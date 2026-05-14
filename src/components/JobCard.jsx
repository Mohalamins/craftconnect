const STATUS_STYLES = {
  pending: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    label: '⏳ Pending',
  },
  accepted: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    label: '✅ Accepted',
  },
  declined: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-600',
    label: '❌ Declined',
  },
  completed: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    label: '🏆 Completed',
  },
  cancelled: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-500',
    label: '🚫 Cancelled',
  },
}
import { useNavigate } from 'react-router-dom' 
export default function JobCard({ job, viewAs, onAction }) {
  const navigate = useNavigate()
  const style = STATUS_STYLES[job?.status] || STATUS_STYLES.pending

  const otherParty =
    viewAs === 'client'
      ? job?.artisan_profiles?.users?.full_name || 'Artisan'
      : job?.client?.full_name || 'Client'

  const otherPartyLabel = viewAs === 'client' ? '🔧 Artisan' : '👤 Client'

  function handleAction(e, status) {
    e.stopPropagation()
    if (onAction && job?.id) {
      onAction(job.id, status)
    }
  }

  return (
    <div className={`${style.bg} border ${style.border} rounded-2xl p-5`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-brand-navy text-sm">
            {job?.title || 'Untitled Job'}
          </h3>

          <p className="text-brand-slate text-xs mt-0.5">
            {otherPartyLabel}:{' '}
            <span className="font-medium">{otherParty}</span>
          </p>
        </div>

        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.bg} ${style.text} border ${style.border} flex-shrink-0`}
        >
          {style.label}
        </span>
      </div>

      {/* Details */}
      <div className="mt-3 space-y-1">
        <p className="text-brand-slate text-xs">
          📝 {job?.description || 'No description provided.'}
        </p>

        {job?.location && (
          <p className="text-brand-slate text-xs">📍 {job.location}</p>
        )}

        {job?.preferred_date && (
          <p className="text-brand-slate text-xs">
            📅{' '}
            {new Date(job.preferred_date).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        )}

        {job?.created_at && (
          <p className="text-brand-slate text-xs">
            🕐 Requested:{' '}
            {new Date(job.created_at).toLocaleDateString('en-GB')}
          </p>
        )}
      </div>

      {/* Decline reason */}
      {job?.status === 'declined' && job?.decline_reason && (
        <div className="mt-3 bg-red-100 rounded-lg p-2.5">
          <p className="text-xs text-red-600">
            <strong>Reason:</strong> {job.decline_reason}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {onAction && (
        <div className="mt-4 flex gap-2 flex-wrap">
          {/* Artisan Actions */}
          {viewAs === 'artisan' && job?.status === 'pending' && (
            <>
              <button
                onClick={(e) => handleAction(e, 'accepted')}
                className="flex-1 bg-brand-green text-white rounded-xl py-2 text-xs font-semibold hover:bg-brand-navy transition-all"
              >
                ✓ Accept Job
              </button>

              <button
                onClick={(e) => handleAction(e, 'declined')}
                className="flex-1 border border-red-300 text-red-500 rounded-xl py-2 text-xs font-semibold hover:bg-red-50 transition-all"
              >
                ✕ Decline
              </button>
            </>
          )}

          {viewAs === 'artisan' && job?.status === 'accepted' && (
            <button
              onClick={(e) => handleAction(e, 'completed')}
              className="flex-1 bg-brand-teal text-white rounded-xl py-2 text-xs font-semibold hover:bg-brand-navy transition-all"
            >
              🏆 Mark as Completed
            </button>
          )}
          {/* Message button on accepted jobs */}
{job.status === 'accepted' && (
  <button
    onClick={(e) => {
      e.stopPropagation()

      const otherId =
        viewAs === 'client'
          ? job.artisan_profiles?.user_id
          : job.client_id

      if (!otherId) return

      navigate(`/messages/${otherId}`)
    }}
    className="flex-1 border border-brand-teal text-brand-teal rounded-xl py-2 text-xs font-semibold hover:bg-brand-light transition-all"
  >
    💬 Message
  </button>
)}
          {/* Client Actions */}
          {viewAs === 'client' && job?.status === 'pending' && (
            <button
              onClick={(e) => handleAction(e, 'cancelled')}
              className="border border-gray-300 text-gray-500 rounded-xl py-2 px-4 text-xs font-medium hover:bg-gray-50 transition-all"
            >
              Cancel Request
            </button>
          )}
        </div>
      )}
    </div>
  )
}