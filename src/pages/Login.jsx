import { useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(160deg, #2C5282 0%, #3A6298 100%)',
    padding: '1.5rem',
  },
  card: {
    background: '#ffffff',
    borderRadius: '4px',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '380px',
    boxShadow: '0 20px 60px rgba(44,82,130,0.35)',
  },
  logo: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  logoTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: '28px',
    fontWeight: '600',
    color: '#2C5282',
    letterSpacing: '0.02em',
    lineHeight: 1.1,
  },
  logoSub: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '10px',
    fontWeight: '500',
    color: '#B8C0CC',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    marginTop: '4px',
  },
  divider: {
    width: '40px',
    height: '1px',
    background: '#B8C0CC',
    margin: '12px auto',
  },
  label: {
    fontFamily: "'Montserrat', sans-serif",
    fontSize: '10px',
    fontWeight: '600',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#6B7A8D',
    marginBottom: '6px',
    display: 'block',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '2px',
    border: '1px solid rgba(184,196,208,0.6)',
    fontSize: '13px',
    width: '100%',
    color: '#2C5282',
    background: '#FAFBFC',
    transition: 'border-color 0.2s',
  },
  error: {
    fontSize: '12px',
    color: '#c0392b',
    background: 'rgba(192,57,43,0.06)',
    border: '1px solid rgba(192,57,43,0.2)',
    borderRadius: '2px',
    padding: '8px 12px',
  },
  btnPrimary: {
    width: '100%',
    padding: '12px',
    background: '#B8C0CC',
    color: '#2C5282',
    border: 'none',
    borderRadius: '2px',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background 0.2s',
  },
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Correo o contraseña incorrectos')
    } else {
      navigate('/trabajos')
    }
    setLoading(false)
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>
          <div style={S.logoTitle}>Notaría 120</div>
          <div style={S.divider} />
          <div style={S.logoSub}>Sistema de gestión</div>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={S.label}>Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={S.input}
              placeholder="usuario@notaria120.mx"
            />
          </div>
          <div>
            <label style={S.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={S.input}
              placeholder="••••••••"
            />
          </div>
          {error && <p style={S.error}>{error}</p>}
          <button type="submit" disabled={loading} style={S.btnPrimary}>
            {loading ? 'Verificando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
