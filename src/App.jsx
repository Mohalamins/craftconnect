import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Register from './pages/auth/Register'
import Login from './pages/auth/Login'
import ClientDashboard from './pages/client/ClientDashboard'
import ArtisanDashboard from './pages/artisan/ArtisanDashboard'
import SetupProfile from './pages/artisan/SetupProfile'
import SubmitVerification from './pages/artisan/SubmitVerification'
import EditProfile from './pages/artisan/EditProfile'
import PublicProfile from './pages/artisan/PublicProfile'
import AdminDashboard from './pages/admin/AdminDashboard'
import ArtisanReview from './pages/admin/ArtisanReview'

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-brand-light">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-brand-slate text-sm mt-3">Loading...</p>
      </div>
    </div>
  )
}

function HomeRedirect() {
  const { user, profile, loading } = useAuth()

  if (loading) return <LoadingScreen />

  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/login" replace />

  if (profile.role === 'client') return <Navigate to="/client-dashboard" replace />
  if (profile.role === 'artisan') return <Navigate to="/artisan-dashboard" replace />
  if (profile.role === 'admin') return <Navigate to="/admin-dashboard" replace />

  return <Navigate to="/login" replace />
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()

  if (loading) return <LoadingScreen />

  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    if (profile.role === 'client') return <Navigate to="/client-dashboard" replace />
    if (profile.role === 'artisan') return <Navigate to="/artisan-dashboard" replace />
    if (profile.role === 'admin') return <Navigate to="/admin-dashboard" replace />
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        {/* Public */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/artisan/:id" element={<PublicProfile />} />

        {/* Client */}
        <Route
          path="/client-dashboard"
          element={
            <ProtectedRoute allowedRoles={['client']}>
              <ClientDashboard />
            </ProtectedRoute>
          }
        />

        {/* Artisan */}
        <Route
          path="/artisan-dashboard"
          element={
            <ProtectedRoute allowedRoles={['artisan']}>
              <ArtisanDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/artisan/setup-profile"
          element={
            <ProtectedRoute allowedRoles={['artisan']}>
              <SetupProfile />
            </ProtectedRoute>
          }
        />
        <Route 
        path="/artisan/submit-verification"
        element={
            <ProtectedRoute allowedRoles={['artisan']}>
            <SubmitVerification />
          </ProtectedRoute>
          } 
        />
        <Route
          path="/artisan/edit-profile"
          element={
            <ProtectedRoute allowedRoles={['artisan']}>
              <EditProfile />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
  path="/admin/review/:id"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <ArtisanReview />
    </ProtectedRoute>
  }
/>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App