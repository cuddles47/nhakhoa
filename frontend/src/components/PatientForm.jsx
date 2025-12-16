import { useState } from 'react'
import { createPatient } from '../api'
import { FiAlertCircle } from 'react-icons/fi'

function PatientForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dob: '',
    gender: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError(null) // Clear error on input change
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.phone) {
      setError('Vui lòng nhập đầy đủ tên và số điện thoại')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await createPatient(formData)
      
      if (onSuccess) {
        onSuccess(response.data.data)
      }
    } catch (err) {
      // Handle validation errors from backend
      if (err.response?.data?.details) {
        const errorMessages = err.response.data.details.map(d => d.message).join(', ')
        setError(errorMessages)
      } else {
        setError('Không thể tạo bệnh nhân mới. Vui lòng thử lại.')
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {error && (
        <div className="error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiAlertCircle size={16} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Họ Tên *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nguyễn Văn A"
            required
          />
        </div>

        <div className="form-group">
          <label>Số Điện Thoại *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="0123456789 (10-11 chữ số)"
            required
          />
        </div>

        <div className="form-group">
          <label>Ngày Sinh</label>
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Giới Tính</label>
          <select name="gender" value={formData.gender} onChange={handleChange}>
            <option value="">-- Chọn giới tính --</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
        </div>

        <div className="form-group">
          <label>Ghi Chú</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Thông tin bổ sung..."
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              className="button-secondary button"
            >
              Hủy
            </button>
          )}
          <button 
            type="submit" 
            disabled={loading}
            className="button"
          >
            {loading ? 'Đang tạo...' : 'Tạo Bệnh Nhân'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PatientForm
