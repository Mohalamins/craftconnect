import { useNavigate } from 'react-router-dom'

export default function ArtisanCard({ artisan }) {
  const navigate = useNavigate()

  function renderStars(rating) {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}
      >
        ★
      </span>
    ))
  }

  return (
    <div
      onClick={() => navigate(`/artisan/${artisan.user_id}`)}
      className="bg-white rounded-2xl shadow-sm border border-brand-border hover:shadow-md hover:border-brand-green hover:-translate-y-1 transition-all duration-200 cursor-pointer p-5"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full border-2 border-brand-border overflow-hidden flex-shrink-0 bg-brand-light flex items-center justify-center">
          {artisan.avatar_url ? (
            <img
              src={artisan.avatar_url}
              alt={artisan.users?.full_name || 'Artisan'}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl">👤</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-brand-navy text-sm truncate">
              {artisan.users?.full_name || 'Unnamed Artisan'}
            </h3>

            {artisan.is_verified && (
              <span className="bg-brand-teal text-white text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                ✓ Verified
              </span>
            )}
          </div>

          <p className="text-brand-teal text-sm font-medium mt-0.5">
            {artisan.trade}
          </p>

          <p className="text-brand-slate text-xs mt-0.5">
            📍 {artisan.city}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1.5">
            {artisan.total_reviews > 0 ? (
              <>
                <div className="flex text-sm">
                  {renderStars(artisan.average_rating)}
                </div>
                <span className="text-xs font-semibold text-brand-navy">
                  {Number(artisan.average_rating).toFixed(1)}
                </span>
                <span className="text-xs text-brand-slate">
                  ({artisan.total_reviews})
                </span>
              </>
            ) : (
              <span className="text-xs text-brand-slate">No reviews yet</span>
            )}
          </div>

          {/* Bio Preview */}
          {artisan.bio && (
            <p className="text-xs text-brand-slate mt-2 line-clamp-2">
              {artisan.bio}
            </p>
          )}

          {/* CTA */}
          <div className="mt-3">
            <span className="text-xs font-medium text-brand-teal">
              View Profile →
            </span>
          </div>
        </div>

        {/* Availability */}
        <div className="flex-shrink-0">
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              artisan.is_available
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            {artisan.is_available ? '🟢 Available' : '🔴 Busy'}
          </span>
        </div>
      </div>
    </div>
  )
}