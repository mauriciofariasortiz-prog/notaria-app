import { useEffect, useState, useMemo, useRef } from 'react'
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
      <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap' }}>{children}</span>
      {count !== undefined && (
        <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-light)', background: 'var(--silver-light)', borderRadius: '99px', padding: '1px 8px', border: '1px solid var(--border)' }}>{count}</span>
      )}
      <div style={{ flex: 1, height: '1px', background: 'var(--gold-border)' }} />
    </div>
  )
}

function fechaLimiteBadge(fecha_limite) {
  if (!fecha_limite) return null
  const hoy = new Date(); hoy.setHours(0,0,0,0)
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
  return <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '99px', background: bg, color, border: `1px solid ${border}`, whiteSpace: 'nowrap' }}>{texto}</span>
}

function TrabajoCard({ t, onClick, isDragging, isDragOver }) {
  const prog = t.prog
  const porcentaje = prog && prog.aplicables > 0 ? Math.round((prog.hechos / prog.aplicables) * 100) : null
  const esCompleto = t.esCompleto

  return (
    <div
      className={`work-card`}
      onClick={onClick}
      style={{
        opacity: isDragging ? 0.4 : esCompleto ? 0.75 : 1,
        transform: isDragOver ? 'scaleX(1.01)' : 'none',
        border: isDragOver ? '1px solid var(--gold)' : undefined,
        transition: 'opacity 0.15s, transform 0.15s, border-color 0.15s',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: '500', color: 'var(--navy-dark)', marginBottom: '4px', lineHeight: 1.2 }}>
            {[t.asunto, t.cliente].filter(Boolean).join(' · ') || t.cliente}
          </p>

          {/* Folio e instrumento */}
          {(t.numero_escritura || t.numero_instrumento) && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
              {t.numero_escritura && (
                <span style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: '600' }}>Folio: {t.numero_escritura}</span>
              )}
              {t.numero_instrumento && (
                <span style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: '600' }}>Instrumento: {t.numero_instrumento}</span>
              )}
            </div>
          )}

          {/* Progreso */}
          {prog && prog.total > 0 && (
            <div style={{ marginBottom: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <div style={{ flex: 1, height: '4px', background: 'rgba(184,196,208,0.3)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '4px', borderRadius: '99px', width: `${porcentaje}%`, background: esCompleto ? '#2d7a4f' : 'linear-gradient(90deg, var(--navy), var(--gold))', transition: 'width 0.4s ease' }} />
                </div>
                <span style={{ fontSize: '10px', fontWeight: '600', color: esCompleto ? '#2d7a4f' : 'var(--amber)', flexShrink: 0 }}>{porcentaje}%</span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-light)' }}>{prog.hechos} de {prog.aplicables} pasos completados</p>
            </div>
          )}

          {/* Fechas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {t.fecha_ingreso && (
              <p style={{ fontSize: '11px', color: 'var(--text-light)' }}>Ingreso: {new Date(t.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-MX')}</p>
            )}
            {t.fecha_limite && fechaLimiteBadge(t.fecha_limite)}
          </div>
        </div>

        {/* Badge estado */}
        {esCompleto ? (
          <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '99px', background: 'rgba(45,122,79,0.09)', color: '#2d7a4f', border: '1px solid rgba(45,122,79,0.22)', flexShrink: 0, marginTop: '2px' }}>Completado</span>
        ) : (
          <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '99px', background: 'rgba(197,169,106,0.13)', color: '#B07D2A', border: '1px solid rgba(197,169,106,0.38)', flexShrink: 0, marginTop: '2px' }}>En proceso</span>
        )}
      </div>
    </div>
  )
}

