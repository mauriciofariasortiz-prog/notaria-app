import { useEffect, useState, useMemo, useRef } from 'react'
import { supabase } from '../supabase'
import { useNavigate, useParams } from 'react-router-dom'
import { Clock, CheckCircle2, ListTodo } from 'lucide-react'
import * as XLSX from 'xlsx'
import Spinner from '../components/Spinner'

const ADMIN_EMAIL = 'mauriciofariasortiz@gmail.com'

function initiales(nombre = '') {
  const parts = nombre.trim().split(' ').filter(Boolean)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  const first = parts[0][0].toUpperCase()
  const last  = parts[parts.length - 1].toUpperCase()
  return last.length <= 3 ? first + last : first + last[0]
}

/* ── Tab bar ── */
function TabBar({ active, onChange, counts }) {
  const tabs = [
    { key: 'en_proceso',  label: 'En proceso',  count: counts.en_proceso  },
    { key: 'completados', label: 'Completados', count: counts.completados  },
    { key: 'pendientes',  label: 'Pendientes',  count: counts.pendientes   },
  ]
  return (
    <div style={{ background: 'var(--navy-dark)', borderBottom: '2px solid var(--gold)', padding: '0 1.75rem', display: 'flex', gap: '0' }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '13px 18px 11px',
          fontSize: '11px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase',
          color: active === t.key ? '#ffffff' : 'rgba(184,192,204,0.55)',
          borderBottom: active === t.key ? '2px solid var(--gold)' : '2px solid transparent',
          marginBottom: '-2px', display: 'flex', alignItems: 'center', gap: '7px',
          transition: 'color 0.15s',
        }}>
          {t.label}
          {t.count > 0 && (
            <span style={{ fontSize: '9px', fontWeight: '700', background: active === t.key ? 'rgba(184,192,204,0.25)' : 'rgba(184,192,204,0.12)', color: active === t.key ? '#B8C0CC' : 'rgba(184,192,204,0.5)', borderRadius: '99px', padding: '1px 6px', minWidth: '16px', textAlign: 'center' }}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ── SectionLabel ── */
function SectionLabel({ children, count, icon: Icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
      <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--navy-dark)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.75 }}>
        {Icon && <Icon size={12} strokeWidth={2.5} />}
        {children}
      </span>
      {count !== undefined && (
        <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-light)', background: 'var(--silver-light)', borderRadius: '99px', padding: '1px 8px', border: '1px solid var(--border)' }}>{count}</span>
      )}
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
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
    color = '#B07D2A'; bg = 'rgba(184,192,204,0.15)'; border = 'rgba(184,192,204,0.45)'
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
    <div className="work-card" onClick={onClick} style={{
      opacity: isDragging ? 0.4 : esCompleto ? 0.75 : 1,
      transform: isDragOver ? 'scaleX(1.01)' : 'none',
      border: isDragOver ? '1px solid var(--gold)' : undefined,
      transition: 'opacity 0.15s, transform 0.15s, border-color 0.15s', cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: '500', color: 'var(--navy-dark)', marginBottom: '4px', lineHeight: 1.2 }}>
            {[t.asunto, t.cliente].filter(Boolean).join(' · ') || t.cliente}
          </p>
          {(t.numero_escritura || t.numero_instrumento) && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
              {t.numero_escritura && <span style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: '600' }}>Folio: {t.numero_escritura}</span>}
              {t.numero_instrumento && <span style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: '600' }}>Instrumento: {t.numero_instrumento}</span>}
            </div>
          )}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {t.fecha_ingreso && <p style={{ fontSize: '11px', color: 'var(--text-light)' }}>Ingreso: {new Date(t.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-MX')}</p>}
            {t.fecha_limite && fechaLimiteBadge(t.fecha_limite)}
          </div>
        </div>
        {esCompleto ? (
          <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '99px', background: 'rgba(45,122,79,0.09)', color: '#2d7a4f', border: '1px solid rgba(45,122,79,0.22)', flexShrink: 0, marginTop: '2px' }}>Completado</span>
        ) : (
          <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '99px', background: 'rgba(184,192,204,0.13)', color: '#B07D2A', border: '1px solid rgba(184,192,204,0.38)', flexShrink: 0, marginTop: '2px' }}>En proceso</span>
        )}
      </div>
    </div>
  )
}

