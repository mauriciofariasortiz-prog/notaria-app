import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabase'

export default function App() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/trabajos')
      } else {
        navigate('/login')
      }
      setLoading(false)
    })
  }, [])

  if (loading) return <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>Cargando...</div>

  return null
}
