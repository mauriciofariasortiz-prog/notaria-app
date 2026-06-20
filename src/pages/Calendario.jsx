import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'
import { ASUNTOS } from '../asuntoPasos'

/* ── Helpers de fecha ── */
function inicioSemana(fecha) {
  const d = new Date(fecha)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}
function addDays(fecha, n) {
  const d = new Date(fecha)
  d.setDate(d.getDate() + n)
  return d
}
function isoDate(d) { return d.toISOString().split('T')[0] }
function esHoy(d) {
  const h = new Date()
  return d.getDate() === h.getDate() && d.getMonth() === h.getMonth() && d.getFullYear() === h.getFullYear()
}
function fmtFechaCorta(d) {
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}
function fmtHora(isoString) {
  return new Date(isoString).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

const DIAS   = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
const MESES  = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

/* ── Colores por tipo ── */
const TIPO_CFG = {
  Firma: { bg: '#142845', border: '#1E3A5F', text: '#C5A96A', badge: 'rgba(197,169,106,0.15)', badgeText: '#C5A96A' },
  Junta: { bg: '#C5A96A', border: '#B8965A', text: '#142845', badge: 'rgba(197,169,106,0.13)',  badgeText: '#B07D2A' },
}

/* ── Parsear fecha_hora ISO → { fecha, hora } ── */
function parseFechaHora(isoString) {
  if (!isoString) return { fecha: new Date().toISOString().split('T')[0], hora: '10:00' }
  const d = new Date(isoString)
  const fecha = d.toLocaleDateString('en-CA') // YYYY-MM-DD local
  const hora  = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return { fecha, hora }
}

/* ── Modal crear / editar evento ── */
function EventoModal({ empleados, eventoEditar, onClose, onSave, onUpdate }) {
  const esEdicion = !!eventoEditar
  const parsed    = parseFechaHora(eventoEditar?.fecha_hora)

  const [form, setForm] = useState({
    tipo:       eventoEditar?.tipo       || 'Firma',
    cliente:    eventoEditar?.cliente    || '',
    asunto:     eventoEditar?.asunto     || '',
    abogado_id: eventoEditar?.abogado_id || '',
    fecha:      parsed.fecha,
    hora:       parsed.hora,
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const lbl = { fontSize: '10px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.cliente.trim()) { setError('El cliente es requerido'); return }
    if (!form.asunto)         { setError('Selecciona un asunto');    return }
    if (!form.fecha)          { setError('La fecha es requerida');   return }

    setSaving(true)
    const fecha_hora = new Date(`${form.fecha}T${form.hora}:00`).toISOString()
    const payload = {
      tipo:       form.tipo,
      cliente:    form.cliente.trim(),
      asunto:     form.asunto,
      abogado_id: form.abogado_id || null,
      fecha_hora,
    }

    if (esEdicion) {
      const { data, error: dbErr } = await supabase
        .from('eventos_calendario')
        .update(payload)
        .eq('id', eventoEditar.id)
        .select('*, empleados(nombre)')
        .single()
      if (dbErr) { setError('Error al guardar. Intenta de nuevo.'); setSaving(false); return }
      onUpdate(data)
    } else {
      const { data, error: dbErr } = await supabase
        .from('eventos_calendario')
        .insert([payload])
        .select('*, empleados(nombre)')
        .single()
      if (dbErr) { setError('Error al guardar. Intenta de nuevo.'); setSaving(false); return }
      onSave(data)
    }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(20,40,69,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', animation: 'fadeIn 0.2s ease' }}>
      <div style={{ background: '#fff', borderRadius: '8px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(20,40,69,0.3)', animation: 'fadeUp 0.25s cubic-bezier(0.22,1,0.36,1)' }}>

        {/* Header del modal */}
        <div style={{ background: 'var(--navy-dark)', padding: '1rem 1.4rem', borderBottom: '2px solid var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: '500', color: '#fff' }}>
              {esEdicion ? 'Editar evento' : 'Nuevo evento'}
            </p>
            <p style={{ fontSize: '11px', color: 'rgba(197,169,106,0.8)', marginTop: '1px' }}>
              {esEdicion ? 'Modifica los datos del evento' : 'Agrega una firma o junta al calendario'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', color: 'rgba(197,169,106,0.7)', cursor: 'pointer', padding: '2px 6px', lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Tipo */}
          <div>
            <label style={lbl}>Tipo de evento</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {['Firma', 'Junta'].map(tipo => {
                const cfg = TIPO_CFG[tipo]
                const sel = form.tipo === tipo
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, tipo }))}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      border: `2px solid ${sel ? cfg.border : 'var(--border)'}`,
                      background: sel ? cfg.bg : '#fafbfc',
                      color: sel ? cfg.text : 'var(--text-muted)',
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {tipo === 'Firma' ? '✍️' : '🤝'} {tipo}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cliente */}
          <div>
            <label style={lbl}>Cliente <span style={{ color: 'var(--gold)' }}>*</span></label>
            <input name="cliente" value={form.cliente} onChange={handleChange} placeholder="Nombre del cliente..." className="field-input" />
          </div>

          {/* Asunto */}
          <div>
            <label style={lbl}>Asunto <span style={{ color: 'var(--gold)' }}>*</span></label>
            <select name="asunto" value={form.asunto} onChange={handleChange} className="field-input">
              <option value="">Selecciona el asunto...</option>
              {ASUNTOS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Abogado */}
          <div>
            <label style={lbl}>Abogado asignado</label>
            <select name="abogado_id" value={form.abogado_id} onChange={handleChange} className="field-input">
              <option value="">Sin asignar</option>
              {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>

          {/* Fecha y hora */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={lbl}>Fecha <span style={{ color: 'var(--gold)' }}>*</span></label>
              <input name="fecha" value={form.fecha} onChange={handleChange} type="date" className="field-input" />
            </div>
            <div>
              <label style={lbl}>Hora</label>
              <input name="hora" value={form.hora} onChange={handleChange} type="time" className="field-input" />
            </div>
          </div>

          {error && (
            <p style={{ fontSize: '12px', color: '#e05252', background: 'rgba(224,82,82,0.07)', border: '1px solid rgba(224,82,82,0.2)', borderRadius: '4px', padding: '8px 12px' }}>
              ⚠ {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px', borderTop: '1px solid var(--border)', marginTop: '4px' }}>
            <button type="button" onClick={onClose} className="btn-ghost-dark">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-gold" style={{ padding: '10px 24px' }}>
              {saving ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Agregar al calendario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Tarjeta de evento en el calendario ── */
function EventoCard({ evento, onDelete, onEdit }) {
  const [hover, setHover] = useState(false)
  const cfg = TIPO_CFG[evento.tipo] || TIPO_CFG.Firma

  return (
    <div
      onClick={() => onEdit(evento)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '8px', padding: '14px 16px', position: 'relative', transition: 'transform 0.15s, box-shadow 0.15s', transform: hover ? 'translateY(-2px)' : 'none', boxShadow: hover ? '0 6px 18px rgba(20,40,69,0.25)' : '0 1px 4px rgba(20,40,69,0.1)', cursor: 'pointer' }}
    >
      {/* Hora + tipo badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', color: cfg.text, opacity: 0.8 }}>{fmtHora(evento.fecha_hora)}</span>
        <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: cfg.text, opacity: 0.85, background: 'rgba(0,0,0,0.12)', borderRadius: '4px', padding: '2px 7px' }}>{evento.tipo}</span>
      </div>

      {/* Cliente */}
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '17px', fontWeight: '500', color: cfg.text, lineHeight: 1.3, marginBottom: '5px' }}>
        {evento.cliente}
      </p>

      {/* Asunto */}
      <p style={{ fontSize: '12px', color: cfg.text, opacity: 0.75, marginBottom: evento.empleados?.nombre ? '5px' : 0, lineHeight: 1.4 }}>
        {evento.asunto}
      </p>

      {/* Abogado */}
      {evento.empleados?.nombre && (
        <p style={{ fontSize: '11px', color: cfg.text, opacity: 0.6, fontWeight: '500' }}>{evento.empleados.nombre}</p>
      )}

      {/* Acciones al hacer hover: editar + eliminar */}
      {hover && (
        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
          <button
            onClick={e => { e.stopPropagation(); onEdit(evento) }}
            style={{ background: 'rgba(0,0,0,0.22)', border: 'none', borderRadius: '4px', color: cfg.text, fontSize: '12px', lineHeight: 1, padding: '4px 7px', cursor: 'pointer' }}
            title="Editar evento"
          >✎</button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(evento.id) }}
            style={{ background: 'rgba(0,0,0,0.22)', border: 'none', borderRadius: '4px', color: cfg.text, fontSize: '13px', lineHeight: 1, padding: '4px 7px', cursor: 'pointer' }}
            title="Eliminar evento"
          >×</button>
        </div>
      )}
    </div>
  )
}

/* ── Página principal ── */
export default function Calendario() {
  const navigate  = useNavigate()
  const [eventos,       setEventos]       = useState([])
  const [empleados,     setEmpleados]     = useState([])
  const [loading,       setLoading]       = useState(true)
  const [modalOpen,     setModalOpen]     = useState(false)
  const [eventoEditar,  setEventoEditar]  = useState(null)
  const [semana,        setSemana]        = useState(() => inicioSemana(new Date()))

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const [{ data: evs }, { data: emps }] = await Promise.all([
      supabase.from('eventos_calendario').select('*, empleados(nombre)').order('fecha_hora', { ascending: true }),
      supabase.from('empleados').select('id, nombre').order('nombre'),
    ])
    setEventos(evs || [])
    setEmpleados(emps || [])
    setLoading(false)
  }

  const sortEventos = (list) => [...list].sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))

  const handleSave = (nuevoEvento) => {
    setEventos(prev => sortEventos([...prev, nuevoEvento]))
    setModalOpen(false)
  }

  const handleUpdate = (eventoActualizado) => {
    setEventos(prev => sortEventos(prev.map(e => e.id === eventoActualizado.id ? eventoActualizado : e)))
    setEventoEditar(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este evento?')) return
    await supabase.from('eventos_calendario').delete().eq('id', id)
    setEventos(prev => prev.filter(e => e.id !== id))
  }

  const abrirEdicion = (evento) => {
    setEventoEditar(evento)
  }

  const cerrarModal = () => {
    setModalOpen(false)
    setEventoEditar(null)
  }

  const diasSemana = DIAS.map((nombre, i) => ({ nombre, fecha: addDays(semana, i) }))

  const eventosPorDia = (fecha) => {
    const iso = isoDate(fecha)
    return eventos.filter(e => e.fecha_hora.startsWith(iso))
      .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
  }

  const totalSemana = diasSemana.reduce((acc, d) => acc + eventosPorDia(d.fecha).length, 0)
  const rango = `${fmtFechaCorta(semana)} – ${fmtFechaCorta(addDays(semana, 6))}, ${semana.getFullYear()}`

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
            Calendario
          </span>
          {!loading && totalSemana > 0 && (
            <span style={{ fontSize: '10px', fontWeight: '700', background: 'var(--gold)', color: 'var(--navy-dark)', borderRadius: '99px', padding: '2px 8px', letterSpacing: '0.06em' }}>
              {totalSemana} esta semana
            </span>
          )}
        </div>

        {/* Leyenda */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {Object.entries(TIPO_CFG).map(([tipo, cfg]) => (
            <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: cfg.bg, border: `1px solid ${cfg.border}` }} />
              <span style={{ fontSize: '10px', color: 'rgba(197,169,106,0.8)', fontWeight: '500' }}>{tipo}</span>
            </div>
          ))}
        </div>

        {/* Navegación semana */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button onClick={() => setSemana(d => addDays(d, -7))}
            style={{ background: 'rgba(197,169,106,0.15)', border: '1px solid rgba(197,169,106,0.35)', borderRadius: '4px', color: 'var(--gold)', fontSize: '14px', fontWeight: '600', padding: '5px 10px', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(197,169,106,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(197,169,106,0.15)'}
          >‹</button>
          <button onClick={() => setSemana(inicioSemana(new Date()))}
            style={{ background: 'rgba(197,169,106,0.15)', border: '1px solid rgba(197,169,106,0.35)', borderRadius: '4px', color: 'var(--gold)', fontSize: '11px', fontWeight: '600', padding: '5px 10px', cursor: 'pointer', letterSpacing: '0.06em', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(197,169,106,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(197,169,106,0.15)'}
          >Hoy</button>
          <button onClick={() => setSemana(d => addDays(d, 7))}
            style={{ background: 'rgba(197,169,106,0.15)', border: '1px solid rgba(197,169,106,0.35)', borderRadius: '4px', color: 'var(--gold)', fontSize: '14px', fontWeight: '600', padding: '5px 10px', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(197,169,106,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(197,169,106,0.15)'}
          >›</button>
        </div>

        {/* Botón + Evento */}
        <button
          onClick={() => { setEventoEditar(null); setModalOpen(true) }}
          className="btn-gold"
          style={{ padding: '8px 16px', fontSize: '11px', whiteSpace: 'nowrap' }}
        >+ Evento</button>
      </header>

      {/* Sub-header con rango */}
      <div style={{ background: 'var(--navy)', borderBottom: '1px solid rgba(197,169,106,0.2)', padding: '10px 1.75rem' }}>
        <span style={{ fontSize: '12px', fontWeight: '500', color: 'rgba(197,169,106,0.8)', letterSpacing: '0.06em' }}>
          Semana del {rango}
        </span>
      </div>

      {/* Grid semanal */}
      {loading ? (
        <div style={{ padding: '1.25rem 1.75rem', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {DIAS.map(d => <div key={d} style={{ height: '300px', borderRadius: '6px' }} className="skeleton" />)}
        </div>
      ) : (
        <div style={{ padding: '1.25rem 1.75rem', overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(140px, 1fr))', gap: '8px', minWidth: '720px' }}>
            {diasSemana.map(({ nombre, fecha }) => {
              const evs     = eventosPorDia(fecha)
              const hoyFlag = esHoy(fecha)
              return (
                <div key={nombre} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>

                  {/* Encabezado día */}
                  <div style={{ textAlign: 'center', padding: '8px 6px', borderRadius: '6px', background: hoyFlag ? 'var(--gold)' : 'var(--card)', border: `1px solid ${hoyFlag ? 'var(--gold)' : 'var(--border)'}`, boxShadow: hoyFlag ? '0 2px 8px rgba(197,169,106,0.3)' : 'var(--shadow-sm)' }}>
                    <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: hoyFlag ? 'var(--navy-dark)' : 'var(--text-light)', marginBottom: '2px' }}>{nombre}</p>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: '600', color: 'var(--navy-dark)', lineHeight: 1 }}>{fecha.getDate()}</p>
                    <p style={{ fontSize: '10px', color: hoyFlag ? 'rgba(20,40,69,0.6)' : 'var(--text-light)' }}>{MESES[fecha.getMonth()]}</p>
                  </div>

                  {/* Botón rápido agregar en ese día */}
                  <button
                    onClick={() => { setEventoEditar(null); setModalOpen(true) }}
                    style={{ background: 'none', border: '1px dashed rgba(197,169,106,0.3)', borderRadius: '4px', color: 'rgba(197,169,106,0.5)', fontSize: '16px', padding: '3px', cursor: 'pointer', transition: 'all 0.15s', lineHeight: 1 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(197,169,106,0.3)'; e.currentTarget.style.color = 'rgba(197,169,106,0.5)' }}
                    title="Agregar evento"
                  >+</button>

                  {/* Eventos del día */}
                  {evs.length === 0 ? (
                    <div style={{ flex: 1, minHeight: '60px', border: '1px dashed rgba(184,196,208,0.3)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>—</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {evs.map(ev => (
                        <EventoCard key={ev.id} evento={ev} onDelete={handleDelete} onEdit={abrirEdicion} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!loading && eventos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-light)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.35 }}>📅</div>
          <p style={{ fontSize: '13px', marginBottom: '6px' }}>No hay eventos en el calendario.</p>
          <p style={{ fontSize: '11px' }}>Usa el botón <strong>+ Evento</strong> para agregar una firma o junta.</p>
        </div>
      )}

      {/* Modal crear / editar */}
      {(modalOpen || eventoEditar) && (
        <EventoModal
          empleados={empleados}
          eventoEditar={eventoEditar}
          onClose={cerrarModal}
          onSave={handleSave}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
