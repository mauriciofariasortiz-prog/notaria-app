export const ASUNTOS = [
  'Copia Certificada',
  'Ratificación de firma',
  'Protocolización',
  'Poder',
  'Constitutiva',
  'Compraventa',
  'Revocación de Poder',
  'Testamento',
  'Fe de Hechos',
  'Donación',
  'Sucesiones',
  'Otro',
]

const ANTES_SCAN = ['Alertas', 'Certificado de Libertad de Gravamen', 'Certificado de Gravámenes', 'Visor Registral']

function insertar(pasos) {
  const idx = pasos.indexOf('Scan')
  if (idx === -1) return [...pasos, ...ANTES_SCAN]
  return [...pasos.slice(0, idx), ...ANTES_SCAN, ...pasos.slice(idx)]
}

export const PASOS_POR_ASUNTO = {
  'Copia Certificada':    insertar(['Cotización', 'Proyecto', 'Scan', 'Copia física', 'Factura', 'Pago']),
  'Ratificación de firma':insertar(['Cotización', 'Proyecto', 'Firma', 'Scan', 'Copia física', 'Factura', 'Pago']),
  'Protocolización':      insertar(['Cotización', 'Proyecto', 'Firma', 'Antilavado', 'Copias certificadas', 'Scan', 'Copia física', 'Factura', 'Pago']),
  'Poder':                insertar(['Cotización', 'Proyecto', 'Firma', 'Copias certificadas', 'Scan', 'Copia física', 'Factura', 'Pago']),
  'Constitutiva':         insertar(['Cotización', 'Proyecto', 'Autorización de nombre', 'Antilavado', 'Firma', 'Copias certificadas', 'Scan', 'Copia física', 'Factura', 'Pago']),
  'Compraventa':          insertar(['Cotización', 'Proyecto', 'Alertas', 'Pre-pre', 'Antilavado', 'Firma', 'Certificado', 'Copias certificadas', 'Scan', 'Copia física', 'Copia a archivo general', 'Factura', 'Pago']),
  'Revocación de Poder':  insertar(['Cotización', 'Proyecto', 'Firma', 'Copias certificadas', 'Scan', 'Copia física', 'Factura', 'Pago']),
  'Testamento':           insertar(['Cotización', 'Pre-pre', 'Proyecto', 'Firma', 'Certificado', 'Copias certificadas', 'Scan', 'Copia física', 'Copia a archivo general', 'Factura', 'Pago']),
  'Fe de Hechos':         insertar(['Cotización', 'Proyecto', 'Firma', 'Scan', 'Copia física', 'Factura', 'Pago']),
  'Donación':             insertar(['Cotización', 'Proyecto', 'Alertas', 'Antilavado', 'Firma', 'Certificado', 'Copias certificadas', 'Scan', 'Copia física', 'Copia a archivo general', 'Factura', 'Pago']),
  'Sucesiones':           insertar(['Cotización', 'Proyecto', 'Alertas', 'Pre-pre', 'Antilavado', 'Firma', 'Certificado', 'Copias certificadas', 'Scan', 'Copia física', 'Copia a archivo general', 'Factura', 'Pago']),
  'Otro':                 insertar(['Cotización', 'Proyecto', 'Firma', 'Scan', 'Copia física', 'Factura', 'Pago']),
}