/* ── Lista con drag & drop ── */
function DraggableList({ items, onNavigate, onReorder }) {
  const dragId   = useRef(null)
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)

  const handleDragStart = (id) => { dragId.current = id; setDraggingId(id) }
  const handleDragOver  = (e, id) => { e.preventDefault(); if (dragId.current !== id) setDragOverId(id) }
  const handleDrop = (targetId) => {
    const fromId = dragId.current
    if (!fromId || fromId === targetId) return
    const arr     = [...items]
    const fromIdx = arr.findIndex(t => t.id === fromId)
    const toIdx   = arr.findIndex(t => t.id === targetId)
    const [moved] = arr.splice(fromIdx, 1)
    arr.splice(toIdx, 0, moved)
    onReorder(arr)
  }
  const handleDragEnd = () => { dragId.current = null; setDraggingId(null); setDragOverId(null) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((t, i) => (
        <div
          key={t.id}
          draggable
          onDragStart={() => handleDragStart(t.id)}
          onDragOver={e => handleDragOver(e, t.id)}
          onDrop={() => { handleDrop(t.id); handleDragEnd() }}
          onDragEnd={handleDragEnd}
          style={{ display: 'flex', alignItems: 'stretch', gap: '0' }}
        >
          {/* Grip handle */}
          <div
            style={{ display: 'flex', alignItems: 'center', padding: '0 8px 0 4px', color: 'var(--text-light)', fontSize: '14px', cursor: 'grab', flexShrink: 0, userSelect: 'none' }}
            title="Arrastra para reordenar"
          >⠿</div>
          <div style={{ flex: 1 }}>
            <TrabajoCard
              t={t}
              index={i}
              onClick={() => onNavigate(t.id)}
              isDragging={draggingId === t.id}
              isDragOver={dragOverId === t.id}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function EmpleadoTrabajos() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [empleado,    setEmpleado]    = useState(null)
  const [enProceso,   setEnProceso]   = useState([])
  const [completados, setCompletados] = useState([])
  const [loading,     setLoading]     = useState(true)

  // Filtros
  const [busqueda,        setBusqueda]        = useState('')
  const [filtroEstado,    setFiltroEstado]    = useState('todos')
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')

  useEffect(() => { cargar() }, [id])

  const cargar = async () => {
    const [{ data: emp }, { data: jobs }] = await Promise.all([
      supabase.from('empleados').select('id, nombre').eq('id', id).single(),
      supabase.from('trabajos')
        .select('*')
        .eq('encargado_id', id)
        .order('orden', { ascending: true }),
    ])

    setEmpleado(emp)

    if (jobs && jobs.length > 0) {
      const ids = jobs.map(j => j.id)
      const { data: items } = await supabase.from('checklist').select('trabajo_id, estado').in('trabajo_id', ids)

      const prog = {}
      ;(items || []).forEach(item => {
        if (!prog[item.trabajo_id]) prog[item.trabajo_id] = { total: 0, aplicables: 0, hechos: 0, pendientes: 0 }
        prog[item.trabajo_id].total++
        if (item.estado !== 'no_aplica') prog[item.trabajo_id].aplicables++
        if (item.estado === 'hecho')     prog[item.trabajo_id].hechos++
        if (item.estado === 'pendiente') prog[item.trabajo_id].pendientes++
      })

      const enriquecidos = jobs.map(j => {
        const p = prog[j.id] || { total: 0, aplicables: 0, hechos: 0, pendientes: 0 }
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

  /* ── Guardar nuevo orden en Supabase ── */
  const guardarOrden = async (newEnProceso, newCompletados) => {
    const all = [...newEnProceso, ...newCompletados]
    await Promise.all(all.map((t, i) => supabase.from('trabajos').update({ orden: i }).eq('id', t.id)))
  }

  const handleReorderEnProceso = (newItems) => {
    setEnProceso(newItems)
    guardarOrden(newItems, completados)
  }

  const handleReorderCompletados = (newItems) => {
    setCompletados(newItems)
    guardarOrden(enProceso, newItems)
  }

  /* ── Filtros ── */
  const filtrar = (lista) => lista.filter(t => {
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      if (!t.cliente?.toLowerCase().includes(q) && !t.asunto?.toLowerCase().includes(q)) return false
    }
    if (filtroFechaDesde && t.fecha_ingreso < filtroFechaDesde) return false
    if (filtroFechaHasta && t.fecha_ingreso > filtroFechaHasta) return false
    return true
  })

  const enProcesoFiltrado  = filtroEstado === 'completado' ? [] : filtrar(enProceso)
  const completadosFiltrado = filtroEstado === 'en_proceso' ? [] : filtrar(completados)

  const total = enProceso.length + completados.length
  const hayFiltros = busqueda || filtroEstado !== 'todos' || filtroFechaDesde || filtroFechaHasta
  const hayFiltroActivo = hayFiltros
  const totalFiltrado = enProcesoFiltrado.length + completadosFiltrado.length

  const limpiarFiltros = () => { setBusqueda(''); setFiltroEstado('todos'); setFiltroFechaDesde(''); setFiltroFechaHasta('') }

  const inputStyle = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '7px 10px', fontSize: '12px', color: 'var(--navy-dark)', outline: 'none', fontFamily: 'inherit' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{ background: 'var(--navy-dark)', borderBottom: '2px solid var(--gold)', padding: '0 1.75rem', height: '64px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button onClick={() => navigate('/trabajos')}
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
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: '500', color: '#ffffff', lineHeight: 1.1 }}>{empleado.nombre}</div>
              <div style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '2px' }}>{total} {total === 1 ? 'trabajo' : 'trabajos'}</div>
            </div>
          </>
        )}

        <div style={{ marginLeft: 'auto' }}>
          <button className="btn-gold" onClick={() => navigate(`/trabajos/nuevo?empleado=${id}`)}>+ Nuevo trabajo</button>
        </div>
      </header>

      <main style={{ padding: '1.75rem', maxWidth: '880px', margin: '0 auto' }}>

        {/* Búsqueda y filtros */}
        {!loading && total > 0 && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: 'rgba(197,169,106,0.8)', pointerEvents: 'none', lineHeight: 1 }}>🔍</span>
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por cliente, asunto o folio..."
                style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px 14px 46px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '14px', color: 'var(--text)', background: '#FAFBFC', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.18s' }}
                onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
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
              {hayFiltroActivo && (
                <button onClick={limpiarFiltros} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '5px', padding: '6px 10px', fontSize: '11px', color: 'var(--text-light)', cursor: 'pointer', whiteSpace: 'nowrap' }}>Limpiar filtros</button>
              )}
            </div>
            {hayFiltroActivo && (
              <p style={{ fontSize: '11px', color: 'var(--text-light)', margin: 0 }}>Mostrando {totalFiltrado} de {total} trabajos</p>
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
        ) : totalFiltrado === 0 ? (
          <div className="anim-fade-up" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)', fontSize: '13px' }}>
            No se encontraron trabajos con esos filtros.
          </div>
        ) : (
          <>
            {enProcesoFiltrado.length > 0 && (
              <div style={{ marginBottom: '2rem' }} className="anim-fade-in">
                <SectionLabel count={enProcesoFiltrado.length}>En proceso</SectionLabel>
                {hayFiltroActivo ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {enProcesoFiltrado.map((t, i) => (
                      <TrabajoCard key={t.id} t={t} index={i} onClick={() => navigate(`/trabajos/${t.id}`)} />
                    ))}
                  </div>
                ) : (
                  <DraggableList items={enProceso} onNavigate={id => navigate(`/trabajos/${id}`)} onReorder={handleReorderEnProceso} />
                )}
              </div>
            )}

            {completadosFiltrado.length > 0 && (
              <div className="anim-fade-in">
                <SectionLabel count={completadosFiltrado.length}>Completados</SectionLabel>
                {hayFiltroActivo ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {completadosFiltrado.map((t, i) => (
                      <TrabajoCard key={t.id} t={t} index={i} onClick={() => navigate(`/trabajos/${t.id}`)} />
                    ))}
                  </div>
                ) : (
                  <DraggableList items={completados} onNavigate={id => navigate(`/trabajos/${id}`)} onReorder={handleReorderCompletados} />
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
