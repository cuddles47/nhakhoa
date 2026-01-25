import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getAllPatients, getVisitsByPatient } from '../api';
import api from '../api';
import { FiDownload, FiCheck, FiAlertCircle, FiPackage, FiDatabase } from 'react-icons/fi';

function DatasetExport() {
  const [patients, setPatients] = useState([]);
  const [selectedPatients, setSelectedPatients] = useState(new Set());
  const [visits, setVisits] = useState([]);
  const [selectedVisits, setSelectedVisits] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  // Export configuration
  const [config, setConfig] = useState({
    format: 'yolo',
    splitRatio: {
      train: 0.7,
      val: 0.15,
      test: 0.15
    },
    filter: {
      annotationStatus: 'full',
      plaqueOnly: false
    }
  });

  // Load patients on mount
  useEffect(() => {
    loadPatients();
  }, []);

  // Load visits when patients are selected
  useEffect(() => {
    if (selectedPatients.size > 0) {
      loadVisitsForSelectedPatients();
    } else {
      setVisits([]);
      setSelectedVisits(new Set());
    }
  }, [selectedPatients]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const response = await getAllPatients();
      setPatients(response.data.data || []);
    } catch (error) {
      console.error('Failed to load patients:', error);
      toast.error('Không thể tải danh sách bệnh nhân');
    } finally {
      setLoading(false);
    }
  };

  const loadVisitsForSelectedPatients = async () => {
    try {
      setLoading(true);
      const allVisits = [];
      
      for (const patientId of selectedPatients) {
        const response = await getVisitsByPatient(patientId);
        // Handle different response structures
        const patientVisits = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        if (Array.isArray(patientVisits)) {
          allVisits.push(...patientVisits.map(v => ({ ...v, patientId })));
        }
      }
      
      setVisits(allVisits);
      
      // Auto-select all visits
      setSelectedVisits(new Set(allVisits.map(v => v.id)));
    } catch (error) {
      console.error('Failed to load visits:', error);
      toast.error('Không thể tải danh sách chuyến khám');
    } finally {
      setLoading(false);
    }
  };

  const selectAllPatients = () => {
    setSelectedPatients(new Set(patients.map(p => p.id)));
  };

  const deselectAllPatients = () => {
    setSelectedPatients(new Set());
  };

  const selectAllVisits = () => {
    setSelectedVisits(new Set(visits.map(v => v.id)));
  };

  const deselectAllVisits = () => {
    setSelectedVisits(new Set());
  };

  const togglePatientSelection = (patientId) => {
    const newSelected = new Set(selectedPatients);
    if (newSelected.has(patientId)) {
      newSelected.delete(patientId);
    } else {
      newSelected.add(patientId);
    }
    setSelectedPatients(newSelected);
  };

  const toggleVisitSelection = (visitId) => {
    const newSelected = new Set(selectedVisits);
    if (newSelected.has(visitId)) {
      newSelected.delete(visitId);
    } else {
      newSelected.add(visitId);
    }
    setSelectedVisits(newSelected);
  };

  const handleSplitRatioChange = (split, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 1) return;
    
    setConfig({
      ...config,
      splitRatio: {
        ...config.splitRatio,
        [split]: numValue
      }
    });
  };

  const validateSplitRatio = () => {
    const sum = config.splitRatio.train + config.splitRatio.val + config.splitRatio.test;
    return Math.abs(sum - 1.0) < 0.001;
  };

  const handleExport = async () => {
    // Validation
    if (selectedVisits.size === 0) {
      toast.error('Vui lòng chọn ít nhất một chuyến khám để export');
      return;
    }

    if (!validateSplitRatio()) {
      toast.error('Tổng tỷ lệ phân chia phải bằng 1.0');
      return;
    }

    try {
      setExporting(true);
      setExportResult(null);

      const payload = {
        visitIds: Array.from(selectedVisits),
        format: config.format,
        split: config.splitRatio,
        filter: config.filter
      };

      const response = await api.post('/export/dataset', payload);

      console.log('Export response:', response);
      console.log('Export response data:', response.data);

      if (response.data.success) {
        setExportResult(response.data.data);
        toast.success('✅ Export dataset thành công!');
      } else {
        throw new Error(response.data.error?.message || 'Export thất bại');
      }
    } catch (error) {
      console.error('Export error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      const errorMsg = error.response?.data?.error?.message || error.message || 'Export thất bại';
      toast.error(errorMsg);
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = async () => {
    if (!exportResult) return;

    try {
      const response = await api.get(`/exports/${exportResult.exportId}/download`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', exportResult.filename || 'dataset.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('⬇️ Tải xuống thành công!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Không thể tải xuống file');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="card">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '1.75rem', 
          fontWeight: '700', 
          color: 'var(--text-main)',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <FiPackage size={28} style={{ color: 'var(--primary)' }} />
          Export Dataset
        </h1>
        <p style={{ 
          color: 'var(--text-sub)', 
          fontSize: '0.95rem' 
        }}>
          Xuất dữ liệu đã gán nhãn subbox để phục vụ training model AI
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {/* Left Column: Patient & Visit Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Patient Selection */}
          <div className="section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
                <span style={{ 
                  background: 'var(--primary)', 
                  color: 'white', 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>1</span>
                Chọn Bệnh Nhân
              </h3>
              {patients.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={selectAllPatients}
                    className="button-secondary"
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.813rem' }}
                  >
                    Chọn tất cả
                  </button>
                  <button
                    onClick={deselectAllPatients}
                    className="button-secondary"
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.813rem' }}
                  >
                    Bỏ chọn
                  </button>
                </div>
              )}
            </div>
            
            {loading && patients.length === 0 ? (
              <div className="loading" style={{ padding: '2rem', textAlign: 'center' }}>
                Đang tải bệnh nhân...
              </div>
            ) : (
              <>
                <div style={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px'
                }}>
                  {patients.map((patient) => (
                    <div
                      key={patient.id}
                      style={{
                        padding: '0.875rem',
                        borderBottom: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        background: selectedPatients.has(patient.id) ? 'var(--primary-light)' : 'white',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => togglePatientSelection(patient.id)}
                      onMouseEnter={(e) => {
                        if (!selectedPatients.has(patient.id)) {
                          e.currentTarget.style.background = 'var(--bg-hover)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedPatients.has(patient.id)) {
                          e.currentTarget.style.background = 'white';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <input
                          type="checkbox"
                          checked={selectedPatients.has(patient.id)}
                          onChange={() => {}}
                          style={{ cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>
                            {patient.name}
                          </div>
                          <div style={{ fontSize: '0.813rem', color: 'var(--text-sub)' }}>
                            ID: {patient.id} • {patient.phone || 'Chưa có SĐT'}
                          </div>
                        </div>
                        {selectedPatients.has(patient.id) && (
                          <FiCheck style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ 
                  marginTop: '0.75rem', 
                  padding: '0.5rem', 
                  background: 'var(--bg-surface)', 
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: 'var(--text-sub)'
                }}>
                  <strong style={{ color: 'var(--primary)' }}>{selectedPatients.size}</strong> bệnh nhân được chọn
                </div>
              </>
            )}
          </div>

          {/* Visit Selection */}
          {selectedPatients.size > 0 && (
            <div className="section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
                  <span style={{ 
                    background: 'var(--primary)', 
                    color: 'white', 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>2</span>
                  Chọn Chuyến Khám
                </h3>
                {visits.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={selectAllVisits}
                      className="button-secondary"
                      style={{ padding: '0.375rem 0.75rem', fontSize: '0.813rem' }}
                    >
                      Chọn tất cả
                    </button>
                    <button
                      onClick={deselectAllVisits}
                      className="button-secondary"
                      style={{ padding: '0.375rem 0.75rem', fontSize: '0.813rem' }}
                    >
                      Bỏ chọn
                    </button>
                  </div>
                )}
              </div>
              
              {loading ? (
                <div className="loading" style={{ padding: '2rem', textAlign: 'center' }}>
                  Đang tải chuyến khám...
                </div>
              ) : visits.length === 0 ? (
                <div style={{ 
                  padding: '2rem', 
                  textAlign: 'center', 
                  color: 'var(--text-sub)',
                  background: 'var(--bg-surface)',
                  borderRadius: '8px'
                }}>
                  <FiAlertCircle size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                  Không tìm thấy chuyến khám
                </div>
              ) : (
                <>
                  <div style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}>
                    {visits.map((visit) => {
                      const patient = patients.find(p => p.id === visit.patientId);
                      return (
                        <div
                          key={visit.id}
                          style={{
                            padding: '0.875rem',
                            borderBottom: '1px solid var(--border-light)',
                            cursor: 'pointer',
                            background: selectedVisits.has(visit.id) ? 'var(--primary-light)' : 'white',
                            transition: 'all 0.2s'
                          }}
                          onClick={() => toggleVisitSelection(visit.id)}
                          onMouseEnter={(e) => {
                            if (!selectedVisits.has(visit.id)) {
                              e.currentTarget.style.background = 'var(--bg-hover)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!selectedVisits.has(visit.id)) {
                              e.currentTarget.style.background = 'white';
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <input
                              type="checkbox"
                              checked={selectedVisits.has(visit.id)}
                              onChange={() => {}}
                              style={{ cursor: 'pointer' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>
                                Khám #{visit.id} - {formatDate(visit.visit_date)}
                              </div>
                              <div style={{ fontSize: '0.813rem', color: 'var(--text-sub)' }}>
                                {patient?.name || 'Unknown'}
                                {visit.status && ` • ${visit.status}`}
                              </div>
                            </div>
                            {selectedVisits.has(visit.id) && (
                              <FiCheck style={{ color: 'var(--primary)', flexShrink: 0 }} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ 
                    marginTop: '0.75rem', 
                    padding: '0.5rem', 
                    background: 'var(--bg-surface)', 
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    color: 'var(--text-sub)'
                  }}>
                    <strong style={{ color: 'var(--primary)' }}>{selectedVisits.size}</strong> chuyến khám được chọn
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Configuration & Export */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Export Settings */}
          <div className="section">
            <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ 
                background: 'var(--primary)', 
                color: 'white', 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>3</span>
              Cấu Hình Export
            </h3>

            {/* Format */}
            <div className="form-group">
              <label className="form-label">Định dạng</label>
              <select
                value={config.format}
                onChange={(e) => setConfig({ ...config, format: e.target.value })}
                className="form-input"
              >
                <option value="yolo">YOLO (Khuyến nghị)</option>
                <option value="coco">COCO</option>
                <option value="both">Cả hai</option>
              </select>
            </div>

            {/* Split Ratios */}
            <div className="form-group">
              <label className="form-label">Phân chia Train/Val/Test</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {[
                  { key: 'train', label: 'Train' },
                  { key: 'val', label: 'Validation' },
                  { key: 'test', label: 'Test' }
                ].map(({ key, label }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label style={{ 
                      minWidth: '80px', 
                      fontSize: '0.875rem', 
                      color: 'var(--text-sub)' 
                    }}>
                      {label}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config.splitRatio[key]}
                      onChange={(e) => handleSplitRatioChange(key, e.target.value)}
                      className="form-input"
                      style={{ flex: 1 }}
                    />
                    <span style={{ 
                      fontSize: '0.875rem', 
                      color: 'var(--text-sub)',
                      minWidth: '40px' 
                    }}>
                      {(config.splitRatio[key] * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
              {!validateSplitRatio() && (
                <div style={{ 
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  background: 'var(--error-bg)',
                  color: 'var(--error)',
                  borderRadius: '6px',
                  fontSize: '0.813rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FiAlertCircle size={16} />
                  Tổng phải bằng 1.0 (hiện tại: {
                    (config.splitRatio.train + config.splitRatio.val + config.splitRatio.test).toFixed(2)
                  })
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="form-group">
              <label className="form-label">Lọc theo trạng thái gán nhãn</label>
              <select
                value={config.filter.annotationStatus}
                onChange={(e) => setConfig({
                  ...config,
                  filter: { ...config.filter, annotationStatus: e.target.value }
                })}
                className="form-input"
              >
                <option value="full">Chỉ ảnh gán nhãn đầy đủ</option>
                <option value="partial">Ảnh gán nhãn một phần</option>
                <option value="any">Tất cả ảnh có gán nhãn</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--text-main)'
              }}>
                <input
                  type="checkbox"
                  checked={config.filter.plaqueOnly}
                  onChange={(e) => setConfig({
                    ...config,
                    filter: { ...config.filter, plaqueOnly: e.target.checked }
                  })}
                  style={{ cursor: 'pointer' }}
                />
                Chỉ ảnh có mảng bám
              </label>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={exporting || selectedVisits.size === 0 || !validateSplitRatio()}
              className="button"
              style={{
                width: '100%',
                marginTop: '1.5rem',
                padding: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '0.938rem',
                fontWeight: '600'
              }}
            >
              {exporting ? (
                <>
                  <div className="spinner" style={{ 
                    width: '16px', 
                    height: '16px',
                    borderWidth: '2px'
                  }}></div>
                  Đang Export...
                </>
              ) : (
                <>
                  <FiDatabase size={18} />
                  Export Dataset
                </>
              )}
            </button>
          </div>

          {/* Export Result */}
          {exportResult && (
            <div style={{
              background: 'var(--success-bg)',
              border: '2px solid var(--success)',
              borderRadius: '12px',
              padding: '1.25rem'
            }}>
              <h3 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '600', 
                color: 'var(--success)',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <FiCheck size={22} />
                Export Thành Công
              </h3>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.5rem',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}>
                {[
                  { label: 'Tổng số ảnh', value: exportResult.stats.totalImages },
                  { label: 'Tổng subbox', value: exportResult.stats.totalSubboxes },
                  { label: 'Có mảng bám', value: exportResult.stats.plaquePositive, color: 'var(--error)' },
                  { label: 'Không mảng bám', value: exportResult.stats.plaqueNegative, color: 'var(--success)' }
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '0.375rem 0'
                  }}>
                    <span style={{ color: 'var(--text-sub)' }}>{label}:</span>
                    <span style={{ 
                      fontWeight: '600', 
                      color: color || 'var(--text-main)' 
                    }}>{value}</span>
                  </div>
                ))}
                
                <div style={{ 
                  height: '1px', 
                  background: 'var(--border-color)', 
                  margin: '0.5rem 0' 
                }}></div>
                
                {[
                  { label: 'Train', value: exportResult.stats.splits.train },
                  { label: 'Validation', value: exportResult.stats.splits.val },
                  { label: 'Test', value: exportResult.stats.splits.test }
                ].map(({ label, value }) => (
                  <div key={label} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '0.375rem 0'
                  }}>
                    <span style={{ color: 'var(--text-sub)' }}>{label}:</span>
                    <span style={{ fontWeight: '600' }}>{value} ảnh</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleDownload}
                className="button"
                style={{
                  width: '100%',
                  background: 'var(--success)',
                  padding: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.938rem',
                  fontWeight: '600'
                }}
              >
                <FiDownload size={18} />
                Tải Xuống ZIP
              </button>

              <p style={{ 
                marginTop: '0.75rem',
                textAlign: 'center',
                fontSize: '0.75rem',
                color: 'var(--text-sub)'
              }}>
                Hết hạn: {new Date(exportResult.expiresAt).toLocaleString('vi-VN')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DatasetExport;