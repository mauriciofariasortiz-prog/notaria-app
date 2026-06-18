import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase'
import { useNavigate, useParams } from 'react-router-dom'
import { ASUNTOS } from '../asuntoPasos'

const ESTADO_CFG = {
  hecho:     { icon: '✓', label: 'Hecho',     color: '#2d7a4f', bg: 'rgba(45,122,79,0.07)',   border: 'rgba(45,122,79,0.2)'   },
  no_aplica: { icon: '/',  label: 'No aplica', color: '#9BA8B6', bg: 'rgba(184,196,208,0.1)', border: 'rgba(184,196,208,0.3)' },
  pendiente: { icon: '○',  label: 'Pendiente', color: '#B07D2A', bg: '#ffffff',                border: 'rgba(184,196,208,0.5)' },
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
      <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap' }}>{children}</span>
      <div style={{ flex: 1, height: '1px', background: 'var(--gold-border)' }} />
    </div>
  )
}
function FL({ children }) {
  return <p style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '3px' }}>{children}</p>
}
function FV({ children }) {
  return <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '15px', color: 'var(--navy-dark)' }}>{children || '—'}</p>
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
    texto = `Entrega: ${limite.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`
  }
  return <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '99px', background: bg, color, border: `1px solid ${border}` }}>{texto}</span>
}

/* ── Parsear "EP 4521" / "AFP 123" → { tipo, numero } ── */
function parseEscritura(val) {
  if (!val) return { tipo: 'EP', numero: '' }
  if (val.startsWith('AFP ')) return { tipo: 'AFP', numero: val.slice(4) }
  if (val.startsWith('EP '))  return { tipo: 'EP',  numero: val.slice(3) }
  return { tipo: 'EP', numero: val }
}

