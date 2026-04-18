import { useEffect } from 'react'
import { supabase } from './supabaseClient'

function App() {
  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase
        .from('users')
        .select('*')

      console.log('DATA:', data)
      console.log('ERROR:', error)
    }

    testConnection()
  }, [])

  return (
    <div className="flex items-center justify-center h-screen bg-blue-500">
      <h1 className="text-white text-4xl font-bold">CraftConnect</h1>
    </div>
  )
}

export default App