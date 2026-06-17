import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../supabase'
import { useNavigate, useParams } from 'react-router-dom'

function initiales(nombre = '') {
  const parts = nombre.trim().split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  const first = parts[0][0].toUpperCase()
  const last  = parts[parts.length - 1].toUpperCase()
  return last.length <= 3 ? first + last : first + last[0]
}

function SectionLabel({ children, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
      <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap' }}>
        {children}
      </span>
      {count !== undefined && (
        <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-light)', background: 'var(--silver-light)', borderRadius: '99px', padding: '1px 8px', border: '1px solid var(--border)' }}>
          {count}
        </span>
      )}
      <div style={{ flex: 1, height: '1px', background: 'var(--gold-border)' }} />
    </div>
  )
}

function fechaLimiteBadge(fecha_limite) {
  if (!fecha_limite) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const limite = new Date(fecha_limite + 'T00:00:00')
  const diff = Math.ceil((limite - hoy) / (1000 * 60 * 60 * 24))

  let color, bg, border, texto
  if (diff < 0) {
    color = '#c0392b'; bg = 'rgba(192,57,43,0.09)'; border = 'rgba(192,57,43,0.3)'
    texto = `Vencida hace ${Math.abs(diff)} día${Math.abs(diff) !== 1 ? 's' : ''}`
  } else if (diff <= 3) {
    color = '#B07D2A'; bg = 'rgba(197,169,106,0.15)'; border = 'rgba(197,169,106,0.45)'
    texto = diff === 0 ? 'Vence hoy' : `Vence en ${diff} día${diff !== 1 ? 's' : ''}`
  } else {
    color = '#2d7a4f'; bg = 'rgba(45,122,79,0.09)'; border = 'rgba(45,122,79,0.25)'
    texto = limite.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  }

  return (
    <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '99px', background: bg, color, border: `1px solid ${border}`, whiteSpace: 'nowrap' }}>
      {texto}
    </span>
  )
}

function TrabajoCard({ t, onClick, index }) {
  const prog = t.prog
  const porcentaje = prog && prog.aplicables > 0 ? Math.round((prog.hechos / prog.aplicables) * 100) : null
  const esCompleto = t.esCompleto

  return (
    <div
      className={`work-card anim-fade-up stagger-${Math.min(index + 1, 5)}`}
      onClick={onClick}
      style={{ opacity: esCompleto ? 0.75 : 1 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: '500', color: 'var(--navy-dark)', marginBottom: '4px', lineHeight: 1.2 }}>
            {[t.asunto, t.cliente].filter(Boolean).join(' · ') || t.cliente}
          </p>

          {/* Folio */}
          {t.numero_escritura && (
            <p style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: '600', marginBottom: '4px' }}>
              Escritura / Folio: {t.numero_escritura}
            </p>
          )}

          {/* Progreso */}
          {prog && prog.total > 0 && (
            <div style={{ marginBottom: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <div style={{ flex: 1, height: '4px', background: 'rgba(184,196,208,0.3)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{
                    height: '4px', borderRadius: '99px', width: `${porcentaje}%`,
                    background: esCompleto ? '#2d7a4f' : 'linear-gradient(90deg, var(--navy), var(--gold))',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <span style={{ fontSize: '10px', fontWeight: '600', color: esCompleto ? '#2d7a4f' : 'var(--amber)', flexShrink: 0 }}>
                  {porcentaje}%
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                {prog.hechos} de {prog.aplicables} pasos completados
              </p>
            </div>
          )}

          {/* Fechas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {t.fecha_ingreso && (
              <p style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                Ingreso: {new Date(t.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-MX')}
              </p>
            )}
            {t.fecha_limite && fechaLimiteBadge(t.fecha_limite)}
          </div>
        </div>

        {/* Badge estado */}
        {esCompleto ? (
          <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '99px', background: 'rgba(45,122,79,0.09)', color: '#2d7a4f', border: '1px solid rgba(45,122,79,0.22)', flexShrink: 0, marginTop: '2px' }}>
            Completado
          </span>
        ) : (
          <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '99px', background: 'rgba(197,169,106,0.13)', color: '#B07D2A', border: '1px solid rgba(197,169,106,0.38)', flexShrink: 0, marginTop: '2px' }}>
            En proceso
          </span>
        )}
      </div>
    </div>
  )
}

