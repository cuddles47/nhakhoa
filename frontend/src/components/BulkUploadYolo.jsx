import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { bulkUploadYoloImages, getPatients } from '../api'

function BulkUploadYolo() {
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [parsedData, setParsedData] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)

  // YOLO label files
  const [labelFiles, setLabelFiles] = useState([])
  const [labelPreview, setLabelPreview] = useState(null)

  // Patient mapping
  const [patientMappings, setPatientMappings] = useState({})
  const [editingGroup, setEditingGroup] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [expandedGroups, setExpandedGroups] = useState({})
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

  // Position mapping - matching backend
  const normalizePosition = (positionName) => {
    if (!positionName) return null

    const normalized = positionName
      .toLowerCase()
      .replace(/[-_\s]/g, '')

    const positionMap = {
      'upper_right': ['upperright', 'topright', 'trenphai', 'pct'],
      'upper_center': ['uppercenter', 'uppermiddle', 'topcenter', 'topmiddle', 'trengiua', 'gct'],
      'upper_left': ['upperleft', 'topleft', 'trentrai', 'tct'],
      'middle_right': ['middleright', 'centralright', 'centerright', 'giuaphai', 'p'],
      'middle_center': ['middlecenter', 'middlemiddle', 'centralcenter', 'centralmiddle', 'center', 'giua', 'g'],
      'middle_left': ['middleleft', 'centralleft', 'centerleft', 'giuatrai', 't'],
      'lower_right': ['lowerright', 'bottomright', 'duoiphai', 'pcd'],
      'lower_center': ['lowercenter', 'lowermiddle', 'bottomcenter', 'bottommiddle', 'duoigiua', 'gcd'],
      'lower_left': ['lowerleft', 'bottomleft', 'duoitrai', 'tcd']
    }

    for (const [standardType, variants] of Object.entries(positionMap)) {
      if (variants.some(v => normalized === v)) {
        return standardType
      }
    }

    return null
  }

  // Parse YOLO filename: Patient_XXXX_position.ext or Patient_add_XXXX_position.ext
  const parseFilename = (filename) => {
    const regex = /Patient_(?:add_)?(\d+)_(\w+)\.(jpg|jpeg|png|JPG|JPEG|PNG)$/i
    const match = filename.match(regex)

    if (!match) return null

    const [, patientId, positionCode, ext] = match
    const normalizedPosition = normalizePosition(positionCode)

    return {
      patientId: patientId.padStart(4, '0'),
      position: normalizedPosition,
      positionCode,
      filename,
      ext: ext.toLowerCase()
    }
  }

  // Recursively collect files from drag/drop (handles folder structure)
  const collectFilesFromDataTransfer = async (dataTransfer) => {
    try {
      if (!dataTransfer?.items || dataTransfer.items.length === 0) {
        return Array.from(dataTransfer?.files || [])
      }

      const traverseEntry = async (entry) => {
        if (!entry) return []

        if (entry.isFile) {
          return new Promise((resolve, reject) => {
            entry.file((file) => resolve([file]), reject)
          })
        }

        if (entry.isDirectory) {
          const reader = entry.createReader()
          const entries = []

          await new Promise((resolve, reject) => {
            const readEntries = () => {
              reader.readEntries((batch) => {
                if (!batch.length) {
                  resolve()
                  return
                }
                entries.push(...batch)
                readEntries()
              }, reject)
            }
            readEntries()
          })

          const files = []
          for (const child of entries) {
            const childFiles = await traverseEntry(child)
            files.push(...childFiles)
          }
          return files
        }

        return []
      }

      const entries = Array.from(dataTransfer.items)
        .map(item => (item.webkitGetAsEntry ? item.webkitGetAsEntry() : null))
        .filter(Boolean)

      if (!entries.length) {
        return Array.from(dataTransfer.files || [])
      }

      const files = []
      for (const entry of entries) {
        const entryFiles = await traverseEntry(entry)
        files.push(...entryFiles)
      }

      return files
    } catch (error) {
      console.error('Không thể đọc folder từ drag & drop, fallback sang FileList:', error)
      return Array.from(dataTransfer?.files || [])
    }
  }

  // Process all dropped/selected files
  const handleFiles = async (fileList) => {
    const allFiles = Array.from(fileList)
    const parsed = []
    const errors = []
    const imageFiles = []
    const yoloLabelFiles = []

    for (const file of allFiles) {
      const ext = file.name.split('.').pop().toLowerCase()

      if (ext === 'txt') {
        // YOLO label file
        yoloLabelFiles.push(file)
      } else if (['jpg', 'jpeg', 'png'].includes(ext)) {
        // Image file
        const info = parseFilename(file.name)
        if (info) {
          if (!info.position) {
            errors.push(`${file.name} (vị trí không hợp lệ)`)
          } else {
            imageFiles.push(file)
            parsed.push({ file, ...info })
          }
        } else {
          if (file.type?.startsWith('image/')) {
            errors.push(`${file.name} (sai định dạng tên file)`)
          }
        }
      }
    }

    if (errors.length > 0) {
      const errorList = errors.slice(0, 5).join('\n')
      const moreText = errors.length > 5 ? `\n... và ${errors.length - 5} file khác` : ''
      toast.error(`⚠️ Không thể parse ${errors.length} file:\n${errorList}${moreText}`, { duration: 8000 })
    }

    setFiles(imageFiles)
    setLabelFiles(yoloLabelFiles)

    // Generate label preview
    if (yoloLabelFiles.length > 0) {
      setLabelPreview({
        totalLabels: yoloLabelFiles.length,
        fileNames: yoloLabelFiles.map(f => f.name).slice(0, 10)
      })
      toast.success(`✓ Tìm thấy ${yoloLabelFiles.length} file YOLO label`)
    } else {
      toast('⚠️ Không tìm thấy file .txt YOLO label trong folder', {
        icon: '⚠️',
        style: {
          background: '#fff3cd',
          color: '#856404',
          border: '1px solid #ffc107'
        }
      })
    }

    // Group by patient ID
    const grouped = parsed.reduce((acc, item) => {
      const key = item.patientId
      if (!acc[key]) {
        acc[key] = {
          patientId: item.patientId,
          images: []
        }
      }
      acc[key].images.push(item)
      return acc
    }, {})

    const groupedArray = Object.values(grouped)
    setParsedData(groupedArray)
    setPatientMappings({})

    // Auto-assign patients
    if (groupedArray.length > 0) {
      await autoAssignPatients(groupedArray)
    }
  }

  const autoAssignPatients = async (groupedData) => {
    const newMappings = {}

    for (const group of groupedData) {
      const groupKey = group.patientId

      try {
        const response = await getPatients(`?search=Patient ID: ${group.patientId}&limit=50`)
        const matchedPatients = response.data.data || []

        const exactMatches = matchedPatients.filter(p =>
          p.notes && p.notes.includes(`Patient ID: ${group.patientId}`)
        )

        if (exactMatches.length === 1) {
          newMappings[groupKey] = {
            type: 'existing',
            patient: exactMatches[0]
          }
        } else if (exactMatches.length === 0) {
          newMappings[groupKey] = {
            type: 'new',
            patient: {
              name: `Bệnh Nhân #${group.patientId}`,
              phone: '',
              dob: '',
              gender: 'unknown',
              notes: `Patient ID: ${group.patientId}`
            }
          }
        } else {
          // Multiple matches - let user choose
          newMappings[groupKey] = {
            type: 'existing',
            patient: exactMatches[0]
          }
        }
      } catch (error) {
        newMappings[groupKey] = {
          type: 'new',
          patient: {
            name: `Bệnh Nhân #${group.patientId}`,
            phone: '',
            dob: '',
            gender: 'unknown',
            notes: `Patient ID: ${group.patientId}`
          }
        }
      }
    }

    setPatientMappings(newMappings)

    if (Object.keys(newMappings).length > 0) {
      const autoAssignedCount = Object.values(newMappings).filter(m => m.type === 'existing').length
      const autoCreateCount = Object.values(newMappings).filter(m => m.type === 'new').length

      if (autoAssignedCount > 0 || autoCreateCount > 0) {
        toast.success(
          `✓ Tự động gán: ${autoAssignedCount} bệnh nhân có sẵn, ${autoCreateCount} bệnh nhân mới`,
          { duration: 5000 }
        )
      }
    }
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
      setSearchResults([])
    }
  }

  const handleSelectExistingPatient = (group, patient) => {
    const groupKey = group.patientId
    setPatientMappings({
      ...patientMappings,
      [groupKey]: {
        type: 'existing',
        patient: patient
      }
    })
    setEditingGroup(null)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleCreateNewPatient = (group) => {
    const groupKey = group.patientId

    if (!newPatientForm.name.trim()) {
      toast.error('Vui lòng nhập tên bệnh nhân')
      return
    }

    setPatientMappings({
      ...patientMappings,
      [groupKey]: {
        type: 'new',
        patient: { ...newPatientForm }
      }
    })
    setEditingGroup(null)
    setNewPatientForm({ name: '', phone: '', dob: '', gender: 'unknown', notes: '' })
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
    const groupKey = group.patientId
    const newMappings = { ...patientMappings }
    delete newMappings[groupKey]
    setPatientMappings(newMappings)
  }

  // Validate before upload
  const handleUpload = async () => {
    if (parsedData.length === 0) {
      toast.error('Không có file nào để upload')
      return
    }

    if (labelFiles.length === 0) {
      toast.error('⚠️ Vui lòng chọn folder chứa file YOLO label (.txt) - Bắt buộc')
      return
    }

    const unmappedGroups = parsedData.filter(group => {
      return !patientMappings[group.patientId]
    })

    if (unmappedGroups.length > 0) {
      toast.error(`Vui lòng chọn/tạo bệnh nhân cho ${unmappedGroups.length} nhóm chưa được gán!`)
      return
    }

    await handleConfirmUpload()
  }

  // Confirm and send upload
  const handleConfirmUpload = async () => {
    try {
      setUploading(true)
      setUploadResult(null)
      setUploadProgress(0)

      const formData = new FormData()

      // Add image files
      files.forEach(file => {
        formData.append('images', file)
      })

      // Add YOLO label files
      labelFiles.forEach(file => {
        formData.append('yoloLabels', file)
      })

      // Build metadata - one entry per patient group
      const enrichedMetadata = parsedData.map(group => ({
        patientId: group.patientId,
        images: group.images.map(img => ({
          filename: img.filename,
          position: img.position,
          ext: img.ext
        })),
        patientMapping: patientMappings[group.patientId]
      }))

      formData.append('metadata', JSON.stringify(enrichedMetadata))

      const totalSize = files.reduce((sum, file) => sum + file.size, 0) +
                        labelFiles.reduce((sum, file) => sum + file.size, 0)
      console.log(`📦 Uploading ${files.length} images + ${labelFiles.length} labels (${(totalSize / 1024 / 1024).toFixed(2)} MB)`)

      toast.loading(`📤 Đang upload ${files.length} ảnh + ${labelFiles.length} labels...`, { id: 'yolo-upload' })

      const response = await bulkUploadYoloImages(formData, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        setUploadProgress(progress)
        console.log(`Upload progress: ${progress}%`)
      })

      const resultData = response.data.data

      // Check if this is an async job (202 response)
      if (response.status === 202 && resultData.jobId) {
        toast.dismiss('yolo-upload')
        toast.success(`✓ Upload đã được tiếp nhận! Đang xử lý ${resultData.totalImages} ảnh...`, { duration: 3000 })
        
        // Poll for job status
        await pollJobStatus(resultData.jobId)
      } else {
        // Legacy sync response
        toast.dismiss('yolo-upload')
        toast.success(
          `✓ Upload thành công!\n` +
          `Bệnh nhân: ${resultData.patientsCreated} mới, ` +
          `Lần khám: ${resultData.visitsCreated}, ` +
          `Ảnh: ${resultData.imagesCreated}, ` +
          `Annotations: ${resultData.annotationsCreated || 0}`,
          { duration: 5000 }
        )

        if (resultData.imagesWithoutAnnotations && resultData.imagesWithoutAnnotations.length > 0) {
          toast(`⚠️ ${resultData.imagesWithoutAnnotations.length} ảnh không có label`, {
            duration: 3000,
            icon: '⚠️',
            style: {
              background: '#fff3cd',
              color: '#856404',
              border: '1px solid #ffc107'
            }
          })
        }

        setUploadResult({ success: true, data: resultData })

        // Clear after success
        setFiles([])
        setLabelFiles([])
        setLabelPreview(null)
        setParsedData([])
        setPatientMappings({})

        setTimeout(() => {
          navigate('/patients')
        }, 2000)
      }

    } catch (error) {
      console.error('Upload error:', error)
      toast.dismiss('yolo-upload')

      let errorMsg = error.message
      if (error.code === 'ECONNABORTED') {
        errorMsg = 'Request timeout - file quá lớn hoặc mạng chậm'
      } else if (error.response) {
        errorMsg = error.response.data?.error || `Server error: ${error.response.status}`
      } else if (error.request) {
        errorMsg = 'Không nhận được phản hồi từ server - kiểm tra kết nối mạng'
      }

      toast.error(`❌ Upload thất bại: ${errorMsg}`, { duration: 10000 })
      setUploadResult({ success: false, error: errorMsg })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const pollJobStatus = async (jobId) => {
    const maxAttempts = 120 // 2 minutes max (120 * 1s)
    let attempts = 0
    
    const poll = async () => {
      try {
        attempts++
        const response = await fetch(`/api/bulk-upload-yolo/status/${jobId}`)
        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to get job status')
        }
        
        const job = data.data
        const progress = job.totalImages > 0 ? Math.round((job.processedImages / job.totalImages) * 100) : 0
        
        setUploadProgress(progress)
        toast.loading(`⏳ Đang xử lý: ${job.processedImages}/${job.totalImages} ảnh (${progress}%)...`, { id: 'yolo-upload' })
        
        if (job.status === 'completed') {
          toast.dismiss('yolo-upload')
          toast.success(
            `✓ Upload thành công!\n` +
            `Bệnh nhân: ${job.patientsCreated} mới, ` +
            `Lần khám: ${job.visitsCreated}, ` +
            `Ảnh: ${job.imagesCreated}, ` +
            `Annotations: ${job.annotationsCreated || 0}`,
            { duration: 5000 }
          )
          
          setUploadResult({ success: true, data: job })
          
          // Clear after success
          setFiles([])
          setLabelFiles([])
          setLabelPreview(null)
          setParsedData([])
          setPatientMappings({})
          
          setTimeout(() => {
            navigate('/patients')
          }, 2000)
          
          return
        }
        
        if (job.status === 'failed') {
          throw new Error(job.errorMessage || 'Upload failed')
        }
        
        if (attempts >= maxAttempts) {
          throw new Error('Upload timeout - job vẫn đang xử lý')
        }
        
        // Poll again after 1 second
        setTimeout(poll, 1000)
        
      } catch (error) {
        console.error('Poll error:', error)
        toast.dismiss('yolo-upload')
        toast.error(`❌ Upload thất bại: ${error.message}`, { duration: 10000 })
        setUploadResult({ success: false, error: error.message })
      }
    }
    
    await poll()
  }

  const handleClear = () => {
    setFiles([])
    setLabelFiles([])
    setLabelPreview(null)
    setParsedData([])
    setUploadResult(null)
    setPatientMappings({})
    setEditingGroup(null)
    setSearchQuery('')
    setSearchResults([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Drag & drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const filesFromDrop = await collectFilesFromDataTransfer(e.dataTransfer)
    handleFiles(filesFromDrop)
  }

  const handleFileSelect = (e) => {
    handleFiles(e.target.files)
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="bulk-upload-container">
      <div className="card">
        <h2>Bulk Upload YOLO</h2>
        <p style={{ color: 'var(--text-sub)', marginBottom: '20px' }}>
          Upload ảnh + YOLO annotations. Format tên: <code>Patient_XXXX_position.jpg</code> hoặc <code>Patient_add_XXXX_position.jpg</code>
        </p>

        {/* Upload Result */}
        {uploadResult && (
          <div className={uploadResult.success ? 'success' : 'error'}>
            {uploadResult.success ? (
              <>
                <strong>✓ Upload thành công!</strong>
                <p>
                  Đã tạo {uploadResult.data.patientsCreated} bệnh nhân, {uploadResult.data.visitsCreated} lần khám,
                  {uploadResult.data.imagesCreated} ảnh, và {uploadResult.data.annotationsCreated || 0} annotations.
                </p>
                {uploadResult.data.imagesWithoutAnnotations && uploadResult.data.imagesWithoutAnnotations.length > 0 && (
                  <p style={{ color: 'var(--warning)', marginTop: '8px' }}>
                    ⚠️ {uploadResult.data.imagesWithoutAnnotations.length} ảnh không có label
                  </p>
                )}
              </>
            ) : (
              <>
                <strong>Upload thất bại</strong>
                <p>{uploadResult.error}</p>
              </>
            )}
          </div>
        )}

        {/* YOLO Labels Status */}
        {labelPreview && (
          <div style={{
            marginBottom: '20px',
            padding: '16px',
            background: '#e8f5e9',
            borderRadius: '8px',
            border: '2px solid #4caf50'
          }}>
            <h3 style={{ marginBottom: '12px', color: '#2e7d32', fontSize: '16px' }}>
              📋 YOLO Labels ({labelPreview.totalLabels} file)
            </h3>
            <div style={{ fontSize: '13px', color: '#666' }}>
              {labelPreview.fileNames.join(', ')}
              {labelPreview.totalLabels > 10 && ` ... và ${labelPreview.totalLabels - 10} file khác`}
            </div>
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
            webkitdirectory="true"
            directory="true"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          <div className="upload-zone-content">
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>
              {isDragging ? '↓' : files.length > 0 ? '✓' : '↑'}
            </div>

            {files.length === 0 ? (
              <>
                <h3>Kéo thả FOLDER vào đây hoặc click để chọn</h3>
                <p style={{ color: '#666', marginTop: '10px' }}>
                  Folder chứa: ảnh JPG/PNG + file YOLO .txt (cùng tên)
                </p>
                <p style={{ color: '#0369a1', marginTop: '8px', fontSize: '13px', fontWeight: '500' }}>
                  📁 Ví dụ: image1.jpg + image1.txt
                </p>
              </>
            ) : (
              <>
                <h3>Đã chọn {files.length} ảnh + {labelFiles.length} labels</h3>
                <p style={{ color: '#666', marginTop: '10px' }}>
                  Click để chọn folder khác
                </p>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
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
              const groupKey = group.patientId
              const mapping = patientMappings[groupKey]
              const isEditing = editingGroup?.patientId === group.patientId

              const missingCount = 9 - group.images.length
              const hasMissing = missingCount > 0

              return (
                <div key={idx} className="bulk-preview-card">
                  <div className="bulk-preview-header">
                    <h4>ID #{group.patientId}</h4>
                    <span className="badge badge-info">
                      {group.images.length} ảnh
                    </span>
                  </div>

                  {/* Missing Images Warning */}
                  {hasMissing && (
                    <div style={{
                      padding: '8px',
                      background: '#fff3cd',
                      border: '1px solid #ffc107',
                      borderRadius: '4px',
                      marginBottom: '10px',
                      fontSize: '12px',
                      color: '#856404'
                    }}>
                      ⚠️ Thiếu {missingCount}/9 ảnh
                    </div>
                  )}

                  {/* Images Preview */}
                  <div className="bulk-preview-images">
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: '600' }}>
                      {group.images.length}/9 ảnh:
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
                  <div style={{ fontSize: '13px', color: '#666' }}>Nhóm ảnh</div>
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
                disabled={uploading}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: '600',
                  opacity: uploading ? 0.5 : 1,
                  cursor: uploading ? 'not-allowed' : 'pointer'
                }}
              >
                {uploading ? `⏳ Đang xử lý... ${uploadProgress}%` : `🚀 Xác nhận và Upload ${parsedData.length} nhóm`}
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

      {/* Format Guide */}
      <div className="card">
        <h3>Hướng Dẫn Đặt Tên File</h3>
        <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <p style={{ marginBottom: '10px' }}>
            <strong>Format:</strong> <code>Patient_XXXX_position.jpg</code> hoặc <code>Patient_add_XXXX_position.jpg</code>
          </p>
          <ul style={{ paddingLeft: '20px', color: '#666' }}>
            <li><strong>XXXX:</strong> ID bệnh nhân (4 số, ví dụ: 0001)</li>
            <li><strong>position:</strong> Vị trí ảnh (G, TCD, TCT, P, PCD, PCT, T, GCT, GCD)</li>
            <li><strong>Extension:</strong> .jpg hoặc .png</li>
          </ul>
          <p style={{ marginTop: '15px', color: '#666', fontSize: '14px' }}>
            <strong>YOLO Label:</strong> File .txt cùng tên với ảnh, format 6 field:
            <code>class_id x_center y_center width height tooth_id</code>
          </p>
          <p style={{ marginTop: '10px', color: '#666', fontSize: '13px' }}>
            <strong>Ví dụ:</strong> <code>Patient_0001_G.jpg</code> + <code>Patient_0001_G.txt</code>
          </p>
        </div>
      </div>
    </div>
  )
}

export default BulkUploadYolo
