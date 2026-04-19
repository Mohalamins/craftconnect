import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Pages
import Register from './pages/auth/Register'
import Login from './pages/auth/Login'
import ClientDashboard from './pages/client/ClientDashboard'
import ArtisanDashboard from './pages/artisan/ArtisanDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'

// Reusable loading screen
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500 text-lg">Loading...</p>
    </div>
  )
}

// Redirect user from "/" to the correct place
function HomeRedirect() {
  const { user, profile, loading } = useAuth()

  if (loading) return <LoadingScreen />

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  if (profile.role === 'client') {
    return <Navigate to="/client-dashboard" replace />
  }

  if (profile.role === 'artisan') {
    return <Navigate to="/artisan-dashboard" replace />
  }

  if (profile.role === 'admin') {
    return <Navigate to="/admin-dashboard" replace />
  }

  return <Navigate to="/login" replace />
}

// Protect routes by login + role
function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <LoadingScreen />

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    if (profile.role === 'client') {
      return <Navigate to="/client-dashboard" replace />
    }

    if (profile.role === 'artisan') {
      return <Navigate to="/artisan-dashboard" replace />
    }

    if (profile.role === 'admin') {
      return <Navigate to="/admin-dashboard" replace />
    }

    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auto redirect from homepage */}
        <Route path="/" element={<HomeRedirect />} />

        {/* Public Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/client-dashboard"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/artisan-dashboard"
          element={
            <ProtectedRoute allowedRoles={['artisan']}>
              <ArtisanDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App