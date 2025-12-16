import { useState } from 'react'
import { FiUsers, FiUploadCloud, FiMenu, FiX, FiChevronLeft, FiChevronRight, FiUser } from 'react-icons/fi'
import { MdOutlineHealthAndSafety } from 'react-icons/md'

function Sidebar({ activeView, onNavigate }) {
  const [collapsed, setCollapsed] = useState(false)

  const menuItems = [
    {
      id: 'patients',
      icon: FiUsers,
      label: 'Quản Lý Bệnh Nhân',
      description: 'Danh sách & hồ sơ bệnh nhân'
    },
    {
      id: 'bulk-upload',
      icon: FiUploadCloud,
      label: 'Upload Hàng Loạt',
      description: 'Nhập ảnh từ folder'
    }
  ]

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button 
        className="mobile-menu-toggle"
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Toggle menu"
      >
        {collapsed ? <FiMenu size={24} /> : <FiX size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">
              <MdOutlineHealthAndSafety size={36} />
            </span>
            {!collapsed && (
              <div className="logo-text">
                <h1>Nha Khoa</h1>
                <p>Hệ Thống Chỉnh Nha</p>
              </div>
            )}
          </div>
          
          <button 
            className="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <h3 className="nav-section-title">
              {!collapsed && 'QUẢN LÝ'}
            </h3>
            
            {menuItems.map(item => {
              const IconComponent = item.icon
              return (
                <button
                  key={item.id}
                  className={`nav-item ${activeView === item.id ? 'active' : ''}`}
                  onClick={() => onNavigate(item.id)}
                  title={collapsed ? item.label : ''}
                >
                  <span className="nav-icon">
                    {IconComponent && <IconComponent size={20} />}
                  </span>
                  {!collapsed && (
                    <div className="nav-content">
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-description">{item.description}</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        <div className="sidebar-footer">
          {!collapsed && (
            <div className="user-info">
              <div className="user-avatar">
                <FiUser size={20} />
              </div>
              <div className="user-details">
                <p className="user-name">Bác Sĩ Admin</p>
                <p className="user-role">Chỉnh Nha</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {!collapsed && (
        <div 
          className="sidebar-overlay"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  )
}

export default Sidebar
