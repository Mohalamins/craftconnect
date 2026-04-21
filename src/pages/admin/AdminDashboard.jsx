import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import logo from '../../assets/logo-icon.png'

const TABS = ['Pending', 'Approved', 'Rejected', 'All Artisans']

export default function AdminDashboard() {
  const { profile, signOut, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('Pending')
  const [artisans, setArtisans] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)

    try {
      const { data: artisanData, error: artisanError } = await supabase
        .from('artisan_profiles')
        .select(`
          *,
          users!artisan_profiles_user_id_fkey (
            id, full_name, email, phone, city, created_at
          )
        `)
        .order('created_at', { ascending: false })

      if (artisanError) throw artisanError

      const { data: verificationData, error: verificationError } = await supabase
        .from('verification_documents')
        .select('*')

      if (verificationError) throw verificationError

      const merged = (artisanData || []).map((artisan) => {
        const verification =
          (verificationData || []).find(
            (doc) => String(doc.user_id).trim() === String(artisan.user_id).trim()
          ) || null

        return {
          ...artisan,
          verification,
        }
      })

      setArtisans(merged)

      const pending = merged.filter(
        (a) => a.verification?.status === 'pending' && !a.is_verified
      ).length

      const approved = merged.filter((a) => a.is_verified).length

      const rejected = merged.filter(
        (a) => a.verification?.status === 'rejected'
      ).length

      setStats({
        total: merged.length,
        pending,
        approved,
        rejected,
      })
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  function getFilteredArtisans() {
    let filtered = artisans

    if (activeTab === 'Pending') {
      filtered = artisans.filter(
        (a) => !a.is_verified && a.verification?.status === 'pending'
      )
    } else if (activeTab === 'Approved') {
      filtered = artisans.filter((a) => a.is_verified)
    } else if (activeTab === 'Rejected') {
      filtered = artisans.filter((a) => a.verification?.status === 'rejected')
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.users?.full_name?.toLowerCase().includes(q) ||
          a.trade?.toLowerCase().includes(q) ||
          a.city?.toLowerCase().includes(q)
      )
    }

    return filtered
  }

  function statusBadge(artisan) {
    if (artisan.is_verified) {
      return (
        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
          ✓ Verified
        </span>
      )
    }

    const docStatus = artisan.verification?.status

    if (docStatus === 'pending') {
      return (
        <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">
          ⏳ Pending
        </span>
      )
    }

    if (docStatus === 'rejected') {
      return (
        <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
          ✗ Rejected
        </span>
      )
    }

    return (
      <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-2.5 py-1 rounded-full">
        No Docs
      </span>
    )
  }

  const filtered = useMemo(
    () => getFilteredArtisans(),
    [artisans, activeTab, search]
  )

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-light">
      <nav className="bg-white border-b border-brand-border px-6 py-4 flex items-center justify-between shadow-sm">
        <img src={logo} alt="CraftConnect" className="h-14 w-auto" />

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-brand-navy">
              {profile?.full_name || 'Admin'}
            </p>
            <p className="text-xs text-brand-slate">Administrator</p>
          </div>

          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
            <span className="text-purple-600 font-bold text-sm">A</span>
          </div>

          <button
            onClick={handleLogout}
            className="text-sm bg-red-50 text-red-500 border border-red-200 px-4 py-1.5 rounded-lg hover:bg-red-100 transition-all"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Admin Dashboard</h1>
          <p className="text-brand-slate text-sm mt-1">
            Manage artisan verifications and monitor platform activity
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Artisans',
              value: stats.total,
              color: 'text-brand-navy',
              bg: 'bg-white',
              icon: '👷',
            },
            {
              label: 'Pending Review',
              value: stats.pending,
              color: 'text-yellow-600',
              bg: 'bg-yellow-50',
              icon: '⏳',
            },
            {
              label: 'Verified',
              value: stats.approved,
              color: 'text-green-600',
              bg: 'bg-green-50',
              icon: '✅',
            },
            {
              label: 'Rejected',
              value: stats.rejected,
              color: 'text-red-500',
              bg: 'bg-red-50',
              icon: '❌',
            },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-2xl shadow-sm p-5`}>
              <div className="text-2xl mb-1">{stat.icon}</div>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-brand-slate text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex border-b border-brand-border">
            {TABS.map((tab) => (
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
                {tab === 'Pending' && stats.pending > 0 && (
                  <span className="ml-1.5 bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded-full">
                    {stats.pending}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4 border-b border-brand-border">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, trade, or city..."
              className="w-full border border-brand-border rounded-lg px-4 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-4xl">🔍</span>
              <p className="text-brand-slate text-sm mt-3">
                No artisans found in this category.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-brand-border">
              {filtered.map((artisan) => (
                <div
                  key={artisan.id}
                  className="flex items-center gap-4 p-4 hover:bg-brand-light transition-all cursor-pointer"
                  onClick={() => navigate(`/admin/review/${artisan.user_id}`)}
                >
                  <div className="w-12 h-12 rounded-full border-2 border-brand-border overflow-hidden flex-shrink-0 bg-brand-light flex items-center justify-center">
                    {artisan.avatar_url ? (
                      <img
                        src={artisan.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl">👤</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-brand-navy text-sm">
                        {artisan.users?.full_name || 'Unnamed Artisan'}
                      </p>
                      {statusBadge(artisan)}
                    </div>

                    <p className="text-brand-teal text-xs mt-0.5">
                      {artisan.trade}
                    </p>

                    <p className="text-brand-slate text-xs">
                      📍 {artisan.city} · {artisan.users?.email || 'No email'}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-brand-slate">
                      {artisan.verification?.submitted_at
                        ? new Date(artisan.verification.submitted_at).toLocaleDateString()
                        : 'No docs submitted'}
                    </p>
                    <p className="text-brand-teal text-xs mt-1 font-medium">
                      Review →
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}