import { useState } from 'react';
import { IMAGE_POSITIONS } from '../../../constants';
import Button from '../../../components/ui/Button';
import './ImageCompare.css';

/**
 * ImageCompare Component
 * Compare RAW vs Stained images side-by-side
 * - Position selector
 * - Zoom functionality
 * - Before/After slider
 */
const ImageCompare = ({ rawImages = [], stainedImages = [] }) => {
  const [selectedPosition, setSelectedPosition] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [sliderPosition, setSliderPosition] = useState(50);

  // Find images for selected position
  const rawImage = rawImages.find(img => img.image_index === selectedPosition);
  const stainedImage = stainedImages.find(img => img.image_index === selectedPosition);

  const hasRaw = !!rawImage;
  const hasStained = !!stainedImage;
  const hasBoth = hasRaw && hasStained;

  const handlePositionChange = (positionIndex) => {
    setSelectedPosition(positionIndex);
    setSliderPosition(50); // Reset slider
    setZoom(1); // Reset zoom
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 1));
  };

  const handleSliderChange = (e) => {
    setSliderPosition(e.target.value);
  };

  return (
    <div className="image-compare">
      <div className="compare-header">
        <h3>So sánh ảnh</h3>
        <div className="zoom-controls">
          <Button size="sm" onClick={handleZoomOut} disabled={zoom <= 1}>
            −
          </Button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <Button size="sm" onClick={handleZoomIn} disabled={zoom >= 3}>
            +
          </Button>
        </div>
      </div>

      {/* Position Selector */}
      <div className="position-selector">
        {IMAGE_POSITIONS.map(position => {
          const hasRawAtPosition = rawImages.some(img => img.image_index === position.index);
          const hasStainedAtPosition = stainedImages.some(img => img.image_index === position.index);
          const hasAnyImage = hasRawAtPosition || hasStainedAtPosition;

          return (
            <button
              key={position.index}
              className={`position-button ${selectedPosition === position.index ? 'active' : ''} ${!hasAnyImage ? 'disabled' : ''}`}
              onClick={() => handlePositionChange(position.index)}
              disabled={!hasAnyImage}
            >
              {position.label}
            </button>
          );
        })}
      </div>

      {/* Image Comparison View */}
      <div className="compare-container">
        {hasBoth ? (
          <div className="compare-slider-view">
            <div className="compare-images" style={{ transform: `scale(${zoom})` }}>
              <div className="image-layer image-raw">
                <img src={rawImage.url_minio} alt="Ảnh thô" />
                <div className="image-label">Ảnh Thô</div>
              </div>
              <div 
                className="image-layer image-stained" 
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <img src={stainedImage.url_minio} alt="Ảnh nhuộm" />
                <div className="image-label">Ảnh Nhuộm</div>
              </div>
              <div 
                className="slider-line" 
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="slider-handle"></div>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={handleSliderChange}
              className="slider-input"
            />
          </div>
        ) : (
          <div className="compare-side-by-side">
            <div className="compare-side">
              <h4>Ảnh Thô</h4>
              {hasRaw ? (
                <div className="single-image" style={{ transform: `scale(${zoom})` }}>
                  <img src={rawImage.url_minio} alt="Ảnh thô" />
                </div>
              ) : (
                <div className="no-image">Chưa có ảnh</div>
              )}
            </div>
            <div className="compare-side">
              <h4>Ảnh Nhuộm</h4>
              {hasStained ? (
                <div className="single-image" style={{ transform: `scale(${zoom})` }}>
                  <img src={stainedImage.url_minio} alt="Ảnh nhuộm" />
                </div>
              ) : (
                <div className="no-image">Chưa có ảnh</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageCompare;
