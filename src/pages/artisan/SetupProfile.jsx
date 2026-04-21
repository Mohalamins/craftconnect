import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import logo from '../../assets/logo-icon.png'

const TRADES = [
  'Plumber',
  'Electrician',
  'Carpenter',
  'Painter',
  'Welder',
  'Mason',
  'Tailor',
  'Mechanic',
  'AC Technician',
  'Tiler',
  'Roofer',
  'Cleaner',
  'Gardener',
]

export default function SetupProfile() {
  const { user, refreshArtisanProfile, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    trade: '',
    city: '',
    phone: '',
    bio: '',
  })

  const [avatar, setAvatar] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Cleanup preview URL (important)
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function handleChange(e) {
    const { name, value } = e.target

    // Limit bio to 300 chars
    if (name === 'bio' && value.length > 300) return

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2MB.')
      return
    }

    if (preview) URL.revokeObjectURL(preview)

    setAvatar(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!user) {
      setError('You must be logged in.')
      return
    }

    if (!formData.trade) return setError('Please select your trade.')
    if (!formData.city.trim()) return setError('Please enter your city.')
    if (!formData.phone.trim()) return setError('Please enter your phone number.')

    setLoading(true)

    try {
      let avatarUrl = null

      // Upload avatar
      if (avatar) {
        const fileExt = avatar.name.split('.').pop()
        const filePath = `${user.id}/avatar.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatar, { upsert: true })

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        avatarUrl = data.publicUrl
      }

      // Update users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          phone: formData.phone,
          city: formData.city,
        })
        .eq('id', user.id)

      if (userError) throw userError

      // Upsert artisan profile (safe)
      const { error: profileError } = await supabase
        .from('artisan_profiles')
        .upsert({
          user_id: user.id,
          trade: formData.trade,
          city: formData.city,
          bio: formData.bio,
          avatar_url: avatarUrl,
        })

      if (profileError) throw profileError

     await refreshProfile()
     await refreshArtisanProfile()

    navigate('/artisan/submit-verification')
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-light px-4 py-10">
      <div className="mx-auto max-w-xl rounded-2xl border border-brand-border bg-white p-8 shadow-md">

        {/* Logo */}
        <div className="mb-4 flex justify-center">
          <img src={logo} alt="CraftConnect" className="h-14 w-auto" />
        </div>

        <h2 className="text-center text-xl font-bold text-brand-navy mb-1">
          Set Up Your Profile
        </h2>

        <p className="text-center text-sm text-brand-slate mb-8">
          Help clients find and trust you
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-5 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full border-4 border-brand-border overflow-hidden bg-brand-light flex items-center justify-center">
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm text-brand-slate">No Photo</span>
              )}
            </div>

            <label className="cursor-pointer bg-brand-light border border-brand-border text-brand-navy text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-border transition">
              {preview ? 'Change Photo' : 'Upload Photo'}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>

            <p className="text-xs text-brand-slate">Max 2MB</p>
          </div>

          {/* Trade */}
          <div>
            <label className="text-sm font-medium text-brand-navy">
              Trade *
            </label>
            <select
              name="trade"
              value={formData.trade}
              onChange={handleChange}
              className="w-full border border-brand-border rounded-lg px-4 py-2.5 text-sm mt-1 focus:ring-2 focus:ring-brand-green"
            >
              <option value="">Select trade</option>
              {TRADES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="text-sm font-medium text-brand-navy">
              City *
            </label>
            <input
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full border border-brand-border rounded-lg px-4 py-2.5 text-sm mt-1"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-medium text-brand-navy">
              Phone *
            </label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border border-brand-border rounded-lg px-4 py-2.5 text-sm mt-1"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm font-medium text-brand-navy">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className="w-full border border-brand-border rounded-lg px-4 py-2.5 text-sm mt-1 resize-none"
            />
            <p className="text-xs text-brand-slate">
              {formData.bio.length}/300
            </p>
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              !formData.trade ||
              !formData.city.trim() ||
              !formData.phone.trim()
            }
            className="w-full bg-brand-green text-white rounded-xl py-3 font-semibold hover:bg-brand-navy transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Complete Setup'}
          </button>

        </form>
      </div>
    </div>
  )
}