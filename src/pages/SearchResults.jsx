import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import ArtisanCard from '../components/ArtisanCard'
import logo from '../assets/logo-icon.png'

const TRADES = [
  'Plumber', 'Electrician', 'Carpenter', 'Painter',
  'Welder', 'Mason', 'Tailor', 'Mechanic',
  'AC Technician', 'Tiler', 'Roofer', 'Cleaner'
]

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [artisans, setArtisans] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // Filter states from URL
  const [trade, setTrade] = useState(searchParams.get('trade') || '')
  const [city, setCity] = useState(searchParams.get('city') || '')
  const [availableOnly, setAvailableOnly] = useState(
    searchParams.get('available') === 'true'
  )
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'rating')

  // Keep state in sync if URL changes
  useEffect(() => {
    setTrade(searchParams.get('trade') || '')
    setCity(searchParams.get('city') || '')
    setAvailableOnly(searchParams.get('available') === 'true')
    setSortBy(searchParams.get('sort') || 'rating')
  }, [searchParams])

  useEffect(() => {
    fetchArtisans()
  }, [trade, city, availableOnly, sortBy])

  async function fetchArtisans() {
    setLoading(true)

    let query = supabase
      .from('artisan_profiles')
      .select(`
        *,
        users!artisan_profiles_user_id_fkey (
          id, full_name, phone
        )
      `)
      .eq('is_verified', true)

    // Filters
    if (trade) query = query.eq('trade', trade)
    if (city.trim()) query = query.ilike('city', `%${city.trim()}%`)
    if (availableOnly) query = query.eq('is_available', true)

    // Sorting
    if (sortBy === 'rating') {
      query = query.order('average_rating', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error('Search error:', error)
      setArtisans([])
      setTotalCount(0)
      setLoading(false)
      return
    }

    setArtisans(data || [])
    setTotalCount(data?.length || 0)
    setLoading(false)
  }

  function updateSearchParams(nextValues) {
    const params = new URLSearchParams()

    if (nextValues.trade) params.set('trade', nextValues.trade)
    if (nextValues.city.trim()) params.set('city', nextValues.city.trim())
    if (nextValues.availableOnly) params.set('available', 'true')
    if (nextValues.sortBy && nextValues.sortBy !== 'rating') {
      params.set('sort', nextValues.sortBy)
    }

    setSearchParams(params)
  }

  function handleSearch(e) {
    e.preventDefault()
    updateSearchParams({ trade, city, availableOnly, sortBy })
  }

  function clearFilters() {
    setTrade('')
    setCity('')
    setAvailableOnly(false)
    setSortBy('rating')
    setSearchParams({})
  }

  function removeTradeFilter() {
    const next = {
      trade: '',
      city,
      availableOnly,
      sortBy,
    }
    setTrade('')
    updateSearchParams(next)
  }

  function removeCityFilter() {
    const next = {
      trade,
      city: '',
      availableOnly,
      sortBy,
    }
    setCity('')
    updateSearchParams(next)
  }

  function removeAvailableFilter() {
    const next = {
      trade,
      city,
      availableOnly: false,
      sortBy,
    }
    setAvailableOnly(false)
    updateSearchParams(next)
  }

  function handleAvailableToggle() {
    const nextValue = !availableOnly
    setAvailableOnly(nextValue)
    updateSearchParams({
      trade,
      city,
      availableOnly: nextValue,
      sortBy,
    })
  }

  function handleSortChange(value) {
    setSortBy(value)
    updateSearchParams({
      trade,
      city,
      availableOnly,
      sortBy: value,
    })
  }

  const hasActiveFilters = trade || city || availableOnly

  return (
    <div className="min-h-screen bg-brand-light">
      {/* Navbar */}
      <nav className="bg-white border-b border-brand-border px-6 py-4 flex items-center justify-between shadow-sm">
        <Link to="/">
          <img src={logo} alt="CraftConnect" className="h-14 w-auto" />
        </Link>
        <Link
          to="/"
          className="text-sm text-brand-teal font-medium hover:underline"
        >
          ← Back to Home
        </Link>
      </nav>

      {/* Search Bar */}
      <div className="bg-brand-navy px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSearch}
            className="bg-white rounded-2xl p-3 flex flex-col md:flex-row gap-3"
          >
            <select
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              className="flex-1 border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green bg-white"
            >
              <option value="">All Trades</option>
              {TRADES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City..."
              className="flex-1 border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green"
            />

            <button
              type="submit"
              className="bg-brand-green text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-teal transition-all"
            >
              🔍 Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Results Header + Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-brand-navy font-semibold">
              {loading
                ? 'Searching...'
                : `${totalCount} artisan${totalCount !== 1 ? 's' : ''} found`}
            </p>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-red-400 hover:underline mt-0.5"
              >
                Clear all filters ✕
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Available Only Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={handleAvailableToggle}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  availableOnly ? 'bg-brand-green' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    availableOnly ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </div>
              <span className="text-xs text-brand-slate font-medium">
                Available only
              </span>
            </label>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="border border-brand-border rounded-lg px-3 py-1.5 text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green bg-white"
            >
              <option value="rating">Sort: Top Rated</option>
              <option value="newest">Sort: Newest</option>
            </select>
          </div>
        </div>

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {trade && (
              <span className="bg-brand-teal text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                🔧 {trade}
                <button
                  onClick={removeTradeFilter}
                  className="ml-1 hover:opacity-70"
                >
                  ✕
                </button>
              </span>
            )}

            {city && (
              <span className="bg-brand-green text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                📍 {city}
                <button
                  onClick={removeCityFilter}
                  className="ml-1 hover:opacity-70"
                >
                  ✕
                </button>
              </span>
            )}

            {availableOnly && (
              <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                🟢 Available only
                <button
                  onClick={removeAvailableFilter}
                  className="ml-1 hover:opacity-70"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : artisans.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <span className="text-5xl">🔍</span>
            <h3 className="text-lg font-bold text-brand-navy mt-4">
              No artisans found
            </h3>
            <p className="text-brand-slate text-sm mt-2">
              Try adjusting your search or removing some filters.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 bg-brand-green text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-navy transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {artisans.map((artisan) => (
              <ArtisanCard key={artisan.id} artisan={artisan} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}