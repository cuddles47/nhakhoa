import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getPatients, searchPatients, deletePatient } from '../api'
import PatientForm from './PatientForm'
import { FiPlus, FiSearch, FiEye, FiTrash2, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiX } from 'react-icons/fi'

function PatientList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Get params from URL or use defaults
  const page = parseInt(searchParams.get('page')) || 1
  const limit = parseInt(searchParams.get('limit')) || 10
  const searchQuery = searchParams.get('search') || ''
  
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadPatients()
  }, [searchParams])

  const loadPatients = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page,
        limit: limit
      })
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      const response = await getPatients(`?${params.toString()}`)
      setPatients(response.data.data || [])
      setTotal(response.data.pagination?.total || 0)
      setTotalPages(response.data.pagination?.totalPages || 0)
      setError(null)
    } catch (err) {
      setError('Không thể tải danh sách bệnh nhân')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    const query = e.target.value
    const newParams = new URLSearchParams(searchParams)
    
    if (query) {
      newParams.set('search', query)
    } else {
      newParams.delete('search')
    }
    newParams.set('page', '1') // Reset to page 1
    
    setSearchParams(newParams)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa bệnh nhân này?')) return

    try {
      await deletePatient(id)
      loadPatients()
    } catch (err) {
      alert('Không thể xóa bệnh nhân')
    }
  }

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('page', newPage.toString())
    setSearchParams(newParams)
  }

  const handleLimitChange = (e) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('limit', e.target.value)
    newParams.set('page', '1') // Reset to page 1
    setSearchParams(newParams)
  }



  if (loading) return <div className="loading">Đang tải...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="card">
      {/* Header with actions */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        gap: '20px'
      }}>
        <h2 style={{ margin: 0 }}>Danh Sách Bệnh Nhân</h2>
        
        <button 
          className="button"
          onClick={() => navigate('/patients/new')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FiPlus size={18} />
          Thêm Bệnh Nhân
        </button>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '500px' }}>
        <FiSearch size={18} style={{ 
          position: 'absolute', 
          left: '14px', 
          top: '50%', 
          transform: 'translateY(-50%)', 
          color: 'var(--text-sub)',
          pointerEvents: 'none'
        }} />
        <input
          type="text"
          className="search-box"
          placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
          value={searchQuery}
          onChange={handleSearch}
          style={{ width: '100%', paddingLeft: '42px' }}
        />
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Họ Tên</th>
            <th>SĐT</th>
            <th>Giới Tính</th>
            <th>Ngày Sinh</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.id}>
              <td>{patient.id}</td>
              <td>{patient.name}</td>
              <td>{patient.phone}</td>
              <td>{patient.gender === 'male' ? 'Nam' : patient.gender === 'female' ? 'Nữ' : '-'}</td>
              <td>{patient.dob ? new Date(patient.dob).toLocaleDateString('vi-VN') : '-'}</td>
              <td className="action-buttons">
                <button 
                  className="icon-button"
                  onClick={() => navigate(`/patients/${patient.id}/visits`)}
                  title="Xem lần khám"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <FiEye size={16} />
                  Xem
                </button>
                <button 
                  className="icon-button"
                  onClick={() => handleDelete(patient.id)}
                  title="Xóa"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--error)' }}
                >
                  <FiTrash2 size={16} />
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {patients.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          {searchQuery ? 'Không tìm thấy bệnh nhân' : 'Không có bệnh nhân nào'}
        </div>
      )}

      {/* Pagination Controls */}
      {total > 0 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '20px',
          borderTop: '1px solid #ddd'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Hiển thị:</span>
            <select value={limit} onChange={handleLimitChange} style={{ padding: '5px' }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              {/* <option value={100}>100</option> */}
            </select>
            <span>/ trang</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Trang {page} / {totalPages} (Tổng: {total})</span>
            
            <button
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
              className="button-secondary button"
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FiChevronsLeft size={16} />
            </button>
            
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="button-secondary button"
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FiChevronLeft size={16} />
            </button>

            {/* Page numbers */}
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1
              // Show first, last, current, and nearby pages
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= page - 1 && pageNum <= page + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={pageNum === page}
                    className={pageNum === page ? 'button' : 'button-secondary button'}
                    style={{
                      padding: '8px 12px',
                      minWidth: '40px'
                    }}
                  >
                    {pageNum}
                  </button>
                )
              } else if (
                pageNum === page - 2 ||
                pageNum === page + 2
              ) {
                return <span key={pageNum}>...</span>
              }
              return null
            })}

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="button-secondary button"
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FiChevronRight size={16} />
            </button>
            
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={page === totalPages}
              className="button-secondary button"
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FiChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default PatientList
