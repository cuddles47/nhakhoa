"""
Image Processing Service Configuration
"""
import os

class Config:
    """Cấu hình cho Image Processing Service"""
    
    # Server config
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 8001))
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    
    # Processing config
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', '/tmp/uploads')
    OUTPUT_FOLDER = os.getenv('OUTPUT_FOLDER', '/tmp/outputs')
    MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', 10 * 1024 * 1024))  # 10MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'bmp'}
    
    # Tooth divider config
    # YOLO class mapping: Teeth 0-19, Brace 21
    BRACKET_CLASS = int(os.getenv('BRACKET_CLASS', 21))
    PADDING_PX = int(os.getenv('PADDING_PX', 10))
    
    # Augmentation config
    AUGMENTATIONS = ['rotate_left', 'rotate_right', 'flip', 'brightness_up', 'brightness_down']
    CREATE_SUBFOLDERS = os.getenv('CREATE_SUBFOLDERS', 'True').lower() == 'true'
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    
    @staticmethod
    def init_folders():
        """Tạo các folder cần thiết"""
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(Config.OUTPUT_FOLDER, exist_ok=True)


# Khởi tạo folders
Config.init_folders()
