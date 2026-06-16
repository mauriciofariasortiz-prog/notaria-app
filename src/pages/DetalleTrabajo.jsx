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

/* ── Modal edición ── */
function EditModal({ trabajo, empleados, onClose, onSave }) {
  const [form, setForm] = useState({
    cliente:       trabajo.cliente       || '',
    asunto:        trabajo.asunto        || '',
    fecha_ingreso: trabajo.fecha_ingreso || '',
    descripcion:   trabajo.descripcion   || '',
    encargado_id:  trabajo.encargado_id  || '',
    notas:         trabajo.notas         || '',
  })
  const [saving, setSaving] = useState(false)
  const lbl = { fontSize: '10px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.cliente.trim()) return
    setSaving(true)
    const { error } = await supabase.from('trabajos').update({
      cliente: form.cliente, asunto: form.asunto,
      fecha_ingreso: form.fecha_ingreso, descripcion: form.descripcion,
      encargado_id: form.encargado_id || null, notas: form.notas,
    }).eq('id', trabajo.id)
    if (!error) onSave(form)
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
          {[['cliente','Cliente',true,'text'],['fecha_ingreso','Fecha de ingreso',false,'date']].map(([name, label, req, type]) => (
            <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={lbl}>{label}{req && <span style={{ color: 'var(--gold)' }}> *</span>}</label>
              <input name={name} value={form[name]} onChange={handleChange} type={type} required={req} className="field-input" />
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={lbl}>Asunto</label>
            <select name="asunto" value={form.asunto} onChange={handleChange} className="field-input">
              <option value="">Sin asunto</option>
              {ASUNTOS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={lbl}>Notas</label>
            <textarea name="notas" value={form.notas} onChange={handleChange} rows={2} className="field-input" style={{ resize: 'vertical' }} />
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

/* ── Checklist con drag & drop nativo ── */
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
        padding: '10px 14px',
        borderRadius: '6px',
        border: `1px solid ${isDragOver ? 'var(--gold)' : cfg.border}`,
        background: isDragging ? 'rgba(197,169,106,0.08)' : cfg.bg,
        cursor: 'grab',
        transition: 'border-color 0.15s, background 0.15s, opacity 0.15s, transform 0.15s',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragOver && !isDragging ? 'scaleX(1.01)' : 'none',
        userSelect: 'none',
      }}
    >
      {/* Grip handle */}
      <div style={{ color: 'var(--text-light)', fontSize: '13px', marginRight: '10px', flexShrink: 0, cursor: 'grab', lineHeight: 1 }}>⠿</div>

      {/* Estado icon */}
      <div
        onClick={e => { e.stopPropagation(); onEstado(item.id, item.estado) }}
        style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: cfg.color, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: '700', flexShrink: 0,
          cursor: 'pointer',
          transition: 'transform 0.15s',
          marginRight: '10px',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {cfg.icon}
      </div>

      {/* Nombre del paso */}
      <span
        onClick={e => { e.stopPropagation(); onEstado(item.id, item.estado) }}
        style={{
          fontSize: '13px', flex: 1,
          color: item.estado === 'no_aplica' ? 'var(--text-light)' : 'var(--navy-dark)',
          textDecoration: item.estado === 'no_aplica' ? 'line-through' : 'none',
          fontWeight: item.estado === 'hecho' ? '500' : '400',
          cursor: 'pointer',
        }}
      >
        {item.paso}
      </span>

      {/* Badge de estado */}
      <span style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: cfg.color, marginLeft: '10px', flexShrink: 0 }}>
        {cfg.label}
      </span>
    </div>
  )
}

