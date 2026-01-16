import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './features/auth/hooks/useAuth'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

// Clear any corrupt state on mount
try {
  const testKey = '__test__'
  localStorage.setItem(testKey, testKey)
  localStorage.removeItem(testKey)
} catch (e) {
  console.warn('localStorage not available, clearing...')
  localStorage.clear()
}

// Temporarily disable StrictMode to prevent double useEffect calls
// StrictMode causes components to mount twice in development which triggers infinite loops
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
)
