import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import logo from '../../assets/logo-icon.png'

export default function PublicProfile() {
  const { id } = useParams() // artisan user_id from URL
  const navigate = useNavigate()
  const location = useLocation()
  const { user: currentUser } = useAuth()

  const [artisan, setArtisan] = useState(null)
  const [user, setUser] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      setNotFound(false)

      // Fetch artisan profile by user_id
      const { data: artisanData, error: artisanError } = await supabase
        .from('artisan_profiles')
        .select('*')
        .eq('user_id', id)
        .single()

      if (artisanError || !artisanData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      // Fetch matching user info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, phone, city')
        .eq('id', id)
        .single()

      if (userError) {
        console.error('Error fetching user info:', userError)
      }

      // Fetch reviews using artisan profile id
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select('*, users!reviews_client_id_fkey(full_name)')
        .eq('artisan_id', artisanData.id)
        .order('created_at', { ascending: false })

      if (reviewError) {
        console.error('Error fetching reviews:', reviewError)
      }

      setArtisan(artisanData)
      setUser(userData)
      setReviews(reviewData || [])
      setLoading(false)
    }

    loadProfile()
  }, [id])

  function renderStars(count) {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={i < count ? 'text-yellow-400' : 'text-gray-300'}
      >
        ★
      </span>
    ))
  }

  function requireLogin(action) {
    if (!currentUser) {
      alert(`Please log in to ${action} this artisan.`)
      navigate('/login', {
        state: { from: location.pathname }
      })
      return false
    }
    return true
  }

  function handleCallClick() {
    const allowed = requireLogin('call')
    if (!allowed) return

    if (!user?.phone) return
    window.location.href = `tel:${user.phone}`
  }

  function handleMessageClick() {
    const allowed = requireLogin('message')
    if (!allowed) return

    navigate(`/messages/${id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <p className="text-brand-slate">Loading profile...</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center px-4">
        <div className="text-center">
          <span className="text-5xl">🔍</span>
          <h2 className="text-xl font-bold text-brand-navy mt-4">
            Artisan Not Found
          </h2>
          <Link
            to="/"
            className="text-brand-teal text-sm mt-2 hover:underline block"
          >
            Go back home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-light">
      <nav className="bg-white border-b border-brand-border px-6 py-4">
        <img src={logo} alt="CraftConnect" className="h-16 w-auto" />
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-full border-4 border-brand-light overflow-hidden flex-shrink-0 bg-brand-light flex items-center justify-center">
              {artisan?.avatar_url ? (
                <img
                  src={artisan.avatar_url}
                  alt={user?.full_name || 'Artisan'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl">👤</span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-brand-navy">
                  {user?.full_name || 'Unnamed Artisan'}
                </h1>

                {artisan?.is_verified ? (
                  <span className="bg-brand-teal text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    Verified ✓
                  </span>
                ) : (
                  <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    Not Verified ⚠️
                  </span>
                )}
              </div>

              <p className="text-brand-teal font-medium mt-1">
                {artisan?.trade}
              </p>

              <p className="text-brand-slate text-sm mt-0.5">
                📍 {artisan?.city || user?.city || 'City not added'}
              </p>

              {artisan?.total_reviews > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <div className="flex">
                    {renderStars(Math.round(artisan.average_rating))}
                  </div>
                  <span className="text-sm font-semibold text-brand-navy ml-1">
                    {Number(artisan.average_rating).toFixed(1)}
                  </span>
                  <span className="text-brand-slate text-xs">
                    ({artisan.total_reviews} reviews)
                  </span>
                </div>
              )}

              <span
                className={`inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full ${
                  artisan?.is_available
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {artisan?.is_available ? '🟢 Available' : '🔴 Unavailable'}
              </span>
            </div>
          </div>

          {artisan?.bio && (
            <p className="text-brand-slate text-sm mt-4 pt-4 border-t border-brand-border">
              {artisan.bio}
            </p>
          )}

          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-brand-border">
            <div className="bg-brand-light rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-brand-navy">0</p>
              <p className="text-xs text-brand-slate mt-1">Jobs Completed</p>
            </div>

            <div className="bg-brand-light rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-brand-green">
                {artisan?.total_reviews > 0
                  ? Number(artisan.average_rating).toFixed(1)
                  : '—'}
              </p>
              <p className="text-xs text-brand-slate mt-1">Avg Rating</p>
            </div>

            <div className="bg-brand-light rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-brand-teal">
                {artisan?.total_reviews || 0}
              </p>
              <p className="text-xs text-brand-slate mt-1">Reviews</p>
            </div>
          </div>

          <div className="flex gap-3 mt-5 pt-4 border-t border-brand-border">
            {user?.phone ? (
              <button
                onClick={handleCallClick}
                className="flex-1 bg-brand-green text-white text-center rounded-xl py-3 font-semibold text-sm hover:bg-brand-navy transition-all"
              >
                📞 Call
              </button>
            ) : (
              <button
                disabled
                className="flex-1 bg-gray-200 text-gray-500 text-center rounded-xl py-3 font-semibold text-sm cursor-not-allowed"
              >
                📞 No Phone
              </button>
            )}

            <button
              onClick={handleMessageClick}
              className="flex-1 bg-brand-teal text-white text-center rounded-xl py-3 font-semibold text-sm hover:bg-brand-navy transition-all"
            >
              💬 Message
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-brand-navy mb-4">
            Reviews ({reviews.length})
          </h3>

          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-3xl">⭐</span>
              <p className="text-brand-slate text-sm mt-2">No reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="border-b border-brand-border pb-4 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-brand-navy">
                      {review.users?.full_name || 'Client'}
                    </p>
                    <div className="flex">{renderStars(review.stars)}</div>
                  </div>

                  {review.comment && (
                    <p className="text-brand-slate text-sm mt-1">
                      {review.comment}
                    </p>
                  )}

                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}