import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useNavigate } from 'react-router-dom'

/* ── Comentarios de una tarea ── */
function SeccionComentarios({ tareaId }) {
  const [comentarios, setComentarios] = useState([])
  const [texto, setTexto] = useState('')
  const [autor, setAutor] = useState('Gabriela Muñoz')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { cargar() }, [tareaId])

  const cargar = async () => {
    const { data } = await supabase
      .from('comentarios_admin')
      .select('*')
      .eq('tarea_id', tareaId)
      .order('created_at', { ascending: true })
    setComentarios(data || [])
  }

  const agregar = async () => {
    if (!texto.trim()) return
    setGuardando(true)
    await supabase.from('comentarios_admin').insert([{ tarea_id: tareaId, texto: texto.trim(), autor }])
    setTexto('')
    await cargar()
    setGuardando(false)
  }

  const fmt = (ts) => new Date(ts).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ marginTop: '12px', borderTop: '1px solid #f0f0f0', paddingTop: '12px' }}>
      <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A9BAD', marginBottom: '8px' }}>Comentarios</p>
      {comentarios.length === 0 && (
        <p style={{ fontSize: '12px', color: '#B0BCC8', marginBottom: '8px' }}>Sin comentarios aún.</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
        {comentarios.map(c => (
          <div key={c.id} style={{ background: '#f7f8fa', borderRadius: '6px', padding: '8px 12px' }}>
            <p style={{ fontSize: '12px', color: '#142845', marginBottom: '2px' }}>{c.texto}</p>
            <p style={{ fontSize: '10px', color: '#8A9BAD' }}>{c.autor || 'Anónimo'} · {fmt(c.created_at)}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); agregar() } }}
          placeholder="Escribe un comentario..."
          style={{ flex: 1, padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '5px', fontSize: '12px', fontFamily: 'inherit', outline: 'none' }}
        />
        <button
          onClick={agregar}
          disabled={guardando || !texto.trim()}
          style={{ background: '#142845', color: '#C5A96A', border: 'none', borderRadius: '5px', padding: '7px 14px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
        >Enviar</button>
      </div>
    </div>
  )
}

/* ── Tarjeta de tarea ── */
function TareaCard({ tarea, onToggle, onEliminar }) {
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${hovered ? '#C5A96A' : '#e5e7eb'}`,
        borderLeft: `3px solid ${tarea.completado ? '#2d7a4f' : '#C5A96A'}`,
        borderRadius: '8px',
        padding: '14px 16px',
        transition: 'border-color 0.18s, box-shadow 0.18s',
        boxShadow: hovered ? '0 4px 16px rgba(30,58,95,0.1)' : '0 1px 4px rgba(0,0,0,0.05)',
        opacity: tarea.completado ? 0.72 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Checkbox */}
        <button
          onClick={() => onToggle(tarea)}
          title={tarea.completado ? 'Marcar como pendiente' : 'Marcar como completada'}
          style={{
            width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
            border: `2px solid ${tarea.completado ? '#2d7a4f' : '#C5A96A'}`,
            background: tarea.completado ? '#2d7a4f' : 'transparent',
            color: '#fff', fontSize: '12px', fontWeight: '700',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.25s, border-color 0.25s',
            marginTop: '1px',
          }}
        >{tarea.completado ? '✓' : ''}</button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '17px', fontWeight: '500', color: '#142845',
            textDecoration: tarea.completado ? 'line-through' : 'none',
            marginBottom: '2px', lineHeight: 1.3,
            transition: 'text-decoration 0.2s',
          }}>{tarea.titulo}</p>
          {tarea.descripcion && (
            <p style={{ fontSize: '12px', color: '#6B7A8D', lineHeight: 1.5 }}>{tarea.descripcion}</p>
          )}
          <p style={{ fontSize: '10px', color: '#B0BCC8', marginTop: '4px' }}>
            {new Date(tarea.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={() => setExpanded(x => !x)}
            style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', color: '#8A9BAD', cursor: 'pointer' }}
          >{expanded ? 'Ocultar' : 'Comentarios'}</button>
          <button
            onClick={() => onEliminar(tarea.id)}
            style={{ background: 'transparent', border: '1px solid #fcd5d5', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', color: '#c97a7a', cursor: 'pointer' }}
          >✕</button>
        </div>
      </div>

      {expanded && <SeccionComentarios tareaId={tarea.id} />}
    </div>
  )
}

/* ── Modal nueva tarea ── */
function NuevaTareaModal({ onClose, onGuardar }) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [guardando, setGuardando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!titulo.trim()) return
    setGuardando(true)
    const { data } = await supabase.from('tareas_admin').insert([{
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      asignado_a: 'Gabriela Muñoz',
    }]).select().single()
    onGuardar(data)
    setGuardando(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(20,40,69,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ background: '#fff', borderRadius: '8px', width: '100%', maxWidth: '460px', boxShadow: '0 24px 80px rgba(20,40,69,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.4rem', borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: '500', color: '#142845' }}>Nueva tarea</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#8A9BAD', cursor: 'pointer' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A9BAD' }}>
              Título <span style={{ color: '#C5A96A' }}>*</span>
            </label>
            <input
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="¿Qué hay que hacer?"
              required
              autoFocus
              className="field-input"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8A9BAD' }}>Descripción</label>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Detalles adicionales..."
              rows={3}
              className="field-input"
              style={{ resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
            <button type="button" onClick={onClose} className="btn-ghost-dark">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-gold" style={{ padding: '10px 22px' }}>
              {guardando ? 'Guardando...' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Página principal ── */
export default function AdminTareas() {
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filtro, setFiltro] = useState('pendientes') // 'pendientes' | 'completadas' | 'todas'
  const navigate = useNavigate()

  useEffect(() => { cargar() }, [])

  const cargar = async () => {
    const { data } = await supabase.from('tareas_admin').select('*').order('created_at', { ascending: false })
    setTareas(data || [])
    setLoading(false)
  }

  const toggleCompletado = async (tarea) => {
    const nuevo = !tarea.completado
    await supabase.from('tareas_admin').update({ completado: nuevo }).eq('id', tarea.id)
    setTareas(ts => ts.map(t => t.id === tarea.id ? { ...t, completado: nuevo } : t))
  }

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta tarea? Esta acción no se puede deshacer.')) return
    await supabase.from('tareas_admin').delete().eq('id', id)
    setTareas(ts => ts.filter(t => t.id !== id))
  }

  const tareasFiltradas = tareas.filter(t =>
    filtro === 'pendientes'  ? !t.completado :
    filtro === 'completadas' ? t.completado  : true
  )

  const pendientes  = tareas.filter(t => !t.completado).length
  const completadas = tareas.filter(t =>  t.completado).length

  const btnFiltro = (val, label) => (
    <button
      onClick={() => setFiltro(val)}
      style={{
        background: filtro === val ? '#142845' : 'transparent',
        color: filtro === val ? '#C5A96A' : '#8A9BAD',
        border: `1px solid ${filtro === val ? '#142845' : '#e5e7eb'}`,
        borderRadius: '99px', padding: '5px 14px', fontSize: '11px', fontWeight: '600',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >{label}</button>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa', fontFamily: "'Montserrat', sans-serif" }}>

      {/* Navbar */}
      <nav style={{ background: '#142845', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/trabajos')}
            style={{ background: 'transparent', border: 'none', color: '#C5A96A', fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '0 4px', transition: 'transform 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}
          >←</button>
          <div style={{ width: '32px', height: '32px', border: '1.5px solid #C5A96A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '14px', fontWeight: '600', color: '#C5A96A' }}>GM</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#D6DFE8' }}>Gabriela Muñoz</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: '#C5A96A', border: 'none', borderRadius: '5px', color: '#142845', fontSize: '11px', fontWeight: '700', padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.06em', transition: 'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#B8965A'}
          onMouseLeave={e => e.currentTarget.style.background = '#C5A96A'}
        >+ Nueva tarea</button>
      </nav>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #142845 100%)', padding: '40px 28px 44px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', border: '1px solid rgba(197,169,106,0.45)', borderRadius: '99px', padding: '5px 16px', marginBottom: '18px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C5A96A' }} />
          <span style={{ fontSize: '10px', fontWeight: '600', color: '#C5A96A', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Administración</span>
        </div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '38px', fontWeight: '600', color: '#fff', margin: '0 0 8px', lineHeight: 1.1 }}>
          Gabriela Muñoz
        </h1>
        <p style={{ fontSize: '13px', color: '#8A9BAD', margin: '0 0 24px' }}>Tareas y recordatorios</p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', fontWeight: '600', color: '#C5A96A', margin: 0 }}>{pendientes}</p>
            <p style={{ fontSize: '10px', color: '#8A9BAD', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pendientes</p>
          </div>
          <div style={{ width: '1px', background: 'rgba(197,169,106,0.25)' }} />
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '32px', fontWeight: '600', color: '#2d7a4f', margin: 0 }}>{completadas}</p>
            <p style={{ fontSize: '10px', color: '#8A9BAD', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Completadas</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 56px' }}>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {btnFiltro('pendientes',  `Pendientes (${pendientes})`)}
          {btnFiltro('completadas', `Completadas (${completadas})`)}
          {btnFiltro('todas',       'Todas')}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: '72px', borderRadius: '8px', background: 'linear-gradient(90deg,#e8eaed 25%,#f4f5f7 50%,#e8eaed 75%)', backgroundSize: '400px 100%', animation: 'shimmer 1.4s ease infinite' }} />
            ))}
          </div>
        ) : tareasFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#8A9BAD', fontSize: '14px' }}>
            {filtro === 'pendientes' ? 'No hay tareas pendientes. ¡Todo al día! ✓' : 'No hay tareas aquí.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tareasFiltradas.map(t => (
              <TareaCard key={t.id} tarea={t} onToggle={toggleCompletado} onEliminar={eliminar} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <NuevaTareaModal
          onClose={() => setShowModal(false)}
          onGuardar={(nueva) => { if (nueva) setTareas(ts => [nueva, ...ts]) }}
        />
      )}
    </div>
  )
}
