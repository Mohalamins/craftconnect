import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL or VITE_SUPABASE_URL')
}

if (!serviceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing auth token' })
    }

    const token = authHeader.replace('Bearer ', '')

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({
        error: authError?.message || 'Invalid user token',
      })
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return res.status(403).json({
        error: `Could not verify admin role: ${profileError.message}`,
      })
    }

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    let body = req.body

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch {
        body = {}
      }
    }

    const { filePath } = body || {}

    if (!filePath) {
      return res.status(400).json({ error: 'Missing filePath' })
    }

    const { data, error } = await supabase.storage
      .from('verification-docs')
      .createSignedUrl(filePath, 60 * 60)

    if (error) {
      return res.status(400).json({
        error: `Failed to create signed URL: ${error.message}`,
      })
    }

    return res.status(200).json({ signedUrl: data.signedUrl })
  } catch (err) {
    return res.status(500).json({
      error: err.message || 'Server error',
    })
  }
}