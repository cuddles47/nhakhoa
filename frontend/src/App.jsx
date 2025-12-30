import { useAuth } from './features/auth/hooks/useAuth'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import PatientList from './components/PatientList'
import PatientForm from './components/PatientForm'
import VisitManager from './components/VisitManager'
import ImageUpload from './components/ImageUpload'
import BulkUpload from './components/BulkUpload'


function App() {
  const { isAuthenticated, logout, isLoggingIn } = useAuth();

  if (isLoggingIn) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar onLogout={logout} />
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
  );
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
