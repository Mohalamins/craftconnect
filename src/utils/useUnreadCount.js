import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export function useUnreadCount(userId) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!userId) return

    fetchCount()

    // Real-time subscription for new messages
    const channel = supabase
      .channel(`unread_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        () => fetchCount()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  async function fetchCount() {
    const { count: unreadCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false)

    setCount(unreadCount || 0)
  }

  return count
}