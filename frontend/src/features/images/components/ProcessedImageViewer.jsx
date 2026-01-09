import { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { FiUpload, FiX, FiZoomIn, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import AnnotationCanvas from '../../../components/AnnotationCanvas';
import annotationService from '../../../services/annotationService';
import { useAuth } from '../../auth/hooks/useAuth';
import toast from 'react-hot-toast';

const ProcessedImageViewer = ({ 
  visitId, 
  rawImages = [], 
  processedImages = [],
  stainedImages = [],
  onProcessClick,
  onImagesUpdate,
  onImageUpload
}) => {
  const [viewMode, setViewMode] = useState('raw'); // 'raw' or 'processed'
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null); // { url, label, position, stainedUrl, imageId, image }
  const [annotations, setAnnotations] = useState([]); // teeth array with subboxes
  const [annotationStats, setAnnotationStats] = useState(null);
  const { user: currentUser, isAuthenticated } = useAuth();

  const hasProcessed = processedImages.some(img => img.url_processed);
  
  // Auto-switch to processed view after processing completes
  useEffect(() => {
    if (hasProcessed && processing) {
      setViewMode('processed');
      setProcessing(false);
      toast.success('Xử lý ảnh thành công!');
    }
  }, [hasProcessed, processing]);
  
  const displayImages = viewMode === 'processed' ? processedImages : rawImages;

  // Đóng lightbox khi nhấn ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && lightboxImage) {
        setLightboxImage(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [lightboxImage]);

  // Tìm ảnh stained cùng vị trí
  const findStainedImage = (position) => {
    return stainedImages.find(img => {
      if (img.image_index === position.index) return true;
      
      const imgType = img.image_type?.toLowerCase() || '';
      const posType = position.type.toLowerCase();
      
      if (imgType.includes(posType)) return true;
      
      if (position.altTypes) {
        return position.altTypes.some(alt => imgType.includes(alt.toLowerCase()));
      }
      
      return false;
    });
  };

  const handleProcessClick = async () => {
    setProcessing(true);
    setError(null);
    
    try {
      const result = await onProcessClick();
    } catch (err) {
      const errorMsg = err.message || 'Có lỗi xảy ra khi xử lý ảnh';
      setError(errorMsg);
      toast.error(errorMsg);
      setProcessing(false);
    }
  };

  // Load annotations for an image
  const loadAnnotationsForImage = async (imageId) => {
    try {
      const result = await annotationService.getImageAnnotations(imageId);
      setAnnotations(result.data?.teeth || []);
      // Ensure percentage is a number
      const progress = result.data?.progress;
      if (progress && typeof progress === 'object') {
        setAnnotationStats({
          ...progress,
          percentage: parseFloat(progress.percentage) || 0
        });
      } else {
        setAnnotationStats(null);
      }
    } catch (err) {
      toast.error('Không thể tải annotations');
      setAnnotations([]);
      setAnnotationStats(null);
    }
  };

  // Handle subbox click to toggle plaque status
  const handleSubboxClick = async (subbox, tooth) => {
    if (!isAuthenticated || !currentUser) {
      toast.error('Vui lòng đăng nhập để sử dụng tính năng annotation');
      return;
    }

    try {
      // Toggle: flip between 0 and 1 (no plaque <-> has plaque)
      const newStatus = subbox.plaque_status === 1 ? 0 : 1;
      
      await annotationService.updatePlaqueStatus(
        subbox.subbox_id, 
        newStatus, 
        currentUser.id
      );

      toast.success(newStatus === 1 ? 'Đánh dấu có mảng bám' : 'Đánh dấu không có mảng bám');
      
      // Reload annotations to reflect change
      if (lightboxImage?.imageId) {
        await loadAnnotationsForImage(lightboxImage.imageId);
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra khi cập nhật: ' + err.message);
    }
  };

  // Navigate between images in lightbox
  const navigateImage = (direction) => {
    if (!lightboxImage) return;
    
    const positions = [
      { index: 1, type: 'top_right', label: 'Top Right', altTypes: [] },
      { index: 2, type: 'top_center', label: 'Top Center', altTypes: ['top_middle'] },
      { index: 3, type: 'top_left', label: 'Top Left', altTypes: [] },
      { index: 4, type: 'central_right', label: 'Central Right', altTypes: [] },
      { index: 5, type: 'central_middle', label: 'Central Middle', altTypes: [] },
      { index: 6, type: 'central_left', label: 'Central Left', altTypes: [] },
      { index: 7, type: 'bottom_right', label: 'Bottom Right', altTypes: [] },
      { index: 8, type: 'bottom_center', label: 'Bottom Center', altTypes: ['bottom_middle'] },
      { index: 9, type: 'bottom_left', label: 'Bottom Left', altTypes: [] }
    ];

    const currentIndex = positions.findIndex(p => p.index === lightboxImage.position.index);
    let nextIndex = currentIndex + direction;
    
    // Wrap around
    if (nextIndex < 0) nextIndex = positions.length - 1;
    if (nextIndex >= positions.length) nextIndex = 0;
    
    const nextPosition = positions[nextIndex];
    
    // Find next image
    const nextImage = displayImages.find(img => {
      if (img.image_index === nextPosition.index) return true;
      const imgType = img.image_type?.toLowerCase() || '';
      const posType = nextPosition.type.toLowerCase();
      if (imgType.includes(posType)) return true;
      if (nextPosition.altTypes) {
        return nextPosition.altTypes.some(alt => imgType.includes(alt.toLowerCase()));
      }
      return false;
    });

    if (nextImage) {
      const imageUrl = viewMode === 'processed' && nextImage.url_processed
        ? nextImage.url_processed
        : nextImage.url;
      const stainedImage = findStainedImage(nextPosition);
      
      setLightboxImage({
        url: imageUrl,
        label: nextPosition.label,
        position: nextPosition,
        stainedUrl: stainedImage?.url,
        imageId: nextImage.id,
        image: nextImage
      });

      // Load annotations for new image
      if (nextImage.id) {
        loadAnnotationsForImage(nextImage.id);
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!lightboxImage) return;
      
      if (e.key === 'ArrowLeft') {
        navigateImage(-1);
      } else if (e.key === 'ArrowRight') {
        navigateImage(1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [lightboxImage]);

  const renderGrid = () => {
    const positions = [
      { index: 1, type: 'top_right', label: 'Top Right', altTypes: [] },
      { index: 2, type: 'top_center', label: 'Top Center', altTypes: ['top_middle'] },
      { index: 3, type: 'top_left', label: 'Top Left', altTypes: [] },
      { index: 4, type: 'central_right', label: 'Central Right', altTypes: [] },
      { index: 5, type: 'central_middle', label: 'Central Middle', altTypes: [] },
      { index: 6, type: 'central_left', label: 'Central Left', altTypes: [] },
      { index: 7, type: 'bottom_right', label: 'Bottom Right', altTypes: [] },
      { index: 8, type: 'bottom_center', label: 'Bottom Center', altTypes: ['bottom_middle'] },
      { index: 9, type: 'bottom_left', label: 'Bottom Left', altTypes: [] }
    ];

    return positions.map((pos) => {
      // Find image by image_index OR by matching image_type
      const image = displayImages.find(img => {
        // First try exact index match
        if (img.image_index === pos.index) return true;
        
        // Then try matching image_type (handle both formats)
        const imgType = img.image_type?.toLowerCase() || '';
        const posType = pos.type.toLowerCase();
        
        // Check main type
        if (imgType.includes(posType)) return true;
        
        // Check alternative types
        if (pos.altTypes) {
          return pos.altTypes.some(alt => imgType.includes(alt.toLowerCase()));
        }
        
        return false;
      });

      const imageUrl = viewMode === 'processed' && image?.url_processed
        ? image.url_processed
        : image?.url;

      return (
        <div 
          key={pos.index} 
          style={{
            aspectRatio: '1',
            display: 'flex',
            flexDirection: 'column',
            border: imageUrl ? '1px solid #f1f5f9' : '1px dashed #e2e8f0',
            borderRadius: '4px',
            padding: '4px',
            backgroundColor: imageUrl ? '#fff' : '#fafbfc',
            cursor: !imageUrl && viewMode === 'raw' ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
            boxShadow: imageUrl ? '0 1px 2px rgba(0,0,0,0.04)' : 'none'
          }}
          onClick={!imageUrl && viewMode === 'raw' && onImageUpload ? 
            () => onImageUpload('raw', pos.type, pos.index) : 
            undefined
          }
        >
          {imageUrl ? (
            <>
              <div style={{ 
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                marginBottom: '4px',
                backgroundColor: '#fafafa',
                borderRadius: '3px',
                position: 'relative'
              }}>
                <img 
                  src={imageUrl} 
                  alt={pos.label}
                  style={{ 
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const stainedImage = findStainedImage(pos);
                    setLightboxImage({ 
                      url: imageUrl, 
                      label: pos.label,
                      position: pos,
                      stainedUrl: stainedImage?.url,
                      imageId: image?.id,
                      image: image
                    });
                    // Load annotations for this image
                    if (image?.id) {
                      loadAnnotationsForImage(image.id);
                    }
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; font-size: 12px;"><span>⚠️ Lỗi</span></div>';
                  }}
                />
                {viewMode === 'processed' && image?.url_processed && (
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: '#10b981',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '9px',
                    fontWeight: '600'
                  }}>
                    ✓ Processed
                  </div>
                )}
              </div>
              <div style={{ 
                fontSize: '9px', 
                color: '#94a3b8', 
                textAlign: 'center',
                paddingTop: '2px',
                borderTop: '1px solid #f1f5f9'
              }}>
                {pos.label}
              </div>
            </>
          ) : (
            <>
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px dashed #e2e8f0',
                borderRadius: '3px',
                backgroundColor: '#f8fafc',
                marginBottom: '4px'
              }}>
                {viewMode === 'raw' ? (
                  <>
                    <FiUpload size={18} color="#cbd5e1" />
                    <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px', fontWeight: '500' }}>
                      Click để upload
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '9px', color: '#cbd5e1' }}>
                    ⏳ Chưa xử lý
                  </div>
                )}
              </div>
              <div style={{ 
                fontSize: '9px', 
                color: '#cbd5e1', 
                textAlign: 'center',
                paddingTop: '2px',
                borderTop: '1px solid #f1f5f9'
              }}>
                {pos.label}
              </div>
            </>
          )}
        </div>
      );
    });
  };

  return (
    <div style={{ 
      background: '#fff', 
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      height: '100%'
    }}>
      {/* Lightbox Overlay - Split Screen */}
      {lightboxImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            padding: '20px',
            cursor: 'pointer'
          }}
          onClick={() => setLightboxImage(null)}
        >
          {/* Nút đóng */}
          <button
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '20px',
              transition: 'all 0.2s',
              backdropFilter: 'blur(10px)',
              zIndex: 10000
            }}
            onClick={(e) => {
              e.stopPropagation();
              setLightboxImage(null);
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            <FiX size={24} />
          </button>

          {/* Label */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            padding: '8px 20px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600',
            zIndex: 10000
          }}>
            {lightboxImage.label}
          </div>

          {/* Annotation Stats */}
          {viewMode === 'processed' && annotationStats && typeof annotationStats === 'object' && (
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '12px',
              zIndex: 10000,
              minWidth: '200px'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '13px' }}>
                📊 Annotation Progress
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Total subbox:</span>
                  <span style={{ fontWeight: '600' }}>{annotationStats.total}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>No plaque:</span>
                  <span style={{ fontWeight: '600', color: '#10b981' }}>{annotationStats.total - annotationStats.plaque_detected}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Has plaque:</span>
                  <span style={{ fontWeight: '600', color: '#ef4444' }}>{annotationStats.plaque_detected}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <button
            style={{
              position: 'absolute',
              top: '50%',
              left: '20px',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              color: 'white',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              zIndex: 10000
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigateImage(-1);
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              e.target.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <FiChevronLeft size={28} />
          </button>

          <button
            style={{
              position: 'absolute',
              top: '50%',
              right: '20px',
              transform: 'translateY(-50%)',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              color: 'white',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              zIndex: 10000
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigateImage(1);
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              e.target.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <FiChevronRight size={28} />
          </button>

          {/* Split Screen Container */}
          <div style={{
            flex: 1,
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '60px',
            marginBottom: '40px',
            minHeight: 0,
            overflow: 'hidden'
          }}>
            {/* Left: Raw/Processed với annotation overlay */}
            <div style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 0,
              minWidth: 0
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                padding: '6px 16px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '12px'
              }}>
                {viewMode === 'processed' ? '🔍 Processed' : '📷 Raw'}
              </div>
              {(() => {
                const shouldShowCanvas = viewMode === 'processed' && annotations.length > 0;
                
                return shouldShowCanvas ? (
                  <AnnotationCanvas
                    imageUrl={lightboxImage.url}
                    teeth={annotations}
                    onSubboxClick={handleSubboxClick}
                  />
                ) : (
                  <img 
                    src={lightboxImage.url}
                    alt={lightboxImage.label}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                );
              })()}
            </div>

            {/* Divider */}
            <div style={{
              width: '2px',
              height: '80%',
              background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.3), transparent)'
            }} />

            {/* Right: Stained */}
            <div style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 0,
              minWidth: 0
            }}>
              <div style={{
                background: 'rgba(147, 51, 234, 0.3)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                padding: '6px 16px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: '12px'
              }}>
                 Stained
              </div>
              {lightboxImage.stainedUrl ? (
                <img 
                  src={lightboxImage.stainedUrl}
                  alt={`${lightboxImage.label} Stained`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '14px',
                  padding: '40px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                  <div>Không có ảnh stained cho vị trí này</div>
                </div>
              )}
            </div>
          </div>

          {/* Hint */}
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '12px',
            textAlign: 'center'
          }}>
            Click bên ngoài hoặc nhấn ESC để đóng
          </div>
        </div>
      )}

      <div style={{ 
        padding: '8px 12px', 
        borderBottom: '1px solid #f1f5f9',
        background: '#f8fafc',
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <h3 style={{ margin: '0 0 2px 0', fontSize: '14px', color: '#334155', fontWeight: '600' }}>
            {viewMode === 'processed' ? ' Ảnh đã xử lý' : ' Ảnh RAW'} ({(viewMode === 'processed' ? processedImages.filter(img => img.url_processed) : rawImages).length}/9)
          </h3>
          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
            {viewMode === 'raw' ? 'Upload 9 ảnh gốc (chưa nhuộm) - Click ảnh để so sánh với stained' : 'Ảnh hậu xử lý - Click để so sánh với stained'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {rawImages.length >= 9 && !hasProcessed && (
            <Button
              onClick={handleProcessClick}
              disabled={processing}
              variant="primary"
            >
              {processing ? ' Đang xử lý...' : ' Xử lý ảnh'}
            </Button>
          )}
          
          {hasProcessed && (
            <div style={{ display: 'flex', gap: '4px' }}>
              <Button
                onClick={() => setViewMode('raw')}
                variant={viewMode === 'raw' ? 'primary' : 'secondary'}
                size="small"
              >
                 Raw
              </Button>
              <Button
                onClick={() => setViewMode('processed')}
                variant={viewMode === 'processed' ? 'primary' : 'secondary'}
                size="small"
              >
                 Processed
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          padding: '8px 12px',
          background: '#fee2e2',
          color: '#991b1b',
          margin: '8px',
          borderLeft: '3px solid #dc2626',
          fontSize: '11px',
          fontWeight: '500',
          borderRadius: '4px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {processing && (
        <div style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          background: 'rgba(255, 255, 255, 0.95)',
          margin: '8px',
          borderRadius: '8px',
          border: '2px dashed #cbd5e1'
        }}>
          <LoadingSpinner size="large" />
          <p style={{ marginTop: '16px', color: '#667eea', fontWeight: '600', fontSize: '14px' }}>
            Đang xử lý ảnh, vui lòng đợi...
          </p>
          <p style={{ marginTop: '8px', color: '#999', fontSize: '12px' }}>
            Service đang cắt 4 góc răng và vẽ bounding boxes
          </p>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '6px',
        padding: '8px'
      }}>
        {renderGrid()}
      </div>

      {!hasProcessed && rawImages.length > 0 && rawImages.length < 9 && (
        <div style={{
          textAlign: 'center',
          padding: '12px',
          background: '#fef3c7',
          borderRadius: '4px',
          margin: '8px',
          border: '1px solid #fde68a'
        }}>
          <p style={{ margin: 0, color: '#92400e', fontSize: '11px', fontWeight: '500' }}>
            💡 Upload đủ 9 ảnh RAW để bật chức năng xử lý ảnh
          </p>
        </div>
      )}
    </div>
  );
};

export default ProcessedImageViewer;
