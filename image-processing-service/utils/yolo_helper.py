"""
YOLO Format Helper Utilities
Chuyển đổi giữa YOLO format và pixel coordinates
"""

def yolo_to_pixel(yolo_box, img_w, img_h):
    """
    Chuyển từ YOLO format (x_center, y_center, width, height) sang pixel coordinates
    
    Args:
        yolo_box: tuple (x_center, y_center, width, height) - normalized [0, 1]
        img_w: chiều rộng ảnh (pixels)
        img_h: chiều cao ảnh (pixels)
    
    Returns:
        tuple (x1, y1, x2, y2) - pixel coordinates
    """
    x_c, y_c, w, h = yolo_box
    x1 = int((x_c - w / 2) * img_w)
    y1 = int((y_c - h / 2) * img_h)
    x2 = int((x_c + w / 2) * img_w)
    y2 = int((y_c + h / 2) * img_h)
    return x1, y1, x2, y2


def pixel_to_yolo(pixel_box, img_w, img_h):
    """
    Chuyển từ pixel coordinates sang YOLO format
    
    Args:
        pixel_box: tuple (x1, y1, x2, y2) - pixel coordinates
        img_w: chiều rộng ảnh (pixels)
        img_h: chiều cao ảnh (pixels)
    
    Returns:
        tuple (x_center, y_center, width, height) - normalized [0, 1]
    """
    x1, y1, x2, y2 = pixel_box
    w = x2 - x1
    h = y2 - y1
    x_c = x1 + w / 2
    y_c = y1 + h / 2
    return x_c / img_w, y_c / img_h, w / img_w, h / img_h


def yolo_to_pascal(boxes, img_width, img_height):
    """
    Chuyển từ YOLO format sang Pascal VOC format
    
    Args:
        boxes: list of [class_id, x_center, y_center, width, height, extra_info]
        img_width: chiều rộng ảnh
        img_height: chiều cao ảnh
    
    Returns:
        pascal_boxes: list of [x_min, y_min, x_max, y_max]
        class_labels: list of class IDs
        extra_infos: list of extra info (tooth ID for 6-field format)
    """
    pascal_boxes = []
    class_labels = []
    extra_infos = []

    for box in boxes:
        class_id, x_center, y_center, width, height, extra_info = box

        x_min = (x_center - width / 2) * img_width
        y_min = (y_center - height / 2) * img_height
        x_max = (x_center + width / 2) * img_width
        y_max = (y_center + height / 2) * img_height

        pascal_boxes.append([x_min, y_min, x_max, y_max])
        class_labels.append(class_id)
        extra_infos.append(extra_info)

    return pascal_boxes, class_labels, extra_infos


def pascal_to_yolo(boxes, class_labels, extra_infos, img_width, img_height):
    """
    Chuyển từ Pascal VOC format sang YOLO format
    
    Args:
        boxes: list of [x_min, y_min, x_max, y_max]
        class_labels: list of class IDs
        extra_infos: list of extra info
        img_width: chiều rộng ảnh
        img_height: chiều cao ảnh
    
    Returns:
        list of [class_id, x_center, y_center, width, height, extra_info]
    """
    yolo_boxes = []

    for box, class_id, extra_info in zip(boxes, class_labels, extra_infos):
        x_min, y_min, x_max, y_max = box

        x_center = ((x_min + x_max) / 2) / img_width
        y_center = ((y_min + y_max) / 2) / img_height
        width = (x_max - x_min) / img_width
        height = (y_max - y_min) / img_height

        # Đảm bảo giá trị trong khoảng [0, 1]
        x_center = max(0, min(1, x_center))
        y_center = max(0, min(1, y_center))
        width = max(0, min(1, width))
        height = max(0, min(1, height))

        yolo_boxes.append([class_id, x_center, y_center, width, height, extra_info])

    return yolo_boxes


def read_yolo_annotation(txt_path):
    """
    Đọc file annotation YOLO format
    
    Args:
        txt_path: đường dẫn đến file .txt
    
    Returns:
        list of [class_id, x_center, y_center, width, height, extra_info]
        - extra_info là None nếu là 5-field format (răng)
        - extra_info là tooth_id nếu là 6-field format (4 vùng răng)
    """
    boxes = []
    with open(txt_path, 'r') as f:
        for line in f.readlines():
            data = line.strip().split()
            if len(data) >= 5:
                class_id = int(data[0])
                x_center, y_center, width, height = map(float, data[1:5])
                # Kiểm tra nếu có trường thông tin thêm (giá trị thứ 6)
                extra_info = int(data[5]) if len(data) >= 6 else None
                boxes.append([class_id, x_center, y_center, width, height, extra_info])
    return boxes


def write_yolo_annotation(txt_path, boxes):
    """
    Ghi file annotation YOLO format
    
    Args:
        txt_path: đường dẫn đến file .txt
        boxes: list of [class_id, x_center, y_center, width, height, extra_info]
    """
    with open(txt_path, 'w') as f:
        for box in boxes:
            class_id, x_center, y_center, width, height, extra_info = box
            if extra_info is not None:
                # 6-field format: class x_center y_center width height tooth_id
                f.write(f"{int(class_id)} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f} {int(extra_info)}\n")
            else:
                # 5-field format: class x_center y_center width height
                f.write(f"{int(class_id)} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}\n")


def get_iou_containment(box_inner, box_outer):
    """
    Kiểm tra xem tâm của box_inner có nằm trong box_outer không
    
    Args:
        box_inner: tuple (x1, y1, x2, y2)
        box_outer: tuple (x1, y1, x2, y2)
    
    Returns:
        bool: True nếu tâm box_inner nằm trong box_outer
    """
    ix1, iy1, ix2, iy2 = box_inner
    ox1, oy1, ox2, oy2 = box_outer
    center_x = (ix1 + ix2) / 2
    center_y = (iy1 + iy2) / 2
    return ox1 < center_x < ox2 and oy1 < center_y < oy2


def get_iou_overlap(box_a, box_b):
    """
    Tính IoU (Intersection over Union) giữa 2 box
    
    Args:
        box_a: tuple (x1, y1, x2, y2)
        box_b: tuple (x1, y1, x2, y2)
    
    Returns:
        float: IoU score [0, 1]
    """
    ax1, ay1, ax2, ay2 = box_a
    bx1, by1, bx2, by2 = box_b
    
    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)
    
    if inter_x1 >= inter_x2 or inter_y1 >= inter_y2:
        return 0.0
    
    inter_area = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)
    area_a = (ax2 - ax1) * (ay2 - ay1)
    area_b = (bx2 - bx1) * (by2 - by1)
    union_area = area_a + area_b - inter_area
    
    if union_area <= 0:
        return 0.0
    
    return inter_area / union_area
