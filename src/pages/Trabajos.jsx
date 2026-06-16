import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

function initiales(nombre = '') {
  const parts = nombre.trim().split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  const first = parts[0][0].toUpperCase()
  const last  = parts[parts.length - 1].toUpperCase()
  return last.length <= 3 ? first + last : first + last[0]
}

const NAV_COLORS = ['#1E3A5F', '#1a3360', '#254870', '#2d4a7a', '#163050']

function AbogadoCard({ emp, onClick, big = false }) {
  const [hovered, setHovered] = useState(false)
  const bg = NAV_COLORS[emp.nombre.charCodeAt(0) % NAV_COLORS.length]
  const avatarSize = big ? 80 : 56

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#ffffff',
        border: `1px solid ${hovered ? '#1E3A5F' : '#e5e7eb'}`,
        borderTop: `3px solid ${hovered ? '#C5A96A' : 'transparent'}`,
        borderRadius: '14px',
        padding: big ? '36px 20px 30px' : '22px 14px 20px',
        cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: big ? '16px' : '11px',
        textAlign: 'center',
        width: '100%', height: '100%',
        transition: 'border-color 0.18s, box-shadow 0.18s, transform 0.18s',
        boxShadow: hovered ? '0 6px 24px rgba(30,58,95,0.13)' : '0 1px 4px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
      }}
    >
      <div style={{
        width: avatarSize, height: avatarSize, borderRadius: '50%',
        background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Cormorant Garamond', serif",
        fontSize: big ? 30 : 20, fontWeight: '600', color: '#C5A96A',
        flexShrink: 0,
        boxShadow: '0 2px 10px rgba(20,40,69,0.2)',
      }}>
        {initiales(emp.nombre)}
      </div>
      <div>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: big ? 22 : 15, fontWeight: '500',
          color: '#142845', margin: '0 0 5px', lineHeight: 1.2,
        }}>
          {emp.nombre}
        </p>
        <p style={{ fontSize: big ? 13 : 11, fontWeight: '500', color: '#8A9BAD', margin: 0 }}>
          {emp.total} {emp.total === 1 ? 'trabajo' : 'trabajos'}
        </p>
      </div>
    </button>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
      <span style={{ fontSize: '11px', fontWeight: '600', color: '#8A9BAD', letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        {children}
      </span>
      <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
    </div>
  )
}

export default function Trabajos() {
  const [empleados, setEmpleados] = useState([])
  const [userName,  setUserName]  = useState('')
  const [loading,   setLoading]   = useState(true)
  const navigate = useNavigate()

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const [{ data: { user } }, { data: emps }, { data: allJobs }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('empleados').select('id, nombre').order('nombre'),
      supabase.from('trabajos').select('encargado_id'),
    ])

    if (user) {
      const { data: emp } = await supabase.from('empleados').select('nombre').eq('user_id', user.id).single()
      setUserName(emp?.nombre || user.email?.split('@')[0] || '')
    }

    const counts = {}
    ;(allJobs || []).forEach(j => {
      if (j.encargado_id) counts[j.encargado_id] = (counts[j.encargado_id] || 0) + 1
    })

    const lista = (emps || []).map(e => ({ ...e, total: counts[e.id] || 0 }))
    // Mauricio FV siempre primero
    const idx = lista.findIndex(e => e.nombre === 'Mauricio FV')
    if (idx > 0) { const [mfv] = lista.splice(idx, 1); lista.unshift(mfv) }

    setEmpleados(lista)
    setLoading(false)
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const [principal, ...resto] = empleados

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa', fontFamily: "'Montserrat', sans-serif" }}>

      {/* NAVBAR */}
      <nav style={{ background: '#142845', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '38px', height: '38px', border: '1.5px solid #C5A96A', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '17px', fontWeight: '600', color: '#C5A96A' }}>120</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#D6DFE8' }}>Notaría Pública No. 120 · Monterrey</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {userName && <span style={{ fontSize: '12px', fontWeight: '500', color: '#8A9BAD' }}>{userName}</span>}
          <button
            onClick={() => navigate('/trabajos/nuevo')}
            style={{ background: '#C5A96A', border: 'none', borderRadius: '5px', color: '#142845', fontSize: '11px', fontWeight: '700', padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.06em', transition: 'background 0.15s, transform 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#B8965A'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#C5A96A'; e.currentTarget.style.transform = 'translateY(0)' }}
          >+ Nuevo trabajo</button>
          <button
            onClick={cerrarSesion}
            style={{ background: 'transparent', border: '1px solid rgba(138,155,173,0.35)', borderRadius: '5px', color: '#8A9BAD', fontSize: '11px', fontWeight: '500', padding: '5px 12px', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C5A96A'; e.currentTarget.style.color = '#C5A96A' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(138,155,173,0.35)'; e.currentTarget.style.color = '#8A9BAD' }}
          >Salir</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #142845 100%)', padding: '52px 28px 56px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', border: '1px solid rgba(197,169,106,0.45)', borderRadius: '99px', padding: '5px 16px', marginBottom: '22px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C5A96A' }} />
          <span style={{ fontSize: '10px', fontWeight: '600', color: '#C5A96A', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Sistema de gestión</span>
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '46px', fontWeight: '600', color: '#ffffff', margin: '0 0 10px', lineHeight: 1.1 }}>
          Notaría Pública No. 120
        </h1>
        <p style={{ fontSize: '13px', color: '#8A9BAD', letterSpacing: '0.06em', margin: 0 }}>Nuevo León · Monterrey</p>
      </div>

      {/* ABOGADOS */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px 56px' }}>
        <SectionTitle>Abogados</SectionTitle>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', height: '200px' }}>
            {[1,2].map(i => <div key={i} style={{ borderRadius: '14px', background: 'linear-gradient(90deg,#e8eaed 25%,#f4f5f7 50%,#e8eaed 75%)', backgroundSize: '400px 100%', animation: 'shimmer 1.4s ease infinite' }} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '14px', alignItems: 'stretch' }}>
            {/* Tarjeta grande — Mauricio FV */}
            {principal && (
              <div style={{ flex: '0 0 220px' }} className="anim-fade-up">
                <AbogadoCard emp={principal} big onClick={() => navigate(`/empleados/${principal.id}`)} />
              </div>
            )}

            {/* Resto — grid 2×2 */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '14px' }}>
              {resto.map((emp, i) => (
                <div key={emp.id} className={`anim-fade-up stagger-${i + 1}`}>
                  <AbogadoCard emp={emp} onClick={() => navigate(`/empleados/${emp.id}`)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
