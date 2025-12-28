"""
Data Augmentation Processor
Thực hiện data augmentation cho ảnh nha khoa và annotations
"""
import cv2
import os
from pathlib import Path
from typing import List, Tuple, Dict
import albumentations as A
from utils.yolo_helper import (
    yolo_to_pascal,
    pascal_to_yolo,
    read_yolo_annotation,
    write_yolo_annotation
)


class DataAugmenter:
    """
    Thực hiện data augmentation cho ảnh và bounding boxes
    """
    
    AUGMENTATIONS = [
        "rotate_left",
        "rotate_right", 
        "flip",
        "brightness_up",
        "brightness_down"
    ]
    
    def __init__(self):
        """Khởi tạo DataAugmenter"""
        pass
    
    def _get_transform(self, augmentation_name: str):
        """
        Lấy albumentations transform theo tên
        
        Args:
            augmentation_name: tên augmentation
        
        Returns:
            albumentations Compose transform
        """
        if augmentation_name == "rotate_left":
            return A.Compose([
                A.Rotate(limit=(-15, -15), p=1.0)
            ], bbox_params=A.BboxParams(format='pascal_voc', label_fields=['class_labels']))
        
        elif augmentation_name == "rotate_right":
            return A.Compose([
                A.Rotate(limit=(15, 15), p=1.0)
            ], bbox_params=A.BboxParams(format='pascal_voc', label_fields=['class_labels']))
        
        elif augmentation_name == "flip":
            return A.Compose([
                A.HorizontalFlip(p=1.0)
            ], bbox_params=A.BboxParams(format='pascal_voc', label_fields=['class_labels']))
        
        elif augmentation_name == "brightness_up":
            return A.Compose([
                A.RandomBrightnessContrast(
                    brightness_limit=(0.2, 0.2), 
                    contrast_limit=0, 
                    p=1.0
                )
            ], bbox_params=A.BboxParams(format='pascal_voc', label_fields=['class_labels']))
        
        elif augmentation_name == "brightness_down":
            return A.Compose([
                A.RandomBrightnessContrast(
                    brightness_limit=(-0.2, -0.2), 
                    contrast_limit=0, 
                    p=1.0
                )
            ], bbox_params=A.BboxParams(format='pascal_voc', label_fields=['class_labels']))
        
        else:
            raise ValueError(f"Không hỗ trợ augmentation: {augmentation_name}")
    
    def augment_image_and_boxes(
        self,
        image,
        boxes: List,
        augmentation_name: str
    ) -> Tuple:
        """
        Áp dụng augmentation cho ảnh và boxes
        
        Args:
            image: numpy array ảnh
            boxes: list of [class_id, x_center, y_center, width, height, extra_info]
            augmentation_name: tên augmentation
        
        Returns:
            (ảnh đã augment, boxes đã augment)
        """
        img_height, img_width = image.shape[:2]
        
        # Chuyển đổi YOLO sang Pascal VOC
        pascal_boxes, class_labels, extra_infos = yolo_to_pascal(
            boxes, img_width, img_height
        )
        
        # Lấy transform
        transform = self._get_transform(augmentation_name)
        
        # Áp dụng augmentation
        transformed = transform(
            image=image,
            bboxes=pascal_boxes,
            class_labels=class_labels
        )
        
        aug_image = transformed['image']
        aug_boxes = transformed['bboxes']
        aug_labels = transformed['class_labels']
        
        # Chuyển đổi lại sang YOLO format (giữ nguyên extra_infos)
        yolo_boxes = pascal_to_yolo(
            aug_boxes, aug_labels, extra_infos, 
            img_width, img_height
        )
        
        return aug_image, yolo_boxes
    
    def augment_single_image(
        self,
        img_path: str,
        ann_path: str,
        output_img_folder: str,
        output_ann_folder: str,
        augmentations: List[str] = None
    ) -> Dict:
        """
        Augment một ảnh đơn
        
        Args:
            img_path: đường dẫn ảnh input
            ann_path: đường dẫn annotation input
            output_img_folder: thư mục lưu ảnh output
            output_ann_folder: thư mục lưu annotation output
            augmentations: danh sách augmentations (None = all)
        
        Returns:
            dict với thông tin các file đã tạo
        """
        if augmentations is None:
            augmentations = self.AUGMENTATIONS
        
        # Đọc ảnh và annotation
        image = cv2.imread(img_path)
        if image is None:
            raise ValueError(f"Không thể đọc ảnh: {img_path}")
        
        if not os.path.exists(ann_path):
            raise ValueError(f"Không tìm thấy annotation: {ann_path}")
        
        boxes = read_yolo_annotation(ann_path)
        
        # Lấy thông tin file
        img_name = Path(img_path).stem
        img_ext = Path(img_path).suffix
        
        # Tạo folder output nếu chưa có
        os.makedirs(output_img_folder, exist_ok=True)
        os.makedirs(output_ann_folder, exist_ok=True)
        
        results = {
            'original': img_name,
            'augmented': []
        }
        
        # Copy ảnh và annotation gốc
        output_img_path = os.path.join(output_img_folder, f"{img_name}_original{img_ext}")
        output_ann_path = os.path.join(output_ann_folder, f"{img_name}_original.txt")
        cv2.imwrite(output_img_path, image)
        write_yolo_annotation(output_ann_path, boxes)
        results['augmented'].append(f"{img_name}_original")
        
        # Áp dụng các augmentation
        for aug_name in augmentations:
            try:
                aug_image, aug_boxes = self.augment_image_and_boxes(
                    image, boxes, aug_name
                )
                
                # Lưu ảnh và annotation đã augment
                aug_img_name = f"{img_name}_{aug_name}{img_ext}"
                aug_ann_name = f"{img_name}_{aug_name}.txt"
                
                aug_img_path = os.path.join(output_img_folder, aug_img_name)
                aug_ann_path = os.path.join(output_ann_folder, aug_ann_name)
                
                cv2.imwrite(aug_img_path, aug_image)
                write_yolo_annotation(aug_ann_path, aug_boxes)
                
                results['augmented'].append(f"{img_name}_{aug_name}")
                
            except Exception as e:
                print(f"  ✗ Lỗi khi augment với {aug_name}: {str(e)}")
        
        return results
    
    def augment_dataset(
        self,
        image_folder: str,
        annotation_folder: str,
        output_image_folder: str,
        output_annotation_folder: str,
        augmentations: List[str] = None,
        create_subfolders: bool = True
    ) -> Dict:
        """
        Thực hiện augmentation cho toàn bộ dataset
        
        Args:
            image_folder: thư mục chứa ảnh input
            annotation_folder: thư mục chứa annotation input
            output_image_folder: thư mục lưu ảnh output
            output_annotation_folder: thư mục lưu annotation output
            augmentations: danh sách augmentations (None = all)
            create_subfolders: tạo subfolder cho mỗi ảnh hay không
        
        Returns:
            dict với thống kê
        """
        if augmentations is None:
            augmentations = self.AUGMENTATIONS
        
        # Tạo thư mục output chính
        os.makedirs(output_image_folder, exist_ok=True)
        os.makedirs(output_annotation_folder, exist_ok=True)
        
        # Lấy danh sách file ảnh
        image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.JPG', '.JPEG', '.PNG', '.BMP']
        image_files = []
        
        for ext in image_extensions:
            image_files.extend(list(Path(image_folder).glob(f'*{ext}')))
        
        stats = {
            'total': len(image_files),
            'success': 0,
            'failed': 0,
            'augmentations_per_image': len(augmentations) + 1,  # +1 cho original
            'errors': []
        }
        
        print(f"Tìm thấy {len(image_files)} ảnh")
        print(f"Sẽ tạo {stats['augmentations_per_image']} ảnh cho mỗi ảnh gốc\n")
        
        for img_path in image_files:
            img_name = img_path.stem
            ann_path = Path(annotation_folder) / f"{img_name}.txt"
            
            if not ann_path.exists():
                error_msg = f"✗ Không tìm thấy annotation cho {img_name}"
                print(error_msg)
                stats['errors'].append(error_msg)
                stats['failed'] += 1
                continue
            
            try:
                # Xác định folder output
                if create_subfolders:
                    img_output_folder = Path(output_image_folder) / img_name
                    ann_output_folder = Path(output_annotation_folder) / img_name
                else:
                    img_output_folder = Path(output_image_folder)
                    ann_output_folder = Path(output_annotation_folder)
                
                # Xử lý augmentation
                results = self.augment_single_image(
                    str(img_path),
                    str(ann_path),
                    str(img_output_folder),
                    str(ann_output_folder),
                    augmentations
                )
                
                stats['success'] += 1
                print(f"✓ Xử lý thành công: {img_name}")
                print(f"  - Tạo {len(results['augmented'])} ảnh")
                
            except Exception as e:
                error_msg = f"✗ Lỗi khi xử lý {img_name}: {str(e)}"
                print(error_msg)
                stats['errors'].append(error_msg)
                stats['failed'] += 1
        
        print("\n" + "="*60)
        print("Hoàn thành!")
        print(f"Thành công: {stats['success']}/{stats['total']}")
        print(f"Kết quả được lưu tại:")
        print(f"  - Ảnh: {output_image_folder}")
        print(f"  - Annotations: {output_annotation_folder}")
        if create_subfolders:
            print(f"  - Mỗi ảnh gốc có 1 folder con chứa {stats['augmentations_per_image']} ảnh")
        print("="*60)
        
        return stats
