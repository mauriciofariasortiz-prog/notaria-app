import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate, useParams } from 'react-router-dom'

const STATUS = {
  completado: { label: 'Completado', color: '#2d7a4f', bg: 'rgba(45,122,79,0.09)', border: 'rgba(45,122,79,0.22)' },
  en_proceso: { label: 'En proceso', color: '#B07D2A', bg: 'rgba(197,169,106,0.13)', border: 'rgba(197,169,106,0.38)' },
  nuevo:      { label: 'Nuevo',      color: '#1E3A5F', bg: 'rgba(30,58,95,0.08)',   border: 'rgba(30,58,95,0.22)'  },
}

function initiales(nombre = '') {
  return nombre.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function Avatar({ nombre, size = 40 }) {
  const colors = ['#1E3A5F', '#2d4a7a', '#3a5c8f', '#254870', '#1a3360']
  const idx = nombre.charCodeAt(0) % colors.length
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: colors[idx],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Cormorant Garamond', serif",
      fontSize: size * 0.38, fontWeight: '600', color: '#C5A96A',
      flexShrink: 0,
    }}>
      {initiales(nombre)}
    </div>
  )
}

export default function EmpleadoTrabajos() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [empleado, setEmpleado] = useState(null)
  const [trabajos, setTrabajos] = useState([])
  const [loading, setLoading]   = useState(true)

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
    setTrabajos(jobs || [])
    setLoading(false)
  }

  const enProceso   = trabajos.filter(t => t.status === 'en_proceso').length
  const completados = trabajos.filter(t => t.status === 'completado').length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <header style={{
        background: 'var(--navy-dark)',
        borderBottom: '2px solid var(--gold)',
        padding: '0 1.75rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}>
        <button
          onClick={() => navigate('/trabajos')}
          style={{
            background: 'transparent', border: 'none',
            color: 'var(--gold)', fontSize: '22px',
            cursor: 'pointer', lineHeight: 1, padding: '0 4px',
            transition: 'transform 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-3px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
        >←</button>

        {!loading && empleado && (
          <>
            <Avatar nombre={empleado.nombre} size={38} />
            <div>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '20px', fontWeight: '500',
                color: '#ffffff', lineHeight: 1.1,
              }}>
                {empleado.nombre}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '2px' }}>
                {trabajos.length} {trabajos.length === 1 ? 'trabajo' : 'trabajos'}
              </div>
            </div>
          </>
        )}

        <div style={{ marginLeft: 'auto' }}>
          <button
            className="btn-gold"
            onClick={() => navigate(`/trabajos/nuevo?empleado=${id}`)}
          >
            + Nuevo trabajo
          </button>
        </div>
      </header>

      <main style={{ padding: '1.75rem', maxWidth: '880px', margin: '0 auto' }}>

        {/* Mini stats */}
        {!loading && trabajos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '1.75rem' }}>
            {[
              { label: 'Total',        value: trabajos.length,  accent: 'var(--navy-dark)' },
              { label: 'En proceso',   value: enProceso,         accent: 'var(--amber)' },
              { label: 'Completados',  value: completados,        accent: 'var(--green)' },
            ].map(({ label, value, accent }, i) => (
              <div key={label} className={`stat-card anim-fade-up stagger-${i + 1}`}>
                <p style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '6px' }}>{label}</p>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '34px', fontWeight: '500', color: accent, lineHeight: 1 }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Lista de trabajos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }} className="anim-fade-in">
          <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap' }}>
            Trabajos asignados
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--gold-border)' }} />
          <span style={{ fontSize: '10px', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>más antiguo → más nuevo</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1,2,3,4].map(i => <div key={i} style={{ height: '76px', borderRadius: '6px' }} className="skeleton" />)}
          </div>
        ) : trabajos.length === 0 ? (
          <div className="anim-fade-up" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)', fontSize: '13px' }}>
            Este empleado no tiene trabajos asignados.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {trabajos.map((t, i) => {
              const meta = STATUS[t.status] || STATUS.nuevo
              return (
                <div
                  key={t.id}
                  className={`work-card anim-fade-up stagger-${Math.min(i + 1, 5)}`}
                  onClick={() => navigate(`/trabajos/${t.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: '17px', fontWeight: '500',
                        color: 'var(--navy-dark)', marginBottom: '3px',
                      }}>
                        {t.cliente}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                        {t.tipo} · {t.folio || 'Sin folio'}{t.descripcion ? ` · ${t.descripcion}` : ''}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                        Ingreso: {new Date(t.fecha_ingreso).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <span
                      className="status-badge"
                      style={{ background: meta.bg, color: meta.color, borderColor: meta.border, marginLeft: '12px', flexShrink: 0 }}
                    >
                      {meta.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
