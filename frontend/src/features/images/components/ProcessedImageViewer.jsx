import { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { FiUpload } from 'react-icons/fi';

const ProcessedImageViewer = ({ 
  visitId, 
  rawImages = [], 
  processedImages = [],
  onProcessClick,
  onImagesUpdate,
  onImageUpload
}) => {
  const [viewMode, setViewMode] = useState('raw'); // 'raw' or 'processed'
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const hasProcessed = processedImages.some(img => img.url_processed);
  
  // Auto-switch to processed view after processing completes
  useEffect(() => {
    console.log('ProcessedImageViewer useEffect:', {
      hasProcessed,
      processing,
      viewMode,
      processedImagesCount: processedImages.length,
      rawImagesCount: rawImages.length
    });
    
    if (hasProcessed && processing) {
      console.log('Auto-switching to processed view');
      setViewMode('processed');
      setProcessing(false);
    }
  }, [hasProcessed, processing]);
  
  const displayImages = viewMode === 'processed' ? processedImages : rawImages;
  
  console.log('ProcessedImageViewer render:', {
    viewMode,
    displayImagesCount: displayImages.length,
    hasProcessed,
    processing,
    sampleImage: displayImages[0]
  });

  const handleProcessClick = async () => {
    console.log('=== PROCESS BUTTON CLICKED ===');
    console.log('Visit ID:', visitId);
    console.log('Raw images count:', rawImages.length);
    
    setProcessing(true);
    setError(null);
    
    try {
      console.log('Calling onProcessClick...');
      const result = await onProcessClick();
      console.log('onProcessClick result:', result);
    } catch (err) {
      console.error('Process error:', err);
      setError(err.message || 'Có lỗi xảy ra khi xử lý ảnh');
      setProcessing(false);
    }
  };

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
        : image?.url_minio;

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
                    window.open(imageUrl, '_blank');
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
            {viewMode === 'processed' ? '🎨 Ảnh đã xử lý' : '📷 Ảnh RAW'} ({(viewMode === 'processed' ? processedImages.filter(img => img.url_processed) : rawImages).length}/9)
          </h3>
          <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
            {viewMode === 'raw' ? 'Upload 9 ảnh gốc (chưa nhuộm)' : 'Ảnh đã xử lý qua Python service'}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {rawImages.length >= 9 && !hasProcessed && (
            <Button
              onClick={handleProcessClick}
              disabled={processing}
              variant="primary"
            >
              {processing ? '⏳ Đang xử lý...' : '🚀 Xử lý ảnh'}
            </Button>
          )}
          
          {hasProcessed && (
            <div style={{ display: 'flex', gap: '4px' }}>
              <Button
                onClick={() => setViewMode('raw')}
                variant={viewMode === 'raw' ? 'primary' : 'secondary'}
                size="small"
              >
                📸 Raw
              </Button>
              <Button
                onClick={() => setViewMode('processed')}
                variant={viewMode === 'processed' ? 'primary' : 'secondary'}
                size="small"
              >
                🎨 Processed
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
