import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png'

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

const TRADE_CARDS = [
  { trade: 'Plumber', icon: '🔧' },
  { trade: 'Electrician', icon: '⚡' },
  { trade: 'Carpenter', icon: '🪚' },
  { trade: 'Painter', icon: '🎨' },
  { trade: 'Welder', icon: '🔥' },
  { trade: 'Mason', icon: '🧱' },
  { trade: 'AC Technician', icon: '❄️' },
  { trade: 'Cleaner', icon: '🧹' },
  { trade: 'Mechanic', icon: '🚗' },
  { trade: 'Tailor', icon: '🧵' },
  { trade: 'Tiler', icon: '🏠' },
  { trade: 'Roofer', icon: '🏗️' },
]

export default function Home() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [city, setCity] = useState('')
  const [trade, setTrade] = useState('')

  function handleSearch(e) {
    e.preventDefault()

    const params = new URLSearchParams()

    if (trade) params.set('trade', trade)
    if (city.trim()) params.set('city', city.trim())

    const queryString = params.toString()
    navigate(queryString ? `/search?${queryString}` : '/search')
  }

  function getDashboardLink() {
    if (!profile) return '/login'
    if (profile.role === 'client') return '/client-dashboard'
    if (profile.role === 'artisan') return '/artisan-dashboard'
    if (profile.role === 'admin') return '/admin-dashboard'
    return '/login'
  }

  function handleTradeClick(selectedTrade) {
    navigate(`/search?trade=${encodeURIComponent(selectedTrade)}`)
  }

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Navbar */}
      <nav className="bg-white border-b border-brand-border px-6 py-4 flex items-center justify-between shadow-sm">
        <Link to="/" aria-label="CraftConnect Home">
          <img src={logo} alt="CraftConnect" className="h-14 w-auto" />
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <Link
              to={getDashboardLink()}
              className="bg-brand-green text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-brand-navy transition-all"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-brand-navy text-sm font-medium hover:text-brand-green transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-brand-green text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-brand-navy transition-all"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-brand-navy py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Find Trusted Artisans
            <span className="text-brand-teal block mt-1">Near You</span>
          </h1>

          <p className="text-gray-300 mt-4 text-base max-w-2xl mx-auto">
            Connect with verified skilled professionals for any job.
            Plumbers, electricians, carpenters and more.
          </p>

          {/* Search Form */}
          <form
            onSubmit={handleSearch}
            className="mt-8 bg-white rounded-2xl p-4 shadow-lg flex flex-col md:flex-row gap-3"
          >
            {/* Trade Dropdown */}
            <select
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              className="flex-1 border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green bg-white"
            >
              <option value="">All Trades</option>
              {TRADES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* City Input */}
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter your city..."
              className="flex-1 border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green"
            />

            {/* Search Button */}
            <button
              type="submit"
              className="bg-brand-green text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-brand-teal transition-all md:w-auto w-full"
            >
              🔍 Search
            </button>
          </form>
        </div>
      </section>

      {/* Trade Categories */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-xl font-bold text-brand-navy mb-6 text-center">
          Browse by Trade
        </h2>

        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {TRADE_CARDS.map(({ trade, icon }) => (
            <button
              key={trade}
              onClick={() => handleTradeClick(trade)}
              className="bg-white border border-brand-border rounded-2xl py-4 px-3 text-center hover:border-brand-green hover:shadow-md transition-all group"
            >
              <div className="text-2xl mb-2">{icon}</div>
              <p className="text-xs font-semibold text-brand-navy group-hover:text-brand-green">
                {trade}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-brand-navy text-center mb-8">
            How CraftConnect Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                icon: '🔍',
                title: 'Search',
                desc: 'Find verified artisans by trade and location in seconds',
              },
              {
                step: '2',
                icon: '📋',
                title: 'Request',
                desc: 'Send a job request with your task details and preferred time',
              },
              {
                step: '3',
                icon: '⭐',
                title: 'Review',
                desc: 'Rate your experience and help others find great artisans',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 bg-brand-light border-2 border-brand-border rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <h3 className="font-bold text-brand-navy text-sm">
                  {item.title}
                </h3>
                <p className="text-brand-slate text-xs mt-1 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="bg-brand-green py-12 px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Are you an Artisan?
          </h2>
          <p className="text-green-100 text-sm mb-6">
            Join CraftConnect and start receiving job requests today
          </p>
          <Link
            to="/register"
            className="bg-white text-brand-green px-8 py-3 rounded-xl font-bold text-sm hover:bg-brand-light transition-all"
          >
            Register as Artisan →
          </Link>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-brand-navy py-6 px-4 text-center">
        <img src={logo} alt="CraftConnect" className="h-10 w-auto mx-auto mb-3" />
        <p className="text-gray-400 text-xs">
          ©️ 2025 CraftConnect. Connecting clients with trusted hands.
        </p>
      </footer>
    </div>
  )
}