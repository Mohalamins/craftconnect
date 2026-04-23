import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/logo.png'

const QUICK_SEARCHES = [
  { trade: 'Plumber', icon: '🔧' },
  { trade: 'Electrician', icon: '⚡' },
  { trade: 'Carpenter', icon: '🪚' },
  { trade: 'Painter', icon: '🎨' },
]

export default function ClientDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const firstName = profile?.full_name?.trim()?.split(' ')[0] || 'Client'

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  function handleQuickSearch(trade) {
    navigate(`/search?trade=${encodeURIComponent(trade)}`)
  }

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Navbar */}
      <nav className="bg-white border-b border-brand-border px-6 py-4 flex items-center justify-between shadow-sm">
        <Link to="/">
          <img src={logo} alt="CraftConnect" className="h-14 w-auto" />
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-sm text-brand-teal font-medium hover:underline"
          >
            Browse Artisans
          </Link>

          <button
            onClick={handleLogout}
            className="text-sm bg-red-50 text-red-500 border border-red-200 px-4 py-1.5 rounded-lg hover:bg-red-100 transition-all"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome */}
        <div className="bg-brand-navy rounded-2xl p-6 text-white">
          <h1 className="text-xl font-bold">
            Welcome back, {firstName} 👋
          </h1>

          <p className="text-gray-300 text-sm mt-1">
            Find the right artisan for your job today.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/search')}
              className="bg-brand-green text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-teal transition-all"
            >
              🔍 Search Artisans
            </button>

            <Link
              to="/"
              className="bg-white text-brand-navy px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-light transition-all text-center"
            >
              Explore Homepage
            </Link>
          </div>
        </div>

        {/* Quick Search */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-brand-navy mb-4">Quick Search</h2>

          <div className="grid grid-cols-2 gap-3">
            {QUICK_SEARCHES.map(({ trade, icon }) => (
              <button
                key={trade}
                onClick={() => handleQuickSearch(trade)}
                className="flex items-center gap-3 border border-brand-border rounded-xl p-3 hover:border-brand-green hover:bg-brand-light transition-all"
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-sm font-medium text-brand-navy">
                  {trade}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/search')}
            className="w-full mt-3 text-center text-xs text-brand-teal font-medium hover:underline"
          >
            View all trades →
          </button>
        </div>

        {/* Job Requests Placeholder */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-brand-navy mb-4">My Job Requests</h2>

          <div className="text-center py-10">
            <span className="text-4xl">📋</span>
            <p className="text-brand-slate text-sm mt-3">
              No job requests yet. Find an artisan to get started.
            </p>

            <button
              onClick={() => navigate('/search')}
              className="mt-4 bg-brand-green text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-navy transition-all"
            >
              Find an Artisan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}