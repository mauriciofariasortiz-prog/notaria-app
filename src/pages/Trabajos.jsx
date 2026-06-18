import { useEffect, useState, useMemo, useRef } from 'react'
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

function ResultadoBusqueda({ trabajo, empNombre, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px', cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(30,58,95,0.1)'; e.currentTarget.style.borderColor = '#C5A96A' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e5e7eb' }}
    >
      <div>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', fontWeight: '500', color: '#142845', marginBottom: '3px' }}>
          {[trabajo.asunto, trabajo.cliente].filter(Boolean).join(' · ')}
        </p>
        {trabajo.numero_escritura && (
          <p style={{ fontSize: '11px', color: '#C5A96A', fontWeight: '600', marginBottom: '2px' }}>Folio: {trabajo.numero_escritura}</p>
        )}
        <p style={{ fontSize: '11px', color: '#8A9BAD' }}>
          {empNombre} · Ingreso: {trabajo.fecha_ingreso ? new Date(trabajo.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-MX') : '—'}
        </p>
      </div>
      <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '99px', flexShrink: 0, marginTop: '2px',
        ...(trabajo.status === 'completado'
          ? { background: 'rgba(45,122,79,0.09)', color: '#2d7a4f', border: '1px solid rgba(45,122,79,0.22)' }
          : { background: 'rgba(197,169,106,0.13)', color: '#B07D2A', border: '1px solid rgba(197,169,106,0.38)' })
      }}>
        {trabajo.status === 'completado' ? 'Completado' : 'En proceso'}
      </span>
    </div>
  )
}

