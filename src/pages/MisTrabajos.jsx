import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

const STATUS = {
  completado: { label: 'Completado', color: '#2d7a4f', bg: 'rgba(45,122,79,0.09)', border: 'rgba(45,122,79,0.22)' },
  en_proceso: { label: 'En proceso', color: '#B07D2A', bg: 'rgba(197,169,106,0.13)', border: 'rgba(197,169,106,0.38)' },
  nuevo:      { label: 'Nuevo',      color: '#1E3A5F', bg: 'rgba(30,58,95,0.08)',   border: 'rgba(30,58,95,0.22)'  },
}

export default function MisTrabajos() {
  const [trabajos, setTrabajos] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { cargarMisTrabajos() }, [])

  const cargarMisTrabajos = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: empleado } = await supabase
      .from('empleados').select('id').eq('user_id', user.id).single()
    if (empleado) {
      const { data } = await supabase
        .from('trabajos')
        .select('*, empleados(nombre)')
        .eq('encargado_id', empleado.id)
        .order('created_at', { ascending: false })
      setTrabajos(data || [])
    }
    setLoading(false)
  }

  const enProceso  = trabajos.filter(t => t.status === 'en_proceso').length
  const completados = trabajos.filter(t => t.status === 'completado').length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ background: 'var(--navy-dark)', borderBottom: '2px solid var(--gold)', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => navigate('/trabajos')}
          style={{ background: 'transparent', border: 'none', color: 'var(--gold)', fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '0 4px', transition: 'transform 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-3px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
        >←</button>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: '500', color: '#fff' }}>
          Mis trabajos
        </span>
      </div>

      <div style={{ padding: '1.5rem', maxWidth: '940px', margin: '0 auto' }}>

        {/* Mini stats */}
        {!loading && trabajos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
            {[
              { label: 'Asignados',   value: trabajos.length,  accent: 'var(--navy-dark)' },
              { label: 'En proceso',  value: enProceso,         accent: 'var(--amber)' },
              { label: 'Completados', value: completados,        accent: 'var(--green)' },
            ].map(({ label, value, accent }, i) => (
              <div key={label} className={`stat-card anim-fade-up stagger-${i + 1}`}>
                <p style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '6px' }}>{label}</p>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '36px', fontWeight: '500', color: accent, lineHeight: 1 }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="anim-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap' }}>Trabajos asignados</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--gold-border)' }} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1,2,3].map(i => <div key={i} style={{ height: '76px', borderRadius: '6px' }} className="skeleton" />)}
          </div>
        ) : trabajos.length === 0 ? (
          <div className="anim-fade-up" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)', fontSize: '13px' }}>
            No tienes trabajos asignados.
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '17px', fontWeight: '500', color: 'var(--navy-dark)', marginBottom: '3px' }}>
                        {t.cliente}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        {t.tipo} · {t.folio || 'Sin folio'}{t.descripcion ? ` · ${t.descripcion}` : ''}
                      </p>
                      <p style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                        {new Date(t.fecha_ingreso).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <span className="status-badge" style={{ background: meta.bg, color: meta.color, borderColor: meta.border, marginLeft: '12px', flexShrink: 0 }}>
                      {meta.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
