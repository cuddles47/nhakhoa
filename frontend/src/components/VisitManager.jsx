import { useState, useEffect } from 'react'
import { getVisitsByPatient, createVisit, updateVisit } from '../api'
import { FiPlus, FiArrowLeft, FiImage, FiX, FiClock, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'

function VisitManager({ patient, onSelectVisit, onBack }) {
  const [visits, setVisits] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (patient) {
      loadVisits()
    }
  }, [patient])

  const loadVisits = async () => {
    try {
      setLoading(true)
      const response = await getVisitsByPatient(patient.id)
      setVisits(response.data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVisit = async (visitData) => {
    try {
      const response = await createVisit({
        ...visitData,
        patient_id: patient.id,
        created_by: 1 // TODO: Use actual logged-in user ID
      })
      const newVisit = response.data.data
      setVisits([newVisit, ...visits])
      setShowCreateModal(false)
      onSelectVisit(newVisit)
    } catch (err) {
      throw err // Let the form handle the error
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-warning', icon: FiClock, text: 'Chờ xử lý' },
      in_progress: { class: 'badge-info', icon: FiLoader, text: 'Đang xử lý' },
      completed: { class: 'badge-success', icon: FiCheckCircle, text: 'Hoàn thành' }
    }
    const badge = badges[status] || badges.pending
    const Icon = badge.icon
    return (
      <span className={`badge ${badge.class}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Icon size={12} />
        {badge.text}
      </span>
    )
  }

  if (!patient) {
    return (
      <div className="card">
        <p>Vui lòng chọn bệnh nhân trước</p>
        <button className="button" onClick={onBack}>← Quay lại</button>
      </div>
    )
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>Lần Khám - {patient.name}</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            SĐT: {patient.phone} | ID: {patient.id}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="button"
            onClick={() => setShowCreateModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FiPlus size={18} />
            Tạo Lần Khám Mới
          </button>
          <button 
            className="button-secondary button"
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FiArrowLeft size={18} />
            Quay lại
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ngày Khám</th>
              <th>Trạng Thái</th>
              <th>Ghi Chú</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((visit) => (
              <tr key={visit.id}>
                <td>{visit.id}</td>
                <td>{new Date(visit.visit_date).toLocaleDateString('vi-VN')}</td>
                <td>{getStatusBadge(visit.status)}</td>
                <td>{visit.notes || '-'}</td>
                <td>
                  <button 
                    className="button"
                    onClick={() => onSelectVisit(visit)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <FiImage size={16} />
                    Upload Ảnh
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {visits.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          Chưa có lần khám nào. Hãy tạo lần khám mới!
        </div>
      )}

      {/* Create Visit Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            position: 'relative',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <button
              onClick={() => setShowCreateModal(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-sub)',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
              }}
            >
              <FiX size={24} />
            </button>
            
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Tạo Lần Khám Mới</h3>
            
            <VisitForm 
              onSubmit={handleCreateVisit}
              onCancel={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Simple inline VisitForm component
function VisitForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    visit_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      await onSubmit(formData)
    } catch (err) {
      if (err.response?.data?.details) {
        const errorMessages = err.response.data.details.map(d => d.message).join(', ')
        setError(errorMessages)
      } else {
        setError('Không thể tạo lần khám. Vui lòng thử lại.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiAlertCircle size={16} />
          {error}
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Ngày Khám *
        </label>
        <input
          type="date"
          value={formData.visit_date}
          onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
          required
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Trạng Thái
        </label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          <option value="pending">Chờ xử lý</option>
          <option value="in_progress">Đang xử lý</option>
          <option value="completed">Hoàn thành</option>
        </select>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Ghi Chú
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Thông tin về lần khám..."
          rows={3}
          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button 
          type="button" 
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Hủy
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="button"
        >
          {loading ? 'Đang tạo...' : 'Tạo Lần Khám'}
        </button>
      </div>
    </form>
  )
}

export default VisitManager
