import { useEffect, useState } from 'react'
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
          {/* Título */}
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: '500', color: 'var(--navy-dark)', marginBottom: '6px', lineHeight: 1.2 }}>
            {[t.asunto, t.cliente].filter(Boolean).join(' · ') || t.cliente}
          </p>

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

          {/* Fecha */}
          {t.fecha_ingreso && (
            <p style={{ fontSize: '11px', color: 'var(--text-light)' }}>
              Ingreso: {new Date(t.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-MX')}
            </p>
          )}
        </div>

        {/* Badge */}
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
  const [enProceso,  setEnProceso]  = useState([])
  const [completados, setCompletados] = useState([])
  const [loading, setLoading] = useState(true)

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

      // Progreso por trabajo
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
        // Completado = ningún paso pendiente (todos son hecho o no_aplica) y hay al menos un paso
        const esCompleto = p.total > 0 && p.pendientes === 0
        return { ...j, prog: p, esCompleto }
      })

      setEnProceso(enriquecidos.filter(t => !t.esCompleto))
      setCompletados(enriquecidos.filter(t => t.esCompleto))
    } else {
      setEnProceso([])
      setCompletados([])
    }

    setLoading(false)
  }

  const total = enProceso.length + completados.length

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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '1.75rem' }}>
            {[
              { label: 'Total',       value: total,              accent: 'var(--navy-dark)' },
              { label: 'En proceso',  value: enProceso.length,   accent: 'var(--amber)' },
              { label: 'Completados', value: completados.length,  accent: 'var(--green)' },
            ].map(({ label, value, accent }, i) => (
              <div key={label} className={`stat-card anim-fade-up stagger-${i + 1}`}>
                <p style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '6px' }}>{label}</p>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '34px', fontWeight: '500', color: accent, lineHeight: 1 }}>{value}</p>
              </div>
            ))}
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
        ) : (
          <>
            {/* En proceso */}
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

            {/* Completados */}
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
