import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ASUNTOS, PASOS_POR_ASUNTO } from '../asuntoPasos'

function Field({ label, required, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', color: error ? '#e05252' : 'var(--text-muted)' }}>
        {label}{required && <span style={{ color: 'var(--gold)', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: '11px', color: '#e05252' }}>⚠ {error}</span>}
    </div>
  )
}

function SectionDivider({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
      <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', whiteSpace: 'nowrap' }}>{children}</span>
      <div style={{ flex: 1, height: '1px', background: 'var(--gold-border)' }} />
    </div>
  )
}

export default function NuevoTrabajo() {
  const [empleados, setEmpleados] = useState([])
  const [form, setForm] = useState({
    cliente: '', asunto: '', fecha_ingreso: new Date().toISOString().split('T')[0],
    descripcion: '', encargado_id: '', numero_escritura: '', numero_instrumento: '', fecha_limite: '',
  })
  const [errors,  setErrors]  = useState({})
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
    if (!f.asunto) e.asunto = 'Selecciona un asunto'
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

    const { data: nuevo, error } = await supabase.from('trabajos').insert([{
      cliente:          form.cliente,
      asunto:           form.asunto,
      fecha_ingreso:    form.fecha_ingreso,
      descripcion:      form.descripcion,
      encargado_id:     form.encargado_id || null,
      numero_escritura:  form.numero_escritura  || null,
      numero_instrumento: form.numero_instrumento || null,
      fecha_limite:      form.fecha_limite      || null,
      status:           'en_proceso',
    }]).select().single()

    if (!error && nuevo) {
      const pasos = PASOS_POR_ASUNTO[form.asunto] || []
      if (pasos.length > 0) {
        await supabase.from('checklist').insert(
          pasos.map(paso => ({ trabajo_id: nuevo.id, paso, estado: 'pendiente' }))
        )
      }
      if (empleadoParam) navigate(`/empleados/${empleadoParam}`)
      else navigate('/trabajos')
    }

    setLoading(false)
  }

  const goBack = () => empleadoParam ? navigate(`/empleados/${empleadoParam}`) : navigate('/trabajos')
  const inputClass = (name) => `field-input${errors[name] ? ' error' : ''}`

  const pasosPreview = form.asunto ? PASOS_POR_ASUNTO[form.asunto] || [] : []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <div style={{ background: 'var(--navy-dark)', borderBottom: '2px solid var(--gold)', padding: '0 1.5rem', height: '56px', display: 'flex', alignItems: 'center', gap: '12px' }}>
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

          {/* Identificación */}
          <SectionDivider>Identificación</SectionDivider>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '14px', boxShadow: 'var(--shadow-sm)' }}>
            <Field label="Cliente" required error={errors.cliente}>
              <input name="cliente" value={form.cliente} onChange={handleChange} onBlur={handleBlur} placeholder="Nombre completo del cliente o empresa" className={inputClass('cliente')} />
            </Field>

            <Field label="Asunto" required error={errors.asunto}>
              <select name="asunto" value={form.asunto} onChange={handleChange} onBlur={handleBlur} className={inputClass('asunto')}>
                <option value="">Selecciona el tipo de asunto...</option>
                {ASUNTOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>

            {/* Preview de pasos */}
            {pasosPreview.length > 0 && (
              <div style={{ background: 'var(--gold-light)', border: '1px solid var(--gold-border)', borderRadius: '4px', padding: '10px 14px' }}>
                <p style={{ fontSize: '10px', fontWeight: '700', color: 'var(--gold-dim)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '7px' }}>
                  Checklist que se generará ({pasosPreview.length} pasos)
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {pasosPreview.map((paso, i) => (
                    <span key={i} style={{ fontSize: '11px', background: 'white', border: '1px solid var(--gold-border)', borderRadius: '99px', padding: '2px 10px', color: 'var(--navy-dark)', fontWeight: '500' }}>
                      {paso}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Número de escritura / Folio">
                <input name="numero_escritura" value={form.numero_escritura} onChange={handleChange} placeholder="Ej. 12,345" className="field-input" />
              </Field>
              <Field label="Número de instrumento">
                <input name="numero_instrumento" value={form.numero_instrumento} onChange={handleChange} placeholder="Ej. 4,521" className="field-input" />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <Field label="Fecha de ingreso">
                <input name="fecha_ingreso" value={form.fecha_ingreso} onChange={handleChange} type="date" className="field-input" />
              </Field>
              <Field label="Fecha de entrega prometida">
                <input name="fecha_limite" value={form.fecha_limite} onChange={handleChange} type="date" className="field-input" />
              </Field>
            </div>

            <Field label="Descripción">
              <textarea name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Detalles adicionales del asunto..." rows={3} className="field-input" style={{ resize: 'vertical' }} />
            </Field>
          </div>

          {/* Asignación */}
          <SectionDivider>Asignación</SectionDivider>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px', boxShadow: 'var(--shadow-sm)' }}>
            <Field label="Encargado">
              <select name="encargado_id" value={form.encargado_id} onChange={handleChange} className="field-input">
                <option value="">Sin asignar</option>
                {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </Field>
          </div>

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
