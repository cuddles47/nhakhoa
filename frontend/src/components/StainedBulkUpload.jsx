import { useState, useRef } from 'react';
import { FiUpload, FiCheck, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import apiClient from '../services/apiClient';

/**
 * StainedBulkUpload Component
 * Workflow: Upload folder → Parse & group by patient+date → Auto-match visits → Preview → Upload
 * Similar to BulkUpload but for stained images (no annotation file needed)
 */
function StainedBulkUpload() {
  const fileInputRef = useRef(null);
  
  // File upload
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Parsed data grouped by patient + date
  const [parsedGroups, setParsedGroups] = useState([]);
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  
  // Parse filename: supports two formats:
  //   1. Patient_0061_28-10-2025_Bottom-left_JPG.rf.hash.jpg (with date)
  //   2. patient_add_0019_G1.JPG (no date, optional numeric suffix)
  const parseFilename = (filename) => {
    const regexWithDate = /Patient[_-](\d{4})[_-](\d{2})[_-](\d{2})[_-](\d{4})[_-](.+?)(?:[_.](?:JPG|PNG|jpg|png))?(?:\.rf\.[a-f0-9]+)?\.(?:jpg|jpeg|png)$/i;
    const matchWithDate = filename.match(regexWithDate);
    
    if (matchWithDate) {
      const [, patientId, day, month, year, position] = matchWithDate;
      return {
        patientId: patientId,
        visitDate: `${year}-${month}-${day}`,
        visitDateDisplay: `${day}/${month}/${year}`,
        position: position,
        filename
      };
    }

    const regexNoDate = /Patient[_-](?:add[_-])?(\d+)[_-](\w+?)(\d*)\.(?:jpg|jpeg|png)$/i;
    const matchNoDate = filename.match(regexNoDate);
    
    if (matchNoDate) {
      const [, patientIdRaw, positionCode] = matchNoDate;
      const patientId = patientIdRaw.padStart(4, '0');
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      return {
        patientId: patientId,
        visitDate: `${yyyy}-${mm}-${dd}`,
        visitDateDisplay: `${dd}/${mm}/${yyyy}`,
        position: positionCode,
        filename
      };
    }

    return null;
  };
  
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
  };

  const handleFiles = (fileList) => {
    const incomingFiles = Array.isArray(fileList) ? fileList : Array.from(fileList);
    const parsed = [];
    const errors = [];
    const imageFiles = [];
    
    incomingFiles.forEach(file => {
      const isLikelyImage = file.type?.startsWith('image/') || /\.(jpe?g|png)$/i.test(file.name);
      if (!isLikelyImage) {
        return;
      }

      const info = parseFilename(file.name);
      if (info) {
        imageFiles.push(file);
        parsed.push({
          file,
          ...info
        });
      } else {
        errors.push(file.name);
      }
    });
    
    if (errors.length > 0) {
      toast.error(`⚠️ Không thể parse ${errors.length} file. Vui lòng kiểm tra tên file.`, {
        duration: 5000
      });
    }
    
    if (parsed.length === 0) {
      toast.error('Không có file nào hợp lệ');
      return;
    }
    
    setFiles(imageFiles);
    
    // Group by patient ID and visit date
    const grouped = parsed.reduce((acc, item) => {
      const key = `${item.patientId}_${item.visitDate}`;
      if (!acc[key]) {
        acc[key] = {
          patientId: item.patientId,
          visitDate: item.visitDate,
          visitDateDisplay: item.visitDateDisplay,
          images: []
        };
      }
      acc[key].images.push(item);
      return acc;
    }, {});
    
    const groupedArray = Object.values(grouped);
    setParsedGroups(groupedArray);
    
    toast.success(`Đã parse ${parsed.length} file từ ${groupedArray.length} bệnh nhân`);
    
    // Auto-validate visits
    validateGroups(groupedArray);
  };
  
  const normalizeIdentifier = (value = '') => {
    if (value === null || value === undefined) return '';
    return String(value)
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '')
      .toLowerCase();
  };

  const fetchPatientsByQueries = async (queries) => {
    const aggregated = [];
    const seenIds = new Set();

    for (const q of queries) {
      if (!q) continue;
      try {
        const response = await apiClient.get('/api/patients', {
          params: { search: q, limit: 50 }
        });
        const items = response.data?.data || [];
        items.forEach(item => {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            aggregated.push(item);
          }
        });
      } catch (error) {
        console.warn('Không thể tìm bệnh nhân với query', q, error);
      }
    }

    return aggregated;
  };

  const findMatchingPatient = (candidates, patientId) => {
    const normalizedNumeric = patientId.replace(/[^0-9]/g, '');
    const trimmed = patientId.replace(/^0+/, '');
    const targetIdentifiers = [
      normalizeIdentifier(patientId),
      normalizeIdentifier(`patient_${patientId}`),
      normalizeIdentifier(`Patient_${patientId}`),
      normalizeIdentifier(`Patient ${patientId}`),
      normalizeIdentifier(`benhnhan_${patientId}`),
      normalizeIdentifier(`benhnhan ${patientId}`),
      normalizeIdentifier(`benhnhan${patientId}`),
      normalizeIdentifier(`benhnhan${trimmed}`),
      normalizeIdentifier(`benhnhan#${patientId}`),
      normalizeIdentifier(`patientid${patientId}`),
      normalizeIdentifier(`patientid:${patientId}`)
    ];

    return candidates.find(candidate => {
      const candidateIdentifiers = [
        normalizeIdentifier(candidate.patient_id),
        normalizeIdentifier(candidate.legacy_patient_code),
        normalizeIdentifier(candidate.full_name),
        normalizeIdentifier(candidate.name),
        normalizeIdentifier(candidate.patient_code),
        normalizeIdentifier(candidate.notes)
      ].filter(Boolean);

      const candidateNumeric = (candidate.patient_id || candidate.patient_code || candidate.id || '')
        .toString()
        .replace(/[^0-9]/g, '');

      if (candidateNumeric && normalizedNumeric && candidateNumeric === normalizedNumeric) {
        return true;
      }

      return candidateIdentifiers.some(id => id && targetIdentifiers.includes(id));
    });
  };

  const validateGroups = async (groups) => {
    // Validate each group: find matching patient (and visit if exists)
    const validatedGroups = await Promise.all(
      groups.map(async (group) => {
        try {
          const trimmedId = group.patientId.replace(/^0+/, '');
          const searchQueries = [
            `Patient_${group.patientId}`,
            `Patient ${group.patientId}`,
            `Patient-${group.patientId}`,
            `Patient${group.patientId}`,
            group.patientId,
            trimmedId,
            `#${group.patientId}`,
            `BN ${group.patientId}`
          ];
          const candidates = await fetchPatientsByQueries(searchQueries);
          const matchingPatient = findMatchingPatient(candidates, group.patientId);
          
          if (!matchingPatient) {
            console.warn('[Bulk Stained] Không tìm thấy bệnh nhân', {
              patientId: group.patientId,
              queries: searchQueries,
              candidateCount: candidates.length,
              candidateSamples: candidates.slice(0, 5)
            });
            return {
              ...group,
              valid: false,
              error: `Không tìm thấy bệnh nhân #${group.patientId}`
            };
          }
          
          // Find visit by date
          const visitsResponse = await apiClient.get(`/api/patients/${matchingPatient.id}/visits`);
          const visits = visitsResponse.data.data || [];
          
          const matchingVisit = visits.find(v => {
            const visitDate = new Date(v.visit_date).toISOString().split('T')[0];
            return visitDate === group.visitDate;
          });
          
          if (!matchingVisit) {
            // Visit doesn't exist yet - will be created during upload
            return {
              ...group,
              valid: true,
              patient: matchingPatient,
              visit: null,
              needsVisitCreation: true,
              warning: `Sẽ tạo lần khám mới ngày ${group.visitDateDisplay}`
            };
          }
          
          // Check if visit has RAW images
          const statusResponse = await apiClient.get(`/api/visits/${matchingVisit.id}/stained-upload-status`);
          const status = statusResponse.data.data;
          
          if (!status.hasRawImages) {
            // Visit exists but no RAW images yet - warn but still valid
            return {
              ...group,
              valid: true,
              patient: matchingPatient,
              visit: matchingVisit,
              status,
              warning: 'Lần khám chưa có ảnh RAW'
            };
          }
          
          return {
            ...group,
            valid: true,
            patient: matchingPatient,
            visit: matchingVisit,
            status
          };
          
        } catch (error) {
          console.error('Error validating group:', error);
          return {
            ...group,
            valid: false,
            error: 'Lỗi kiểm tra dữ liệu'
          };
        }
      })
    );
    
    setParsedGroups(validatedGroups);
    
    const validCount = validatedGroups.filter(g => g.valid).length;
    const invalidCount = validatedGroups.filter(g => !g.valid).length;
    const warningCount = validatedGroups.filter(g => g.valid && g.warning).length;
    
    if (invalidCount > 0) {
      toast.error(`${validCount} nhóm hợp lệ, ${invalidCount} nhóm lỗi`, { duration: 5000 });
    } else if (warningCount > 0) {
      toast.success(`Tất cả ${validCount} nhóm đều hợp lệ! (${warningCount} nhóm có cảnh báo)`);
    } else {
      toast.success(`Tất cả ${validCount} nhóm đều hợp lệ!`);
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const filesFromDrop = await collectFilesFromDataTransfer(e.dataTransfer);
    handleFiles(filesFromDrop);
  };
  
  const handleFileInputChange = (e) => {
    handleFiles(e.target.files);
  };
  
  const handleUpload = async () => {
    if (parsedGroups.length === 0) {
      toast.error('Chưa có file để upload');
      return;
    }
    
    const validGroups = parsedGroups.filter(g => g.valid);
    
    if (validGroups.length === 0) {
      toast.error('Không có nhóm nào hợp lệ để upload');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      let totalSuccess = 0;
      let totalFailed = 0;
      const results = [];
      
      // Upload each group sequentially
      for (let i = 0; i < validGroups.length; i++) {
        const group = validGroups[i];
        
        setUploadProgress(Math.round((i / validGroups.length) * 100));
        
        try {
          const formData = new FormData();
          
          // If visit doesn't exist yet, send patientId + visitDate for auto-creation
          if (group.needsVisitCreation) {
            formData.append('patientId', group.patient.id);
            formData.append('visitDate', group.visitDate);
          } else {
            formData.append('visitId', group.visit.id);
          }
          
          group.images.forEach(img => {
            formData.append('images', img.file);
          });
          
          const response = await apiClient.post('/api/bulk-upload/stained', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          
          if (response.data.success) {
            totalSuccess++;
            results.push({
              group,
              success: true,
              data: response.data.data
            });
            
            // Show warnings from backend validation
            if (response.data.data?.validation?.warnings && response.data.data.validation.warnings.length > 0) {
              response.data.data.validation.warnings.forEach(warning => {
                toast.warning(warning, { duration: 4000 });
              });
            }
          } else {
            totalFailed++;
            results.push({
              group,
              success: false,
              error: response.data.error
            });
          }
          
        } catch (error) {
          console.error(`Upload failed for group ${group.patientId}:`, error);
          totalFailed++;
          results.push({
            group,
            success: false,
            error: error.response?.data?.error || error.message
          });
        }
      }
      
      setUploadProgress(100);
      setUploadResult({ totalSuccess, totalFailed, results });
      
      if (totalSuccess > 0) {
        toast.success(`Upload thành công ${totalSuccess}/${validGroups.length} nhóm!`);
      }
      
      if (totalFailed > 0) {
        toast.error(`${totalFailed} nhóm upload thất bại`);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Lỗi khi upload');
    } finally {
      setUploading(false);
    }
  };
  
  const normalizePosition = (positionName) => {
    const normalized = positionName
      .toLowerCase()
      .replace(/[-_\s]/g, '');
    
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
    };
    
    const allPositions = [
      { index: 1, type: 'upper_right', label: 'Trên phải' },
      { index: 2, type: 'upper_center', label: 'Trên giữa' },
      { index: 3, type: 'upper_left', label: 'Trên trái' },
      { index: 4, type: 'middle_right', label: 'Giữa phải' },
      { index: 5, type: 'middle_center', label: 'Giữa' },
      { index: 6, type: 'middle_left', label: 'Giữa trái' },
      { index: 7, type: 'lower_right', label: 'Dưới phải' },
      { index: 8, type: 'lower_center', label: 'Dưới giữa' },
      { index: 9, type: 'lower_left', label: 'Dưới trái' }
    ];
    
    for (const [type, variants] of Object.entries(positionMap)) {
      if (variants.some(v => normalized === v)) {
        return allPositions.find(p => p.type === type);
      }
    }

    for (const [type, variants] of Object.entries(positionMap)) {
      if (variants.some(v => normalized.includes(v) || v.includes(normalized))) {
        return allPositions.find(p => p.type === type);
      }
    }
    
    return null;
  };
  
  return (
    <div className="bulk-upload-container">
      <div className="card">
        <h2>Bulk Upload Ảnh Nhuộm</h2>
        <p style={{ color: 'var(--text-sub)', marginBottom: '20px' }}>
          Upload hàng loạt ảnh nhuộm. Hỗ trợ 2 format: <code>Patient_XXXX_DD-MM-YYYY_Position.jpg</code> hoặc <code>patient_add_XXXX_Position.jpg</code>
        </p>
        <div
          className={`upload-zone-bulk ${isDragging ? 'dragging' : ''} ${files.length > 0 ? 'has-files' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            webkitdirectory="true"
            directory="true"
            multiple
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          
          <div className="upload-zone-content">
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>
              {isDragging ? '↓' : files.length > 0 ? '✓' : '↑'}
            </div>
            
            {files.length === 0 ? (
              <>
                <h3>Kéo thả FOLDER ảnh nhuộm vào đây</h3>
                <p style={{ color: 'var(--text-sub)', marginTop: '10px' }}>
                  Hoặc click để chọn toàn bộ folder chứa ảnh nhuộm
                </p>
                <p style={{ color: 'var(--info)', marginTop: '8px', fontSize: '13px', fontWeight: '500' }}>
                  Format: <code>Patient_0061_28-10-2025_Top-right.jpg</code> hoặc <code>patient_add_0019_G1.jpg</code>
                </p>
              </>
            ) : (
              <>
                <h3>Đã chọn {files.length} ảnh</h3>
                <p style={{ color: 'var(--text-sub)', marginTop: '10px' }}>
                  Click để chọn folder khác hoặc kéo thả folder mới
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
              onClick={() => {
                setFiles([]);
                setParsedGroups([]);
                setUploadResult(null);
              }}
              disabled={uploading}
            >
              Xóa tất cả
            </button>
          </div>
        )}

        {/* Parsed Groups */}
        {parsedGroups.length > 0 && (
          <div style={{ marginTop: '30px' }}>
            <h3>Xem Trước Nhóm Ảnh ({parsedGroups.length} nhóm)</h3>
            <p style={{ color: 'var(--text-sub)', marginBottom: '20px', fontSize: '14px' }}>
              Hệ thống đã tự động phân nhóm và validate các ảnh theo bệnh nhân
            </p>
          
          <div className="bulk-preview-grid">
            {parsedGroups.map((group, idx) => (
              <div key={idx} className="bulk-preview-card">
                <div className="bulk-preview-header">
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px 0' }}>ID #{group.patientId}</h4>
                    <span className="badge badge-info" style={{ fontSize: '12px' }}>
                      {group.visitDateDisplay}
                    </span>
                  </div>
                  <div>
                    {group.valid ? (
                      <FiCheck size={24} style={{ color: 'var(--success)' }} />
                    ) : (
                      <FiAlertCircle size={24} style={{ color: 'var(--error)' }} />
                    )}
                  </div>
                </div>
                
                {/* Patient Info */}
                {group.patient && (
                  <div style={{ fontSize: '13px', color: 'var(--text-sub)', marginBottom: '10px' }}>
                    {group.patient.full_name} • {group.patient.patient_id}
                  </div>
                )}
                
                {/* Visit Status */}
                {group.visit && (
                  <div style={{ fontSize: '13px', color: 'var(--text-sub)', marginBottom: '10px' }}>
                    Visit #{group.visit.id} • {group.status?.rawImageCount}/9 RAW • {group.status?.stainedImageCount}/9 Nhuộm
                  </div>
                )}
                
                {/* New Visit Badge */}
                {group.needsVisitCreation && (
                  <div className="badge" style={{ 
                    background: 'var(--info-bg)', 
                    color: 'var(--info)',
                    marginBottom: '10px',
                    display: 'inline-block'
                  }}>
                    🆕 Lần khám mới (tạo tự động)
                  </div>
                )}
                
                {/* Error Message */}
                {group.error && (
                  <div style={{ 
                    padding: '8px', 
                    background: 'var(--error-bg)', 
                    border: '1px solid var(--error)',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    fontSize: '12px',
                    color: 'var(--error)'
                  }}>
                    ⚠️ {group.error}
                  </div>
                )}
                
                {/* Warning Message */}
                {group.warning && (
                  <div style={{ 
                    padding: '8px', 
                    background: 'var(--warning-bg)', 
                    border: '1px solid var(--warning)',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    fontSize: '12px',
                    color: 'var(--warning)'
                  }}>
                    ℹ️ {group.warning}
                  </div>
                )}
                
                {/* Images Preview */}
                <div className="bulk-preview-images">
                  <p style={{ fontSize: '12px', color: 'var(--text-sub)', marginBottom: '8px', fontWeight: '600' }}>
                    {group.images.length}/9 ảnh:
                  </p>
                  <div className="image-list">
                    {group.images.slice(0, 5).map((img, i) => {
                      const pos = normalizePosition(img.position);
                      return (
                        <div key={i} className="image-preview-item" style={{ marginBottom: '4px' }}>
                          <span className="image-icon" style={{ color: 'var(--primary)', fontSize: '8px', marginRight: '6px' }}>●</span>
                          <span 
                            className="image-name" 
                            title={img.filename}
                            style={{ 
                              fontSize: '11px', 
                              color: 'var(--text-main)',
                              wordBreak: 'break-all',
                              lineHeight: '1.4'
                            }}
                          >
                            {pos ? `${pos.label}: ` : ''}{img.filename}
                          </span>
                        </div>
                      );
                    })}
                    {group.images.length > 5 && (
                      <div 
                        style={{ 
                          fontSize: '11px',
                          color: 'var(--primary)',
                          fontWeight: '600',
                          marginTop: '6px',
                          padding: '4px 0'
                        }}
                      >
                        +{group.images.length - 5} ảnh khác
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Upload Section */}
          {!uploadResult && (
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              {uploading && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '8px',
                    fontSize: '13px',
                    color: 'var(--text-sub)'
                  }}>
                    <span>Đang upload...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div style={{ 
                    height: '8px', 
                    background: 'var(--bg-surface)', 
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      height: '100%', 
                      background: 'var(--primary)',
                      width: `${uploadProgress}%`,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>
              )}
              
              <button
                className="button"
                onClick={handleUpload}
                disabled={uploading || parsedGroups.filter(g => g.valid).length === 0}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px'
                }}
              >
                <FiUpload size={18} />
                {uploading ? 'Đang upload...' : `Upload ${parsedGroups.filter(g => g.valid).length} nhóm (${files.length} ảnh)`}
              </button>
            </div>
          )}
        </div>
        )}
      
        {/* Upload Result */}
        {uploadResult && (
          <div style={{ marginTop: '30px' }}>
            <h3>Kết Quả Upload</h3>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <div style={{ 
              flex: 1,
              padding: '16px',
              background: 'var(--success-bg)',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid var(--success)'
            }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--success)' }}>
                {uploadResult.totalSuccess}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--success)', marginTop: '4px' }}>
                Thành công
              </div>
            </div>
            {uploadResult.totalFailed > 0 && (
              <div style={{ 
                flex: 1,
                padding: '16px',
                background: 'var(--error-bg)',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid var(--error)'
              }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--error)' }}>
                  {uploadResult.totalFailed}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--error)', marginTop: '4px' }}>
                  Thất bại
                </div>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {uploadResult.results.map((result, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px',
                  background: result.success ? 'var(--success-bg)' : 'var(--error-bg)',
                  border: result.success ? '1px solid var(--success)' : '1px solid var(--error)',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              >
                <div style={{ fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>
                  Bệnh Nhân #{result.group.patientId} - {result.group.visitDateDisplay}
                </div>
                {result.success ? (
                  <div style={{ color: 'var(--success)' }}>
                    ✓ Upload {result.data.totalProcessed} ảnh 
                    ({result.data.imagesCreated} mới, {result.data.imagesReplaced} thay thế)
                    {result.data.validation?.warnings && result.data.validation.warnings.length > 0 && (
                      <div style={{ marginTop: '4px', color: 'var(--warning)' }}>
                        ⚠️ {result.data.validation.warnings.join('. ')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: 'var(--error)' }}>
                    ✗ {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          </div>
        )}
      </div>
    </div>
  );
}

export default StainedBulkUpload;
