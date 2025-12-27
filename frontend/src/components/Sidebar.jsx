import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { FiUsers, FiUploadCloud, FiMenu, FiX, FiChevronLeft, FiChevronRight, FiUser, FiLogOut } from 'react-icons/fi'
import { MdOutlineHealthAndSafety } from 'react-icons/md'

function Sidebar({ onLogout }) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const menuItems = [
    {
      path: '/patients',
      icon: FiUsers,
      label: 'Quản Lý Bệnh Nhân',
      description: 'Danh sách & hồ sơ bệnh nhân',
      isActive: (pathname) => pathname.startsWith('/patients') || pathname === '/'
    },
    {
      path: '/bulk-upload',
      icon: FiUploadCloud,
      label: 'Upload Hàng Loạt',
      description: 'Nhập ảnh từ folder',
      isActive: (pathname) => pathname === '/bulk-upload'
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
              const isActive = item.isActive(location.pathname)
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive ? 'active' : ''}`}
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
                </NavLink>
              )
            })}
          </div>
        </nav>

        <div className="sidebar-footer">
          {!collapsed ? (
            <div className="user-info">
              <div className="user-avatar">
                <FiUser size={20} />
              </div>
              <div className="user-details">
                <p className="user-name">{localStorage.getItem('username') || 'Admin'}</p>
                <p className="user-role">Quản trị viên</p>
              </div>
              <button 
                className="logout-button"
                onClick={onLogout}
                title="Đăng xuất"
              >
                <FiLogOut size={18} />
              </button>
            </div>
          ) : (
            <button 
              className="logout-button-collapsed"
              onClick={onLogout}
              title="Đăng xuất"
            >
              <FiLogOut size={20} />
            </button>
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
