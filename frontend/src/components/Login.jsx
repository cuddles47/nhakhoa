import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'
import { FiEye, FiEyeOff, FiUser, FiLock } from 'react-icons/fi'
import '../styles/Login.css'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ thông tin')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await login({ username, password })
      
      if (response.data.success) {
        const { user } = response.data.data
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('username', user.username)
        localStorage.setItem('userId', user.id)
        localStorage.setItem('userRole', user.role)
        onLogin()
        navigate('/')
      } else {
        setError(response.data.message || 'Đăng nhập thất bại')
      }
    } catch (err) {
      console.error('Login error:', err)
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError('Đã xảy ra lỗi. Vui lòng thử lại.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Hệ Thống Hỗ Trợ Chỉnh Nha</h1>
          <p>Đăng nhập để tiếp tục</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập</label>
            <div className="input-wrapper">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                disabled={isLoading}
                autoFocus
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                tabIndex={-1}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {/* <div className="login-footer">
          <p className="demo-info">💡 Tài khoản demo: admin / admin</p>
        </div> */}
      </div>
    </div>
  )
}

export default Login
