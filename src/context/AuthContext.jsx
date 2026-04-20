import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext({})
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [artisanProfile, setArtisanProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setArtisanProfile(null)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setArtisanProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    setLoading(true)

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) {
      console.error('Error fetching user profile:', userError)
      setProfile(null)
      setArtisanProfile(null)
      setLoading(false)
      return
    }

    setProfile(userData)

    if (userData?.role === 'artisan') {
      const { data: artisanData, error: artisanError } = await supabase
        .from('artisan_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (artisanError) {
        setArtisanProfile(null)
      } else {
        setArtisanProfile(artisanData || null)
      }
    } else {
      setArtisanProfile(null)
    }

    setLoading(false)
  }

  async function refreshProfile() {
    if (!user) return
    await fetchProfile(user.id)
  }

  async function refreshArtisanProfile() {
    if (!user) return

    const { data, error } = await supabase
      .from('artisan_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error refreshing artisan profile:', error)
      setArtisanProfile(null)
      return
    }

    setArtisanProfile(data || null)
  }

  async function signUp(email, password, fullName, role) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName,
        },
      },
    })

    if (error) return { error }

    if (data.user) {
      await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', data.user.id)
    }

    return { data }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { data, error }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const value = {
    user,
    profile,
    artisanProfile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    refreshArtisanProfile,
    fetchProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}