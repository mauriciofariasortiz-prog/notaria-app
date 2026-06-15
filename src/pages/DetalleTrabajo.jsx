import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate, useParams } from 'react-router-dom'

const STATUS = {
  completado: { label: 'Completado', color: '#2d7a4f', bg: 'rgba(45,122,79,0.09)', border: 'rgba(45,122,79,0.22)' },
  en_proceso: { label: 'En proceso', color: '#B07D2A', bg: 'rgba(197,169,106,0.13)', border: 'rgba(197,169,106,0.38)' },
  nuevo:      { label: 'Nuevo',      color: '#1E3A5F', bg: 'rgba(30,58,95,0.08)',   border: 'rgba(30,58,95,0.22)'  },
}

const ESTADO_CONFIG = {
  hecho:     { icon: '✓', label: 'Hecho',     color: '#2d7a4f', bg: 'rgba(45,122,79,0.07)',   border: 'rgba(45,122,79,0.2)'   },
  no_aplica: { icon: '/',  label: 'No aplica', color: '#9BA8B6', bg: 'rgba(184,196,208,0.1)', border: 'rgba(184,196,208,0.3)' },
  pendiente: { icon: '○',  label: 'Pendiente', color: '#B07D2A', bg: '#ffffff',                border: 'rgba(184,196,208,0.5)' },
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
      <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap' }}>
        {children}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--gold-border)' }} />
    </div>
  )
}

function FieldLabel({ children }) {
  return <p style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '3px' }}>{children}</p>
}

function FieldValue({ children }) {
  return <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '15px', color: 'var(--navy-dark)' }}>{children || '—'}</p>
}

