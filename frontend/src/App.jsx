import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import PatientList from './components/PatientList'
import PatientForm from './components/PatientForm'
import VisitManager from './components/VisitManager'
import ImageUpload from './components/ImageUpload'
import BulkUpload from './components/BulkUpload'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const auth = localStorage.getItem('isAuthenticated')
    setIsAuthenticated(auth === 'true')
    setIsLoading(false)
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('username')
    setIsAuthenticated(false)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar onLogout={handleLogout} />
        
        <main className="main-container">
          <div className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/patients" replace />} />
              <Route path="/patients" element={<PatientList />} />
              <Route path="/patients/new" element={<PatientForm />} />
              <Route path="/patients/:patientId/visits" element={<VisitManager />} />
              <Route path="/visits/:visitId/images" element={<ImageUpload />} />
              <Route path="/bulk-upload" element={<BulkUpload />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}

function NotFound() {
  return (
    <div className="card">
      <h2>404 - Không Tìm Thấy Trang</h2>
      <p>Trang bạn đang tìm không tồn tại.</p>
      <a href="/patients" className="button">Quay về Danh sách Bệnh nhân</a>
    </div>
  )
}

export default App
