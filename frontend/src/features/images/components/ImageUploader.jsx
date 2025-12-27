import { useState, useRef } from 'react';
import { IMAGE_POSITIONS, IMAGE_CATEGORY } from '../../../constants';
import { isValidImageType, isValidFileSize } from '../../../utils/validators';
import { formatFileSize } from '../../../utils/formatters';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import './ImageUploader.css';

/**
 * ImageUploader Component
 * Handles 3x3 grid image upload for dental orthodontic images
 * - Drag & drop support
 * - Preview before upload
 * - Validation (type, size)
 * - Separate RAW and Stained categories
 */
const ImageUploader = ({ 
  visitId,
  category = IMAGE_CATEGORY.RAW,
  onUploadComplete,
  existingImages = []
}) => {
  const [selectedFiles, setSelectedFiles] = useState({});
  const [previews, setPreviews] = useState({});
  const [dragOver, setDragOver] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRefs = useRef({});

  // Create a map of existing images by position
  const existingImageMap = existingImages.reduce((acc, img) => {
    if (img.image_category === category) {
      acc[img.image_index] = img;
    }
    return acc;
  }, {});

  const handleFileSelect = (position, file) => {
    // Validate file
    const positionErrors = {};
    
    if (!isValidImageType(file)) {
      positionErrors[position] = 'Định dạng không hợp lệ. Chỉ chấp nhận JPG, JPEG, PNG';
      setErrors({ ...errors, ...positionErrors });
      return;
    }

    if (!isValidFileSize(file, 10)) {
      positionErrors[position] = `Kích thước file quá lớn. Tối đa 10MB (${formatFileSize(file.size)})`;
      setErrors({ ...errors, ...positionErrors });
      return;
    }

    // Clear errors for this position
    const newErrors = { ...errors };
    delete newErrors[position];
    setErrors(newErrors);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews(prev => ({ ...prev, [position]: reader.result }));
    };
    reader.readAsDataURL(file);

    // Store file
    setSelectedFiles(prev => ({ ...prev, [position]: file }));
  };

  const handleDrop = (e, position) => {
    e.preventDefault();
    setDragOver(null);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(position, file);
    }
  };

  const handleDragOver = (e, position) => {
    e.preventDefault();
    setDragOver(position);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleFileInputChange = (position, e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(position, file);
    }
  };

  const handleRemoveFile = (position) => {
    const newFiles = { ...selectedFiles };
    const newPreviews = { ...previews };
    const newErrors = { ...errors };
    
    delete newFiles[position];
    delete newPreviews[position];
    delete newErrors[position];

    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    setErrors(newErrors);

    // Reset file input
    if (fileInputRefs.current[position]) {
      fileInputRefs.current[position].value = '';
    }
  };

  const handleUploadAll = async () => {
    if (Object.keys(selectedFiles).length === 0) {
      return;
    }

    setUploading(true);

    try {
      // Upload files sequentially (you can parallelize if needed)
      for (const [position, file] of Object.entries(selectedFiles)) {
        const positionData = IMAGE_POSITIONS.find(p => p.index === parseInt(position));
        
        const imageData = {
          file,
          category,
          type: positionData.type,
          index: positionData.index
        };

        // Call upload API (implement in parent or use mutation hook)
        await onUploadComplete(imageData);
      }

      // Clear all after successful upload
      setSelectedFiles({});
      setPreviews({});
      setErrors({});
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const renderGridCell = (position) => {
    const hasFile = selectedFiles[position.index];
    const hasExisting = existingImageMap[position.index];
    const hasPreview = previews[position.index];
    const error = errors[position.index];
    const isDragOver = dragOver === position.index;

    return (
      <div
        key={position.index}
        className={`image-grid-cell ${isDragOver ? 'drag-over' : ''} ${error ? 'has-error' : ''}`}
        onDrop={(e) => handleDrop(e, position.index)}
        onDragOver={(e) => handleDragOver(e, position.index)}
        onDragLeave={handleDragLeave}
      >
        <div className="cell-label">{position.label}</div>

        {hasFile && hasPreview ? (
          <div className="cell-preview">
            <img src={hasPreview} alt={position.label} />
            <button
              className="remove-button"
              onClick={() => handleRemoveFile(position.index)}
              type="button"
            >
              ×
            </button>
          </div>
        ) : hasExisting ? (
          <div className="cell-existing">
            <img src={hasExisting.url_minio} alt={position.label} />
            <div className="existing-badge">Đã có ảnh</div>
          </div>
        ) : (
          <div className="cell-dropzone">
            <input
              ref={(el) => (fileInputRefs.current[position.index] = el)}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={(e) => handleFileInputChange(position.index, e)}
              className="file-input"
              id={`file-${category}-${position.index}`}
            />
            <label htmlFor={`file-${category}-${position.index}`} className="file-label">
              <span className="upload-icon">📷</span>
              <span className="upload-text">Chọn hoặc kéo thả ảnh</span>
            </label>
          </div>
        )}

        {error && <div className="cell-error">{error}</div>}
      </div>
    );
  };

  return (
    <div className="image-uploader">
      <div className="uploader-header">
        <h3>{category === IMAGE_CATEGORY.RAW ? 'Ảnh Thô' : 'Ảnh Nhuộm'}</h3>
        <div className="uploader-actions">
          <Button
            variant="primary"
            onClick={handleUploadAll}
            disabled={Object.keys(selectedFiles).length === 0 || uploading}
            loading={uploading}
          >
            Tải lên {Object.keys(selectedFiles).length > 0 && `(${Object.keys(selectedFiles).length})`}
          </Button>
        </div>
      </div>

      {uploading && <LoadingSpinner text="Đang tải ảnh lên..." />}

      <div className="image-grid">
        {IMAGE_POSITIONS.map(renderGridCell)}
      </div>

      <div className="uploader-info">
        <p>• Định dạng: JPG, JPEG, PNG</p>
        <p>• Kích thước tối đa: 10MB</p>
        <p>• Số lượng: 9 ảnh (3×3 grid)</p>
      </div>
    </div>
  );
};

export default ImageUploader;