/* ── Bell / Notificaciones ── */
function diasSinMovimiento(ultima_actividad) {
  if (!ultima_actividad) return 0
  const diff = Date.now() - new Date(ultima_actividad).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function BellButton({ trabajosStale, onVerTrabajo }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const count = trabajosStale.length

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ position: 'relative', background: open ? 'rgba(197,169,106,0.2)' : 'transparent', border: `1px solid ${open ? 'rgba(197,169,106,0.5)' : 'rgba(138,155,173,0.35)'}`, borderRadius: '5px', color: count > 0 ? '#C5A96A' : '#8A9BAD', fontSize: '16px', padding: '5px 10px', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '4px' }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.borderColor = 'rgba(197,169,106,0.5)'; e.currentTarget.style.color = '#C5A96A' } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = 'rgba(138,155,173,0.35)'; e.currentTarget.style.color = count > 0 ? '#C5A96A' : '#8A9BAD' } }}
        title="Trabajos sin movimiento"
      >
        🔔
        {count > 0 && (
          <span style={{ background: '#e05252', color: '#fff', borderRadius: '99px', fontSize: '10px', fontWeight: '700', padding: '1px 6px', minWidth: '18px', textAlign: 'center', lineHeight: '16px' }}>
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="anim-slide-down" style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '320px', background: '#fff', borderRadius: '8px', boxShadow: '0 12px 40px rgba(20,40,69,0.22)', border: '1px solid #e5e7eb', zIndex: 200, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', background: '#fafbfc' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#142845' }}>
              Sin movimiento · +7 días
            </p>
            {count === 0 && (
              <p style={{ fontSize: '12px', color: '#8A9BAD', marginTop: '4px' }}>Todos los trabajos están al día ✓</p>
            )}
          </div>
          {count > 0 && (
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {trabajosStale.map(t => {
                const dias = diasSinMovimiento(t.ultima_actividad)
                return (
                  <div
                    key={t.id}
                    onClick={() => { onVerTrabajo(t.id); setOpen(false) }}
                    style={{ padding: '10px 16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f7f8fa'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '14px', fontWeight: '500', color: '#142845', marginBottom: '2px' }}>
                      {[t.asunto, t.cliente].filter(Boolean).join(' · ')}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#e05252' }}>
                        {dias} día{dias !== 1 ? 's' : ''} sin cambios
                      </span>
                      {t.emp_nombre && (
                        <span style={{ fontSize: '10px', color: '#8A9BAD' }}>· {t.emp_nombre}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Trabajos() {
  const [empleados,     setEmpleados]     = useState([])
  const [userName,      setUserName]      = useState('')
  const [loading,       setLoading]       = useState(true)
  const [busqueda,      setBusqueda]      = useState('')
  const [todosJobs,     setTodosJobs]     = useState([])
  const [empMap,        setEmpMap]        = useState({})
  const [trabajosStale, setTrabajosStale] = useState([])
  const navigate = useNavigate()

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const [{ data: { user } }, { data: emps }, { data: allJobs }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('empleados').select('id, nombre').order('nombre'),
      supabase.from('trabajos').select('id, encargado_id, cliente, asunto, fecha_ingreso, numero_escritura, status, ultima_actividad'),
    ])

    if (user) {
      const { data: emp } = await supabase.from('empleados').select('nombre').eq('user_id', user.id).single()
      setUserName(emp?.nombre || user.email?.split('@')[0] || '')
    }

    const counts = {}
    const map = {}
    ;(emps || []).forEach(e => { map[e.id] = e.nombre })
    ;(allJobs || []).forEach(j => {
      if (j.encargado_id) counts[j.encargado_id] = (counts[j.encargado_id] || 0) + 1
    })

    const lista = (emps || []).map(e => ({ ...e, total: counts[e.id] || 0 }))
    const idx = lista.findIndex(e => e.nombre === 'Mauricio FV')
    if (idx > 0) { const [mfv] = lista.splice(idx, 1); lista.unshift(mfv) }

    // Trabajos en proceso sin movimiento en 3+ días
    const hace7 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    const stale = (allJobs || [])
      .filter(j => j.status !== 'completado' && j.ultima_actividad && new Date(j.ultima_actividad) < hace7)
      .map(j => ({ ...j, emp_nombre: map[j.encargado_id] || null }))
      .sort((a, b) => new Date(a.ultima_actividad) - new Date(b.ultima_actividad))

    setEmpleados(lista)
    setTodosJobs(allJobs || [])
    setEmpMap(map)
    setTrabajosStale(stale)
    setLoading(false)
  }

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const resultados = useMemo(() => {
    if (!busqueda.trim()) return []
    const q = busqueda.toLowerCase()
    return todosJobs.filter(j =>
      j.cliente?.toLowerCase().includes(q) ||
      j.asunto?.toLowerCase().includes(q) ||
      j.numero_escritura?.toLowerCase().includes(q)
    )
  }, [busqueda, todosJobs])

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {userName && <span style={{ fontSize: '12px', fontWeight: '500', color: '#8A9BAD' }}>{userName}</span>}

          {/* Campana */}
          <BellButton trabajosStale={trabajosStale} onVerTrabajo={id => navigate(`/trabajos/${id}`)} />

          {/* Calendario */}
          <button
            onClick={() => navigate('/calendario')}
            style={{ background: 'transparent', border: '1px solid rgba(138,155,173,0.35)', borderRadius: '5px', color: '#8A9BAD', fontSize: '11px', fontWeight: '500', padding: '5px 12px', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C5A96A'; e.currentTarget.style.color = '#C5A96A' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(138,155,173,0.35)'; e.currentTarget.style.color = '#8A9BAD' }}
          >📅 Calendario</button>

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
        <p style={{ fontSize: '13px', color: '#8A9BAD', letterSpacing: '0.06em', margin: '0 0 28px' }}>Nuevo León · Monterrey</p>

        {/* Barra de búsqueda global */}
        <div style={{ maxWidth: '520px', margin: '0 auto', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', color: 'rgba(197,169,106,0.7)', pointerEvents: 'none' }}>🔍</span>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar en todos los trabajos — cliente, asunto o folio..."
            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(197,169,106,0.35)', borderRadius: '8px', padding: '12px 16px 12px 40px', fontSize: '13px', color: '#fff', outline: 'none', fontFamily: 'inherit', backdropFilter: 'blur(4px)' }}
          />
        </div>
      </div>

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 24px 56px' }}>

        {busqueda.trim() ? (
          <>
            <SectionTitle>
              {resultados.length === 0
                ? 'Sin resultados'
                : `${resultados.length} resultado${resultados.length !== 1 ? 's' : ''} para "${busqueda}"`}
            </SectionTitle>
            {resultados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#8A9BAD', fontSize: '13px' }}>
                No se encontró ningún trabajo con ese término.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {resultados.map(j => (
                  <ResultadoBusqueda
                    key={j.id}
                    trabajo={j}
                    empNombre={empMap[j.encargado_id] || 'Sin asignar'}
                    onClick={() => navigate(`/trabajos/${j.id}`)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <SectionTitle>Abogados</SectionTitle>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', height: '200px' }}>
                {[1,2].map(i => <div key={i} style={{ borderRadius: '14px', background: 'linear-gradient(90deg,#e8eaed 25%,#f4f5f7 50%,#e8eaed 75%)', backgroundSize: '400px 100%', animation: 'shimmer 1.4s ease infinite' }} />)}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '14px', alignItems: 'stretch' }}>
                {principal && (
                  <div style={{ flex: '0 0 220px' }} className="anim-fade-up">
                    <AbogadoCard emp={principal} big onClick={() => navigate(`/empleados/${principal.id}`)} />
                  </div>
                )}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '14px' }}>
                  {resto.map((emp, i) => (
                    <div key={emp.id} className={`anim-fade-up stagger-${i + 1}`}>
                      <AbogadoCard emp={emp} onClick={() => navigate(`/empleados/${emp.id}`)} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