/* ── Modal de edición ── */
function EditModal({ trabajo, empleados, onClose, onSave }) {
  const [form, setForm] = useState({
    cliente:      trabajo.cliente || '',
    asunto:       trabajo.asunto  || '',
    fecha_ingreso: trabajo.fecha_ingreso || '',
    descripcion:  trabajo.descripcion || '',
    encargado_id: trabajo.encargado_id || '',
    notas:        trabajo.notas || '',
  })
  const [saving, setSaving] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.cliente.trim()) return
    setSaving(true)
    const { error } = await supabase.from('trabajos').update({
      cliente:      form.cliente,
      asunto:       form.asunto,
      fecha_ingreso: form.fecha_ingreso,
      descripcion:  form.descripcion,
      encargado_id: form.encargado_id || null,
      notas:        form.notas,
    }).eq('id', trabajo.id)
    if (!error) onSave(form)
    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(20,40,69,0.55)', backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
      animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: '#fff', borderRadius: '8px', width: '100%', maxWidth: '560px',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(20,40,69,0.3)',
        animation: 'fadeUp 0.25s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {/* Header modal */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.1rem 1.4rem',
          borderBottom: '1px solid var(--border)',
        }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: '500', color: 'var(--navy-dark)' }}>
            Editar trabajo
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '20px', color: 'var(--text-light)', cursor: 'pointer', lineHeight: 1, padding: '2px 6px' }}
          >×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '13px' }}>

          {/* Identificación */}
          <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '-2px' }}>
            Identificación
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Cliente <span style={{ color: 'var(--gold)' }}>*</span>
            </label>
            <input name="cliente" value={form.cliente} onChange={handleChange} required className="field-input" placeholder="Nombre del cliente" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Asunto</label>
            <input name="asunto" value={form.asunto} onChange={handleChange} className="field-input" placeholder="Ej. Compraventa, Testamento..." />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Fecha de ingreso</label>
            <input name="fecha_ingreso" value={form.fecha_ingreso} onChange={handleChange} type="date" className="field-input" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={2} className="field-input" style={{ resize: 'vertical' }} placeholder="Detalles adicionales..." />
          </div>

          {/* Asignación */}
          <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginTop: '4px', marginBottom: '-2px' }}>
            Asignación
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Encargado</label>
            <select name="encargado_id" value={form.encargado_id} onChange={handleChange} className="field-input">
              <option value="">Sin asignar</option>
              {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Notas</label>
            <textarea name="notas" value={form.notas} onChange={handleChange} rows={2} className="field-input" style={{ resize: 'vertical' }} placeholder="Instrucciones especiales..." />
          </div>

          {/* Acciones */}
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

/* ── Pantalla principal ── */
export default function DetalleTrabajo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [trabajo,   setTrabajo]   = useState(null)
  const [checklist, setChecklist] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [editOpen,  setEditOpen]  = useState(false)
  const [animating, setAnimating] = useState(null)

  useEffect(() => { cargarTrabajo() }, [id])

  const cargarTrabajo = async () => {
    const [{ data: t }, { data: c }, { data: emps }] = await Promise.all([
      supabase.from('trabajos').select('*, empleados(nombre)').eq('id', id).single(),
      supabase.from('checklist').select('*').eq('trabajo_id', id),
      supabase.from('empleados').select('id, nombre').order('nombre'),
    ])
    setTrabajo(t)
    setChecklist(c || [])
    setEmpleados(emps || [])
    setLoading(false)
  }

  const cambiarEstado = async (itemId, estadoActual) => {
    const ciclo = { pendiente: 'hecho', hecho: 'no_aplica', no_aplica: 'pendiente' }
    const nuevoEstado = ciclo[estadoActual]
    setAnimating(itemId)
    setTimeout(() => setAnimating(null), 300)
    await supabase.from('checklist').update({ estado: nuevoEstado }).eq('id', itemId)
    const todos = checklist.map(c => c.id === itemId ? { ...c, estado: nuevoEstado } : c)
    setChecklist(todos)
    const aplicables = todos.filter(c => c.estado !== 'no_aplica')
    const hechos     = aplicables.filter(c => c.estado === 'hecho')
    const nuevoStatus = hechos.length === aplicables.length && aplicables.length > 0 ? 'completado' : 'en_proceso'
    await supabase.from('trabajos').update({ status: nuevoStatus }).eq('id', id)
    setTrabajo(prev => ({ ...prev, status: nuevoStatus }))
  }

  const handleSave = (formData) => {
    // Actualiza local sin recargar
    const enc = empleados.find(e => e.id === formData.encargado_id)
    setTrabajo(prev => ({
      ...prev,
      ...formData,
      empleados: enc ? { nombre: enc.nombre } : null,
    }))
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
  const meta       = STATUS[trabajo.status] || STATUS.nuevo
  const completo   = porcentaje === 100

  return (
    <>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Header */}
        <div style={{
          background: 'var(--navy-dark)', borderBottom: '2px solid var(--gold)',
          padding: '0 1.5rem', height: '56px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'transparent', border: 'none', color: 'var(--gold)', fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '0 4px', transition: 'transform 0.15s', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
          >←</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: '500', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {trabajo.cliente}
            </div>
            {trabajo.asunto && (
              <div style={{ fontSize: '11px', color: 'rgba(184,196,208,0.8)', marginTop: '1px' }}>
                {trabajo.asunto}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setEditOpen(true)}
              style={{
                background: 'rgba(197,169,106,0.15)', border: '1px solid rgba(197,169,106,0.4)',
                borderRadius: '4px', color: '#C5A96A',
                fontSize: '11px', fontWeight: '600', letterSpacing: '0.06em',
                padding: '5px 12px', cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(197,169,106,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(197,169,106,0.15)'}
            >
              Editar
            </button>
            <span className="status-badge" style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}>
              {meta.label}
            </span>
          </div>
        </div>

        <div style={{ padding: '1.5rem', maxWidth: '740px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Datos del trabajo */}
          <div className="anim-fade-up" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
            <SectionLabel>Datos del trabajo</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 28px' }}>
              <div><FieldLabel>Cliente</FieldLabel><FieldValue>{trabajo.cliente}</FieldValue></div>
              <div><FieldLabel>Asunto</FieldLabel><FieldValue>{trabajo.asunto}</FieldValue></div>
              <div><FieldLabel>Fecha de ingreso</FieldLabel><FieldValue>{trabajo.fecha_ingreso ? new Date(trabajo.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-MX') : '—'}</FieldValue></div>
              <div><FieldLabel>Encargado</FieldLabel><FieldValue>{trabajo.empleados?.nombre}</FieldValue></div>
            </div>
            {trabajo.descripcion && (
              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                <FieldLabel>Descripción</FieldLabel>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginTop: '2px' }}>{trabajo.descripcion}</p>
              </div>
            )}
            {trabajo.notas && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <FieldLabel>Notas</FieldLabel>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginTop: '2px' }}>{trabajo.notas}</p>
              </div>
            )}
          </div>

          {/* Checklist */}
          {checklist.length > 0 && (
            <div className="anim-fade-up stagger-2" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
              <SectionLabel>Procedimiento</SectionLabel>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>{hechos} de {aplicables} pasos completados</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: completo ? 'var(--green)' : 'var(--amber)' }}>{porcentaje}%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--silver-light)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{
                    height: '6px',
                    background: completo ? 'linear-gradient(90deg, #2d7a4f, #3da068)' : 'linear-gradient(90deg, var(--navy), var(--gold))',
                    borderRadius: '99px', width: `${porcentaje}%`,
                    transition: 'width 0.5s cubic-bezier(0.22,1,0.36,1)',
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {checklist.map(item => {
                  const cfg = ESTADO_CONFIG[item.estado] || ESTADO_CONFIG.pendiente
                  const isAnimating = animating === item.id
                  return (
                    <div
                      key={item.id}
                      className="check-item"
                      onClick={() => cambiarEstado(item.id, item.estado)}
                      style={{
                        background: cfg.bg, border: `1px solid ${cfg.border}`,
                        opacity: isAnimating ? 0.7 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: cfg.color, color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '13px', fontWeight: '700', flexShrink: 0,
                          transition: 'transform 0.2s',
                          transform: isAnimating ? 'scale(1.2)' : 'scale(1)',
                        }}>
                          {cfg.icon}
                        </div>
                        <span style={{
                          fontSize: '13px',
                          color: item.estado === 'no_aplica' ? 'var(--text-light)' : 'var(--navy-dark)',
                          textDecoration: item.estado === 'no_aplica' ? 'line-through' : 'none',
                          fontWeight: item.estado === 'hecho' ? '500' : '400',
                        }}>
                          {item.paso}
                        </span>
                      </div>
                      <span style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: cfg.color, marginLeft: '10px', flexShrink: 0 }}>
                        {cfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '12px', fontStyle: 'italic' }}>
                Toca cada paso para cambiar su estado
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de edición */}
      {editOpen && (
        <EditModal
          trabajo={trabajo}
          empleados={empleados}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  )
}
