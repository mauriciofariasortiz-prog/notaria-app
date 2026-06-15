import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Trabajos from './pages/Trabajos.jsx'
import EmpleadoTrabajos from './pages/EmpleadoTrabajos.jsx'
import NuevoTrabajo from './pages/NuevoTrabajo.jsx'
import DetalleTrabajo from './pages/DetalleTrabajo.jsx'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/trabajos" element={<Trabajos />} />
        <Route path="/trabajos/nuevo" element={<NuevoTrabajo />} />
        <Route path="/trabajos/:id" element={<DetalleTrabajo />} />
        <Route path="/empleados/:id" element={<EmpleadoTrabajos />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
