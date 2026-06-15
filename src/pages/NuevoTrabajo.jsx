import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useNavigate, useSearchParams } from 'react-router-dom'

function Field({ label, required, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{
        fontSize: '10px', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase',
        color: error ? '#e05252' : 'var(--text-muted)',
      }}>
        {label}{required && <span style={{ color: 'var(--gold)', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
      {error && (
        <span style={{ fontSize: '11px', color: '#e05252', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ⚠ {error}
        </span>
      )}
    </div>
  )
}

function SectionDivider({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
      <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap' }}>
        {children}
      </span>
      <div style={{ flex: 1, height: '1px', background: 'var(--gold-border)' }} />
    </div>
  )
}

export default function NuevoTrabajo() {
  const [empleados, setEmpleados] = useState([])
  const [form, setForm] = useState({
    cliente: '', asunto: '', fecha_ingreso: new Date().toISOString().split('T')[0],
    descripcion: '', encargado_id: '', notas: '',
  })
  const [errors, setErrors]   = useState({})
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const empleadoParam = searchParams.get('empleado') || ''

  useEffect(() => {
    supabase.from('empleados').select('id, nombre').order('nombre').then(({ data }) => {
      setEmpleados(data || [])
      if (empleadoParam) setForm(f => ({ ...f, encargado_id: empleadoParam }))
    })
  }, [])

  const validate = (f) => {
    const e = {}
    if (!f.cliente.trim()) e.cliente = 'El nombre del cliente es requerido'
    return e
  }

  const handleChange = (e) => {
    const next = { ...form, [e.target.name]: e.target.value }
    setForm(next)
    if (touched[e.target.name]) setErrors(validate(next))
  }

  const handleBlur = (e) => {
    setTouched(t => ({ ...t, [e.target.name]: true }))
    setErrors(validate(form))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const allTouched = Object.fromEntries(Object.keys(form).map(k => [k, true]))
    setTouched(allTouched)
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setLoading(true)
    const { error } = await supabase.from('trabajos').insert([{
      cliente:      form.cliente,
      asunto:       form.asunto,
      fecha_ingreso: form.fecha_ingreso,
      descripcion:  form.descripcion,
      encargado_id: form.encargado_id || null,
      notas:        form.notas,
      status:       'en_proceso',
    }])
    if (!error) {
      if (empleadoParam) navigate(`/empleados/${empleadoParam}`)
      else navigate('/trabajos')
    }
    setLoading(false)
  }

  const goBack = () => empleadoParam ? navigate(`/empleados/${empleadoParam}`) : navigate('/trabajos')
  const inputClass = (name) => `field-input${errors[name] ? ' error' : ''}`

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{
        background: 'var(--navy-dark)', borderBottom: '2px solid var(--gold)',
        padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <button
          onClick={goBack}
          style={{ background: 'transparent', border: 'none', color: 'var(--gold)', fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '0 4px', transition: 'transform 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-3px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
        >←</button>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: '500', color: '#fff' }}>
          Nuevo trabajo
        </span>
      </div>

      <div style={{ padding: '1.5rem', maxWidth: '660px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit} noValidate className="anim-scale-in">

          {/* ── Identificación ── */}
          <SectionDivider>Identificación</SectionDivider>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '14px', boxShadow: 'var(--shadow-sm)' }}>
            <Field label="Cliente" required error={errors.cliente}>
              <input
                name="cliente" value={form.cliente}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="Nombre completo del cliente o empresa"
                className={inputClass('cliente')}
              />
            </Field>
            <Field label="Asunto">
              <input
                name="asunto" value={form.asunto}
                onChange={handleChange}
                placeholder="Ej. Compraventa, Testamento, Poder notarial..."
                className="field-input"
              />
            </Field>
            <Field label="Fecha de ingreso">
              <input
                name="fecha_ingreso" value={form.fecha_ingreso}
                onChange={handleChange}
                type="date"
                className="field-input"
              />
            </Field>
            <Field label="Descripción">
              <textarea
                name="descripcion" value={form.descripcion}
                onChange={handleChange}
                placeholder="Detalles adicionales del asunto..."
                rows={3}
                className="field-input"
                style={{ resize: 'vertical' }}
              />
            </Field>
          </div>

          {/* ── Asignación ── */}
          <SectionDivider>Asignación</SectionDivider>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px', boxShadow: 'var(--shadow-sm)' }}>
            <Field label="Encargado">
              <select name="encargado_id" value={form.encargado_id} onChange={handleChange} className="field-input">
                <option value="">Sin asignar</option>
                {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </Field>
            <Field label="Notas">
              <textarea
                name="notas" value={form.notas}
                onChange={handleChange}
                placeholder="Instrucciones especiales, documentos pendientes..."
                rows={3}
                className="field-input"
                style={{ resize: 'vertical' }}
              />
            </Field>
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={goBack} className="btn-ghost-dark">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-gold" style={{ padding: '10px 24px' }}>
              {loading ? 'Guardando...' : 'Crear trabajo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
