export default function Spinner({ text = 'Cargando...', size = 'md' }) {
  return (
    <div className="loading-center">
      <div className={`spinner${size === 'sm' ? ' spinner-sm' : ''}`} />
      {text && <span>{text}</span>}
    </div>
  )
}
