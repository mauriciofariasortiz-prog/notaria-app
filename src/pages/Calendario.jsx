import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

function inicioSemana(fecha) {
  const d = new Date(fecha)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function addDays(fecha, n) {
  const d = new Date(fecha)
  d.setDate(d.getDate() + n)
  return d
}

function fmtFecha(d) {
  return `${d.getDate()} ${MESES[d.getMonth()]}`
}

function esHoy(d) {
  const hoy = new Date()
  return d.getDate() === hoy.getDate() && d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear()
}

function isoDate(d) {
  return d.toISOString().split('T')[0]
}

export default function Calendario() {
  const navigate = useNavigate()
  const [firmas, setFirmas] = useState([])
  const [loading, setLoading] = useState(true)
  const [semana, setSemana] = useState(() => inicioSemana(new Date()))

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const { data } = await supabase
      .from('checklist')
      .select('id, fecha_firma, paso, trabajo_id, trabajos(id, cliente, asunto, empleados(nombre))')
      .eq('paso', 'Firma')
      .eq('estado', 'hecho')
      .not('fecha_firma', 'is', null)
      .order('fecha_firma', { ascending: true })
    setFirmas(data || [])
    setLoading(false)
  }

  const semanaAnterior = () => setSemana(d => addDays(d, -7))
  const semanaSiguiente = () => setSemana(d => addDays(d, 7))
  const hoy = () => setSemana(inicioSemana(new Date()))

  const diasSemana = DIAS.map((nombre, i) => ({
    nombre,
    fecha: addDays(semana, i),
  }))

  const firmasPorDia = (fecha) => {
    const iso = isoDate(fecha)
    return firmas.filter(f => f.fecha_firma === iso)
  }

  const totalSemana = diasSemana.reduce((acc, d) => acc + firmasPorDia(d.fecha).length, 0)

  const rango = `${fmtFecha(semana)} – ${fmtFecha(addDays(semana, 6))}, ${semana.getFullYear()}`

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{ background: 'var(--navy-dark)', borderBottom: '2px solid var(--gold)', padding: '0 1.75rem', height: '64px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={() => navigate('/trabajos')}
          style={{ background: 'transparent', border: 'none', color: 'var(--gold)', fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '0 4px', transition: 'transform 0.15s', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-3px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
        >←</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: '500', color: '#fff' }}>
            Calendario de Firmas
          </span>
          {!loading && totalSemana > 0 && (
            <span style={{ fontSize: '10px', fontWeight: '700', background: 'var(--gold)', color: 'var(--navy-dark)', borderRadius: '99px', padding: '2px 8px', letterSpacing: '0.06em' }}>
              {totalSemana} esta semana
            </span>
          )}
        </div>

        {/* Navegación de semana */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button onClick={semanaAnterior} style={{ background: 'rgba(197,169,106,0.15)', border: '1px solid rgba(197,169,106,0.35)', borderRadius: '4px', color: 'var(--gold)', fontSize: '14px', fontWeight: '600', padding: '5px 10px', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(197,169,106,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(197,169,106,0.15)'}
          >‹</button>
          <button onClick={hoy} style={{ background: 'rgba(197,169,106,0.15)', border: '1px solid rgba(197,169,106,0.35)', borderRadius: '4px', color: 'var(--gold)', fontSize: '11px', fontWeight: '600', padding: '5px 10px', cursor: 'pointer', letterSpacing: '0.06em', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(197,169,106,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(197,169,106,0.15)'}
          >Hoy</button>
          <button onClick={semanaSiguiente} style={{ background: 'rgba(197,169,106,0.15)', border: '1px solid rgba(197,169,106,0.35)', borderRadius: '4px', color: 'var(--gold)', fontSize: '14px', fontWeight: '600', padding: '5px 10px', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(197,169,106,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(197,169,106,0.15)'}
          >›</button>
        </div>
      </header>

      {/* Rango de semana */}
      <div style={{ background: 'var(--navy)', borderBottom: '1px solid rgba(197,169,106,0.2)', padding: '10px 1.75rem' }}>
        <span style={{ fontSize: '12px', fontWeight: '500', color: 'rgba(197,169,106,0.8)', letterSpacing: '0.06em' }}>
          Semana del {rango}
        </span>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {DIAS.map(d => <div key={d} style={{ height: '300px', borderRadius: '6px' }} className="skeleton" />)}
        </div>
      ) : (
        <div style={{ padding: '1.25rem 1.75rem', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))', gap: '8px', minWidth: '700px' }}>
            {diasSemana.map(({ nombre, fecha }) => {
              const firmasDelDia = firmasPorDia(fecha)
              const hoyFlag = esHoy(fecha)
              return (
                <div key={nombre} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* Encabezado del día */}
                  <div style={{
                    textAlign: 'center', padding: '8px 6px',
                    borderRadius: '6px',
                    background: hoyFlag ? 'var(--gold)' : 'var(--card)',
                    border: `1px solid ${hoyFlag ? 'var(--gold)' : 'var(--border)'}`,
                    boxShadow: hoyFlag ? '0 2px 8px rgba(197,169,106,0.3)' : 'var(--shadow-sm)',
                  }}>
                    <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: hoyFlag ? 'var(--navy-dark)' : 'var(--text-light)', marginBottom: '2px' }}>
                      {nombre}
                    </p>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: '600', color: hoyFlag ? 'var(--navy-dark)' : 'var(--navy-dark)', lineHeight: 1 }}>
                      {fecha.getDate()}
                    </p>
                    <p style={{ fontSize: '10px', color: hoyFlag ? 'rgba(20,40,69,0.6)' : 'var(--text-light)' }}>
                      {MESES[fecha.getMonth()]}
                    </p>
                  </div>

                  {/* Firmas del día */}
                  {firmasDelDia.length === 0 ? (
                    <div style={{ flex: 1, minHeight: '80px', border: '1px dashed rgba(184,196,208,0.35)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>—</span>
                    </div>
                  ) : (
                    firmasDelDia.map(f => (
                      <div
                        key={f.id}
                        onClick={() => navigate(`/trabajos/${f.trabajo_id}`)}
                        style={{ background: 'var(--card)', border: '1px solid var(--gold-border)', borderLeft: '3px solid var(--gold)', borderRadius: '6px', padding: '8px 10px', cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s', boxShadow: 'var(--shadow-sm)' }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)' }}
                      >
                        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '13px', fontWeight: '500', color: 'var(--navy-dark)', lineHeight: 1.3, marginBottom: '4px' }}>
                          {f.trabajos?.cliente || '—'}
                        </p>
                        {f.trabajos?.asunto && (
                          <p style={{ fontSize: '10px', color: 'var(--gold)', fontWeight: '600', marginBottom: '3px' }}>
                            {f.trabajos.asunto}
                          </p>
                        )}
                        {f.trabajos?.empleados?.nombre && (
                          <p style={{ fontSize: '10px', color: 'var(--text-light)' }}>
                            {f.trabajos.empleados.nombre}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Estado vacío total */}
      {!loading && firmas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-light)', fontSize: '13px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>📅</div>
          <p>No hay firmas registradas aún.</p>
          <p style={{ marginTop: '6px', fontSize: '11px' }}>Las firmas aparecen aquí cuando se marca el paso "Firma" como completado y se captura la fecha.</p>
        </div>
      )}
    </div>
  )
}
