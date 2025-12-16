import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import PatientList from './components/PatientList'
import PatientForm from './components/PatientForm'
import VisitManager from './components/VisitManager'
import ImageUpload from './components/ImageUpload'
import BulkUpload from './components/BulkUpload'

function App() {
  const [activeView, setActiveView] = useState('patients')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [selectedVisit, setSelectedVisit] = useState(null)

  // Reset to safe state on mount
  useEffect(() => {
    // If user hard refreshes on a view that needs data, redirect to patients
    if ((activeView === 'visits' && !selectedPatient) || 
        (activeView === 'images' && !selectedVisit)) {
      setActiveView('patients')
      setSelectedPatient(null)
      setSelectedVisit(null)
    }
  }, [])

  const handleNavigation = (viewId) => {
    setActiveView(viewId)
    
    // Reset selections when going to main views
    if (viewId === 'new-patient' || viewId === 'patients' || viewId === 'bulk-upload') {
      setSelectedPatient(null)
      setSelectedVisit(null)
    }
  }

  const handlePatientCreated = (patient) => {
    setSelectedPatient(patient)
    setActiveView('visits')
  }

  const renderContent = () => {
    switch (activeView) {
      case 'new-patient':
        return (
          <div className="main-content">
            <PatientForm 
              onSuccess={handlePatientCreated}
              onCancel={() => setActiveView('patients')}
            />
          </div>
        )
      
      case 'patients':
        return (
          <div className="main-content">
            <PatientList 
              onSelectPatient={(patient) => {
                setSelectedPatient(patient)
                setActiveView('visits')
              }} 
            />
          </div>
        )
      
      case 'visits':
        if (!selectedPatient) {
          setActiveView('patients')
          return null
        }
        return (
          <div className="main-content">
            <VisitManager 
              patient={selectedPatient}
              onSelectVisit={(visit) => {
                setSelectedVisit(visit)
                setActiveView('images')
              }}
              onBack={() => setActiveView('patients')}
            />
          </div>
        )
      
      case 'images':
        if (!selectedVisit) {
          setActiveView('visits')
          return null
        }
        return (
          <div className="main-content">
            <ImageUpload 
              visit={selectedVisit}
              onBack={() => setActiveView('visits')}
            />
          </div>
        )
      
      case 'bulk-upload':
        return (
          <div className="main-content">
            <BulkUpload />
          </div>
        )
      
      default:
        return (
          <div className="main-content">
            <div className="card">
              <h2>Chào mừng đến Hệ Thống Nha Khoa 🦷</h2>
              <p>Chọn một mục từ menu bên trái để bắt đầu.</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="app-layout">
      <Sidebar activeView={activeView} onNavigate={handleNavigation} />
      
      <main className="main-container">
        {renderContent()}
      </main>
    </div>
  )
}

export default App
