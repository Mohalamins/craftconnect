import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import logo from '../../assets/logo.png'

export default function JobRequestForm() {
  const { artisanId } = useParams() // artisan_profiles.id
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    preferred_date: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!user) {
      navigate('/login')
      return
    }

    if (profile?.role !== 'client') {
      setError('Only clients can send job requests.')
      return
    }

    if (!formData.title.trim()) {
      setError('Please enter a job title.')
      return
    }

    if (!formData.description.trim()) {
      setError('Please describe the job.')
      return
    }

    if (!formData.location.trim()) {
      setError('Please enter a location.')
      return
    }

    setLoading(true)

    try {
      const { error: insertError } = await supabase.from('jobs').insert({
        client_id: user.id,
        artisan_id: artisanId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        preferred_date: formData.preferred_date || null,
        status: 'pending',
      })

      if (insertError) throw insertError

      navigate('/client-dashboard', {
        state: { successMessage: 'Job request sent successfully!' },
      })
    } catch (err) {
      setError(err.message || 'Failed to send request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-light py-10 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-5 text-center">
          <img src={logo} alt="CraftConnect" className="h-10 w-auto mx-auto mb-4" />
          <h2 className="text-xl font-bold text-brand-navy">Send Job Request</h2>
          <p className="text-brand-slate text-sm mt-1">
            Describe your job clearly so the artisan can respond quickly.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <label className="block text-sm font-semibold text-brand-navy mb-1">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Fix leaking kitchen pipe"
              className="w-full border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <label className="block text-sm font-semibold text-brand-navy mb-1">
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the job clearly..."
              rows={4}
              className="w-full border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <label className="block text-sm font-semibold text-brand-navy mb-1">
              Job Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Kadikoy, Istanbul"
              className="w-full border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <label className="block text-sm font-semibold text-brand-navy mb-1">
              Preferred Date
              <span className="text-brand-slate font-normal ml-1 text-xs">
                (optional)
              </span>
            </label>
            <input
              type="date"
              name="preferred_date"
              value={formData.preferred_date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          <div className="bg-brand-light border border-brand-border rounded-xl p-4 flex gap-3">
            <span className="text-xl flex-shrink-0">💡</span>
            <p className="text-brand-slate text-xs leading-relaxed">
              The artisan will review your request and accept or decline.
              You can track the response on your dashboard.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 border border-brand-border text-brand-slate rounded-xl py-3 font-medium text-sm hover:bg-brand-light transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-green text-white rounded-xl py-3 font-semibold hover:bg-brand-navy transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Request →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}