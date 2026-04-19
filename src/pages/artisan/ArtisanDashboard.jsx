import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function ArtisanDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome, {profile?.full_name} 👋
            </h1>
            <p className="text-gray-500 mt-1">Artisan Dashboard</p>
            <span className="inline-block mt-2 bg-orange-100 text-orange-600 text-xs font-medium px-3 py-1 rounded-full">
              Role: {profile?.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600"
          >
            Logout
          </button>
        </div>
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm font-medium">
            ✅ Authentication working! You are logged in as an Artisan.
          </p>
        </div>
      </div>
    </div>
  )
}