function DraggableList({ items, onNavigate, onReorder }) {
  const dragId = useRef(null)
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)

  const handleDragStart = (id) => { dragId.current = id; setDraggingId(id) }
  const handleDragOver  = (e, id) => { e.preventDefault(); if (dragId.current !== id) setDragOverId(id) }
  const handleDrop = (targetId) => {
    const fromId = dragId.current
    if (!fromId || fromId === targetId) return
    const arr = [...items]
    const fromIdx = arr.findIndex(t => t.id === fromId)
    const toIdx   = arr.findIndex(t => t.id === targetId)
    const [moved] = arr.splice(fromIdx, 1)
    arr.splice(toIdx, 0, moved)
    onReorder(arr)
  }
  const handleDragEnd = () => { dragId.current = null; setDraggingId(null); setDragOverId(null) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((t) => (
        <div key={t.id} draggable
          onDragStart={() => handleDragStart(t.id)}
          onDragOver={e => handleDragOver(e, t.id)}
          onDrop={() => { handleDrop(t.id); handleDragEnd() }}
          onDragEnd={handleDragEnd}
          style={{ display: 'flex', alignItems: 'stretch' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px 0 4px', color: 'var(--text-light)', fontSize: '14px', cursor: 'grab', flexShrink: 0, userSelect: 'none' }} title="Arrastra para reordenar">⠿</div>
          <div style={{ flex: 1 }}>
            <TrabajoCard t={t} onClick={() => onNavigate(t.id)} isDragging={draggingId === t.id} isDragOver={dragOverId === t.id} />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Comentarios de un pendiente ── */
function ComentariosPendiente({ pendienteId, autor }) {
  const [comentarios, setComentarios] = useState([])
  const [texto, setTexto] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { cargar() }, [pendienteId])

  const cargar = async () => {
    const { data } = await supabase.from('comentarios_pendientes').select('*').eq('pendiente_id', pendienteId).order('created_at', { ascending: true })
    setComentarios(data || [])
  }

  const agregar = async () => {
    if (!texto.trim()) return
    setGuardando(true)
    await supabase.from('comentarios_pendientes').insert([{ pendiente_id: pendienteId, texto: texto.trim(), autor }])
    setTexto('')
    await cargar()
    setGuardando(false)
  }

  const fmt = ts => new Date(ts).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
      <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '8px' }}>Comentarios</p>
      {comentarios.length === 0 && <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '8px' }}>Sin comentarios.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
        {comentarios.map(c => (
          <div key={c.id} style={{ background: 'var(--silver-light)', borderRadius: '6px', padding: '7px 10px' }}>
            <p style={{ fontSize: '12px', color: 'var(--navy-dark)', marginBottom: '2px' }}>{c.texto}</p>
            <p style={{ fontSize: '10px', color: 'var(--text-light)' }}>{c.autor} · {fmt(c.created_at)}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <input value={texto} onChange={e => setTexto(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); agregar() } }}
          placeholder="Escribe un comentario..."
          style={{ flex: 1, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: '5px', fontSize: '12px', fontFamily: 'inherit', outline: 'none', background: 'var(--card)' }} />
        <button onClick={agregar} disabled={guardando || !texto.trim()} className="btn-gold" style={{ padding: '7px 14px', fontSize: '11px' }}>Enviar</button>
      </div>
    </div>
  )
}

/* ── Tarjeta de pendiente ── */
function PendienteCard({ p, onCompletar, autor }) {
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: 'var(--card)', border: `1px solid ${hovered ? 'rgba(44,82,130,0.25)' : 'var(--border)'}`, borderLeft: '3px solid var(--gold)', borderRadius: '8px', padding: '14px 16px', transition: 'border-color 0.18s, box-shadow 0.18s', boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '17px', fontWeight: '500', color: 'var(--navy-dark)', marginBottom: '2px', lineHeight: 1.3 }}>{p.titulo}</p>
          {p.descripcion && <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{p.descripcion}</p>}
          <p style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '4px' }}>
            {new Date(p.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button onClick={() => setExpanded(x => !x)}
            style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', color: 'var(--text-light)', cursor: 'pointer' }}>
            {expanded ? 'Ocultar' : 'Notas'}
          </button>
          <button onClick={() => onCompletar(p.id)}
            style={{ background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.3)', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: '600', color: '#2d7a4f', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(45,122,79,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(45,122,79,0.08)'}
          >✓ Hecho</button>
        </div>
      </div>
      {expanded && <ComentariosPendiente pendienteId={p.id} autor={autor} />}
    </div>
  )
}

/* ── Tab: Pendientes ── */
function TabPendientes({ empleadoId, userNombre, showForm, setShowForm }) {
  const [pendientes, setPendientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { cargar() }, [empleadoId])

  const cargar = async () => {
    const { data } = await supabase.from('pendientes').select('*').eq('empleado_id', empleadoId).order('created_at', { ascending: false })
    setPendientes(data || [])
    setLoading(false)
  }

  const agregar = async (e) => {
    e.preventDefault()
    if (!titulo.trim()) return
    setGuardando(true)
    const { data } = await supabase.from('pendientes').insert([{ empleado_id: empleadoId, titulo: titulo.trim(), descripcion: descripcion.trim() || null }]).select().single()
    if (data) setPendientes(prev => [data, ...prev])
    setTitulo(''); setDescripcion(''); setShowForm(false); setGuardando(false)
  }

  const completar = async (id) => {
    await supabase.from('pendientes').delete().eq('id', id)
    setPendientes(prev => prev.filter(p => p.id !== id))
  }

  if (loading) return <Spinner text="Cargando pendientes..." />

  return (
    <div>
      {/* Formulario inline */}
      {showForm && (
        <form onSubmit={agregar} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.25rem', marginBottom: '20px', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', fontWeight: '500', color: 'var(--navy-dark)', margin: 0 }}>Nuevo pendiente</p>
          <input autoFocus value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título..." required className="field-input" />
          <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción (opcional)..." rows={2} className="field-input" style={{ resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setShowForm(false); setTitulo(''); setDescripcion('') }} className="btn-ghost-dark">Cancelar</button>
            <button type="submit" disabled={guardando || !titulo.trim()} className="btn-gold" style={{ padding: '9px 22px' }}>Agregar</button>
          </div>
        </form>
      )}

      {pendientes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)', fontSize: '13px' }}>
          No hay recordatorios pendientes.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {pendientes.map(p => (
            <PendienteCard key={p.id} p={p} onCompletar={completar} autor={userNombre} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Componente principal ── */
export default function EmpleadoTrabajos() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('en_proceso')
  const [empleado,    setEmpleado]    = useState(null)
  const [enProceso,   setEnProceso]   = useState([])
  const [completados, setCompletados] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [userEmail,   setUserEmail]   = useState('')
  const [userNombre,  setUserNombre]  = useState('')
  const [pendientesCount, setPendientesCount] = useState(0)
  const [descargando, setDescargando] = useState(false)
  const [limpiando,   setLimpiando]   = useState(false)
  const [showPendienteForm, setShowPendienteForm] = useState(false)

  // Filtros — aplican solo en "En proceso"
  const [busqueda,         setBusqueda]         = useState('')
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')

  useEffect(() => { cargar() }, [id])

  const cargar = async () => {
    const [{ data: emp }, { data: jobs }, { data: { user } }, { data: pends }] = await Promise.all([
      supabase.from('empleados').select('id, nombre').eq('id', id).single(),
      supabase.from('trabajos').select('*').eq('encargado_id', id).order('orden', { ascending: true }),
      supabase.auth.getUser(),
      supabase.from('pendientes').select('id').eq('empleado_id', id),
    ])

    setEmpleado(emp)
    setPendientesCount((pends || []).length)

    if (user) {
      setUserEmail(user.email || '')
      const { data: empUser } = await supabase.from('empleados').select('nombre').eq('user_id', user.id).single()
      setUserNombre(empUser?.nombre || user.email?.split('@')[0] || 'Usuario')
    }

    if (jobs && jobs.length > 0) {
      const { data: items } = await supabase.from('checklist').select('trabajo_id, estado').in('trabajo_id', jobs.map(j => j.id))
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
        return { ...j, prog: p, esCompleto: p.total > 0 && p.pendientes === 0 }
      })
      setEnProceso(enriquecidos.filter(t => !t.esCompleto))
      setCompletados(enriquecidos.filter(t => t.esCompleto))
    } else {
      setEnProceso([]); setCompletados([])
    }

    setLoading(false)
  }

  const guardarOrden = async (newEP, newC) => {
    const all = [...newEP, ...newC]
    await Promise.all(all.map((t, i) => supabase.from('trabajos').update({ orden: i }).eq('id', t.id)))
  }
  const handleReorderEnProceso  = (items) => { setEnProceso(items);  guardarOrden(items, completados) }
  const handleReorderCompletados = (items) => { setCompletados(items); guardarOrden(enProceso, items) }

  /* ── Filtros "En proceso" ── */
  const enProcesoFiltrado = useMemo(() => enProceso.filter(t => {
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      if (!t.cliente?.toLowerCase().includes(q) && !t.asunto?.toLowerCase().includes(q)) return false
    }
    if (filtroFechaDesde && t.fecha_ingreso < filtroFechaDesde) return false
    if (filtroFechaHasta && t.fecha_ingreso > filtroFechaHasta) return false
    return true
  }), [enProceso, busqueda, filtroFechaDesde, filtroFechaHasta])

  const hayFiltro = busqueda || filtroFechaDesde || filtroFechaHasta
  const limpiarFiltros = () => { setBusqueda(''); setFiltroFechaDesde(''); setFiltroFechaHasta('') }

  /* ── Excel completados del mes ── */
  const mesActual = () => {
    const ahora = new Date()
    return completados.filter(t => {
      if (!t.ultima_actividad) return false
      const d = new Date(t.ultima_actividad)
      return d.getFullYear() === ahora.getFullYear() && d.getMonth() === ahora.getMonth()
    })
  }

  const descargarExcel = async () => {
    setDescargando(true)
    const del_mes = mesActual()
    if (del_mes.length === 0) { alert('No hay trabajos completados este mes.'); setDescargando(false); return }
    const fmt = v => v ? new Date(v + 'T00:00:00').toLocaleDateString('es-MX') : ''
    const fmtTs = v => v ? new Date(v).toLocaleDateString('es-MX') : ''
    const ws = XLSX.utils.json_to_sheet(del_mes.map(t => ({
      'Cliente':              t.cliente || '',
      'Asunto':               t.asunto || '',
      'Tipo instrumento':     t.numero_escritura || '',
      'Número de instrumento':t.numero_instrumento || '',
      'Fecha de ingreso':     fmt(t.fecha_ingreso),
      'Fecha de completado':  fmtTs(t.ultima_actividad),
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Completados')
    const mes = new Date().toLocaleString('es-MX', { month: 'long', year: 'numeric' }).replace(' ', '-')
    XLSX.writeFile(wb, `completados-${empleado?.nombre?.replace(/ /g, '-').toLowerCase()}-${mes}.xlsx`)
    setDescargando(false)
  }

  const limpiarMes = async () => {
    const del_mes = mesActual()
    if (del_mes.length === 0) { alert('No hay trabajos completados este mes.'); return }
    const mes = new Date().toLocaleString('es-MX', { month: 'long', year: 'numeric' })
    if (!window.confirm(`¿Eliminar ${del_mes.length} trabajo${del_mes.length !== 1 ? 's' : ''} completados de ${mes}? Esta acción no se puede deshacer.`)) return
    setLimpiando(true)
    await supabase.from('trabajos').delete().in('id', del_mes.map(t => t.id))
    setCompletados(prev => prev.filter(t => !del_mes.find(d => d.id === t.id)))
    setLimpiando(false)
  }

  const total = enProceso.length + completados.length
  const inputStyle = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '5px', padding: '7px 10px', fontSize: '12px', color: 'var(--navy-dark)', outline: 'none', fontFamily: 'inherit' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{ background: 'var(--navy-dark)', padding: '0 1.75rem', height: '64px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button onClick={() => navigate('/trabajos')}
          style={{ background: 'transparent', border: 'none', color: 'var(--gold)', fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '0 4px', transition: 'transform 0.15s', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-3px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
        >←</button>

        {!loading && empleado && (
          <>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#3A6298', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: 15, fontWeight: '600', color: '#B8C0CC', flexShrink: 0 }}>
              {initiales(empleado.nombre)}
            </div>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: '500', color: '#ffffff', lineHeight: 1.1 }}>{empleado.nombre}</div>
              <div style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '2px' }}>{total} {total === 1 ? 'trabajo' : 'trabajos'}</div>
            </div>
          </>
        )}
        <div style={{ marginLeft: 'auto' }}>
          {tab === 'pendientes' ? (
            <button className="btn-gold"
              onClick={() => setShowPendienteForm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '7px' }}
            >
              <span style={{ fontSize: '16px', lineHeight: 1, fontWeight: '400' }}>+</span>
              Nuevo pendiente
            </button>
          ) : (
            <button className="btn-gold" onClick={() => navigate(`/trabajos/nuevo?empleado=${id}`)}>+ Nuevo trabajo</button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <TabBar
        active={tab}
        onChange={t => { setTab(t); setShowPendienteForm(false) }}
        counts={{ en_proceso: enProceso.length, completados: completados.length, pendientes: pendientesCount }}
      />

      <main className="anim-page-enter" style={{ padding: '1.75rem', maxWidth: '880px', margin: '0 auto' }}>

        {loading ? (
          <Spinner text="Cargando..." />
        ) : tab === 'en_proceso' ? (
          <>
            {/* Barra de búsqueda */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'rgba(184,192,204,0.8)', pointerEvents: 'none' }}>🔍</span>
                <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar por cliente o asunto..."
                  style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px 11px 40px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '13px', color: 'var(--text)', background: '#FAFBFC', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.18s' }}
                  onFocus={e => e.target.style.borderColor = 'var(--navy-dark)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>Ingreso desde</span>
                  <input type="date" value={filtroFechaDesde} onChange={e => setFiltroFechaDesde(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-light)', whiteSpace: 'nowrap' }}>hasta</span>
                  <input type="date" value={filtroFechaHasta} onChange={e => setFiltroFechaHasta(e.target.value)} style={inputStyle} />
                </div>
                {hayFiltro && <button onClick={limpiarFiltros} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '5px', padding: '6px 10px', fontSize: '11px', color: 'var(--text-light)', cursor: 'pointer' }}>Limpiar</button>}
              </div>
              {hayFiltro && <p style={{ fontSize: '11px', color: 'var(--text-light)', margin: 0 }}>Mostrando {enProcesoFiltrado.length} de {enProceso.length} trabajos</p>}
            </div>

            {enProceso.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)', fontSize: '13px' }}>No hay trabajos en proceso.</div>
            ) : enProcesoFiltrado.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)', fontSize: '13px' }}>No hay resultados para esos filtros.</div>
            ) : hayFiltro ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {enProcesoFiltrado.map(t => <TrabajoCard key={t.id} t={t} onClick={() => navigate(`/trabajos/${t.id}`)} />)}
              </div>
            ) : (
              <DraggableList items={enProceso} onNavigate={empId => navigate(`/trabajos/${empId}`)} onReorder={handleReorderEnProceso} />
            )}
          </>

        ) : tab === 'completados' ? (
          <>
            {/* Acciones del mes — solo admin */}
            {userEmail === ADMIN_EMAIL && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button onClick={descargarExcel} disabled={descargando}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 14px', fontSize: '11px', fontWeight: '600', color: 'var(--navy-dark)', cursor: descargando ? 'wait' : 'pointer', transition: 'background 0.15s, box-shadow 0.15s', boxShadow: 'var(--shadow-sm)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--silver-light)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--card)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
                >⬇ Excel del mes</button>
                <button onClick={limpiarMes} disabled={limpiando}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(192,57,43,0.07)', border: '1px solid rgba(192,57,43,0.25)', borderRadius: '6px', padding: '8px 14px', fontSize: '11px', fontWeight: '600', color: '#c0392b', cursor: limpiando ? 'wait' : 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,57,43,0.13)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(192,57,43,0.07)'}
                >🗑 Limpiar mes</button>
              </div>
            )}

            {completados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)', fontSize: '13px' }}>No hay trabajos completados.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {completados.map(t => <TrabajoCard key={t.id} t={t} onClick={() => navigate(`/trabajos/${t.id}`)} />)}
              </div>
            )}
          </>

        ) : (
          <TabPendientes empleadoId={id} userNombre={userNombre} showForm={showPendienteForm} setShowForm={setShowPendienteForm} />
        )}
      </main>
    </div>
  )
}