export default function EmpleadoTrabajos() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [empleado, setEmpleado] = useState(null)
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')

  useEffect(() => { cargar() }, [id])

  const cargar = async () => {
    const [{ data: emp }, { data: jobs }] = await Promise.all([
      supabase.from('empleados').select('id, nombre').eq('id', id).single(),
      supabase.from('trabajos')
        .select('*')
        .eq('encargado_id', id)
        .order('fecha_ingreso', { ascending: true }),
    ])

    setEmpleado(emp)

    if (jobs && jobs.length > 0) {
      const ids = jobs.map(j => j.id)
      const { data: items } = await supabase
        .from('checklist')
        .select('trabajo_id, estado')
        .in('trabajo_id', ids)

      const prog = {}
      ;(items || []).forEach(item => {
        if (!prog[item.trabajo_id]) prog[item.trabajo_id] = { total: 0, aplicables: 0, hechos: 0, pendientes: 0 }
        prog[item.trabajo_id].total++
        if (item.estado !== 'no_aplica') prog[item.trabajo_id].aplicables++
        if (item.estado === 'hecho') prog[item.trabajo_id].hechos++
        if (item.estado === 'pendiente') prog[item.trabajo_id].pendientes++
      })

      const enriquecidos = jobs.map(j => {
        const p = prog[j.id] || { total: 0, aplicables: 0, hechos: 0, pendientes: 0 }
        const esCompleto = p.total > 0 && p.pendientes === 0
        return { ...j, prog: p, esCompleto }
      })

      setTodos(enriquecidos)
    } else {
      setTodos([])
    }

    setLoading(false)
  }

  const filtrados = useMemo(() => {
    return todos.filter(t => {
      // Búsqueda por cliente o asunto
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase()
        if (!t.cliente?.toLowerCase().includes(q) && !t.asunto?.toLowerCase().includes(q)) return false
      }
      // Filtro estado
      if (filtroEstado === 'en_proceso' && t.esCompleto) return false
      if (filtroEstado === 'completado' && !t.esCompleto) return false
      // Filtro fecha ingreso
      if (filtroFechaDesde && t.fecha_ingreso < filtroFechaDesde) return false
      if (filtroFechaHasta && t.fecha_ingreso > filtroFechaHasta) return false
      return true
    })
  }, [todos, busqueda, filtroEstado, filtroFechaDesde, filtroFechaHasta])

  const enProceso  = filtrados.filter(t => !t.esCompleto)
  const completados = filtrados.filter(t => t.esCompleto)
  const total = todos.length
  const hayFiltros = busqueda || filtroEstado !== 'todos' || filtroFechaDesde || filtroFechaHasta

  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroEstado('todos')
    setFiltroFechaDesde('')
    setFiltroFechaHasta('')
  }

  const inputStyle = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '7px 10px', fontSize: '12px', color: 'var(--navy-dark)', outline: 'none', fontFamily: 'inherit' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{ background: 'var(--navy-dark)', borderBottom: '2px solid var(--gold)', padding: '0 1.75rem', height: '64px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={() => navigate('/trabajos')}
          style={{ background: 'transparent', border: 'none', color: 'var(--gold)', fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '0 4px', transition: 'transform 0.15s', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-3px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
        >←</button>

        {!loading && empleado && (
          <>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#1E3A5F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: 15, fontWeight: '600', color: '#C5A96A', flexShrink: 0 }}>
              {initiales(empleado.nombre)}
            </div>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: '500', color: '#ffffff', lineHeight: 1.1 }}>
                {empleado.nombre}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '2px' }}>
                {total} {total === 1 ? 'trabajo' : 'trabajos'}
              </div>
            </div>
          </>
        )}

        <div style={{ marginLeft: 'auto' }}>
          <button className="btn-gold" onClick={() => navigate(`/trabajos/nuevo?empleado=${id}`)}>
            + Nuevo trabajo
          </button>
        </div>
      </header>

      <main style={{ padding: '1.75rem', maxWidth: '880px', margin: '0 auto' }}>

        {/* Stats */}
        {!loading && total > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '1.25rem' }}>
            {[
              { label: 'Total',       value: total,                                     accent: 'var(--navy-dark)' },
              { label: 'En proceso',  value: todos.filter(t => !t.esCompleto).length,   accent: 'var(--amber)' },
              { label: 'Completados', value: todos.filter(t => t.esCompleto).length,    accent: 'var(--green)' },
            ].map(({ label, value, accent }, i) => (
              <div key={label} className={`stat-card anim-fade-up stagger-${i + 1}`}>
                <p style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '6px' }}>{label}</p>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '34px', fontWeight: '500', color: accent, lineHeight: 1 }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Búsqueda y filtros */}
        {!loading && total > 0 && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: 'var(--shadow-sm)' }}>
            {/* Barra de búsqueda */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--text-light)', pointerEvents: 'none' }}>🔍</span>
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por cliente o asunto..."
                style={{ ...inputStyle, width: '100%', paddingLeft: '30px', boxSizing: 'border-box' }}
              />
            </div>

            {/* Filtros en línea */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={inputStyle}>
                <option value="todos">Todos los estados</option>
                <option value="en_proceso">En proceso</option>
                <option value="completado">Completados</option>
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>Ingreso desde</span>
                <input type="date" value={filtroFechaDesde} onChange={e => setFiltroFechaDesde(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>hasta</span>
                <input type="date" value={filtroFechaHasta} onChange={e => setFiltroFechaHasta(e.target.value)} style={inputStyle} />
              </div>

              {hayFiltros && (
                <button onClick={limpiarFiltros} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '5px', padding: '6px 10px', fontSize: '11px', color: 'var(--text-light)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Limpiar filtros
                </button>
              )}
            </div>

            {hayFiltros && (
              <p style={{ fontSize: '11px', color: 'var(--text-light)', margin: 0 }}>
                Mostrando {filtrados.length} de {total} trabajos
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1,2,3].map(i => <div key={i} style={{ height: '90px', borderRadius: '6px' }} className="skeleton" />)}
          </div>
        ) : total === 0 ? (
          <div className="anim-fade-up" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)', fontSize: '13px' }}>
            Este empleado no tiene trabajos asignados.
          </div>
        ) : filtrados.length === 0 ? (
          <div className="anim-fade-up" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)', fontSize: '13px' }}>
            No se encontraron trabajos con esos filtros.
          </div>
        ) : (
          <>
            {enProceso.length > 0 && (
              <div style={{ marginBottom: '2rem' }} className="anim-fade-in">
                <SectionLabel count={enProceso.length}>En proceso</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {enProceso.map((t, i) => (
                    <TrabajoCard key={t.id} t={t} index={i} onClick={() => navigate(`/trabajos/${t.id}`)} />
                  ))}
                </div>
              </div>
            )}

            {completados.length > 0 && (
              <div className="anim-fade-in">
                <SectionLabel count={completados.length}>Completados</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {completados.map((t, i) => (
                    <TrabajoCard key={t.id} t={t} index={i} onClick={() => navigate(`/trabajos/${t.id}`)} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