/* ── Pantalla principal ── */
export default function DetalleTrabajo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trabajo,    setTrabajo]    = useState(null)
  const [checklist,  setChecklist]  = useState([])
  const [empleados,  setEmpleados]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [editOpen,   setEditOpen]   = useState(false)
  const [nuevoPaso,  setNuevoPaso]  = useState('')
  const [addingPaso, setAddingPaso] = useState(false)
  const [savingPaso, setSavingPaso] = useState(false)

  // Drag state
  const dragId   = useRef(null)
  const [dragOverId,  setDragOverId]  = useState(null)
  const [draggingId,  setDraggingId]  = useState(null)

  useEffect(() => { cargarTrabajo() }, [id])

  const cargarTrabajo = async () => {
    const [{ data: t }, { data: c }, { data: emps }] = await Promise.all([
      supabase.from('trabajos').select('*, empleados(nombre)').eq('id', id).single(),
      supabase.from('checklist').select('*').eq('trabajo_id', id).order('orden'),
      supabase.from('empleados').select('id, nombre').order('nombre'),
    ])
    setTrabajo(t)
    setChecklist(c || [])
    setEmpleados(emps || [])
    setLoading(false)
  }

  /* ── Cambiar estado del paso ── */
  const cambiarEstado = async (itemId, estadoActual) => {
    const ciclo = { pendiente: 'hecho', hecho: 'no_aplica', no_aplica: 'pendiente' }
    const nuevoEstado = ciclo[estadoActual]
    await supabase.from('checklist').update({ estado: nuevoEstado }).eq('id', itemId)
    const todos = checklist.map(c => c.id === itemId ? { ...c, estado: nuevoEstado } : c)
    setChecklist(todos)
    // Recalcular status del trabajo
    const aplicables  = todos.filter(c => c.estado !== 'no_aplica')
    const hechos      = aplicables.filter(c => c.estado === 'hecho')
    const nuevoStatus = aplicables.length > 0 && hechos.length === aplicables.length ? 'completado' : 'en_proceso'
    await supabase.from('trabajos').update({ status: nuevoStatus }).eq('id', id)
    setTrabajo(prev => ({ ...prev, status: nuevoStatus }))
  }

  /* ── Drag & drop ── */
  const handleDragStart = (itemId) => {
    dragId.current = itemId
    setDraggingId(itemId)
  }
  const handleDragOver = (itemId) => {
    if (dragId.current !== itemId) setDragOverId(itemId)
  }
  const handleDrop = async (targetId) => {
    const fromId = dragId.current
    if (!fromId || fromId === targetId) return

    const items  = [...checklist]
    const fromIdx = items.findIndex(c => c.id === fromId)
    const toIdx   = items.findIndex(c => c.id === targetId)
    const [moved] = items.splice(fromIdx, 1)
    items.splice(toIdx, 0, moved)

    // Asignar nuevo orden
    const reordered = items.map((item, i) => ({ ...item, orden: i }))
    setChecklist(reordered)

    // Guardar en Supabase (batch)
    await Promise.all(reordered.map(item =>
      supabase.from('checklist').update({ orden: item.orden }).eq('id', item.id)
    ))
  }
  const handleDragEnd = () => {
    dragId.current = null
    setDraggingId(null)
    setDragOverId(null)
  }

  /* ── Agregar paso extra ── */
  const agregarPaso = async () => {
    const paso = nuevoPaso.trim()
    if (!paso) return
    setSavingPaso(true)
    const maxOrden = checklist.length
    const { data } = await supabase.from('checklist')
      .insert([{ trabajo_id: id, paso, estado: 'pendiente', orden: maxOrden }])
      .select().single()
    if (data) setChecklist(prev => [...prev, data])
    setNuevoPaso('')
    setAddingPaso(false)
    setSavingPaso(false)
  }

  const handleSave = (formData) => {
    const enc = empleados.find(e => e.id === formData.encargado_id)
    setTrabajo(prev => ({ ...prev, ...formData, empleados: enc ? { nombre: enc.nombre } : null }))
    setEditOpen(false)
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
          <button
            onClick={() => navigate(-1)}
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
            <button
              onClick={() => setEditOpen(true)}
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
            </div>
            {trabajo.descripcion && (
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                <FL>Descripción</FL>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginTop: '2px' }}>{trabajo.descripcion}</p>
              </div>
            )}
            {trabajo.notas && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <FL>Notas</FL>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginTop: '2px' }}>{trabajo.notas}</p>
              </div>
            )}
          </div>

          {/* Checklist */}
          <div className="anim-fade-up stagger-2" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
            <SectionLabel>Procedimiento</SectionLabel>

            {/* Barra de progreso */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>{hechos} de {aplicables} pasos completados</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: completo ? 'var(--green)' : 'var(--amber)' }}>{porcentaje}%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--silver-light)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '6px', borderRadius: '99px', width: `${porcentaje}%`, background: completo ? 'linear-gradient(90deg,#2d7a4f,#3da068)' : 'linear-gradient(90deg,var(--navy),var(--gold))', transition: 'width 0.5s cubic-bezier(0.22,1,0.36,1)' }} />
              </div>
            </div>

            {/* Items con drag & drop */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {checklist.map(item => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  onEstado={cambiarEstado}
                  isDragging={draggingId === item.id}
                  isDragOver={dragOverId === item.id}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>

            {/* Agregar paso */}
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
              {addingPaso ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    autoFocus
                    value={nuevoPaso}
                    onChange={e => setNuevoPaso(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarPaso() } if (e.key === 'Escape') { setAddingPaso(false); setNuevoPaso('') } }}
                    placeholder="Nombre del paso..."
                    className="field-input"
                    style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
                  />
                  <button onClick={agregarPaso} disabled={savingPaso || !nuevoPaso.trim()} className="btn-gold" style={{ padding: '8px 16px', fontSize: '12px' }}>
                    {savingPaso ? '...' : 'Agregar'}
                  </button>
                  <button onClick={() => { setAddingPaso(false); setNuevoPaso('') }} className="btn-ghost-dark" style={{ padding: '8px 12px', fontSize: '12px' }}>
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingPaso(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px dashed rgba(197,169,106,0.45)', borderRadius: '6px', padding: '8px 14px', cursor: 'pointer', color: 'var(--gold)', fontSize: '12px', fontWeight: '600', width: '100%', justifyContent: 'center', transition: 'border-color 0.15s, background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'var(--gold-light)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(197,169,106,0.45)'; e.currentTarget.style.background = 'none' }}
                >
                  + Agregar paso
                </button>
              )}
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '10px', fontStyle: 'italic' }}>
              Toca el ícono o el nombre para cambiar estado · Arrastra ⠿ para reordenar
            </p>
          </div>
        </div>
      </div>

      {editOpen && (
        <EditModal trabajo={trabajo} empleados={empleados} onClose={() => setEditOpen(false)} onSave={handleSave} />
      )}
    </>
  )
}
