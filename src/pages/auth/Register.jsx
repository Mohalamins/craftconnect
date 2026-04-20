import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.png'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'client',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!formData.fullName.trim()) {
      return setError('Please enter your full name.')
    }

    if (!formData.email.trim()) {
      return setError('Please enter your email.')
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters.')
    }

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.')
    }

    setLoading(true)

    const { error } = await signUp(
      formData.email,
      formData.password,
      formData.fullName,
      formData.role
    )

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setLoading(false)

    navigate('/login', {
      state: {
        message: 'Account created successfully. Please sign in.',
      },
    })
  }

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-white p-8 shadow-md">
        <div className="mb-6 flex justify-center">
          <img src={logo} alt="CraftConnect" className="h-12 w-auto" />
        </div>

        <h2 className="mb-1 text-center text-xl font-semibold text-brand-navy">
          Create your account
        </h2>
        <p className="mb-6 text-center text-sm text-brand-slate">
          Join CraftConnect today
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-brand-navy">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Muhammad Al Amin"
              className="w-full rounded-lg border border-brand-border px-4 py-2.5 text-sm text-brand-navy placeholder:text-brand-slate focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-navy">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@email.com"
              className="w-full rounded-lg border border-brand-border px-4 py-2.5 text-sm text-brand-navy placeholder:text-brand-slate focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-navy">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              className="w-full rounded-lg border border-brand-border px-4 py-2.5 text-sm text-brand-navy placeholder:text-brand-slate focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-navy">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your password"
              className="w-full rounded-lg border border-brand-border px-4 py-2.5 text-sm text-brand-navy placeholder:text-brand-slate focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-brand-navy">
              I am...
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'client' })}
                className={`rounded-xl border-2 py-3 text-sm font-medium transition-all ${
                  formData.role === 'client'
                    ? 'border-brand-green bg-brand-light text-brand-green'
                    : 'border-brand-border text-brand-slate hover:border-brand-green'
                }`}
              >
                👤 A Client
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'artisan' })}
                className={`rounded-xl border-2 py-3 text-sm font-medium transition-all ${
                  formData.role === 'artisan'
                    ? 'border-brand-green bg-brand-light text-brand-green'
                    : 'border-brand-border text-brand-slate hover:border-brand-green'
                }`}
              >
                🔧 An Artisan
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-green py-3 font-semibold text-white transition-all hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-slate">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-teal hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}