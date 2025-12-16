import { useState, useEffect } from 'react'
import { getPatients, searchPatients, deletePatient } from '../api'
import PatientForm from './PatientForm'
import { FiPlus, FiSearch, FiEye, FiTrash2, FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight, FiX } from 'react-icons/fi'

function PatientList({ onSelectPatient }) {
  const [patients, setPatients] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadPatients()
  }, [page, limit])

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
    setSearchQuery(query)
    setPage(1) // Reset to page 1
  }

  // Debounced search - separate from page/limit effect
  useEffect(() => {
    if (searchQuery === '') return // Don't trigger on empty initial state
    
    const timer = setTimeout(() => {
      loadPatients()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

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
    setPage(newPage)
  }

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value))
    setPage(1)
  }

  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    loadPatients()
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
          onClick={() => setShowCreateModal(true)}
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
        <FiSearch size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sub)' }} />
        <input
          type="text"
          className="search-box"
          placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
          value={searchQuery}
          onChange={handleSearch}
          style={{ width: '100%', paddingLeft: '40px' }}
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
                  onClick={() => onSelectPatient(patient)}
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

      {/* Create Patient Modal */}
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
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
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
            
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Thêm Bệnh Nhân Mới</h3>
            
            <PatientForm 
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientList
