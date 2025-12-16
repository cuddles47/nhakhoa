import { useState, useEffect } from 'react'
import { getImagesByVisit, createImage, updateImageValidation } from '../api'
import { FiArrowLeft, FiImage, FiUpload, FiCheck, FiX, FiCheckCircle, FiXCircle } from 'react-icons/fi'

function ImageUpload({ visit, onBack }) {
  const [images, setImages] = useState([])
  const [rawImages, setRawImages] = useState([])
  const [stainedImages, setStainedImages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (visit) {
      loadImages()
    }
  }, [visit])

  const loadImages = async () => {
    try {
      setLoading(true)
      const response = await getImagesByVisit(visit.id)
      const allImages = response.data.data || []
      
      setImages(allImages)
      setRawImages(allImages.filter(img => img.image_category === 'raw'))
      setStainedImages(allImages.filter(img => img.image_category === 'stained'))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (category, index) => {
    // Mock upload - In reality, you'd upload to MinIO first
    const mockUrl = `nhakhoa/visits/${visit.id}/${category}_${String(index).padStart(3, '0')}.jpg`
    
    try {
      const imageData = {
        visit_id: visit.id,
        url_minio: mockUrl,
        image_category: category,
        image_type: `position_${index}`,
        image_index: index,
        notes: `${category === 'raw' ? 'Ảnh RAW' : 'Ảnh nhuộm'} số ${index}`
      }
      
      await createImage(imageData)
      loadImages()
    } catch (err) {
      alert('Không thể tạo ảnh')
      console.error(err)
    }
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
    const positions = Array.from({ length: 9 }, (_, i) => i + 1)
    
    return (
      <div className="image-grid">
        {positions.map((pos) => {
          const image = imagesList.find(img => img.image_index === pos)
          
          return (
            <div 
              key={pos} 
              className={`image-card ${image ? 'uploaded' : 'pending'}`}
            >
              {image ? (
                <>
                  <div style={{ fontSize: '48px', marginBottom: '10px', color: 'var(--primary)' }}>
                    <FiImage size={48} />
                  </div>
                  <p style={{ fontSize: '12px', color: '#666' }}>
                    Ảnh {pos} - {image.validation_status}
                  </p>
                  <div style={{ marginTop: '10px', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                    {image.validation_status === 'pending' && (
                      <>
                        <button 
                          className="button"
                          style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleValidation(image.id, 'valid')}
                        >
                          <FiCheck size={12} />
                          Hợp lệ
                        </button>
                        <button 
                          className="button-danger button"
                          style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleValidation(image.id, 'invalid')}
                        >
                          <FiX size={12} />
                          Không hợp lệ
                        </button>
                      </>
                    )}
                    {image.validation_status === 'valid' && (
                      <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiCheckCircle size={12} />
                        Đã xác nhận
                      </span>
                    )}
                    {image.validation_status === 'invalid' && (
                      <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiXCircle size={12} />
                        Không hợp lệ
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div 
                    className="upload-zone"
                    onClick={() => handleImageUpload(category, pos)}
                  >
                    <div style={{ fontSize: '48px', color: 'var(--text-sub)' }}>
                      <FiUpload size={48} />
                    </div>
                    <p>Upload ảnh {pos}</p>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (!visit) {
    return (
      <div className="card">
        <p>Vui lòng chọn lần khám trước</p>
        <button className="button" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FiArrowLeft size={16} />
          Quay lại
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Upload Ảnh - Lần Khám #{visit.id}</h2>
            <p style={{ color: '#666', fontSize: '14px' }}>
              Ngày khám: {new Date(visit.visit_date).toLocaleDateString('vi-VN')}
            </p>
          </div>
          <button className="button-secondary button" onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiArrowLeft size={16} />
            Quay lại
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Ảnh RAW ({rawImages.length}/9)</h2>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          Upload 9 ảnh gốc (chưa nhuộm)
        </p>
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : (
          renderImageGrid('raw', rawImages)
        )}
      </div>

      <div className="card">
        <h2>Ảnh Nhuộm ({stainedImages.length}/9)</h2>
        <p style={{ color: '#666', marginBottom: '15px' }}>
          Upload 9 ảnh sau khi nhuộm mảng bám
        </p>
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : (
          renderImageGrid('stained', stainedImages)
        )}
      </div>

      <div className="card">
        <h3>Tổng Quan</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginTop: '15px' }}>
          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
              {rawImages.length}/9
            </div>
            <div style={{ color: '#666' }}>Ảnh RAW</div>
          </div>
          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
              {stainedImages.length}/9
            </div>
            <div style={{ color: '#666' }}>Ảnh Nhuộm</div>
          </div>
          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
              {images.filter(img => img.validation_status === 'valid').length}
            </div>
            <div style={{ color: '#666' }}>Ảnh Hợp Lệ</div>
          </div>
          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
              {images.filter(img => img.validation_status === 'pending').length}
            </div>
            <div style={{ color: '#666' }}>Chờ Kiểm Tra</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageUpload
