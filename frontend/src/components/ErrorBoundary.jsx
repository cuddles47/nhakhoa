import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    // Clear all state and reload
    localStorage.clear()
    sessionStorage.clear()
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto',
          paddingTop: '100px'
        }}>
          <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>
            ⚠️ Đã xảy ra lỗi
          </h1>
          
          <p style={{ 
            fontSize: '16px', 
            color: '#666',
            marginBottom: '10px' 
          }}>
            Ứng dụng gặp sự cố không mong muốn.
          </p>

          {this.state.error && (
            <details style={{
              background: '#f8f9fa',
              padding: '15px',
              borderRadius: '4px',
              marginTop: '20px',
              textAlign: 'left',
              fontSize: '14px',
              color: '#333'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                Chi tiết lỗi (cho developer)
              </summary>
              <pre style={{ 
                marginTop: '10px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '12px 24px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              🔄 Xóa cache và tải lại
            </button>

            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              🔁 Tải lại trang
            </button>
          </div>

          <p style={{ 
            marginTop: '30px', 
            fontSize: '14px', 
            color: '#999' 
          }}>
            Nếu lỗi vẫn tiếp tục, vui lòng liên hệ IT support.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
