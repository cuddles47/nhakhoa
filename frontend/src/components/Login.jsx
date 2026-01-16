import { useState } from 'react'
import { useAuth } from '../features/auth/hooks/useAuth'
import { FiEye, FiEyeOff, FiUser, FiLock } from 'react-icons/fi'
import '../styles/Login.css'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoggingIn, loginError } = useAuth();
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    login({ username, password });
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Hệ Thống Hỗ Trợ Chỉnh Nha</h1>
          <p>Đăng nhập để tiếp tục</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {(error || loginError) && (
            <div className="error-message">
              {error || (loginError?.message || 'Đăng nhập thất bại')}
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
                  disabled={isLoggingIn}
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
                disabled={isLoggingIn}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoggingIn}
                tabIndex={-1}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>
          
          <button 
            className="login-button"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Đang đăng nhập...' : 'Đăng nhập'}
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
