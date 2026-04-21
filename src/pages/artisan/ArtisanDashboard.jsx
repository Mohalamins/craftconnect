import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import logo from '../../assets/logo-icon.png'

export default function ArtisanDashboard() {
  const {
    profile,
    artisanProfile,
    signOut,
    refreshArtisanProfile,
    loading,
  } = useAuth()

  const navigate = useNavigate()
  const location = useLocation()

  const [toggling, setToggling] = useState(false)
  const [error, setError] = useState('')
  const [verification, setVerification] = useState(null)

  const [successMessage, setSuccessMessage] = useState(location.state?.message)

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (location.state?.message) {
      navigate(location.pathname, { replace: true })
    }
  }, [location.state, location.pathname, navigate])

  useEffect(() => {
    async function loadVerification() {
      if (!profile) return

      const { data, error } = await supabase
        .from('verification_documents')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle()

      if (error) {
        console.error('Error loading verification status:', error)
        return
      }

      setVerification(data || null)
    }

    loadVerification()
  }, [profile])

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <p className="text-brand-slate">Loading...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-brand-navy mb-2">
            Profile not found
          </h2>
          <p className="text-brand-slate text-sm mb-6">
            Please sign in again to continue.
          </p>
          <Link
            to="/login"
            className="bg-brand-green text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-navy transition-all"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  if (!artisanProfile) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow p-8 max-w-md w-full text-center">
          <span className="text-5xl">🔧</span>
          <h2 className="text-xl font-bold text-brand-navy mt-4 mb-2">
            Profile Not Set Up
          </h2>
          <p className="text-brand-slate text-sm mb-6">
            Complete your artisan profile so clients can find you.
          </p>
          <Link
            to="/artisan/setup-profile"
            className="bg-brand-green text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-navy transition-all"
          >
            Set Up Profile
          </Link>
        </div>
      </div>
    )
  }

  async function toggleAvailability() {
    try {
      setError('')
      setToggling(true)

      const { error } = await supabase
        .from('artisan_profiles')
        .update({ is_available: !artisanProfile.is_available })
        .eq('user_id', profile.id)

      if (error) throw error

      await refreshArtisanProfile()
    } catch (err) {
      setError(err.message || 'Failed to update availability.')
    } finally {
      setToggling(false)
    }
  }

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-brand-light">
      <nav className="bg-white border-b border-brand-border px-6 py-4 flex items-center justify-between">
        <img src={logo} alt="CraftConnect" className="h-12 w-auto" />
        <div className="flex items-center gap-3">
          <Link
            to="/artisan/edit-profile"
            className="text-sm text-brand-teal font-medium hover:underline"
          >
            Edit Profile
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm bg-red-50 text-red-500 border border-red-200 px-4 py-1.5 rounded-lg hover:bg-red-100 transition-all"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
            ✅ {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {/* Verification Status Banner */}
        {!verification && !artisanProfile.is_verified && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-xl">📝</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-800">
                Verification Required
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                Submit your documents to get verified and start receiving jobs.
              </p>
            </div>
            <Link
              to="/artisan/submit-verification"
              className="text-xs text-brand-teal font-medium hover:underline flex-shrink-0"
            >
              Submit →
            </Link>
          </div>
        )}

        {verification?.status === 'pending' && !artisanProfile.is_verified && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-xl">⏳</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-800">
                Verification Pending
              </p>
              <p className="text-xs text-yellow-700 mt-0.5">
                Our admin team is reviewing your documents. You&apos;ll be
                notified once verified.
              </p>
            </div>
            <Link
              to="/artisan/submit-verification"
              className="text-xs text-brand-teal font-medium hover:underline flex-shrink-0"
            >
              Update docs →
            </Link>
          </div>
        )}

        {verification?.status === 'rejected' && !artisanProfile.is_verified && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-xl">❌</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700">
                Verification Rejected
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                {verification.admin_feedback ||
                  'Please update your documents and resubmit.'}
              </p>
            </div>
            <Link
              to="/artisan/submit-verification"
              className="text-xs text-brand-teal font-medium hover:underline flex-shrink-0"
            >
              Resubmit →
            </Link>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-full border-4 border-brand-light overflow-hidden flex-shrink-0 bg-brand-light flex items-center justify-center">
              {artisanProfile.avatar_url ? (
                <img
                  src={artisanProfile.avatar_url}
                  alt={profile.full_name || 'Artisan'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl">👤</span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-brand-navy">
                  {profile.full_name || 'Unnamed Artisan'}
                </h2>

                {artisanProfile.is_verified ? (
                  <span className="bg-brand-teal text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    ✓ Verified
                  </span>
                ) : (
                  <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    ⏳ Pending Verification
                  </span>
                )}
              </div>

              <p className="text-brand-teal font-medium mt-1">
                {artisanProfile.trade}
              </p>

              <p className="text-brand-slate text-sm mt-0.5">
                📍 {artisanProfile.city}
              </p>

              <p className="text-brand-slate text-sm">
                📞 {profile.phone || 'No phone added'}
              </p>

              {artisanProfile.total_reviews > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-yellow-400">★</span>
                  <span className="text-sm font-semibold text-brand-navy">
                    {Number(artisanProfile.average_rating).toFixed(1)}
                  </span>
                  <span className="text-brand-slate text-xs">
                    ({artisanProfile.total_reviews} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>

          {artisanProfile.bio && (
            <p className="text-brand-slate text-sm mt-4 pt-4 border-t border-brand-border">
              {artisanProfile.bio}
            </p>
          )}

          <div className="flex items-center justify-between mt-5 pt-4 border-t border-brand-border">
            <div>
              <p className="text-sm font-medium text-brand-navy">Availability</p>
              <p className="text-xs text-brand-slate">
                {artisanProfile.is_available
                  ? 'Clients can see and contact you'
                  : 'You are hidden from search results'}
              </p>
            </div>

            <button
              onClick={toggleAvailability}
              disabled={toggling}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
                artisanProfile.is_available ? 'bg-brand-green' : 'bg-gray-300'
              } ${toggling ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  artisanProfile.is_available ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-brand-navy">0</p>
            <p className="text-xs text-brand-slate mt-1">Total Jobs</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-brand-teal">0</p>
            <p className="text-xs text-brand-slate mt-1">Pending</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-2xl font-bold text-brand-green">
              {artisanProfile.total_reviews > 0
                ? Number(artisanProfile.average_rating).toFixed(1)
                : '—'}
            </p>
            <p className="text-xs text-brand-slate mt-1">Avg Rating</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-brand-navy mb-4">Job Requests</h3>
          <div className="text-center py-10">
            <span className="text-4xl">📋</span>
            <p className="text-brand-slate text-sm mt-3">
              No job requests yet. Coming in Phase 6.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}