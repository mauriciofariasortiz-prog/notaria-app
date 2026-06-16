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

export const PASOS_POR_ASUNTO = {
  'Copia Certificada':    ['Cotización', 'Proyecto', 'Scan', 'Copia física', 'Factura', 'Pago'],
  'Ratificación de firma':['Cotización', 'Proyecto', 'Firma', 'Scan', 'Copia física', 'Factura', 'Pago'],
  'Protocolización':      ['Cotización', 'Proyecto', 'Firma', 'Antilavado', 'Copias certificadas', 'Scan', 'Copia física', 'Factura', 'Pago'],
  'Poder':                ['Cotización', 'Proyecto', 'Firma', 'Copias certificadas', 'Scan', 'Copia física', 'Factura', 'Pago'],
  'Constitutiva':         ['Cotización', 'Proyecto', 'Autorización de nombre', 'Antilavado', 'Firma', 'Copias certificadas', 'Scan', 'Copia física', 'Factura', 'Pago'],
  'Compraventa':          ['Cotización', 'Proyecto', 'Alertas', 'Pre-pre', 'Antilavado', 'Firma', 'Certificado', 'Copias certificadas', 'Scan', 'Copia física', 'Copia a archivo general', 'Factura', 'Pago'],
  'Revocación de Poder':  ['Cotización', 'Proyecto', 'Firma', 'Copias certificadas', 'Scan', 'Copia física', 'Factura', 'Pago'],
  'Testamento':           ['Cotización', 'Pre-pre', 'Proyecto', 'Firma', 'Certificado', 'Copias certificadas', 'Scan', 'Copia física', 'Copia a archivo general', 'Factura', 'Pago'],
  'Fe de Hechos':         ['Cotización', 'Proyecto', 'Firma', 'Scan', 'Copia física', 'Factura', 'Pago'],
  'Donación':             ['Cotización', 'Proyecto', 'Alertas', 'Antilavado', 'Firma', 'Certificado', 'Copias certificadas', 'Scan', 'Copia física', 'Copia a archivo general', 'Factura', 'Pago'],
  'Sucesiones':           ['Cotización', 'Proyecto', 'Alertas', 'Pre-pre', 'Antilavado', 'Firma', 'Certificado', 'Copias certificadas', 'Scan', 'Copia física', 'Copia a archivo general', 'Factura', 'Pago'],
  'Otro':                 ['Cotización', 'Proyecto', 'Firma', 'Scan', 'Copia física', 'Factura', 'Pago'],
}
