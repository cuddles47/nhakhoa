import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { bulkUploadYoloImages, getPatients, createPatient } from '../api'

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
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationSummary, setValidationSummary] = useState(null)
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
      'upper_right': ['upperright', 'topright', 'trenphai', 'PCT'],
      'upper_center': ['uppercenter', 'uppermiddle', 'topcenter', 'topmiddle', 'trengiua', 'GCT'],
      'upper_left': ['upperleft', 'topleft', 'trentrai', 'TCT'],
      'middle_right': ['middleright', 'centralright', 'centerright', 'giuaphai', 'P'],
      'middle_center': ['middlecenter', 'middlemiddle', 'centralcenter', 'centralmiddle', 'center', 'giua', 'G'],
      'middle_left': ['middleleft', 'centralleft', 'centerleft', 'giuatrai', 'T'],
      'lower_right': ['lowerright', 'bottomright', 'duoiphai', 'PCD'],
      'lower_center': ['lowercenter', 'lowermiddle', 'bottomcenter', 'bottommiddle', 'duoigiua', 'GCD'],
      'lower_left': ['lowerleft', 'bottomleft', 'duoitrai', 'TCD']
    }

    for (const [standardType, variants] of Object.entries(positionMap)) {
      if (variants.some(v => normalized === v || normalized.includes(v) || v.includes(normalized))) {
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
  }

  const handleMappingChange = (groupKey, mapping) => {
    setPatientMappings({
      ...patientMappings,
      [groupKey]: mapping
    })
  }

  const handleRemoveMapping = (group) => {
    const groupKey = group.patientId
    const newMappings = { ...patientMappings }
    delete newMappings[groupKey]
    setPatientMappings(newMappings)
  }

  const handleSearchPatients = async (query) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      const response = await getPatients(`?search=${encodeURIComponent(query)}&limit=10`)
      setSearchResults(response.data.data || [])
    } catch (error) {
      setSearchResults([])
    }
  }

  const handleCreateNewPatient = async (groupKey) => {
    try {
      const response = await createPatient(newPatientForm)
      const newPatient = response.data.data

      setPatientMappings({
        ...patientMappings,
        [groupKey]: {
          type: 'existing',
          patient: newPatient
        }
      })

      toast.success(`✓ Đã tạo bệnh nhân: ${newPatient.name}`)
      setNewPatientForm({ name: '', phone: '', dob: '', gender: 'unknown', notes: '' })
    } catch (error) {
      toast.error('❌ Lỗi khi tạo bệnh nhân: ' + error.message)
    }
  }

  // Upload validation summary
  const generateValidationSummary = () => {
    const expectedPositions = [
      'upper_right', 'upper_center', 'upper_left',
      'middle_right', 'middle_center', 'middle_left',
      'lower_right', 'lower_center', 'lower_left'
    ]

    const positionLabels = {
      'upper_right': 'Trên phải',
      'upper_center': 'Trên giữa',
      'upper_left': 'Trên trái',
      'middle_right': 'Giữa phải',
      'middle_center': 'Giữa',
      'middle_left': 'Giữa trái',
      'lower_right': 'Dưới phải',
      'lower_center': 'Dưới giữa',
      'lower_left': 'Dưới trái'
    }

    const missingReport = []

    parsedData.forEach(group => {
      const uploadedPositions = group.images.map(img => img.position)
      const missingPositions = expectedPositions.filter(pos => !uploadedPositions.includes(pos))

      if (missingPositions.length > 0) {
        const missingLabels = missingPositions.map(pos => positionLabels[pos] || pos)
        missingReport.push({
          patientId: group.patientId,
          totalImages: group.images.length,
          missingCount: missingPositions.length,
          missingPositions: missingLabels
        })
      }
    })

    return missingReport
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

    const missingReport = generateValidationSummary()
    const totalImages = parsedData.reduce((sum, group) => sum + group.images.length, 0)
    const totalLabels = labelFiles.length
    const newPatientsCount = Object.values(patientMappings).filter(m => m.type === 'new').length
    const existingPatientsCount = Object.values(patientMappings).filter(m => m.type === 'existing').length

    setValidationSummary({
      totalImages,
      totalLabels,
      newPatientsCount,
      existingPatientsCount,
      patientsCount: parsedData.length,
      missingReport
    })
    setShowValidationModal(true)
  }

  // Confirm and send upload
  const handleConfirmUpload = async () => {
    setShowValidationModal(false)

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

  const handleClear = () => {
    setFiles([])
    setLabelFiles([])
    setLabelPreview(null)
    setParsedData([])
    setUploadResult(null)
    setPatientMappings({})
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

              return (
                <div key={idx} className="bulk-preview-card">
                  <div className="bulk-preview-header">
                    <h4>ID #{group.patientId}</h4>
                    <span className="badge badge-info">
                      {group.images.length} ảnh
                    </span>
                    {mapping && (
                      <span className={`badge ${mapping.type === 'existing' ? 'badge-success' : 'badge-warning'}`}>
                        {mapping.type === 'existing' ? '✓ Có sẵn' : '+ Mới'}
                      </span>
                    )}
                  </div>

                  {/* Image list */}
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                      Ảnh ({group.images.length}/9):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {group.images.map((img, imgIdx) => (
                        <span key={imgIdx} style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          background: '#e3f2fd',
                          borderRadius: '4px',
                          color: '#1565c0'
                        }}>
                          {img.positionCode}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Patient mapping section */}
                  <div style={{ marginTop: '12px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                    {!mapping ? (
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                          Chọn bệnh nhân:
                        </div>
                        <select
                          className="form-select"
                          onChange={(e) => {
                            if (e.target.value === 'new') {
                              handleMappingChange(groupKey, {
                                type: 'new',
                                patient: {
                                  name: `Bệnh Nhân #${group.patientId}`,
                                  phone: '',
                                  dob: '',
                                  gender: 'unknown',
                                  notes: `Patient ID: ${group.patientId}`
                                }
                              })
                            } else if (e.target.value) {
                              const patient = searchResults.find(p => p.id === parseInt(e.target.value))
                              if (patient) {
                                handleMappingChange(groupKey, {
                                  type: 'existing',
                                  patient
                                })
                              }
                            }
                          }}
                          style={{ width: '100%', padding: '6px 8px', fontSize: '12px' }}
                        >
                          <option value="">-- Chọn --</option>
                          <option value="new">+ Tạo mới</option>
                          {searchResults.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: '600' }}>
                            {mapping.patient.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#666' }}>
                            {mapping.type === 'existing' ? 'Bệnh nhân có sẵn' : 'Bệnh nhân mới'}
                          </div>
                        </div>
                        <button
                          className="button-secondary"
                          onClick={() => handleRemoveMapping(group)}
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          Xóa
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Search input */}
          <div style={{ marginTop: '20px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Tìm bệnh nhân theo tên hoặc SĐT..."
              value={searchQuery}
              onChange={(e) => handleSearchPatients(e.target.value)}
              style={{ width: '100%', padding: '8px 12px' }}
            />
          </div>

          {/* Upload Button */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              className="button"
              onClick={handleUpload}
              disabled={uploading}
              style={{
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              {uploading ? `⏳ Đang upload... ${uploadProgress}%` : `📤 Upload ${parsedData.length} nhóm`}
            </button>
          </div>
        </div>
      )}

      {/* Validation Modal */}
      {showValidationModal && validationSummary && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{
              marginBottom: '20px',
              color: '#1F2937',
              fontSize: '22px'
            }}>
              📊 Xác Nhận Upload YOLO
            </h2>

            {/* Summary Stats */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Bệnh nhân</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1E88E5' }}>
                    {validationSummary.patientsCount}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Ảnh</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1E88E5' }}>
                    {validationSummary.totalImages}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>YOLO Labels</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9C27B0' }}>
                    {validationSummary.totalLabels}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Bệnh nhân mới</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                    {validationSummary.newPatientsCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Missing Images Warning */}
            {validationSummary.missingReport.length > 0 ? (
              <div style={{
                background: '#FFF3E0',
                border: '2px solid #FFA726',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px'
              }}>
                <h3 style={{ color: '#E65100', fontSize: '16px', marginBottom: '15px' }}>
                  ⚠️ Cảnh báo: {validationSummary.missingReport.length} bệnh nhân thiếu ảnh
                </h3>
                <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {validationSummary.missingReport.map((report, idx) => (
                    <div key={idx} style={{
                      background: 'white',
                      padding: '12px',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      border: '1px solid #FFB74D'
                    }}>
                      <div style={{ fontWeight: 'bold', color: '#E65100', marginBottom: '5px' }}>
                        Bệnh Nhân #{report.patientId}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        ✅ Có: {report.totalImages}/9 ảnh | ❌ Thiếu: {report.missingPositions.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                background: '#E8F5E9',
                border: '2px solid #4CAF50',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>✅</div>
                <div style={{ color: '#2E7D32', fontSize: '16px', fontWeight: '600' }}>
                  Hoàn hảo! Tất cả bệnh nhân đều có đủ 9 ảnh
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '25px' }}>
              <button
                className="button"
                onClick={handleConfirmUpload}
                disabled={uploading}
                style={{
                  flex: 1,
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: '600',
                  background: '#4CAF50',
                  opacity: uploading ? 0.5 : 1,
                  cursor: uploading ? 'not-allowed' : 'pointer'
                }}
              >
                {uploading ? `⏳ Đang xử lý... ${uploadProgress}%` : '✓ Xác Nhận Upload'}
              </button>
              <button
                className="button-secondary button"
                onClick={() => setShowValidationModal(false)}
                disabled={uploading}
                style={{
                  padding: '14px 24px',
                  fontSize: '15px',
                  fontWeight: '600'
                }}
              >
                Hủy
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
