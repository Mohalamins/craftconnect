import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.png'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const successMessage = location.state?.message
  const from = location.state?.from || '/'

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!formData.email.trim()) {
      setError('Please enter your email.')
      return
    }

    if (!formData.password) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)

    const { error } = await signIn(formData.email, formData.password)

    if (error) {
      setError(error.message || 'Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    setLoading(false)
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-white p-8 shadow-md">
        <div className="mb-6 flex justify-center">
          <img src={logo} alt="CraftConnect" className="h-24 w-auto" />
        </div>

        <h2 className="mb-1 text-center text-xl font-semibold text-brand-navy">
          Welcome back
        </h2>
        <p className="mb-6 text-center text-sm text-brand-slate">
          Sign in to your account
        </p>

        {successMessage && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Your password"
              className="w-full rounded-lg border border-brand-border px-4 py-2.5 text-sm text-brand-navy placeholder:text-brand-slate focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-green py-3 font-semibold text-white transition-all hover:bg-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-slate">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-brand-teal hover:underline"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}