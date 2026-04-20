import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import logo from '../../assets/logo.png'

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
]

export default function EditProfile() {
  const {
    user,
    profile,
    artisanProfile,
    refreshArtisanProfile,
    refreshProfile,
    loading: authLoading,
  } = useAuth()

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

  useEffect(() => {
    if (artisanProfile && profile) {
      setFormData({
        trade: artisanProfile.trade || '',
        city: artisanProfile.city || '',
        phone: profile.phone || '',
        bio: artisanProfile.bio || '',
      })
      setPreview(artisanProfile.avatar_url || null)
    }
  }, [artisanProfile, profile])

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  function handleChange(e) {
    const { name, value } = e.target

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
      setError('Please upload an image.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB.')
      return
    }

    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview)
    }

    setAvatar(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!user) return setError('You must be logged in.')
    if (!formData.trade) return setError('Please select your trade.')
    if (!formData.city.trim()) return setError('Please enter your city.')
    if (!formData.phone.trim()) return setError('Please enter your phone number.')

    setLoading(true)

    try {
      let avatarUrl = artisanProfile?.avatar_url || null

      if (avatar) {
        const fileExt = avatar.name.split('.').pop()
        const filePath = `${user.id}/avatar.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatar, { upsert: true })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        avatarUrl = urlData.publicUrl
      }

      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          phone: formData.phone,
          city: formData.city,
        })
        .eq('id', user.id)

      if (userUpdateError) throw userUpdateError

      const { error: artisanUpdateError } = await supabase
        .from('artisan_profiles')
        .update({
          trade: formData.trade,
          city: formData.city,
          bio: formData.bio,
          avatar_url: avatarUrl,
        })
        .eq('user_id', user.id)

      if (artisanUpdateError) throw artisanUpdateError

      await refreshProfile()
      await refreshArtisanProfile()

      navigate('/artisan-dashboard', {
        state: { message: 'Profile updated successfully!' },
      })
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <p className="text-brand-slate">Loading...</p>
      </div>
    )
  }

  if (!profile || !artisanProfile) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-brand-border bg-white p-8 shadow-md text-center">
          <h2 className="text-xl font-bold text-brand-navy mb-2">
            Profile not found
          </h2>
          <p className="text-sm text-brand-slate mb-6">
            Please complete your artisan setup first.
          </p>
          <button
            onClick={() => navigate('/artisan/setup-profile')}
            className="bg-brand-green text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-navy transition-all"
          >
            Go to Setup Profile
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-light py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-md border border-brand-border p-8">
        <div className="flex justify-center mb-4">
          <img src={logo} alt="CraftConnect" className="h-10 w-auto" />
        </div>

        <h2 className="text-center text-xl font-bold text-brand-navy mb-1">
          Edit Profile
        </h2>
        <p className="text-center text-sm text-brand-slate mb-8">
          Keep your information up to date
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full border-4 border-brand-border overflow-hidden bg-brand-light flex items-center justify-center">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm text-brand-slate">No Photo</span>
              )}
            </div>

            <label className="cursor-pointer bg-brand-light border border-brand-border text-brand-navy text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-border transition-all">
              Change Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-navy mb-1">
              Trade
            </label>
            <select
              name="trade"
              value={formData.trade}
              onChange={handleChange}
              className="w-full border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green bg-white"
            >
              <option value="">Select your trade...</option>
              {TRADES.map((trade) => (
                <option key={trade} value={trade}>
                  {trade}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-navy mb-1">
              City
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="Your city"
              className="w-full border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-navy mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+90 555 123 4567"
              className="w-full border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-navy mb-1">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              placeholder="Tell clients about yourself..."
              className="w-full border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
            />
            <p className="text-xs text-brand-slate mt-1">
              {formData.bio.length}/300 characters
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/artisan-dashboard')}
              className="flex-1 border border-brand-border text-brand-slate rounded-xl py-3 font-medium hover:bg-brand-light transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-green text-white rounded-xl py-3 font-semibold hover:bg-brand-navy transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}