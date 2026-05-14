import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import JobCard from '../../components/JobCard'
import { useUnreadCount } from '../../utils/useUnreadCount' 
import logo from '../../assets/logo.png'

const TABS = ['Active', 'Completed', 'All']

const QUICK_SEARCHES = [
  { trade: 'Plumber', icon: '🔧' },
  { trade: 'Electrician', icon: '⚡' },
  { trade: 'Carpenter', icon: '🪚' },
  { trade: 'Painter', icon: '🎨' },
]

export default function ClientDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Active')
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || ''
  )
  const [declineModal, setDeclineModal] = useState(null)
  const unreadCount = useUnreadCount(profile?.id)

  useEffect(() => {
    if (profile) fetchJobs()
  }, [profile])

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(''), 4000)
      return () => clearTimeout(t)
    }
  }, [successMessage])

  async function fetchJobs() {
    setLoading(true)

    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        artisan_profiles!jobs_artisan_id_fkey (
          user_id,trade, city, avatar_url,
          users!artisan_profiles_user_id_fkey (
            full_name
          )
        )
      `)
      .eq('client_id', profile.id)
      .order('created_at', { ascending: false })

    if (!error) setJobs(data || [])
    setLoading(false)
  }

  async function handleAction(jobId, newStatus) {
    if (newStatus === 'cancelled') {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId)
        .eq('client_id', profile.id)

      if (!error) fetchJobs()
    }
  }

  function getFilteredJobs() {
    if (activeTab === 'Active') {
      return jobs.filter(j => ['pending', 'accepted'].includes(j.status))
    }
    if (activeTab === 'Completed') {
      return jobs.filter(j => ['completed', 'declined', 'cancelled'].includes(j.status))
    }
    return jobs
  }

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  const filtered = getFilteredJobs()
  const activeCount = jobs.filter(j => ['pending', 'accepted'].includes(j.status)).length

  return (
    <div className="min-h-screen bg-brand-light">

      {/* Navbar */}
      <nav className="bg-white border-b border-brand-border px-6 py-4 flex items-center justify-between shadow-sm">
        <img src={logo} alt="CraftConnect" className="h-14 w-auto" />
        <div className="flex items-center gap-3">
         
           {/* Messages */}
<Link
  to="/messages"
  className="relative text-sm text-brand-teal font-medium hover:underline inline-flex items-center gap-1"
>
  💬 Messages

  {unreadCount > 0 && (
  <span className="absolute -top-2 left-2 bg-red-500 text-white text-[10px] min-w-3.5 h-3.5 px-1 rounded-full flex items-center justify-center font-bold">
    {unreadCount > 9 ? '9+' : unreadCount}
  </span>
)}
</Link>

{/* Back Home */}
<Link
  to="/"
  className="text-sm text-brand-teal font-medium hover:underline"
>
  ← Back Home
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

        {/* Success Toast */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm font-medium flex items-center gap-2">
            ✅ {successMessage}
          </div>
        )}

        {/* Welcome Banner */}
        <div className="bg-brand-navy rounded-2xl p-6 text-white">
          <h1 className="text-xl font-bold">
            Welcome, {profile?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-300 text-sm mt-1">
            {activeCount > 0
              ? `You have ${activeCount} active job request${activeCount > 1 ? 's' : ''}.`
              : 'Find the right artisan for your job today.'}
          </p>
          <button
            onClick={() => navigate('/search')}
            className="mt-4 bg-brand-green text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-teal transition-all"
          >
            🔍 Find an Artisan
          </button>
        </div>

        {/* Quick Search */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-bold text-brand-navy mb-4">Quick Search</h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_SEARCHES.map(({ trade, icon }) => (
              <button
                key={trade}
                onClick={() => navigate(`/search?trade=${trade}`)}
                className="flex items-center gap-3 border border-brand-border rounded-xl p-3 hover:border-brand-green hover:bg-brand-light transition-all"
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-sm font-medium text-brand-navy">{trade}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Job Requests */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-brand-border">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3.5 text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'border-b-2 border-brand-green text-brand-green'
                    : 'text-brand-slate hover:text-brand-navy'
                }`}
              >
                {tab}
                {tab === 'Active' && activeCount > 0 && (
                  <span className="ml-1.5 bg-brand-green text-white text-xs px-1.5 py-0.5 rounded-full">
                    {activeCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-4xl">📋</span>
                <p className="text-brand-slate text-sm mt-3">
                  {activeTab === 'Active'
                    ? 'No active job requests.'
                    : 'No completed jobs yet.'}
                </p>
                <button
                  onClick={() => navigate('/search')}
                  className="mt-4 bg-brand-green text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-navy transition-all"
                >
                  Find an Artisan
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    viewAs="client"
                    onAction={handleAction}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}