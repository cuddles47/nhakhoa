"""
Tooth Divider Processor
Cắt 4 góc của răng dựa trên bounding box răng và mắc cài
"""
import cv2
import os
import random
import numpy as np
from typing import List, Tuple, Dict
from utils.yolo_helper import (
    yolo_to_pixel,
    pixel_to_yolo,
    read_yolo_annotation,
    write_yolo_annotation,
    get_iou_containment,
    get_iou_overlap
)


class ToothDivider:
    """
    Xử lý ảnh nha khoa: cắt 4 góc răng dựa trên bounding box răng và mắc cài
    """
    
    # Cấu hình mặc định
    # YOLO class mapping: Teeth 0-19, Brace 21
    BRACKET_CLASS = 21  # Nhãn của mắc cài (YOLO class 21 = COCO category_id 21)
    COLOR_GREEN = (50, 205, 50)   # Vùng Label 0 (không có mảng bám) - Lime Green
    COLOR_RED = (255, 0, 0)       # Vùng Label 1 (có mảng bám) - Bright Red
    COLOR_WHITE = (255, 255, 255) # Màu của Răng
    COLOR_YELLOW = (0, 255, 255)  # Màu vàng cho highlight - Yellow/Cyan
    PADDING_PX = 10  # Số pixel mở rộng cho khung răng khi vẽ
    BBOX_THICKNESS = 10  # Độ dày viền bounding box
    
    def __init__(self, bracket_class=21, padding_px=10, iou_threshold=0.1):
        """
        Khởi tạo ToothDivider
        
        Args:
            bracket_class: ID class của mắc cài (mặc định 13)
            padding_px: Số pixel mở rộng cho khung răng (mặc định 10)
            iou_threshold: Ngưỡng IoU tối thiểu để match bracket (mặc định 0.1)
        """
        self.bracket_class = bracket_class
        self.padding_px = padding_px
        self.iou_threshold = iou_threshold
    
    def _find_matching_bracket(self, brackets: List[Tuple], tooth_box: Tuple) -> Tuple:
        """
        Tìm mắc cài nằm trong răng (2-tier matching)
        
        Tier 1: Center containment - tâm bracket nằm strictly trong tooth box
        Tier 2: IoU overlap > threshold - fallback nếu tier 1 fail
        
        Args:
            brackets: danh sách tọa độ các mắc cài
            tooth_box: tọa độ răng
        
        Returns:
            tọa độ mắc cài khớp hoặc None
        """
        for bracket_box in brackets:
            if get_iou_containment(bracket_box, tooth_box):
                return bracket_box
        
        best_bracket = None
        best_iou = 0.0
        for bracket_box in brackets:
            iou = get_iou_overlap(bracket_box, tooth_box)
            if iou > best_iou:
                best_iou = iou
                best_bracket = bracket_box
        
        if best_bracket and best_iou > self.iou_threshold:
            return best_bracket
        
        return None
    
    def _create_four_regions(self, tooth_box: Tuple, bracket_box: Tuple) -> Dict:
        """
        Tạo 4 vùng (Gingival, Incisal, Mesial, Distal) dựa trên răng và mắc cài
        
        Args:
            tooth_box: (x1, y1, x2, y2) của răng
            bracket_box: (x1, y1, x2, y2) của mắc cài
        
        Returns:
            dict với keys 'G', 'I', 'M', 'D' và values là tọa độ
        """
        tx1, ty1, tx2, ty2 = tooth_box
        bx1, by1, bx2, by2 = bracket_box
        
        return {
            'G': (tx1, ty1, tx2, by1),  # Gingival (phía trên mắc cài)
            'I': (tx1, by2, tx2, ty2),  # Incisal (phía dưới mắc cài)
            'M': (tx1, by1, bx1, by2),  # Mesial (bên trái mắc cài)
            'D': (bx2, by1, tx2, by2)   # Distal (bên phải mắc cài)
        }
    
    def _draw_regions_on_image(
        self, 
        img: np.ndarray, 
        regions: Dict, 
        tooth_box: Tuple,
        tooth_id: int,
        img_w: int,
        img_h: int
    ) -> Tuple[np.ndarray, List]:
        """
        Vẽ 4 vùng màu và khung răng lên ảnh
        
        Args:
            img: ảnh gốc
            regions: dict các vùng 4 góc
            tooth_box: tọa độ răng gốc
            tooth_id: ID răng
            img_w, img_h: kích thước ảnh
        
        Returns:
            (ảnh đã vẽ, danh sách annotations cho 4 vùng)
        """
        region_annotations = []
        tx1, ty1, tx2, ty2 = tooth_box
        
        # Vẽ 4 vùng màu
        for region_name, roi_coords in regions.items():
            # Random label cho mảng bám (0 hoặc 1)
            random_cls = random.choice([0, 1])
            color = self.COLOR_GREEN if random_cls == 0 else self.COLOR_RED
            
            # Vẽ rectangle (độ dày đậm hơn)
            cv2.rectangle(
                img, 
                (roi_coords[0], roi_coords[1]), 
                (roi_coords[2], roi_coords[3]), 
                color, 
                self.BBOX_THICKNESS
            )
            
            # Tạo annotation cho vùng này (6-field format)
            yolo_roi = pixel_to_yolo(roi_coords, img_w, img_h)
            region_annotations.append([
                random_cls,  # 0 hoặc 1 (mảng bám)
                yolo_roi[0], yolo_roi[1], yolo_roi[2], yolo_roi[3],
                tooth_id  # tooth_id ở field cuối
            ])
        
        # Vẽ khung răng mở rộng (màu trắng)
        draw_tx1 = max(0, tx1 - self.padding_px)
        draw_ty1 = max(0, ty1 - self.padding_px)
        draw_tx2 = min(img_w, tx2 + self.padding_px)
        draw_ty2 = min(img_h, ty2 + self.padding_px)
        
        cv2.rectangle(
            img,
            (draw_tx1, draw_ty1),
            (draw_tx2, draw_ty2),
            self.COLOR_YELLOW,
            self.BBOX_THICKNESS
        )
        
        return img, region_annotations
    
    def process_single_image(
        self, 
        img_path: str, 
        lbl_path: str,
        output_img_path: str = None,
        output_lbl_path: str = None
    ) -> Tuple[np.ndarray, List]:
        """
        Xử lý một ảnh đơn
        
        Args:
            img_path: đường dẫn ảnh input
            lbl_path: đường dẫn label input
            output_img_path: đường dẫn lưu ảnh output (optional)
            output_lbl_path: đường dẫn lưu label output (optional)
        
        Returns:
            (ảnh đã xử lý, danh sách annotations mới)
        """
        # 1. Đọc ảnh
        img = cv2.imread(img_path)
        if img is None:
            raise ValueError(f"Không thể đọc ảnh: {img_path}")
        
        img_h, img_w = img.shape[:2]
        
        # 2. Đọc nhãn gốc
        if not os.path.exists(lbl_path):
            raise ValueError(f"Không tìm thấy file label: {lbl_path}")
        
        original_boxes = read_yolo_annotation(lbl_path)
        
        # Phân loại thành brackets và teeth
        brackets = []
        teeth = []
        
        for box in original_boxes:
            cls, x_c, y_c, w, h, extra = box
            coords = yolo_to_pixel([x_c, y_c, w, h], img_w, img_h)
            
            if cls == self.bracket_class:
                brackets.append(coords)
            else:
                teeth.append({'coords': coords, 'id': cls})
        
        filename = os.path.basename(img_path)
        print(f"[{filename}] Phát hiện {len(teeth)} răng, {len(brackets)} brackets")
        
        # 3. Xử lý từng răng
        new_labels = []
        matched_count = 0
        
        for tooth in teeth:
            t_box = tooth['coords']
            t_id = tooth['id']
            
            # Lưu thông tin gốc của răng (5-field format)
            yolo_t = pixel_to_yolo(t_box, img_w, img_h)
            new_labels.append([t_id, yolo_t[0], yolo_t[1], yolo_t[2], yolo_t[3], None])
            
            # Tìm mắc cài khớp
            matching_bracket = self._find_matching_bracket(brackets, t_box)
            
            if matching_bracket:
                matched_count += 1
                # Tạo 4 vùng
                regions = self._create_four_regions(t_box, matching_bracket)
                
                # Vẽ và tạo annotations
                img, region_annotations = self._draw_regions_on_image(
                    img, regions, t_box, t_id, img_w, img_h
                )
                
                # Thêm annotations của 4 vùng
                new_labels.extend(region_annotations)
            else:
                closest_bracket = None
                closest_iou = 0.0
                for bracket_box in brackets:
                    iou = get_iou_overlap(bracket_box, t_box)
                    if iou > closest_iou:
                        closest_iou = iou
                        closest_bracket = bracket_box
                
                if closest_bracket:
                    print(f"  ⚠️ Răng class {t_id} tại {t_box} KHÔNG match bracket nào. "
                          f"Bracket gần nhất: {closest_bracket}, IoU={closest_iou:.3f}")
                else:
                    print(f"  ⚠️ Răng class {t_id} tại {t_box} KHÔNG match - không có bracket nào")
        
        print(f"[{filename}] Kết quả: {matched_count}/{len(teeth)} răng có subbox ({matched_count * 4} subboxes)")
        
        # 4. Lưu kết quả nếu có đường dẫn output
        if output_img_path:
            cv2.imwrite(output_img_path, img)
        
        if output_lbl_path:
            write_yolo_annotation(output_lbl_path, new_labels)
        
        return img, new_labels
    
    def process_batch(
        self,
        img_folder: str,
        lbl_folder: str,
        out_img_folder: str,
        out_lbl_folder: str
    ) -> Dict:
        """
        Xử lý batch nhiều ảnh
        
        Args:
            img_folder: thư mục chứa ảnh input
            lbl_folder: thư mục chứa label input
            out_img_folder: thư mục lưu ảnh output
            out_lbl_folder: thư mục lưu label output
        
        Returns:
            dict với thống kê xử lý
        """
        os.makedirs(out_img_folder, exist_ok=True)
        os.makedirs(out_lbl_folder, exist_ok=True)
        
        # Tìm tất cả file ảnh
        img_files = []
        for ext in ['.png', '.jpg', '.jpeg', '.PNG', '.JPG', '.JPEG']:
            img_files.extend([
                os.path.join(img_folder, f) 
                for f in os.listdir(img_folder) 
                if f.endswith(ext)
            ])
        
        stats = {
            'total': len(img_files),
            'success': 0,
            'failed': 0,
            'errors': []
        }
        
        print(f"Tìm thấy {len(img_files)} ảnh. Bắt đầu xử lý...")
        
        for img_path in img_files:
            filename = os.path.basename(img_path)
            base_name = os.path.splitext(filename)[0]
            lbl_path = os.path.join(lbl_folder, base_name + ".txt")
            
            output_img_path = os.path.join(out_img_folder, filename)
            output_lbl_path = os.path.join(out_lbl_folder, base_name + ".txt")
            
            try:
                self.process_single_image(
                    img_path, lbl_path, 
                    output_img_path, output_lbl_path
                )
                stats['success'] += 1
                print(f"✓ Xử lý thành công: {filename}")
            except Exception as e:
                stats['failed'] += 1
                error_msg = f"✗ Lỗi khi xử lý {filename}: {str(e)}"
                stats['errors'].append(error_msg)
                print(error_msg)
        
        print(f"\nHoàn tất! Thành công: {stats['success']}/{stats['total']}")
        print(f"Box răng màu trắng được vẽ rộng hơn {self.padding_px}px")
        
        return stats
