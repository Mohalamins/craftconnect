import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import logo from '../../assets/logo-icon.png'

export default function ArtisanReview() {
  const { id } = useParams() // artisan user_id
  const navigate = useNavigate()

  const [artisan, setArtisan] = useState(null)
  const [user, setUser] = useState(null)
  const [docs, setDocs] = useState(null)
  const [signedUrls, setSignedUrls] = useState({})
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionDone, setActionDone] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchArtisanData()
  }, [id])

  async function fetchArtisanData() {
    setLoading(true)
    setError('')

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (userError) throw userError

      const { data: artisanData, error: artisanError } = await supabase
        .from('artisan_profiles')
        .select('*')
        .eq('user_id', id)
        .single()

      if (artisanError) throw artisanError

      const { data: docsData, error: docsError } = await supabase
        .from('verification_documents')
        .select('*')
        .eq('user_id', id)
        .maybeSingle()

      if (docsError) throw docsError

      setUser(userData)
      setArtisan(artisanData)
      setDocs(docsData || null)
      setFeedback(docsData?.admin_feedback || '')

      if (docsData) {
        const urls = {}
        const docKeys = [
          'id_document_url',
          'cv_url',
          'proof_of_work_url',
          'extra_doc_url',
        ]

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) throw sessionError
        if (!session?.access_token) {
          throw new Error('Admin session not found. Please sign in again.')
        }

        for (const key of docKeys) {
          if (docsData[key]) {
            try {
              const res = await fetch('/api/admin/create-doc-link', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                  filePath: docsData[key],
                }),
              })

              const result = await res.json()

              if (res.ok && result.signedUrl) {
                urls[key] = result.signedUrl
              } else {
                console.error(`Failed to sign ${key}:`, result.error)
              }
            } catch (err) {
              console.error(`Error signing ${key}:`, err)
            }
          }
        }

        setSignedUrls(urls)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to load artisan review data.')
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove() {
    if (!docs) {
      setError('This artisan has not submitted documents yet.')
      return
    }

    if (artisan?.is_verified) {
      setError('This artisan is already verified.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const { error: docsError } = await supabase
        .from('verification_documents')
        .update({
          status: 'approved',
          admin_feedback: feedback.trim() || 'Your profile has been verified.',
          reviewed_at: new Date().toISOString(),
        })
        .eq('user_id', id)

      if (docsError) throw docsError

      const { error: artisanError } = await supabase
        .from('artisan_profiles')
        .update({ is_verified: true })
        .eq('user_id', id)

      if (artisanError) throw artisanError

      setActionDone('approved')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to approve artisan.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReject() {
    if (!docs) {
      setError('This artisan has not submitted documents yet.')
      return
    }

    if (artisan?.is_verified) {
      setError('Approved artisans cannot be rejected here.')
      return
    }

    if (!feedback.trim()) {
      setError('Please provide a reason for rejection.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const { error: docsError } = await supabase
        .from('verification_documents')
        .update({
          status: 'rejected',
          admin_feedback: feedback.trim(),
          reviewed_at: new Date().toISOString(),
        })
        .eq('user_id', id)

      if (docsError) throw docsError

      const { error: artisanError } = await supabase
        .from('artisan_profiles')
        .update({ is_verified: false })
        .eq('user_id', id)

      if (artisanError) throw artisanError

      setActionDone('rejected')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to reject artisan.')
    } finally {
      setSubmitting(false)
    }
  }

  function isPDF(path) {
    return path?.toLowerCase().endsWith('.pdf')
  }

  function getDocStatus(path) {
    return path ? 'Submitted' : 'Missing'
  }

  function downloadFile(url, label) {
    const link = document.createElement('a')
    link.href = url
    link.download = label
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const docLabels = {
    id_document_url: { label: 'National ID / Passport', icon: '🪪' },
    cv_url: { label: 'CV / Resume', icon: '📄' },
    proof_of_work_url: { label: 'Proof of Work Experience', icon: '🏆' },
    extra_doc_url: { label: 'Additional Document', icon: '📎' },
  }

  const isAlreadyApproved = artisan?.is_verified
  const hasDocs = !!docs

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user || !artisan) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-brand-navy mb-2">
            Artisan not found
          </h2>
          <p className="text-brand-slate text-sm mb-6">
            The artisan record could not be loaded.
          </p>
          <button
            onClick={() => navigate('/admin-dashboard')}
            className="w-full bg-brand-green text-white rounded-xl py-3 font-semibold hover:bg-brand-navy transition-all"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (actionDone) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">
            {actionDone === 'approved' ? '✅' : '❌'}
          </div>
          <h2 className="text-xl font-bold text-brand-navy mb-2">
            {actionDone === 'approved' ? 'Artisan Verified!' : 'Artisan Rejected'}
          </h2>
          <p className="text-brand-slate text-sm mb-6">
            {actionDone === 'approved'
              ? `${user.full_name} is now verified and visible to clients.`
              : `${user.full_name} has been rejected and the feedback has been saved.`}
          </p>
          <button
            onClick={() => navigate('/admin-dashboard')}
            className="w-full bg-brand-green text-white rounded-xl py-3 font-semibold hover:bg-brand-navy transition-all"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-light">
      <nav className="bg-white border-b border-brand-border px-6 py-4 flex items-center justify-between shadow-sm">
        <img src={logo} alt="CraftConnect" className="h-14 w-auto" />
        <button
          onClick={() => navigate('/admin-dashboard')}
          className="text-sm text-brand-teal font-medium hover:underline"
        >
          ← Back to Dashboard
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-brand-navy mb-4">Artisan Profile</h2>

          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-full border-4 border-brand-light overflow-hidden flex-shrink-0 bg-brand-light flex items-center justify-center">
              {artisan.avatar_url ? (
                <img src={artisan.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">👤</span>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-bold text-brand-navy">{user.full_name}</h3>
              <p className="text-brand-teal font-medium">{artisan.trade}</p>

              <div className="mt-2 space-y-1">
                <p className="text-brand-slate text-sm">📧 {user.email || 'No email'}</p>
                <p className="text-brand-slate text-sm">📞 {user.phone || 'No phone'}</p>
                <p className="text-brand-slate text-sm">📍 {artisan.city || 'No city'}</p>
                <p className="text-brand-slate text-sm">
                  📅 Registered:{' '}
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>

            <div className="flex-shrink-0">
              {artisan.is_verified ? (
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                  ✓ Verified
                </span>
              ) : docs?.status === 'rejected' ? (
                <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                  ✗ Rejected
                </span>
              ) : docs?.status === 'pending' ? (
                <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                  ⏳ Pending
                </span>
              ) : (
                <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-full">
                  No Docs
                </span>
              )}
            </div>
          </div>

          {artisan.bio && (
            <div className="mt-4 pt-4 border-t border-brand-border">
              <p className="text-xs font-semibold text-brand-navy mb-1">Bio</p>
              <p className="text-brand-slate text-sm">{artisan.bio}</p>
            </div>
          )}
        </div>

        {hasDocs && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-brand-navy mb-4">Document Summary</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(docLabels).map(([key, config]) => (
                <div key={key} className="bg-brand-light rounded-xl p-4 text-center">
                  <div className="text-2xl mb-1">{config.icon}</div>
                  <p className="text-xs font-semibold text-brand-navy">{config.label}</p>
                  <p
                    className={`text-xs mt-2 font-medium ${
                      docs[key] ? 'text-green-700' : 'text-gray-500'
                    }`}
                  >
                    {getDocStatus(docs[key])}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-brand-navy mb-1">Submitted Documents</h2>
          <p className="text-brand-slate text-xs mb-5">
            Submitted on:{' '}
            {docs?.submitted_at
              ? new Date(docs.submitted_at).toLocaleDateString()
              : 'Not submitted yet'}
          </p>

          {!docs ? (
            <div className="text-center py-10">
              <span className="text-4xl">📭</span>
              <p className="text-brand-slate text-sm mt-3">
                This artisan has not submitted any documents yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(docLabels).map(([key, config]) => {
                const signedUrl = signedUrls[key]

                return (
                  <div key={key} className="border border-brand-border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-brand-light">
                      <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <p className="text-sm font-semibold text-brand-navy">
                          {config.label}
                        </p>
                      </div>

                      {signedUrl ? (
                        <div className="flex items-center gap-3">
                          <a
                            href={signedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-brand-teal font-medium hover:underline"
                          >
                            Open ↗
                          </a>
                          <button
                            onClick={() => downloadFile(signedUrl, config.label)}
                            className="text-xs text-brand-navy font-medium hover:underline"
                          >
                            Download ↓
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-red-500 font-medium">
                          Preview unavailable
                        </span>
                      )}
                    </div>

                    {!docs[key] ? (
                      <div className="p-4 text-sm text-gray-500">No file uploaded</div>
                    ) : !signedUrl ? (
                      <div className="p-4 text-sm text-red-500">
                        Could not load this document preview. Check API route or env variables.
                      </div>
                    ) : isPDF(docs[key]) ? (
                      <div className="p-4 flex items-center gap-3">
                        <span className="text-3xl">📄</span>
                        <div>
                          <p className="text-sm font-medium text-brand-navy">
                            PDF Document
                          </p>
                          <a
                            href={signedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-brand-teal hover:underline"
                          >
                            Click to view PDF
                          </a>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={signedUrl}
                        alt={config.label}
                        className="w-full max-h-64 object-contain bg-gray-50"
                      />
                    )}
                  </div>
                )
              })}

              {docs.notes && (
                <div className="bg-brand-light border border-brand-border rounded-xl p-4">
                  <p className="text-xs font-semibold text-brand-navy mb-1">
                    📝 Note from Artisan
                  </p>
                  <p className="text-brand-slate text-sm">{docs.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-brand-navy mb-1">Your Decision</h2>
          <p className="text-brand-slate text-xs mb-5">
            Approving will give this artisan a verified badge visible to all clients.
            Rejection requires a reason.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4 text-sm">
              {error}
            </div>
          )}

          {docs?.admin_feedback && (docs?.status === 'rejected' || artisan?.is_verified) && (
            <div className="bg-brand-light border border-brand-border rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-brand-navy mb-1">
                Previous Feedback
              </p>
              <p className="text-brand-slate text-sm">{docs.admin_feedback}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-brand-navy mb-1">
              Feedback / Notes
              <span className="text-brand-slate font-normal ml-1 text-xs">
                (required for rejection)
              </span>
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Documents are clear and verified. Welcome aboard! / Your ID image is blurry, please resubmit."
              rows={3}
              className="w-full border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={submitting || !hasDocs || isAlreadyApproved}
              className="flex-1 border-2 border-red-300 text-red-500 rounded-xl py-3 font-semibold text-sm hover:bg-red-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Processing...' : '✗ Reject'}
            </button>

            <button
              onClick={handleApprove}
              disabled={submitting || !hasDocs || isAlreadyApproved}
              className="flex-1 bg-brand-green text-white rounded-xl py-3 font-semibold text-sm hover:bg-brand-navy transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Processing...' : '✓ Approve & Verify'}
            </button>
          </div>

          {!hasDocs && (
            <p className="text-center text-xs text-brand-slate mt-3">
              Cannot approve or reject — artisan has not submitted documents yet.
            </p>
          )}

          {isAlreadyApproved && (
            <p className="text-center text-xs text-brand-slate mt-3">
              This artisan is already verified. Decision is locked.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}