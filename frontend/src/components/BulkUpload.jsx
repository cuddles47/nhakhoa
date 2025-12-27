import { useState, useRef } from 'react'
import { bulkUploadImages, getPatients, createPatient } from '../api'

function BulkUpload() {
  const [files, setFiles] = useState([])
  const [parsedData, setParsedData] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const fileInputRef = useRef(null)
  
  // Patient mapping: { groupKey: { type: 'existing'|'new', patient: {...} } }
  const [patientMappings, setPatientMappings] = useState({})
  const [editingGroup, setEditingGroup] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [expandedGroups, setExpandedGroups] = useState({}) // Track which groups are expanded
  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    phone: '',
    dob: '',
    gender: 'unknown',
    notes: ''
  })

  const toggleGroupExpansion = (groupKey) => {
    setExpandedGroups({
      ...expandedGroups,
      [groupKey]: !expandedGroups[groupKey]
    })
  }

  // Parse filename: Patient_0061_28-10-2025_Bottom-left_JPG.rf.2a1880e537881d1577af1f9ba997076f
  const parseFilename = (filename) => {
    // Match pattern: Patient_XXXX_DD-MM-YYYY_Position_JPG.rf.hash or Patient_XXXX_DD-MM-YYYY_Position.JPG
    const regex = /Patient_(\d+)_(\d{2})-(\d{2})-(\d{4})_(.+?)(?:_(?:JPG|PNG|jpg|png))?(?:\.rf\.[a-f0-9]+|\.(jpg|jpeg|png|JPG|JPEG|PNG))$/i
    const match = filename.match(regex)
    
    if (!match) {
      return null
    }
    
    const [, patientId, day, month, year, position] = match
    return {
      patientId: patientId.padStart(4, '0'),
      visitDate: `${year}-${month}-${day}`,
      position: position.toLowerCase().replace(/-/g, '_'),
      filename,
      ext: 'jpg' // Default to jpg since format is complex
    }
  }

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList)
    const parsed = []
    const errors = []

    newFiles.forEach(file => {
      const info = parseFilename(file.name)
      if (info) {
        parsed.push({
          file,
          ...info
        })
      } else {
        errors.push(file.name)
      }
    })

    if (errors.length > 0) {
      alert(`⚠️ Không thể parse ${errors.length} file:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`)
    }

    setFiles(newFiles)
    
    // Group by patient ID and visit date
    const grouped = parsed.reduce((acc, item) => {
      const key = `${item.patientId}_${item.visitDate}`
      if (!acc[key]) {
        acc[key] = {
          patientId: item.patientId,
          visitDate: item.visitDate,
          images: []
        }
      }
      acc[key].images.push(item)
      return acc
    }, {})

    setParsedData(Object.values(grouped))
    
    // Reset patient mappings when new files are loaded
    setPatientMappings({})
  }

  const handleSearchPatient = async (query) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    
    try {
      const response = await getPatients(`?search=${encodeURIComponent(query)}&limit=15`)
      setSearchResults(response.data.data || [])
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    }
  }

  const handleSelectExistingPatient = (group, patient) => {
    const groupKey = `${group.patientId}_${group.visitDate}`
    setPatientMappings({
      ...patientMappings,
      [groupKey]: {
        type: 'existing',
        patient: patient,
        patientId: group.patientId,
        visitDate: group.visitDate
      }
    })
    setEditingGroup(null)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleCreateNewPatient = (group) => {
    const groupKey = `${group.patientId}_${group.visitDate}`
    
    // Validate form
    if (!newPatientForm.name.trim()) {
      alert('Vui lòng nhập tên bệnh nhân')
      return
    }
    
    setPatientMappings({
      ...patientMappings,
      [groupKey]: {
        type: 'new',
        patient: { ...newPatientForm },
        patientId: group.patientId,
        visitDate: group.visitDate
      }
    })
    setEditingGroup(null)
    setNewPatientForm({
      name: '',
      phone: '',
      dob: '',
      gender: 'unknown',
      notes: ''
    })
  }

  const handleEditGroup = (group) => {
    setEditingGroup(group)
    setSearchQuery('')
    setSearchResults([])
    setNewPatientForm({
      name: `Bệnh Nhân #${group.patientId}`,
      phone: '',
      dob: '',
      gender: 'unknown',
      notes: `Patient ID: ${group.patientId}`
    })
  }

  const handleRemoveMapping = (group) => {
    const groupKey = `${group.patientId}_${group.visitDate}`
    const newMappings = { ...patientMappings }
    delete newMappings[groupKey]
    setPatientMappings(newMappings)
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    handleFiles(files)
  }

  const handleFileSelect = (e) => {
    const files = e.target.files
    handleFiles(files)
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async () => {
    if (parsedData.length === 0) {
      alert('Không có file nào để upload')
      return
    }

    // Validate: All groups must have patient mapping
    const unmappedGroups = parsedData.filter(group => {
      const groupKey = `${group.patientId}_${group.visitDate}`
      return !patientMappings[groupKey]
    })

    if (unmappedGroups.length > 0) {
      alert(`Vui lòng chọn/tạo bệnh nhân cho ${unmappedGroups.length} nhóm chưa được gán!`)
      return
    }

    // Confirm before uploading
    const totalImages = parsedData.reduce((sum, group) => sum + group.images.length, 0)
    const newPatientsCount = Object.values(patientMappings).filter(m => m.type === 'new').length
    const existingPatientsCount = Object.values(patientMappings).filter(m => m.type === 'existing').length
    
    const confirmed = window.confirm(
      `Bạn sắp:\n` +
      `- Tạo ${newPatientsCount} bệnh nhân mới\n` +
      `- Gán ${existingPatientsCount} nhóm cho bệnh nhân có sẵn\n` +
      `- Tạo ${parsedData.length} lần khám\n` +
      `- Upload ${totalImages} ảnh\n\n` +
      `Xác nhận?`
    )

    if (!confirmed) return

    try {
      setUploading(true)
      setUploadResult(null)

      const formData = new FormData()
      
      // Add all files
      files.forEach(file => {
        formData.append('images', file)
      })

      // Merge parsedData with patientMappings
      const enrichedMetadata = parsedData.map(group => {
        const groupKey = `${group.patientId}_${group.visitDate}`
        const mapping = patientMappings[groupKey]
        
        return {
          ...group,
          patientMapping: mapping
        }
      })

      // Add metadata
      formData.append('metadata', JSON.stringify(enrichedMetadata))
setPatientMappings({})
    setEditingGroup(null)
    setSearchQuery('')
    setSearchResults([])
    
      const response = await bulkUploadImages(formData)
      
      setUploadResult({
        success: true,
        data: response.data
      })

      // Clear files after success
      setFiles([])
      setParsedData([])
      setPatientMappings({})
      
    } catch (error) {
      console.error('Upload error:', error)
      setUploadResult({
        success: false,
        error: error.response?.data?.error || error.message
      })
    } finally {
      setUploading(false)
    }
  }

  const handleClear = () => {
    setFiles([])
    setParsedData([])
    setUploadResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bulk-upload-container">
      <div className="card">
        <h2>Bulk Upload Ảnh</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Upload hàng loạt ảnh với tên file theo format: <code>Patient_XXXX_DD-MM-YYYY_Position.JPG</code>
        </p>

        {/* Upload Result */}
        {uploadResult && (
          <div className={uploadResult.success ? 'success' : 'error'} style={{ marginBottom: '20px' }}>
            {uploadResult.success ? (
              <>
                <strong>✓ Upload thành công!</strong>
                <p>Đã tạo {uploadResult.data.patientsCreated} bệnh nhân, {uploadResult.data.visitsCreated} lần khám, và {uploadResult.data.imagesCreated} ảnh.</p>
              </>
            ) : (
              <>
                <strong>Upload thất bại</strong>
                <p>{uploadResult.error}</p>
              </>
            )}
          </div>
        )}

        {/* Drag and Drop Zone */}
        <div
          className={`upload-zone-bulk ${isDragging ? 'dragging' : ''} ${files.length > 0 ? 'has-files' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          <div className="upload-zone-content">
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>
              {isDragging ? '↓' : files.length > 0 ? '✓' : '↑'}
            </div>
            
            {files.length === 0 ? (
              <>
                <h3>Kéo thả ảnh vào đây hoặc click để chọn</h3>
                <p style={{ color: '#666', marginTop: '10px' }}>
                  Chấp nhận: JPG, JPEG, PNG
                </p>
              </>
            ) : (
              <>
                <h3>Đã chọn {files.length} file</h3>
                <p style={{ color: '#666', marginTop: '10px' }}>
                  Click để chọn thêm hoặc kéo thả file khác
                </p>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons - Clear only, Upload moved to bottom */}
        {files.length > 0 && (
          <div className="button-group" style={{ marginTop: '20px' }}>
            <button
              className="button-secondary button"
              onClick={handleClear}
              disabled={uploading}
            >
              Xóa tất cả
            </button>
          </div>
        )}
      </div>

      {/* Parsed Data Preview with Patient Assignment */}
      {parsedData.length > 0 && (
        <div className="card">
          <h3>Gán Bệnh Nhân Cho Nhóm Ảnh ({parsedData.length} nhóm)</h3>
          <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
            Chọn bệnh nhân có sẵn hoặc tạo mới cho mỗi nhóm ảnh
          </p>
          
          <div className="bulk-preview-grid">
            {parsedData.map((group, idx) => {
              const groupKey = `${group.patientId}_${group.visitDate}`
              const mapping = patientMappings[groupKey]
              const isEditing = editingGroup?.patientId === group.patientId && editingGroup?.visitDate === group.visitDate

              return (
                <div key={idx} className="bulk-preview-card">
                  <div className="bulk-preview-header">
                    <h4>ID #{group.patientId}</h4>
                    <span className="badge badge-info">
                      {new Date(group.visitDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  
                  {/* Images Preview */}
                  <div className="bulk-preview-images">
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
                      {group.images.length} ảnh:
                    </p>
                    <div className="image-list">
                      {(expandedGroups[groupKey] ? group.images : group.images.slice(0, 5)).map((img, i) => (
                        <div key={i} className="image-preview-item" style={{ marginBottom: '4px' }}>
                          <span className="image-icon" style={{ color: '#1E88E5', fontSize: '8px', marginRight: '6px' }}>●</span>
                          <span 
                            className="image-name" 
                            title={img.filename}
                            style={{ 
                              fontSize: '11px', 
                              color: '#444',
                              wordBreak: 'break-all',
                              lineHeight: '1.4'
                            }}
                          >
                            {img.filename}
                          </span>
                        </div>
                      ))}
                      {group.images.length > 5 && (
                        <div 
                          className="image-preview-item" 
                          onClick={() => toggleGroupExpansion(groupKey)}
                          style={{ 
                            cursor: 'pointer', 
                            color: '#1E88E5',
                            fontSize: '11px',
                            fontWeight: '600',
                            marginTop: '6px',
                            padding: '4px 0'
                          }}
                          onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                          onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                        >
                          {expandedGroups[groupKey] 
                            ? '▲ Thu gọn' 
                            : `▼ +${group.images.length - 5} ảnh khác`
                          }
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Patient Assignment Status */}
                  {mapping ? (
                    <div style={{ marginTop: '10px', padding: '10px', background: '#e8f5e9', borderRadius: '4px', border: '1px solid #4CAF50' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '12px', color: '#4CAF50', fontWeight: 'bold', marginBottom: '4px' }}>
                            {mapping.type === 'existing' ? '✓ Bệnh nhân có sẵn' : '✓ Tạo bệnh nhân mới'}
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: '600' }}>{mapping.patient.name}</div>
                          {mapping.patient.phone && (
                            <div style={{ fontSize: '12px', color: '#666' }}>{mapping.patient.phone}</div>
                          )}
                        </div>
                        <button
                          className="button-secondary button"
                          onClick={() => handleRemoveMapping(group)}
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                        >
                          Đổi
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '10px' }}>
                      {!isEditing ? (
                        <button
                          className="button"
                          onClick={() => handleEditGroup(group)}
                          style={{ width: '100%' }}
                        >
                          Chọn/Tạo Bệnh Nhân
                        </button>
                      ) : (
                        <div style={{ padding: '10px', background: '#f9fbfc', borderRadius: '4px', border: '1px solid #ddd' }}>
                          {/* Search Existing */}
                          <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: '600' }}>
                              Tìm bệnh nhân có sẵn
                            </label>
                            <input
                              type="text"
                              placeholder="Tìm theo tên hoặc SĐT..."
                              value={searchQuery}
                              onChange={(e) => handleSearchPatient(e.target.value)}
                              style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                            />
                            {searchResults.length > 0 && (
                              <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px', background: 'white' }}>
                                {searchResults.map(patient => (
                                  <div
                                    key={patient.id}
                                    onClick={() => handleSelectExistingPatient(group, patient)}
                                    style={{ 
                                      padding: '8px', 
                                      cursor: 'pointer', 
                                      borderBottom: '1px solid #f0f0f0',
                                      fontSize: '13px'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                                    onMouseLeave={(e) => e.target.style.background = 'white'}
                                  >
                                    <div style={{ fontWeight: '600' }}>{patient.name}</div>
                                    <div style={{ fontSize: '11px', color: '#666' }}>{patient.phone}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* OR Divider */}
                          <div style={{ textAlign: 'center', margin: '10px 0', color: '#999', fontSize: '12px' }}>
                            HOẶC
                          </div>

                          {/* Create New Patient */}
                          <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: '600' }}>
                              Tạo bệnh nhân mới
                            </label>
                            <input
                              type="text"
                              placeholder="Tên bệnh nhân *"
                              value={newPatientForm.name}
                              onChange={(e) => setNewPatientForm({...newPatientForm, name: e.target.value})}
                              style={{ width: '100%', padding: '6px', fontSize: '13px', marginBottom: '5px' }}
                            />
                            <input
                              type="text"
                              placeholder="Số điện thoại"
                              value={newPatientForm.phone}
                              onChange={(e) => setNewPatientForm({...newPatientForm, phone: e.target.value})}
                              style={{ width: '100%', padding: '6px', fontSize: '13px', marginBottom: '5px' }}
                            />
                            <input
                              type="date"
                              placeholder="Ngày sinh"
                              value={newPatientForm.dob}
                              onChange={(e) => setNewPatientForm({...newPatientForm, dob: e.target.value})}
                              style={{ width: '100%', padding: '6px', fontSize: '13px', marginBottom: '5px' }}
                            />
                            <select
                              value={newPatientForm.gender}
                              onChange={(e) => setNewPatientForm({...newPatientForm, gender: e.target.value})}
                              style={{ width: '100%', padding: '6px', fontSize: '13px', marginBottom: '10px' }}
                            >
                              <option value="unknown">Chưa xác định</option>
                              <option value="male">Nam</option>
                              <option value="female">Nữ</option>
                            </select>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              className="button"
                              onClick={() => handleCreateNewPatient(group)}
                              style={{ flex: 1, padding: '6px', fontSize: '13px' }}
                            >
                              Tạo & Gán
                            </button>
                            <button
                              className="button-secondary button"
                              onClick={() => setEditingGroup(null)}
                              style={{ padding: '6px 12px', fontSize: '13px' }}
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Confirmation Summary */}
          <div style={{ marginTop: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '12px', border: '2px solid #e0e0e0' }}>
            <h3 style={{ marginBottom: '15px', color: '#1F2937', fontSize: '16px' }}>📋 Xác Nhận Trước Khi Upload</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
                <div style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1E88E5' }}>
                    {parsedData.length}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>Nhóm ảnh (lần khám)</div>
                </div>
                <div style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1E88E5' }}>
                    {parsedData.reduce((sum, group) => sum + group.images.length, 0)}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>Tổng số ảnh</div>
                </div>
                <div style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                    {Object.values(patientMappings).filter(m => m.type === 'new').length}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>Bệnh nhân mới</div>
                </div>
                <div style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFA726' }}>
                    {Object.values(patientMappings).filter(m => m.type === 'existing').length}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>Bệnh nhân có sẵn</div>
                </div>
              </div>

              {/* Status Message */}
              {Object.keys(patientMappings).length < parsedData.length ? (
                <div style={{ 
                  padding: '12px 16px', 
                  background: '#FFF3E0', 
                  border: '1px solid #FFA726',
                  borderRadius: '8px',
                  color: '#E65100',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>⚠️</span>
                  <div>
                    <strong>Chưa hoàn tất:</strong> {parsedData.length - Object.keys(patientMappings).length} nhóm chưa gán bệnh nhân.
                    <br />
                    <span style={{ fontSize: '13px' }}>Vui lòng gán bệnh nhân cho tất cả các nhóm trước khi upload.</span>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  padding: '12px 16px', 
                  background: '#E8F5E9', 
                  border: '1px solid #4CAF50',
                  borderRadius: '8px',
                  color: '#2E7D32',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>✅</span>
                  <div>
                    <strong>Sẵn sàng upload!</strong> Tất cả {parsedData.length} nhóm đã được gán bệnh nhân.
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="button"
                onClick={handleUpload}
                disabled={uploading || Object.keys(patientMappings).length < parsedData.length}
                style={{ 
                  flex: 1, 
                  padding: '14px', 
                  fontSize: '15px',
                  fontWeight: '600',
                  opacity: (uploading || Object.keys(patientMappings).length < parsedData.length) ? 0.5 : 1,
                  cursor: (uploading || Object.keys(patientMappings).length < parsedData.length) ? 'not-allowed' : 'pointer'
                }}
              >
                {uploading ? '⏳ Đang xử lý...' : `🚀 Xác nhận và Upload ${parsedData.length} nhóm`}
              </button>
              <button
                className="button-secondary button"
                onClick={handleClear}
                disabled={uploading}
                style={{ 
                  padding: '14px 24px', 
                  fontSize: '15px',
                  fontWeight: '600'
                }}
              >
                ❌ Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Format Guide
      <div className="card">
        <h3>Hướng Dẫn Đặt Tên File</h3>
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <p style={{ marginBottom: '10px' }}><strong>Format:</strong> <code>Patient_XXXX_DD-MM-YYYY_Position.JPG</code></p>
          <ul style={{ paddingLeft: '20px', color: '#666' }}>
            <li><strong>XXXX:</strong> ID bệnh nhân (4 số, ví dụ: 0094)</li>
            <li><strong>DD-MM-YYYY:</strong> Ngày khám (ví dụ: 25-11-2025)</li>
            <li><strong>Position:</strong> Vị trí ảnh (ví dụ: Top-middle, Bottom-left)</li>
            <li><strong>Extension:</strong> .JPG hoặc .PNG</li>
          </ul>
          <p style={{ marginTop: '15px', color: '#666', fontSize: '14px' }}>
            <strong>Ví dụ:</strong> <code>Patient_0094_25-11-2025_Top-middle.JPG</code>
          </p>
        </div>
      </div> */}
    </div>
  )
}

export default BulkUpload
