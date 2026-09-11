import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { bulkUploadImages, getPatients, createPatient } from '../api'

// BUILD-TAG-2026-09-10-B
console.log('BulkUpload bundle build: 2026-09-10-B (stub-skip + 0-byte guard)')

function BulkUpload() {
  const navigate = useNavigate()
  const [files, setFiles] = useState([])
  const [parsedData, setParsedData] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)
  
  // Annotation file state
  const [annotationFile, setAnnotationFile] = useState(null)
  const [annotationPreview, setAnnotationPreview] = useState(null)
  
  // Patient mapping: { groupKey: { type: 'existing'|'new', patient: {...} } }
  const [patientMappings, setPatientMappings] = useState({})
  const [editingGroup, setEditingGroup] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [expandedGroups, setExpandedGroups] = useState({}) // Track which groups are expanded
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

  // Parse filename: Patient_0127_26-11-2025_Bottom-left_JPG.rf.c26f53735acf4f0b26dd6ed747ed87f7.jpg
  //               : patient_add_0001_G.jpg (new format, no date)
  const parseFilename = (filename) => {
    // Old pattern: Patient_XXXX_DD-MM-YYYY_Position_JPG.rf.hash or Patient_XXXX_DD-MM-YYYY_Position.JPG
    const oldRegex = /Patient_(\d+)_(\d{2})-(\d{2})-(\d{4})_(.+?)(?:_(?:JPG|PNG|jpg|png))?(?:\.rf\.[a-f0-9]+|\.(jpg|jpeg|png|JPG|JPEG|PNG))$/i
    let match = filename.match(oldRegex)
    
    let patientId, position, visitDate
    let day, month, year
    
    if (match) {
      [, patientId, day, month, year, position] = match
      visitDate = `${year}-${month}-${day}`
    } else {
      // New pattern: patient_add_XXXX_Position.ext (no date, uses today)
      const newRegex = /(?:patient[_-]add|patient|Patient)[_-](\d+)_{0,1}(.+?)(?:\.rf\.[a-f0-9]+)?\.(?:jpg|jpeg|png|JPG|JPEG|PNG)$/i
      match = filename.match(newRegex)
      if (match) {
        [, patientId, position] = match
        visitDate = new Date().toISOString().split('T')[0]
      }
    }
    
    if (!match) {
      return null
    }
    
    // Normalize position using comprehensive mapping
    const normalizedPosition = normalizePosition(position)
    
    console.log(`📸 Parsed ${filename}: position="${position}" -> normalized="${normalizedPosition}"`)
    
    return {
      patientId: patientId.padStart(4, '0'),
      visitDate,
      position: normalizedPosition,
      filename,
      ext: 'jpg' // Default to jpg since format is complex
    }
  }

  // Normalize position name with all variations
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
    
    // First pass: exact match
    for (const [standardType, variants] of Object.entries(positionMap)) {
      if (variants.some(v => normalized === v.toLowerCase())) {
        return standardType
      }
    }
    // Second pass: partial match (multi-char only, longest-match-wins to avoid
    // single-letter code collisions like 't' matching 'bottomleft', or
    // 'center' matching inside 'bottomcenter')
    let best = null
    let bestLen = 0
    for (const [standardType, variants] of Object.entries(positionMap)) {
      for (const v of variants) {
        const vn = v.toLowerCase()
        if (vn.length < 2 || vn.length <= bestLen) continue
        if (normalized.includes(vn) || vn.includes(normalized)) {
          bestLen = vn.length
          best = standardType
        }
      }
    }
    if (best) return best
    
    console.warn(`⚠️ Unknown position: "${positionName}"`)
    return null
  }

  const processAnnotationFile = async (file, groupedData) => {
    try {
      const text = await file.text()
      const cocoData = JSON.parse(text)

      if (!cocoData.images || !cocoData.annotations || !cocoData.categories) {
        toast.error('⚠️ File annotation không đúng định dạng COCO JSON');
        return
      }

      setAnnotationFile(file)

      // Generate preview statistics
      const preview = {
        totalImages: cocoData.images.length,
        totalAnnotations: cocoData.annotations.length,
        categories: cocoData.categories.map(c => c.name),
        imageAnnotationCounts: {}
      }

      cocoData.annotations.forEach(ann => {
        preview.imageAnnotationCounts[ann.image_id] = 
          (preview.imageAnnotationCounts[ann.image_id] || 0) + 1
      })

      preview.avgAnnotations = (preview.totalAnnotations / preview.totalImages).toFixed(1)
      setAnnotationPreview(preview)

      // Analyze missing images
      analyzeMissingImages(cocoData, groupedData)

    } catch (error) {
      toast.error('❌ Lỗi khi đọc file annotation: ' + error.message);
    }
  }

  const analyzeMissingImages = (cocoData, groupedData) => {
    // Expected 9 positions per patient
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

    groupedData.forEach(group => {
      const uploadedPositions = group.images.map(img => img.position)
      const missingPositions = expectedPositions.filter(pos => !uploadedPositions.includes(pos))
      
      if (missingPositions.length > 0) {
        const missingLabels = missingPositions.map(pos => positionLabels[pos] || pos)
        missingReport.push({
          patientId: group.patientId,
          visitDate: group.visitDate,
          totalImages: group.images.length,
          missingCount: missingPositions.length,
          missingPositions: missingLabels
        })
      }
    })

    if (missingReport.length > 0) {
      let message = `⚠️ Phát hiện ${missingReport.length} bệnh nhân thiếu ảnh:\n\n`
      missingReport.forEach(report => {
        message += `• Patient #${report.patientId} (${new Date(report.visitDate).toLocaleDateString('vi-VN')}):\n`
        message += `  - Có: ${report.totalImages}/9 ảnh\n`
        message += `  - Thiếu ${report.missingCount}: ${report.missingPositions.join(', ')}\n\n`
      })
      
      toast(message, { 
        duration: 10000,
        icon: '⚠️',
        style: {
          background: '#fff3cd',
          color: '#856404',
          border: '1px solid #ffc107'
        }
      })
    } else {
      toast.success('✓ Tất cả bệnh nhân đều có đủ 9 ảnh!');
    }
  }

  const handleFiles = async (fileList) => {
    const allFiles = Array.from(fileList)
    const parsed = []
    const errors = []
    let foundAnnotationFile = null

    // Separate image files and annotation file
    const imageFiles = []
    const sample = []
    
    for (const file of allFiles) {
      // Skip macOS metadata/stub files
      if (file.name.startsWith('._') || file.name === '.DS_Store') {
        continue
      }
      
      // Check if it's annotation file (.json)
      if (file.name.endsWith('.json') || file.name.includes('annotation') || file.name.includes('_annotations.coco')) {
        foundAnnotationFile = file
        continue
      }

      // Zero-byte images are unusable (stub / cloud placeholder) - surface them clearly
      if ((file.type?.startsWith('image/') || /\.(jpe?g|png)$/i.test(file.name)) && file.size === 0) {
        errors.push(`${file.name} (file rỗng 0 byte / placeholder, không upload được)`)
        continue
      }
      
      // Try to parse as image file
      const parsedInfo = parseFilename(file.name)
      if (sample.length < 8) sample.push({ name: file.name, rel: file.webkitRelativePath || null, type: file.type, size: file.size, parsed: !!parsedInfo, pos: parsedInfo && parsedInfo.position })
      const info = parsedInfo
      if (info) {
        // Check if position was successfully normalized
        if (!info.position) {
          errors.push(`${file.name} (vị trí không hợp lệ)`)
        } else {
          imageFiles.push(file)
          parsed.push({
            file,
            ...info
          })
        }
      } else {
        // Might be image but can't parse filename format
        if (file.type?.startsWith('image/') || /\.(jpe?g|png)$/i.test(file.name)) {
          errors.push(`${file.name} (sai định dạng tên file)`)
        }
      }
    }

    if (errors.length > 0) {
      const errorList = errors.slice(0, 5).join('\n')
      const moreText = errors.length > 5 ? `\n... và ${errors.length - 5} file khác` : ''
      toast.error(`⚠️ Không thể parse ${errors.length} file:\n${errorList}${moreText}`, { duration: 8000 });
    }

    setFiles(imageFiles)
    console.log(`[HF] total=${allFiles.length} imageFiles=${imageFiles.length} errors=${errors.length} sample=`, JSON.stringify(sample))
    console.log(`[HF2] sizes=`, JSON.stringify(imageFiles.slice(0, 3).map(f => ({ name: f.name, size: f.size }))))
    
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

    const groupedArray = Object.values(grouped)
    setParsedData(groupedArray)
    
    // Auto-detect and process annotation file
    if (foundAnnotationFile) {
      toast.success(`✓ Tìm thấy file annotation: ${foundAnnotationFile.name}`);
      await processAnnotationFile(foundAnnotationFile, groupedArray)
    }
    
    // Reset patient mappings when new files are loaded
    setPatientMappings({})
    
    // Auto-assign patients based on patient ID
    if (groupedArray.length > 0) {
      await autoAssignPatients(groupedArray)
    }
  }

  const autoAssignPatients = async (groupedData) => {
    const newMappings = {}
    
    for (const group of groupedData) {
      const groupKey = `${group.patientId}_${group.visitDate}`
      
      try {
        // Search for patient by ID in notes field
        const response = await getPatients(`?search=Patient ID: ${group.patientId}&limit=50`)
        const matchedPatients = response.data.data || []
        
        // Filter to exact matches in notes field
        const exactMatches = matchedPatients.filter(p => 
          p.notes && p.notes.includes(`Patient ID: ${group.patientId}`)
        )
        
        if (exactMatches.length === 1) {
          // Single match found - auto-assign
          newMappings[groupKey] = {
            type: 'existing',
            patient: exactMatches[0],
            patientId: group.patientId,
            visitDate: group.visitDate
          }
        } else if (exactMatches.length === 0) {
          // No match - suggest new patient creation
          newMappings[groupKey] = {
            type: 'new',
            patient: {
              name: `Bệnh Nhân #${group.patientId}`,
              phone: '',
              dob: '',
              gender: 'unknown',
              notes: `Patient ID: ${group.patientId}`
            },
            patientId: group.patientId,
            visitDate: group.visitDate
          }
        }
        // If multiple matches, leave unassigned for manual selection
      } catch (error) {
        console.error(`Error auto-assigning patient ${group.patientId}:`, error)
      }
    }
    
    if (Object.keys(newMappings).length > 0) {
      setPatientMappings(newMappings)
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
      toast.error('Vui lòng nhập tên bệnh nhân');
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

  const collectFilesFromDataTransfer = async (dataTransfer) => {
    try {
      if (!dataTransfer?.items || dataTransfer.items.length === 0) {
        return Array.from(dataTransfer?.files || []);
      }

      const traverseEntry = async (entry) => {
        if (!entry) return [];

        if (entry.isFile) {
          return new Promise((resolve, reject) => {
            entry.file((file) => resolve([file]), reject);
          });
        }

        if (entry.isDirectory) {
          const reader = entry.createReader();
          const entries = [];

          await new Promise((resolve, reject) => {
            const readEntries = () => {
              reader.readEntries((batch) => {
                if (!batch.length) {
                  resolve();
                  return;
                }
                entries.push(...batch);
                readEntries();
              }, reject);
            };
            readEntries();
          });

          const files = [];
          for (const child of entries) {
            const childFiles = await traverseEntry(child);
            files.push(...childFiles);
          }
          return files;
        }

        return [];
      };

      const entries = Array.from(dataTransfer.items)
        .map(item => (item.webkitGetAsEntry ? item.webkitGetAsEntry() : null))
        .filter(Boolean);

      if (!entries.length) {
        return Array.from(dataTransfer.files || []);
      }

      const files = [];
      for (const entry of entries) {
        const entryFiles = await traverseEntry(entry);
        files.push(...entryFiles);
      }

      return files;
    } catch (error) {
      console.error('Không thể đọc folder từ drag & drop, fallback sang FileList:', error);
      return Array.from(dataTransfer?.files || []);
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const fileList = await collectFilesFromDataTransfer(e.dataTransfer)
    console.log(`[DROP] items=${e.dataTransfer.items.length}`)
    handleFiles(fileList)
  }

  const handleFileSelect = (e) => {
    const files = e.target.files
    handleFiles(files)
    e.target.value = ''
  }

  const handleAnnotationFileClear = () => {
    setAnnotationFile(null)
    setAnnotationPreview(null)
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

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
      console.log(`🔍 Patient ${group.patientId}: Uploaded positions:`, uploadedPositions)
      const missingPositions = expectedPositions.filter(pos => !uploadedPositions.includes(pos))
      
      if (missingPositions.length > 0) {
        const missingLabels = missingPositions.map(pos => positionLabels[pos] || pos)
        console.log(`⚠️ Patient ${group.patientId}: Missing ${missingPositions.length} positions:`, missingPositions)
        missingReport.push({
          patientId: group.patientId,
          visitDate: group.visitDate,
          totalImages: group.images.length,
          missingCount: missingPositions.length,
          missingPositions: missingLabels
        })
      }
    })

    return missingReport
  }

  const handleUpload = async () => {
    if (parsedData.length === 0) {
      toast.error('Không có file nào để upload');
      return
    }

    // Validate: All groups must have patient mapping
    const unmappedGroups = parsedData.filter(group => {
      const groupKey = `${group.patientId}_${group.visitDate}`
      return !patientMappings[groupKey]
    })

    if (unmappedGroups.length > 0) {
      toast.error(`Vui lòng chọn/tạo bệnh nhân cho ${unmappedGroups.length} nhóm chưa được gán!`)
      return
    }

    // Generate validation summary for missing images
    const missingReport = generateValidationSummary()
    const totalImages = parsedData.reduce((sum, group) => sum + group.images.length, 0)
    const newPatientsCount = Object.values(patientMappings).filter(m => m.type === 'new').length
    const existingPatientsCount = Object.values(patientMappings).filter(m => m.type === 'existing').length
    
    // Store validation summary and show modal
    setValidationSummary({
      totalImages,
      newPatientsCount,
      existingPatientsCount,
      visitsCount: parsedData.length,
      annotationsCount: annotationPreview?.totalAnnotations || 0,
      missingReport
    })
    setShowValidationModal(true)
  }

  const handleConfirmUpload = async () => {
    setShowValidationModal(false)

    if (files.length === 0) {
      console.error('[U1] BLOCKED: files.length=0, parsedData=', JSON.stringify(parsedData.map(g => g.images.length)))
      toast.error('⚠️ Không có file ảnh hợp lệ để upload (kiểm tra file rỗng 0 byte / placeholder).', { duration: 8000 })
      setUploading(false)
      return
    }
    console.log('[U1] files=' + files.length + ' sizes=' + JSON.stringify(files.slice(0, 3).map(f => ({ name: f.name, size: f.size }))))

    try {
      setUploading(true)
      setUploadResult(null)
      setUploadProgress(0)

      const formData = new FormData()
      
      // Add all image files
      files.forEach(file => {
        formData.append('images', file)
      })

      // Add annotation file (optional - only if provided)
      if (annotationFile) {
        formData.append('annotationFile', annotationFile)
      }

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

      // Calculate FormData size (approximate)
      const totalSize = files.reduce((sum, file) => sum + file.size, 0) + (annotationFile?.size || 0)
      console.log(`[U1] Uploading ${files.length} images (${(totalSize / 1024 / 1024).toFixed(2)} MB)`)
      
      toast.loading(`📤 Đang upload ${files.length} ảnh (${(totalSize / 1024 / 1024).toFixed(2)} MB)...`, { id: 'bulk-upload' })
      console.log('[U2] SENDING bulk-upload request')
    
      const response = await bulkUploadImages(formData, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        setUploadProgress(progress)
        console.log(`Upload progress: ${progress}%`)
      })
      console.log('[U3] OK status=' + response.status)
      
      const resultData = response.data.data
      
      // Dismiss loading toast and show success
      toast.dismiss('bulk-upload')
      toast.success(
        `✓ Upload thành công! \n` +
        `Bệnh nhân: ${resultData.patientsCreated} mới, ` +
        `Lần khám: ${resultData.visitsCreated}, ` +
        `Ảnh: ${resultData.imagesCreated}, ` +
        `Annotations: ${resultData.annotationsCreated || 0}`,
        { duration: 5000 }
      )
      
      // Show warning for images without annotations (only when annotation file was provided)
      if (annotationFile && resultData.imagesWithoutAnnotations && resultData.imagesWithoutAnnotations.length > 0) {
        toast(`⚠️ ${resultData.imagesWithoutAnnotations.length} ảnh không có annotation`, {
          duration: 3000,
          icon: '⚠️',
          style: {
            background: '#fff3cd',
            color: '#856404',
            border: '1px solid #ffc107'
          }
        })
      }
      
      setUploadResult({
        success: true,
        data: resultData
      })

      // Clear files after success
      setFiles([])
      setParsedData([])
      setPatientMappings({})
      setAnnotationFile(null)
      setAnnotationPreview(null)
      
      // Redirect to patients page after short delay
      setTimeout(() => {
        navigate('/patients')
      }, 2000)
      setEditingGroup(null)
      setSearchQuery('')
      setSearchResults([])
      
    } catch (error) {
      console.error('[U4] ERROR:', error)
      console.error('Upload error:', error)
      
      // Dismiss loading toast
      toast.dismiss('bulk-upload')
      
      let errorMsg = error.message
      
      if (error.code === 'ECONNABORTED') {
        errorMsg = 'Request timeout - file quá lớn hoặc mạng chậm'
      } else if (error.response) {
        errorMsg = error.response.data?.error || `Server error: ${error.response.status}`
      } else if (error.request) {
        errorMsg = 'Không nhận được phản hồi từ server - kiểm tra kết nối mạng'
      }
      
      toast.error(`❌ Upload thất bại: ${errorMsg}`, { duration: 10000 })
      
      setUploadResult({
        success: false,
        error: errorMsg
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleClear = () => {
    setFiles([])
    setParsedData([])
    setUploadResult(null)
    setAnnotationFile(null)
    setAnnotationPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bulk-upload-container">
      <div className="card">
        <h2>Bulk Upload Ảnh RAW</h2>
        <p style={{ color: 'var(--text-sub)', marginBottom: '20px' }}>
          Upload hàng loạt ảnh với tên file theo format: <code>Patient_XXXX_DD-MM-YYYY_Position.JPG</code> hoặc <code>patient_add_XXXX_Position.jpg</code>
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
                {annotationFile && uploadResult.data.imagesWithoutAnnotations && uploadResult.data.imagesWithoutAnnotations.length > 0 && (
                  <p style={{ color: 'var(--warning)', marginTop: '8px' }}>
                    ⚠️ {uploadResult.data.imagesWithoutAnnotations.length} ảnh không có annotation
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

        {/* Annotation File Status - Auto-detected from folder */}
        {/* <div style={{ marginBottom: '20px', padding: '16px', background: annotationFile ? '#e8f5e9' : '#fff3e0', borderRadius: '8px', border: `2px dashed ${annotationFile ? '#4caf50' : '#ff9800'}` }}>
          <h3 style={{ marginBottom: '12px', color: annotationFile ? '#2e7d32' : '#f57c00', fontSize: '16px' }}>
            📋 File Annotation {annotationFile ? '✓ Đã phát hiện' : '⚠️ Chưa có'}
          </h3>
          
          {!annotationFile && (
            <p style={{ fontSize: '13px', color: '#f57c00', marginTop: '0' }}>
              Hệ thống sẽ tự động tìm file .json trong folder bạn upload. Đảm bảo folder chứa file annotation COCO JSON.
            </p>
          )}
          
          {annotationFile && (
            <div style={{ padding: '12px', background: '#fff', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <strong style={{ color: '#4CAF50' }}>✓ {annotationFile.name}</strong>
                  <span style={{ color: '#666', fontSize: '12px', marginLeft: '8px' }}>
                    ({(annotationFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={handleAnnotationFileClear}
                  className="button-secondary"
                  style={{ padding: '4px 12px', fontSize: '12px' }}
                >
                  Xóa
                </button>
              </div>
              
              {annotationPreview && (
                <div style={{ fontSize: '13px', color: '#666', paddingTop: '8px', borderTop: '1px solid #e0e0e0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div> Tổng ảnh: <strong>{annotationPreview.totalImages}</strong></div>
                    <div> Tổng annotations: <strong>{annotationPreview.totalAnnotations}</strong></div>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '11px', color: '#999' }}>
                    Categories: {annotationPreview.categories.slice(0, 8).join(', ')}
                    {annotationPreview.categories.length > 8 && '...'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div> */}

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
                  Folder chứa: ảnh JPG/PNG theo đúng format tên file (file annotation JSON là tùy chọn)
                </p>
                <p style={{ color: '#0369a1', marginTop: '8px', fontSize: '13px', fontWeight: '500' }}>
                  📁 Hệ thống tự động tìm file annotation trong folder nếu có
                </p>
              </>
            ) : (
              <>
                <h3>Đã chọn {files.length} ảnh</h3>
                <p style={{ color: '#666', marginTop: '10px' }}>
                  Click để chọn folder khác
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
              
              // Calculate missing positions
              const expectedPositions = [
                'upper_right', 'upper_center', 'upper_left',
                'middle_right', 'middle_center', 'middle_left',
                'lower_right', 'lower_center', 'lower_left'
              ]
              const uploadedPositions = group.images.map(img => img.position)
              const missingCount = 9 - group.images.length
              const hasMissing = missingCount > 0

              return (
                <div key={idx} className="bulk-preview-card">
                  <div className="bulk-preview-header">
                    <h4>ID #{group.patientId}</h4>
                    <span className="badge badge-info">
                      {new Date(group.visitDate).toLocaleDateString('vi-VN')}
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
              fontSize: '22px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              📊 Xác Nhận Upload
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
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Bệnh nhân mới</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                    {validationSummary.newPatientsCount}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Bệnh nhân có sẵn</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFA726' }}>
                    {validationSummary.existingPatientsCount}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Lần khám</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1E88E5' }}>
                    {validationSummary.visitsCount}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Ảnh</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1E88E5' }}>
                    {validationSummary.totalImages}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>Annotations</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9C27B0' }}>
                  {validationSummary.annotationsCount}
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
                <h3 style={{ 
                  color: '#E65100', 
                  fontSize: '16px', 
                  marginBottom: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '22px' }}>⚠️</span>
                  Cảnh báo: {validationSummary.missingReport.length} bệnh nhân thiếu ảnh
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
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>
                        📅 {new Date(report.visitDate).toLocaleDateString('vi-VN')}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>
                        ✅ Có: {report.totalImages}/9 ảnh
                      </div>
                      <div style={{ fontSize: '13px', color: '#E65100' }}>
                        ❌ Thiếu {report.missingCount} ảnh: {report.missingPositions.join(', ')}
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
