import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../supabaseClient'
import { getConversationId } from '../../utils/conversation'

export default function ChatWindow() {
  const { receiverId } = useParams()
  const { user, profile } = useAuth()

  const [messages, setMessages] = useState([])
  const [otherUser, setOtherUser] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const bottomRef = useRef(null)

  const conversationId =
    user && receiverId ? getConversationId(user.id, receiverId) : null

  useEffect(() => {
    if (!user || !receiverId || !conversationId) return

    fetchOtherUser()
    fetchMessages()
    markAsRead()

    const channel = supabase
      .channel(`chat_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
          markAsRead()
          scrollToBottom()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, receiverId, conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }

  async function fetchOtherUser() {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('id', receiverId)
      .single()

    setOtherUser(data)
  }

  async function fetchMessages() {
    setLoading(true)

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (!error) setMessages(data || [])

    setLoading(false)
    scrollToBottom()
  }

  async function markAsRead() {
    if (!user || !conversationId) return

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', user.id)
      .eq('is_read', false)
  }

  async function sendMessage(e) {
  e.preventDefault()

  if (!user || !receiverId || !conversationId) return

  const content = newMessage.trim()
  if (!content) return

  setSending(true)
  setNewMessage('')

  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      conversation_id: conversationId,
      content,
      is_read: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error sending message:', error)
    setNewMessage(content)
  } else {
    setMessages((prev) => [...prev, data])
    scrollToBottom()
  }

  setSending(false)
}

  function formatTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    return (
      date.toLocaleDateString([], {
        day: 'numeric',
        month: 'short',
      }) +
      ' ' +
      date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    )
  }

  function groupMessagesByDate() {
    const groups = []
    let currentDate = null

    for (const msg of messages) {
      const msgDate = new Date(msg.created_at).toDateString()

      if (msgDate !== currentDate) {
        currentDate = msgDate
        groups.push({
          type: 'date',
          date: msgDate,
          id: `date_${msgDate}`,
        })
      }

      groups.push({
        type: 'message',
        ...msg,
      })
    }

    return groups
  }

  function getDashboardLink() {
    if (profile?.role === 'client') return '/client-dashboard'
    if (profile?.role === 'artisan') return '/artisan-dashboard'
    return '/'
  }

  const grouped = groupMessagesByDate()

  return (
    <div className="flex flex-col h-screen bg-brand-light">
      {/* Header */}
      <div className="bg-white border-b border-brand-border px-4 py-3 flex items-center gap-3 shadow-sm flex-shrink-0">
        <Link to="/messages" className="text-brand-teal text-lg">
          ←
        </Link>

        <div className="w-10 h-10 rounded-full bg-brand-light border-2 border-brand-border flex items-center justify-center flex-shrink-0">
          <span className="text-lg">👤</span>
        </div>

        <div className="flex-1">
          <p className="font-bold text-brand-navy text-sm">
            {otherUser?.full_name || 'Loading...'}
          </p>
          <p className="text-brand-slate text-xs capitalize">
            {otherUser?.role || ''}
          </p>
        </div>

        <Link
          to={getDashboardLink()}
          className="text-xs text-brand-slate hover:text-brand-navy"
        >
          Dashboard
        </Link>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <span className="text-5xl">👋</span>
            <p className="text-brand-navy font-semibold mt-4">
              Start the conversation
            </p>
            <p className="text-brand-slate text-sm mt-1">
              Say hello to {otherUser?.full_name?.split(' ')[0] || 'this user'}
            </p>
          </div>
        ) : (
          <>
            {grouped.map((item) => {
              if (item.type === 'date') {
                return (
                  <div key={item.id} className="flex items-center gap-3 py-3">
                    <div className="flex-1 h-px bg-brand-border" />
                    <span className="text-xs text-brand-slate font-medium px-2">
                      {new Date(item.date).toLocaleDateString([], {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    <div className="flex-1 h-px bg-brand-border" />
                  </div>
                )
              }

              const isMe = item.sender_id === user.id

              return (
                <div
                  key={item.id}
                  className={`flex ${
                    isMe ? 'justify-end' : 'justify-start'
                  } mb-1`}
                >
                  <div
                    className={`max-w-xs md:max-w-md ${
                      isMe ? 'items-end' : 'items-start'
                    } flex flex-col`}
                  >
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-brand-green text-white rounded-br-sm'
                          : 'bg-white text-brand-navy border border-brand-border rounded-bl-sm'
                      }`}
                    >
                      {item.content}
                    </div>

                    <p className="text-xs text-brand-slate mt-1 px-1">
                      {formatTime(item.created_at)}
                      {isMe && (
                        <span className="ml-1">
                          {item.is_read ? ' ✓✓' : ' ✓'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}

            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-brand-border px-4 py-3 flex-shrink-0">
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${
              otherUser?.full_name?.split(' ')[0] || ''
            }...`}
            className="flex-1 border border-brand-border rounded-xl px-4 py-2.5 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-green"
            disabled={sending}
          />

          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-brand-green text-white w-11 h-11 rounded-xl flex items-center justify-center hover:bg-brand-navy transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <span className="text-lg">➤</span>
          </button>
        </form>
      </div>
    </div>
  )
}