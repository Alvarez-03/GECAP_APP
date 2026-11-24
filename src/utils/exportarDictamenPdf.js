import { jsPDF } from 'jspdf'

export function exportarDictamenPolicialPdf({
  alerta = {},
  operadorDocumento = '',
  patrullaResponsable = '',
  codigoPolicia = '',
  detallesProcedimiento = ''
} = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 16
  const maxWidth = pageWidth - marginX * 2
  let cursorY = 16

  const radicado = alerta?.codigo_seguimiento || alerta?.id || 'SIN-RADICADO'
  const fechaEmision = new Date().toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  // Encabezado Institucional
  doc.setFillColor(15, 23, 42) // slate-900
  doc.rect(0, 0, pageWidth, 26, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('GECAP • POLICÍA NACIONAL DE COLOMBIA', marginX, 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(203, 213, 225) // slate-300
  doc.text('INFORME OFICIAL DE FINALIZACIÓN DE PROCEDIMIENTO POLICIAL', marginX, 17)
  doc.text(`Radicado: #${radicado}  |  Generado: ${fechaEmision}`, marginX, 22)

  cursorY = 34

  // Caja resumen de trazabilidad
  doc.setFillColor(241, 245, 249) // slate-100
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(marginX, cursorY, maxWidth, 20, 2, 2, 'FD')

  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.text(`ID / Placa Operador: ${operadorDocumento || 'No registrado'}`, marginX + 4, cursorY + 6.5)
  doc.text(`Patrulla Responsable: ${patrullaResponsable || 'No registrada'}`, marginX + 4, cursorY + 12)
  doc.text(
    `Código / Ley 1801: ${codigoPolicia || 'No aplica'}  |  Estado: ${alerta?.estado_actual || '5.50 - PROCEDIMIENTO FINALIZADO'}`,
    marginX + 4,
    cursorY + 17.5
  )

  cursorY += 28

  // Cuerpo del informe (respetando secciones y saltos de página)
  const lineasCrudas = String(detallesProcedimiento || '').split('\n')

  lineasCrudas.forEach((lineaOriginal) => {
    const linea = lineaOriginal.trimEnd()

    // Línea vacía: espaciado vertical controlado
    if (!linea.trim()) {
      cursorY += 3
      if (cursorY > pageHeight - 18) {
        doc.addPage()
        cursorY = 18
      }
      return
    }

    const esTituloPrincipal = linea.startsWith('INFORME DE POLICÍA')
    const esSeccionNumerada = /^[1-7]\.\s+[A-ZÁÉÍÓÚÑ\s]+/.test(linea.trim())

    if (esTituloPrincipal) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(15, 23, 42)
    } else if (esSeccionNumerada) {
      cursorY += 2
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(185, 28, 28) // red-700 institucional
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(30, 41, 59) // slate-800
    }

    const bloquesEnvueltos = doc.splitTextToSize(linea, maxWidth)
    bloquesEnvueltos.forEach((renglon) => {
      if (cursorY > pageHeight - 18) {
        doc.addPage()
        cursorY = 18
      }
      doc.text(renglon, marginX, cursorY)
      cursorY += esSeccionNumerada ? 5.2 : 4.6
    })
  })

  // Numeración de páginas en pie de página
  const totalPaginas = doc.getNumberOfPages()
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i)
    doc.setDrawColor(226, 232, 240)
    doc.line(marginX, pageHeight - 13, pageWidth - marginX, pageHeight - 13)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text('Sistema GECAP • Documento generado para constancia operativa', marginX, pageHeight - 8)
    doc.text(`Página ${i} de ${totalPaginas}`, pageWidth - marginX, pageHeight - 8, {
      align: 'right'
    })
  }

  const nombreLimpio = String(radicado).replace(/[^a-zA-Z0-9-_]/g, '_')
  doc.save(`Dictamen_Policial_${nombreLimpio}.pdf`)
}