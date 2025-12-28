import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getVisitById, getImagesByVisit, createImage, updateImageValidation } from '../api'
import { FiArrowLeft, FiImage, FiUpload, FiCheck, FiX, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import ProcessedImageViewer from '../features/images/components/ProcessedImageViewer'
import imageService from '../services/imageService'

function ImageUpload() {
  const { visitId } = useParams()
  const navigate = useNavigate()
  
  const [visit, setVisit] = useState(null)
  const [images, setImages] = useState([])
  const [rawImages, setRawImages] = useState([])
  const [stainedImages, setStainedImages] = useState([])
  const [processedImages, setProcessedImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadVisitAndImages()
  }, [visitId])

  const loadVisitAndImages = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch visit data
      const visitResponse = await getVisitById(visitId)
      const visitData = visitResponse.data.data
      setVisit(visitData)
      
      // Fetch images
      const imagesResponse = await getImagesByVisit(visitId)
      const allImages = imagesResponse.data.data || []
      
      setImages(allImages)
      setRawImages(allImages.filter(img => img.image_category === 'raw'))
      setStainedImages(allImages.filter(img => img.image_category === 'stained'))
    } catch (err) {
      console.error(err)
      setError('Không thể tải thông tin lần khám')
    } finally {
      setLoading(false)
    }
  }

  const loadImages = async () => {
    try {
      const response = await getImagesByVisit(visitId)
      const allImages = response.data.data || []
      
      // Convert all MinIO paths to proxy URLs
      const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.17:3000';
      const convertToProxyUrl = (url) => {
        if (!url) return url;
        if (url.startsWith('http')) return url; // Already full URL
        // Convert /nhakhoa/visits/... to /api/images/proxy/visits/...
        const path = url.replace(/^\/nhakhoa\//, '');
        return `${API_URL}/api/images/proxy/${path}`;
      };
      
      const allImagesWithProxy = allImages.map(img => ({
        ...img,
        url: convertToProxyUrl(img.url),
        url_processed: convertToProxyUrl(img.url_processed)
      }));
      
      setImages(allImagesWithProxy)
      const rawImagesData = allImagesWithProxy.filter(img => img.image_category === 'raw')
      setRawImages(rawImagesData)
      setStainedImages(allImagesWithProxy.filter(img => img.image_category === 'stained'))
      
      // Update processedImages - use rawImages that have url_processed
      const processedImagesData = rawImagesData.filter(img => img.url_processed)
      setProcessedImages(processedImagesData)
      
      console.log('Images reloaded with proxy URLs:', {
        total: allImagesWithProxy.length,
        raw: rawImagesData.length,
        processed: processedImagesData.length,
        sampleUrl: rawImagesData[0]?.url
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleProcessImages = async () => {
    try {
      console.log('Starting image processing for visit:', visitId);
      const result = await imageService.processImages(visitId);
      console.log('Processing result:', result);
      
      if (result.success) {
        setProcessedImages(result.data);
        // Reload all images to get updated URLs
        await loadImages();
      }
      
      return result;
    } catch (err) {
      console.error('Error processing images:', err);
      throw new Error(err.response?.data?.error || 'Không thể xử lý ảnh');
    }
  }

  const handleImageUpload = async (category, positionType, index) => {
    // Create file input for image selection
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/jpg,image/png'
    
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      
      try {
        // Create FormData for multipart upload
        const formData = new FormData()
        formData.append('image', file)
        formData.append('visit_id', visitId)
        formData.append('image_category', category)
        formData.append('image_type', positionType)
        formData.append('image_index', index)
        formData.append('notes', `${category === 'raw' ? 'Ảnh RAW' : 'Ảnh nhuộm'} - ${positionType}`)
        
        // Upload to backend (which will upload to MinIO and create DB record)
        await createImage(formData)
        loadImages()
      } catch (err) {
        alert('Không thể tạo ảnh: ' + (err.response?.data?.message || err.message))
        console.error(err)
      }
    }
    
    // Trigger file picker
    input.click()
  }

  const handleValidation = async (imageId, status) => {
    try {
      await updateImageValidation(imageId, status)
      loadImages()
    } catch (err) {
      alert('Không thể cập nhật trạng thái')
      console.error(err)
    }
  }

  const renderImageGrid = (category, imagesList) => {
    // Define 3x3 grid with semantic position names for dental images
    const positions = [
      { index: 1, type: 'top_right', label: 'Top Right' },
      { index: 2, type: 'top_center', label: 'Top Center', altTypes: ['top_middle'] },
      { index: 3, type: 'top_left', label: 'Top Left' },
      { index: 4, type: 'central_right', label: 'Central Right' },
      { index: 5, type: 'central_middle', label: 'Central Middle' },
      { index: 6, type: 'central_left', label: 'Central Left' },
      { index: 7, type: 'bottom_right', label: 'Bottom Right' },
      { index: 8, type: 'bottom_center', label: 'Bottom Center', altTypes: ['bottom_middle'] },
      { index: 9, type: 'bottom_left', label: 'Bottom Left' }
    ]
    
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '6px',
        padding: '0'
      }}>
        {positions.map((pos) => {
          // Find image by image_index OR by matching image_type
          const image = imagesList.find(img => {
            // First try exact index match
            if (img.image_index === pos.index) return true
            
            // Then try matching image_type (handle both formats)
            const imgType = img.image_type?.toLowerCase() || ''
            const posType = pos.type.toLowerCase()
            
            // Check main type
            if (imgType.includes(posType)) return true
            
            // Check alternative types
            if (pos.altTypes) {
              return pos.altTypes.some(alt => imgType.includes(alt.toLowerCase()))
            }
            
            return false
          })
          
          return (
            <div 
              key={pos.index} 
              style={{
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                border: image ? '1px solid #f1f5f9' : '1px dashed #e2e8f0',
                borderRadius: '4px',
                padding: '4px',
                backgroundColor: image ? '#fff' : '#fafbfc',
                cursor: image ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: image ? '0 1px 2px rgba(0,0,0,0.04)' : 'none'
              }}
              onClick={!image ? () => handleImageUpload(category, pos.type, pos.index) : undefined}
            >
              {image ? (
                <>
                  <div style={{ 
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    marginBottom: '4px',
                    backgroundColor: '#fafafa',
                    borderRadius: '3px'
                  }}>
                    <img 
                      src={image.url_minio} 
                      alt={pos.label}
                      style={{ 
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(image.url_minio, '_blank')
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; font-size: 12px;"><span>⚠️ Lỗi</span></div>'
                      }}
                    />
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
                    <FiUpload size={18} color="#cbd5e1" />
                    <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px', fontWeight: '500' }}>
                      Click để upload
                    </div>
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
          )
        })}
      </div>
    )
  }

  if (loading) {
    return <div className="loading">Đang tải...</div>
  }

  if (error || !visit) {
    return (
      <div className="card">
        <p style={{ color: 'var(--error)' }}>{error || 'Không tìm thấy lần khám'}</p>
        <button className="button" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FiArrowLeft size={16} />
          Quay lại
        </button>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden', 
      background: '#f8fafc'
    }}>
      {/* Header */}
      <div style={{ 
        margin: '0', 
        padding: '10px 16px',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        borderBottom: '1px solid #e2e8f0',
        flexShrink: 0 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <h2 style={{ margin: '0 0 2px 0', color: '#1e293b', fontSize: '16px', fontWeight: '600' }}>Upload Ảnh - Lần Khám #{visit.id}</h2>
              <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
                Ngày khám: {new Date(visit.visit_date).toLocaleDateString('vi-VN')}
              </p>
            </div>
            {/* Stats inline */}
            <div style={{ display: 'flex', gap: '6px', marginLeft: '12px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                background: '#e0f2fe',
                padding: '4px 8px',
                borderRadius: '12px',
                border: '1px solid #bae6fd'
              }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#0369a1' }}>
                  {rawImages.length}/9
                </span>
                <span style={{ fontSize: '10px', color: '#0c4a6e' }}>RAW</span>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                background: '#dcfce7',
                padding: '4px 8px',
                borderRadius: '12px',
                border: '1px solid #bbf7d0'
              }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#15803d' }}>
                  {stainedImages.length}/9
                </span>
                <span style={{ fontSize: '10px', color: '#166534' }}>Nhuộm</span>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                background: '#d1fae5',
                padding: '4px 8px',
                borderRadius: '12px',
                border: '1px solid #a7f3d0'
              }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#047857' }}>
                  {images.filter(img => img.validation_status === 'valid').length}
                </span>
                <span style={{ fontSize: '10px', color: '#065f46' }}>Hợp lệ</span>
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                background: '#fef3c7',
                padding: '4px 8px',
                borderRadius: '12px',
                border: '1px solid #fde68a'
              }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#d97706' }}>
                  {images.filter(img => img.validation_status === 'pending').length}
                </span>
                <span style={{ fontSize: '10px', color: '#b45309' }}>Chờ</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              background: '#fff',
              border: '1px solid #e2e8f0',
              color: '#475569',
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            <FiArrowLeft size={14} />
            Quay lại
          </button>
        </div>
      </div>

      {/* Split Screen: RAW (Left) | Stained (Right) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '1px',
        background: '#e2e8f0',
        minHeight: '0',
        marginBottom: '24px'
      }}>
        {/* Left Panel - RAW/Processed Images */}
        <div style={{ 
          background: '#fff', 
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <ProcessedImageViewer
            visitId={visitId}
            rawImages={rawImages}
            processedImages={processedImages}
            onProcessClick={handleProcessImages}
            onImagesUpdate={loadImages}
            onImageUpload={handleImageUpload}
          />
        </div>

        {/* Right Panel - Stained Images */}
        <div style={{ 
          background: '#fff',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '8px 12px', 
            borderBottom: '1px solid #f1f5f9',
            background: '#f8fafc',
            flexShrink: 0
          }}>
            <h3 style={{ margin: '0 0 2px 0', fontSize: '14px', color: '#334155', fontWeight: '600' }}>
              🦷 Ảnh Nhuộm ({stainedImages.length}/9)
            </h3>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
              Upload 9 ảnh sau khi nhuộm mảng bám
            </p>
          </div>
          <div style={{ padding: '12px' }}>
            {renderImageGrid('stained', stainedImages)}
          </div>
        </div>
      </div>

    </div>
  )
}

export default ImageUpload
