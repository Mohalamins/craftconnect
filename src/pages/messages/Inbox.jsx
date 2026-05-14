import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import logo from '../../assets/logo.png'

export default function Inbox() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchConversations()
  }, [user])

  async function fetchConversations() {
    setLoading(true)

    // Get all messages where user is sender or receiver
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey (
          id, full_name
        ),
        receiver:users!messages_receiver_id_fkey (
          id, full_name
        )
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching messages:', error)
      setLoading(false)
      return
    }

    // Group by conversation_id, keep only latest message per conversation
    const seen = new Set()
    const unique = []

    for (const msg of data || []) {
      if (!seen.has(msg.conversation_id)) {
        seen.add(msg.conversation_id)
        unique.push(msg)
      }
    }

    setConversations(unique)
    setLoading(false)
  }

  function getOtherPerson(msg) {
    if (msg.sender?.id === user.id) return msg.receiver
    return msg.sender
  }

  function getUnreadCount(conversationId) {
    // Count unread in this conversation where user is receiver
    return conversations.filter(
      m => m.conversation_id === conversationId &&
           m.receiver_id === user.id &&
           !m.is_read
    ).length
  }

  function getDashboardLink() {
    if (profile?.role === 'client') return '/client-dashboard'
    if (profile?.role === 'artisan') return '/artisan-dashboard'
    return '/'
  }

  return (
    <div className="min-h-screen bg-brand-light">

      {/* Navbar */}
      <nav className="bg-white border-b border-brand-border px-6 py-4 flex items-center justify-between shadow-sm">
        <img src={logo} alt="CraftConnect" className="h-14 w-auto" />
        <Link
          to={getDashboardLink()}
          className="text-sm text-brand-teal font-medium hover:underline"
        >
          ← Dashboard
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">

        <h1 className="text-2xl font-bold text-brand-navy mb-6">
          Messages
        </h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <span className="text-5xl">💬</span>
            <h3 className="text-lg font-bold text-brand-navy mt-4">
              No messages yet
            </h3>
            <p className="text-brand-slate text-sm mt-2">
              Start a conversation by messaging an artisan
              from their profile page.
            </p>
            <Link
              to="/search"
              className="mt-5 inline-block bg-brand-green text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-navy transition-all"
            >
              Find Artisans
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {conversations.map((msg, index) => {
              const other = getOtherPerson(msg)
              const isUnread = !msg.is_read && msg.receiver_id === user.id

              return (
                <button
                  key={msg.conversation_id}
                  onClick={() => navigate(`/messages/${other?.id}`)}
                  className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-brand-light transition-all ${
                    index !== conversations.length - 1
                      ? 'border-b border-brand-border'
                      : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-brand-light border-2 border-brand-border flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">👤</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-semibold ${
                        isUnread ? 'text-brand-navy' : 'text-brand-slate'
                      }`}>
                        {other?.full_name || 'Unknown'}
                      </p>
                      <p className="text-xs text-brand-slate flex-shrink-0 ml-2">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className={`text-xs mt-0.5 truncate ${
                      isUnread ? 'font-semibold text-brand-navy' : 'text-brand-slate'
                    }`}>
                      {msg.sender_id === user.id ? 'You: ' : ''}
                      {msg.content}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {isUnread && (
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-green flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}