/* ── Modal edición ── */
function EditModal({ trabajo, empleados, onClose, onSave }) {
  const escrituraInit = parseEscritura(trabajo.numero_escritura)
  const asuntoEnLista = ASUNTOS.includes(trabajo.asunto)

  const [form, setForm] = useState({
    cliente:            trabajo.cliente            || '',
    asunto:             asuntoEnLista ? (trabajo.asunto || '') : 'Otro',
    fecha_ingreso:      trabajo.fecha_ingreso      || '',
    descripcion:        trabajo.descripcion        || '',
    encargado_id:       trabajo.encargado_id       || '',
    numero_instrumento: trabajo.numero_instrumento || '',
  })
  const [tipoEscritura,       setTipoEscritura]       = useState(escrituraInit.tipo)
  const [numeroEscritura,     setNumeroEscritura]     = useState(escrituraInit.numero)
  const [asuntoPersonalizado, setAsuntoPersonalizado] = useState(asuntoEnLista ? '' : (trabajo.asunto || ''))
  const [saving, setSaving] = useState(false)

  const lbl = { fontSize: '10px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }
  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const selectStyle = { padding: '10px 12px', borderRadius: '4px', border: '1px solid var(--silver-border)', fontSize: '13px', color: 'var(--text)', background: '#FAFBFC', fontFamily: 'inherit', cursor: 'pointer' }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.cliente.trim()) return
    if (form.asunto === 'Otro' && !asuntoPersonalizado.trim()) return
    setSaving(true)

    const asuntoFinal    = form.asunto === 'Otro' ? asuntoPersonalizado.trim() : form.asunto
    const escrituraFinal = numeroEscritura.trim() ? `${tipoEscritura} ${numeroEscritura.trim()}` : null

    const { error } = await supabase.from('trabajos').update({
      cliente:            form.cliente,
      asunto:             asuntoFinal,
      fecha_ingreso:      form.fecha_ingreso,
      descripcion:        form.descripcion,
      encargado_id:       form.encargado_id       || null,
      numero_escritura:   escrituraFinal,
      numero_instrumento: form.numero_instrumento || null,
    }).eq('id', trabajo.id)
    if (!error) onSave({ ...form, asunto: asuntoFinal, numero_escritura: escrituraFinal })
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(20,40,69,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', animation: 'fadeIn 0.2s ease' }}>
      <div style={{ background: '#fff', borderRadius: '8px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(20,40,69,0.3)', animation: 'fadeUp 0.25s cubic-bezier(0.22,1,0.36,1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.4rem', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: '500', color: 'var(--navy-dark)' }}>Editar trabajo</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', color: 'var(--text-light)', cursor: 'pointer', padding: '2px 6px' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '13px' }}>
          <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>Identificación</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={lbl}>Cliente <span style={{ color: 'var(--gold)' }}>*</span></label>
            <input name="cliente" value={form.cliente} onChange={handleChange} required className="field-input" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={lbl}>Asunto</label>
            <select name="asunto" value={form.asunto} onChange={handleChange} className="field-input">
              <option value="">Sin asunto</option>
              {ASUNTOS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          {form.asunto === 'Otro' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={lbl}>Especifica el asunto <span style={{ color: 'var(--gold)' }}>*</span></label>
              <input value={asuntoPersonalizado} onChange={e => setAsuntoPersonalizado(e.target.value)} placeholder="Describe el asunto específico..." className="field-input" autoFocus />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={lbl}>Tipo de instrumento / Número</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={tipoEscritura} onChange={e => setTipoEscritura(e.target.value)} style={{ ...selectStyle, width: '90px', flexShrink: 0 }}>
                <option value="EP">EP</option>
                <option value="AFP">AFP</option>
              </select>
              <input value={numeroEscritura} onChange={e => setNumeroEscritura(e.target.value)} placeholder="Número (ej. 4,521)" className="field-input" style={{ flex: 1 }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={lbl}>Número de instrumento</label>
            <input name="numero_instrumento" value={form.numero_instrumento} onChange={handleChange} placeholder="Ej. 4,521" className="field-input" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={lbl}>Fecha de ingreso</label>
            <input name="fecha_ingreso" value={form.fecha_ingreso} onChange={handleChange} type="date" className="field-input" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={lbl}>Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={2} className="field-input" style={{ resize: 'vertical' }} />
          </div>

          <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginTop: '4px' }}>Asignación</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={lbl}>Encargado</label>
            <select name="encargado_id" value={form.encargado_id} onChange={handleChange} className="field-input">
              <option value="">Sin asignar</option>
              {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <button type="button" onClick={onClose} className="btn-ghost-dark">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-gold" style={{ padding: '10px 22px' }}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Checklist Item ── */
function ChecklistItem({ item, onEstado, isDragging, isDragOver, onDragStart, onDragOver, onDrop, onDragEnd }) {
  const cfg = ESTADO_CFG[item.estado] || ESTADO_CFG.pendiente
  return (
    <div
      draggable
      onDragStart={() => onDragStart(item.id)}
      onDragOver={e => { e.preventDefault(); onDragOver(item.id) }}
      onDrop={() => onDrop(item.id)}
      onDragEnd={onDragEnd}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderRadius: '6px',
        border: `1px solid ${isDragOver ? 'var(--gold)' : cfg.border}`,
        background: isDragging ? 'rgba(197,169,106,0.08)' : cfg.bg,
        cursor: 'grab', transition: 'border-color 0.15s, background 0.15s, opacity 0.15s, transform 0.15s',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragOver && !isDragging ? 'scaleX(1.01)' : 'none',
        userSelect: 'none',
      }}
    >
      <div style={{ color: 'var(--text-light)', fontSize: '13px', marginRight: '10px', flexShrink: 0, cursor: 'grab', lineHeight: 1 }}>⠿</div>
      <div
        onClick={e => { e.stopPropagation(); onEstado(item.id, item.estado) }}
        style={{ width: '28px', height: '28px', borderRadius: '50%', background: cfg.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0, cursor: 'pointer', transition: 'transform 0.15s', marginRight: '10px' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >{cfg.icon}</div>
      <span
        onClick={e => { e.stopPropagation(); onEstado(item.id, item.estado) }}
        style={{ fontSize: '13px', flex: 1, color: item.estado === 'no_aplica' ? 'var(--text-light)' : 'var(--navy-dark)', textDecoration: item.estado === 'no_aplica' ? 'line-through' : 'none', fontWeight: item.estado === 'hecho' ? '500' : '400', cursor: 'pointer' }}
      >{item.paso}</span>
      <span style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: cfg.color, marginLeft: '10px', flexShrink: 0 }}>{cfg.label}</span>
    </div>
  )
}

/* ── Historial de notas ── */
function SeccionNotas({ trabajoId, empleados, currentUserName, onLog }) {
  const [notas, setNotas] = useState([])
  const [loadingNotas, setLoadingNotas] = useState(true)
  const [nuevoTexto, setNuevoTexto] = useState('')
  const [nuevoAutor, setNuevoAutor] = useState(currentUserName || '')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { cargarNotas() }, [trabajoId])
  useEffect(() => { if (currentUserName && !nuevoAutor) setNuevoAutor(currentUserName) }, [currentUserName])

  const cargarNotas = async () => {
    const { data } = await supabase.from('notas').select('*').eq('trabajo_id', trabajoId).order('created_at', { ascending: true })
    setNotas(data || [])
    setLoadingNotas(false)
  }

  const agregarNota = async () => {
    if (!nuevoTexto.trim() || !nuevoAutor.trim()) return
    setGuardando(true)
    const { data } = await supabase.from('notas').insert([{ trabajo_id: trabajoId, texto: nuevoTexto.trim(), autor: nuevoAutor.trim() }]).select().single()
    if (data) {
      setNotas(prev => [...prev, data])
      setNuevoTexto('')
      await onLog(`Agregó comentario: "${nuevoTexto.trim().substring(0, 60)}${nuevoTexto.length > 60 ? '…' : ''}"`)
    }
    setGuardando(false)
  }

  const formatFecha = ts => {
    const d = new Date(ts)
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' +
           d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="anim-fade-up stagger-3" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
      <SectionLabel>Comentarios y notas</SectionLabel>
      {loadingNotas ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2].map(i => <div key={i} style={{ height: '60px', borderRadius: '6px' }} className="skeleton" />)}
        </div>
      ) : notas.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-light)', fontStyle: 'italic', marginBottom: '16px' }}>Aún no hay comentarios.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {notas.map(nota => (
            <div key={nota.id} style={{ background: 'var(--gold-light)', border: '1px solid var(--gold-border)', borderRadius: '6px', padding: '10px 14px' }}>
              <p style={{ fontSize: '13px', color: 'var(--navy-dark)', lineHeight: 1.6, marginBottom: '6px', whiteSpace: 'pre-wrap' }}>{nota.texto}</p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--gold)', letterSpacing: '0.06em' }}>{nota.autor}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-light)' }}>· {formatFecha(nota.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '4px' }}>Agregar comentario</p>
        <select value={nuevoAutor} onChange={e => setNuevoAutor(e.target.value)} className="field-input" style={{ fontSize: '12px' }}>
          <option value="">¿Quién escribe?</option>
          {empleados.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
        </select>
        <textarea value={nuevoTexto} onChange={e => setNuevoTexto(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) agregarNota() }} placeholder="Escribe tu comentario..." rows={3} className="field-input" style={{ resize: 'vertical', fontSize: '13px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-light)', fontStyle: 'italic' }}>Ctrl+Enter para enviar</span>
          <button onClick={agregarNota} disabled={guardando || !nuevoTexto.trim() || !nuevoAutor.trim()} className="btn-gold" style={{ padding: '8px 18px', fontSize: '12px' }}>
            {guardando ? 'Guardando...' : 'Agregar comentario'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Bitácora (solo Mauricio FV) ── */
function SeccionBitacora({ trabajoId }) {
  const [entradas, setEntradas] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    supabase.from('bitacora').select('*').eq('trabajo_id', trabajoId).order('created_at', { ascending: false })
      .then(({ data }) => { setEntradas(data || []); setLoading(false) })
  }, [trabajoId])

  const formatFecha = ts => {
    const d = new Date(ts)
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' +
           d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }

  const iconAccion = (accion) => {
    if (accion.startsWith('Cambió')) return '🔄'
    if (accion.startsWith('Agregó comentario')) return '💬'
    if (accion.startsWith('Editó')) return '✏️'
    if (accion.startsWith('Firma')) return '✍️'
    return '•'
  }

  return (
    <div className="anim-fade-up stagger-4" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
      <SectionLabel>Bitácora de cambios</SectionLabel>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[1,2,3].map(i => <div key={i} style={{ height: '36px', borderRadius: '4px' }} className="skeleton" />)}
        </div>
      ) : entradas.length === 0 ? (
        <p style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic' }}>Sin cambios registrados aún.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {entradas.map(e => (
            <div key={e.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '7px 10px', background: 'var(--bg)', borderRadius: '5px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>{iconAccion(e.accion)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '12px', color: 'var(--navy-dark)', lineHeight: 1.4 }}>{e.accion}</p>
                <p style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '2px' }}>
                  <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{e.usuario}</span>
                  {' · '}{formatFecha(e.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Pantalla principal ── */
export default function DetalleTrabajo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trabajo,        setTrabajo]        = useState(null)
  const [checklist,      setChecklist]      = useState([])
  const [empleados,      setEmpleados]      = useState([])
  const [loading,        setLoading]        = useState(true)
  const [editOpen,       setEditOpen]       = useState(false)
  const [nuevoPaso,      setNuevoPaso]      = useState('')
  const [addingPaso,     setAddingPaso]     = useState(false)
  const [savingPaso,     setSavingPaso]     = useState(false)
  const [currentUser,    setCurrentUser]    = useState('')
  const [esMauricio,     setEsMauricio]     = useState(false)
  const [bitacoraKey,    setBitacoraKey]    = useState(0) // para re-render bitácora

  const dragId      = useRef(null)
  const [dragOverId,  setDragOverId]  = useState(null)
  const [draggingId,  setDraggingId]  = useState(null)

  useEffect(() => { cargarTrabajo() }, [id])

  const cargarTrabajo = async () => {
    const [{ data: t }, { data: c }, { data: emps }, { data: { user } }] = await Promise.all([
      supabase.from('trabajos').select('*, empleados(nombre)').eq('id', id).single(),
      supabase.from('checklist').select('*').eq('trabajo_id', id).order('orden'),
      supabase.from('empleados').select('id, nombre').order('nombre'),
      supabase.auth.getUser(),
    ])
    setTrabajo(t)
    setChecklist(c || [])
    setEmpleados(emps || [])

    if (user) {
      const { data: emp } = await supabase.from('empleados').select('nombre').eq('user_id', user.id).single()
      const nombre = emp?.nombre || user.email?.split('@')[0] || 'Usuario'
      setCurrentUser(nombre)
      setEsMauricio(nombre === 'Mauricio FV')
    }
    setLoading(false)
  }

  /* ── Helper: log a bitácora + actualizar ultima_actividad ── */
  const logAccion = async (accion) => {
    await Promise.all([
      supabase.from('bitacora').insert([{ trabajo_id: id, usuario: currentUser || 'Sistema', accion }]),
      supabase.from('trabajos').update({ ultima_actividad: new Date().toISOString() }).eq('id', id),
    ])
    setBitacoraKey(k => k + 1)
  }

  /* ── Cambiar estado del paso ── */
  const cambiarEstado = async (itemId, estadoActual) => {
    const ciclo = { pendiente: 'hecho', hecho: 'no_aplica', no_aplica: 'pendiente' }
    const nuevoEstado = ciclo[estadoActual]
    const item = checklist.find(c => c.id === itemId)

    await supabase.from('checklist').update({ estado: nuevoEstado }).eq('id', itemId)
    const todos = checklist.map(c => c.id === itemId ? { ...c, estado: nuevoEstado } : c)
    setChecklist(todos)

    const aplicables  = todos.filter(c => c.estado !== 'no_aplica')
    const hechos      = aplicables.filter(c => c.estado === 'hecho')
    const nuevoStatus = aplicables.length > 0 && hechos.length === aplicables.length ? 'completado' : 'en_proceso'
    await supabase.from('trabajos').update({ status: nuevoStatus }).eq('id', id)
    setTrabajo(prev => ({ ...prev, status: nuevoStatus }))

    const etiqueta = { hecho: 'Hecho', no_aplica: 'No aplica', pendiente: 'Pendiente' }[nuevoEstado] || nuevoEstado
    await logAccion(`Cambió paso "${item?.paso}" a ${etiqueta}`)
  }

  /* ── Drag & Drop ── */
  const handleDragStart = itemId => { dragId.current = itemId; setDraggingId(itemId) }
  const handleDragOver  = itemId => { if (dragId.current !== itemId) setDragOverId(itemId) }
  const handleDrop = async targetId => {
    const fromId = dragId.current
    if (!fromId || fromId === targetId) return
    const items   = [...checklist]
    const fromIdx = items.findIndex(c => c.id === fromId)
    const toIdx   = items.findIndex(c => c.id === targetId)
    const [moved] = items.splice(fromIdx, 1)
    items.splice(toIdx, 0, moved)
    const reordered = items.map((item, i) => ({ ...item, orden: i }))
    setChecklist(reordered)
    await Promise.all(reordered.map(item => supabase.from('checklist').update({ orden: item.orden }).eq('id', item.id)))
  }
  const handleDragEnd = () => { dragId.current = null; setDraggingId(null); setDragOverId(null) }

  /* ── Agregar paso ── */
  const agregarPaso = async () => {
    const paso = nuevoPaso.trim()
    if (!paso) return
    setSavingPaso(true)
    const maxOrden = checklist.length
    const { data } = await supabase.from('checklist').insert([{ trabajo_id: id, paso, estado: 'pendiente', orden: maxOrden }]).select().single()
    if (data) {
      setChecklist(prev => [...prev, data])
      await logAccion(`Agregó paso "${paso}"`)
    }
    setNuevoPaso(''); setAddingPaso(false); setSavingPaso(false)
  }

  /* ── Eliminar trabajo ── */
  const eliminarTrabajo = async () => {
    const confirmado = window.confirm(
      '¿Estás seguro que deseas eliminar este trabajo? Esta acción no se puede deshacer.'
    )
    if (!confirmado) return

    // El checklist, notas y bitácora se eliminan en cascada por las FK
    await supabase.from('trabajos').delete().eq('id', id)

    // Regresar a la lista del abogado encargado (o a trabajos si no hay)
    const encargadoId = trabajo?.encargado_id
    if (encargadoId) navigate(`/empleados/${encargadoId}`)
    else navigate('/trabajos')
  }

  /* ── Guardar edición ── */
  const handleSave = async (formData) => {
    const enc = empleados.find(e => e.id === formData.encargado_id)
    setTrabajo(prev => ({ ...prev, ...formData, empleados: enc ? { nombre: enc.nombre } : null }))
    setEditOpen(false)
    await logAccion('Editó datos del trabajo')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ background: 'var(--navy-dark)', borderBottom: '2px solid var(--gold)', height: '56px' }} />
      <div style={{ padding: '1.5rem', maxWidth: '740px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ height: '130px', borderRadius: '6px' }} className="skeleton" />
        <div style={{ height: '320px', borderRadius: '6px' }} className="skeleton" />
      </div>
    </div>
  )

  if (!trabajo) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-light)', fontSize: '13px' }}>Trabajo no encontrado.</p>
    </div>
  )

  const hechos     = checklist.filter(c => c.estado === 'hecho').length
  const aplicables = checklist.filter(c => c.estado !== 'no_aplica').length
  const porcentaje = aplicables > 0 ? Math.round((hechos / aplicables) * 100) : 0
  const completo   = porcentaje === 100

  const statusMeta = completo
    ? { label: 'Completado', color: '#2d7a4f', bg: 'rgba(45,122,79,0.09)', border: 'rgba(45,122,79,0.22)' }
    : { label: 'En proceso', color: '#B07D2A', bg: 'rgba(197,169,106,0.13)', border: 'rgba(197,169,106,0.38)' }

  return (
    <>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{ background: 'var(--navy-dark)', borderBottom: '2px solid var(--gold)', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate(-1)}
            style={{ background: 'transparent', border: 'none', color: 'var(--gold)', fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '0 4px', transition: 'transform 0.15s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
          >←</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: '500', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {[trabajo.asunto, trabajo.cliente].filter(Boolean).join(' · ') || trabajo.cliente}
            </div>
            {trabajo.fecha_ingreso && (
              <div style={{ fontSize: '11px', color: 'rgba(184,196,208,0.8)', marginTop: '1px' }}>
                Ingreso: {new Date(trabajo.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-MX')}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button onClick={() => setEditOpen(true)}
              style={{ background: 'rgba(197,169,106,0.15)', border: '1px solid rgba(197,169,106,0.4)', borderRadius: '4px', color: '#C5A96A', fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em', padding: '5px 12px', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(197,169,106,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(197,169,106,0.15)'}
            >Editar</button>
            <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: '99px', background: statusMeta.bg, color: statusMeta.color, border: `1px solid ${statusMeta.border}` }}>
              {statusMeta.label}
            </span>
          </div>
        </div>

        <div style={{ padding: '1.5rem', maxWidth: '740px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Datos */}
          <div className="anim-fade-up" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
            <SectionLabel>Datos del trabajo</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 28px' }}>
              <div><FL>Cliente</FL><FV>{trabajo.cliente}</FV></div>
              <div><FL>Asunto</FL><FV>{trabajo.asunto}</FV></div>
              <div><FL>Fecha de ingreso</FL><FV>{trabajo.fecha_ingreso ? new Date(trabajo.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-MX') : null}</FV></div>
              <div><FL>Encargado</FL><FV>{trabajo.empleados?.nombre}</FV></div>
              {trabajo.numero_escritura && (
                <div><FL>Escritura / Folio</FL><FV>{trabajo.numero_escritura}</FV></div>
              )}
              {trabajo.numero_instrumento && (
                <div><FL>Número de instrumento</FL><FV>{trabajo.numero_instrumento}</FV></div>
              )}
            </div>
            {trabajo.fecha_limite && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <FL>Fecha de entrega prometida</FL>
                <div style={{ marginTop: '4px' }}>{fechaLimiteBadge(trabajo.fecha_limite)}</div>
              </div>
            )}
            {trabajo.descripcion && (
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                <FL>Descripción</FL>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginTop: '2px' }}>{trabajo.descripcion}</p>
              </div>
            )}
          </div>

          {/* Checklist */}
          <div className="anim-fade-up stagger-2" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
            <SectionLabel>Procedimiento</SectionLabel>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>{hechos} de {aplicables} pasos completados</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: completo ? 'var(--green)' : 'var(--amber)' }}>{porcentaje}%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--silver-light)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '6px', borderRadius: '99px', width: `${porcentaje}%`, background: completo ? 'linear-gradient(90deg,#2d7a4f,#3da068)' : 'linear-gradient(90deg,var(--navy),var(--gold))', transition: 'width 0.5s cubic-bezier(0.22,1,0.36,1)' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {checklist.map(item => (
                <ChecklistItem key={item.id} item={item} onEstado={cambiarEstado}
                  isDragging={draggingId === item.id} isDragOver={dragOverId === item.id}
                  onDragStart={handleDragStart} onDragOver={handleDragOver}
                  onDrop={handleDrop} onDragEnd={handleDragEnd}
                />
              ))}
            </div>
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
              {addingPaso ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input autoFocus value={nuevoPaso} onChange={e => setNuevoPaso(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarPaso() } if (e.key === 'Escape') { setAddingPaso(false); setNuevoPaso('') } }}
                    placeholder="Nombre del paso..." className="field-input" style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }} />
                  <button onClick={agregarPaso} disabled={savingPaso || !nuevoPaso.trim()} className="btn-gold" style={{ padding: '8px 16px', fontSize: '12px' }}>
                    {savingPaso ? '...' : 'Agregar'}
                  </button>
                  <button onClick={() => { setAddingPaso(false); setNuevoPaso('') }} className="btn-ghost-dark" style={{ padding: '8px 12px', fontSize: '12px' }}>Cancelar</button>
                </div>
              ) : (
                <button onClick={() => setAddingPaso(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px dashed rgba(197,169,106,0.45)', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer', color: 'var(--gold)', fontSize: '12px', fontWeight: '600', width: '100%', justifyContent: 'center', transition: 'border-color 0.15s, background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'var(--gold-light)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(197,169,106,0.45)'; e.currentTarget.style.background = 'none' }}
                >+ Agregar paso</button>
              )}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '10px', fontStyle: 'italic' }}>
              Toca el ícono o el nombre para cambiar estado · Arrastra ⠿ para reordenar
            </p>
          </div>

          {/* Comentarios */}
          <SeccionNotas trabajoId={id} empleados={empleados} currentUserName={currentUser} onLog={logAccion} />

          {/* Bitácora — solo Mauricio FV */}
          {esMauricio && <SeccionBitacora key={bitacoraKey} trabajoId={id} />}

          {/* Eliminar trabajo */}
          <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)', marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={eliminarTrabajo}
              style={{ background: 'transparent', border: '1px solid rgba(192,57,43,0.3)', borderRadius: '4px', color: 'rgba(192,57,43,0.65)', fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em', padding: '7px 16px', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s, background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(192,57,43,0.7)'; e.currentTarget.style.color = '#c0392b'; e.currentTarget.style.background = 'rgba(192,57,43,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(192,57,43,0.3)'; e.currentTarget.style.color = 'rgba(192,57,43,0.65)'; e.currentTarget.style.background = 'transparent' }}
            >
              Eliminar trabajo
            </button>
          </div>

        </div>
      </div>

      {/* Modal edición */}
      {editOpen && (
        <EditModal trabajo={trabajo} empleados={empleados} onClose={() => setEditOpen(false)} onSave={handleSave} />
      )}

    </>
  )
}
