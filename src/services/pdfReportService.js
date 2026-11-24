import { jsPDF } from 'jspdf'

const COLORES = {
  navy: [15, 23, 42],        // slate-900
  azulGecap: [29, 78, 216],  // blue-700
  rojo: [220, 38, 38],       // red-600
  ambar: [217, 119, 6],      // amber-600
  verde: [5, 150, 105],      // emerald-600
  texto: [30, 41, 59],       // slate-800
  gris: [100, 116, 139],     // slate-500
  borde: [226, 232, 240],    // slate-200
  fondoSuave: [248, 250, 252]
}

async function cargarLogoBase64(url = '/LOGO_GECAP.png') {
  try {
    const resp = await fetch(url)
    if (!resp.ok) return null
    const blob = await resp.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function limpiarLineaMarkdown(texto = '') {
  return texto
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .trim()
}

function verificarSaltoPagina(doc, yActual, alturaNecesaria, margenInferior = 20) {
  const altoPagina = doc.internal.pageSize.getHeight()
  if (yActual + alturaNecesaria > altoPagina - margenInferior) {
    doc.addPage()
    return 18
  }
  return yActual
}

function dibujarEncabezado(doc, logoBase64, metadatos) {
  const anchoPagina = doc.internal.pageSize.getWidth()

  // Banda institucional superior
  doc.setFillColor(...COLORES.navy)
  doc.rect(0, 0, anchoPagina, 32, 'F')

  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 14, 5, 22, 22)
  }

  const xTexto = logoBase64 ? 40 : 14
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text('GECAP — INFORME TÁCTICO Y ANALÍTICA OPERATIVA', xTexto, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(203, 213, 225)
  doc.text('Policía Nacional de Colombia • Distrito de Policía Tuluá, Valle del Cauca', xTexto, 20)
  doc.text(`Generado: ${metadatos.fechaGeneracion}   |   Operador: ${metadatos.operador}`, xTexto, 25.5)

  // Caja de filtros aplicados
  let y = 38
  doc.setFillColor(...COLORES.fondoSuave)
  doc.setDrawColor(...COLORES.borde)
  doc.roundedRect(14, y, anchoPagina - 28, 18, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...COLORES.navy)
  doc.text('PARÁMETROS DE CONSULTA:', 18, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLORES.texto)
  const resumenFiltros = [
    `Periodo: ${metadatos.rangoTemporal}`,
    `Base/CAI: ${metadatos.estacion}`,
    `Cuadrante: ${metadatos.cuadrante}`,
    `Tipología: ${metadatos.tipologia}`,
    `Estado: ${metadatos.estado}`
  ].join('   •   ')

  const lineasFiltros = doc.splitTextToSize(resumenFiltros, anchoPagina - 36)
  doc.text(lineasFiltros, 18, y + 12)

  return y + 24
}

function dibujarSeccionTitulo(doc, y, titulo) {
  const anchoPagina = doc.internal.pageSize.getWidth()
  y = verificarSaltoPagina(doc, y, 14)

  doc.setFillColor(...COLORES.navy)
  doc.rect(14, y, 3, 6.5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(...COLORES.navy)
  doc.text(titulo.toUpperCase(), 20, y + 5)

  doc.setDrawColor(...COLORES.borde)
  doc.line(14, y + 8.5, anchoPagina - 14, y + 8.5)

  return y + 13
}

function dibujarKpis(doc, y, kpis) {
  const anchoPagina = doc.internal.pageSize.getWidth()
  const margen = 14
  const gap = 4
  const anchoCard = (anchoPagina - margen * 2 - gap * 3) / 4
  const altoCard = 22

  y = verificarSaltoPagina(doc, y, altoCard + 6)

  const tarjetas = [
    { label: 'TOTAL INCIDENTES', valor: String(kpis.totalAlertas ?? 0), color: COLORES.azulGecap },
    { label: 'PENDIENTES', valor: String(kpis.alertasPendientes ?? 0), color: COLORES.ambar },
    { label: 'FINALIZADOS (5.50)', valor: String(kpis.alertasFinalizadas ?? 0), color: COLORES.verde },
    { label: 'EFECTIVIDAD', valor: `${kpis.porcentajeEfectividad ?? 0}%`, color: COLORES.rojo }
  ]

  tarjetas.forEach((card, idx) => {
    const x = margen + idx * (anchoCard + gap)
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(...COLORES.borde)
    doc.roundedRect(x, y, anchoCard, altoCard, 2, 2, 'FD')

    // Borde superior de color
    doc.setFillColor(...card.color)
    doc.rect(x, y, anchoCard, 2, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...COLORES.gris)
    doc.text(card.label, x + 3, y + 8)

    doc.setFontSize(14)
    doc.setTextColor(...COLORES.navy)
    doc.text(card.valor, x + 3, y + 17)
  })

  return y + altoCard + 8
}

function dibujarGraficas(doc, y, graficas) {
  const validas = (graficas || []).filter((g) => g && g.imagenBase64)
  if (!validas.length) return y

  y = dibujarSeccionTitulo(doc, y, '1. Métricas Gráficas del Sistema')

  const anchoPagina = doc.internal.pageSize.getWidth()
  const margen = 14
  const gap = 5
  const anchoColumna = (anchoPagina - margen * 2 - gap) / 2
  const altoCaja = 62

  for (let i = 0; i < validas.length; i += 2) {
    y = verificarSaltoPagina(doc, y, altoCaja + 6)

    const par = [validas[i], validas[i + 1]].filter(Boolean)
    par.forEach((grafica, colIdx) => {
      const x = margen + colIdx * (anchoColumna + gap)

      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(...COLORES.borde)
      doc.roundedRect(x, y, anchoColumna, altoCaja, 2, 2, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(...COLORES.navy)
      doc.text(grafica.titulo, x + 4, y + 6.5)

      if (grafica.subtitulo) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(...COLORES.gris)
        doc.text(grafica.subtitulo, x + 4, y + 10.5)
      }

      // Mantener proporción original del canvas dentro del cuadro
      const maxW = anchoColumna - 8
      const maxH = altoCaja - 16
      const ratio = grafica.aspectRatio || 1.7
      let imgW = maxW
      let imgH = imgW / ratio

      if (imgH > maxH) {
        imgH = maxH
        imgW = imgH * ratio
      }

      const imgX = x + 4 + (maxW - imgW) / 2
      const imgY = y + 13 + (maxH - imgH) / 2

      doc.addImage(grafica.imagenBase64, 'PNG', imgX, imgY, imgW, imgH)
    })

    y += altoCaja + 6
  }

  return y
}

function dibujarReporteIA(doc, y, markdownReporte) {
  y = dibujarSeccionTitulo(doc, y, '2. Análisis Táctico Generado por Inteligencia Artificial')

  const anchoPagina = doc.internal.pageSize.getWidth()
  const anchoTexto = anchoPagina - 28

  if (!markdownReporte || !markdownReporte.trim()) {
    y = verificarSaltoPagina(doc, y, 12)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(...COLORES.gris)
    doc.text('No se generó informe de IA previo a la exportación de este documento.', 14, y + 4)
    return y + 12
  }

  const lineas = markdownReporte.split('\n')

  for (const rawLine of lineas) {
    const linea = rawLine.trim()
    if (!linea) {
      y += 2.5
      continue
    }

    // Encabezados (#, ##, ### o líneas numeradas en negrita tipo "1. **Resumen...**")
    const esTituloSeccion =
      /^#{1,3}\s+/.test(linea) || /^\d+\.\s+\*\*.+\*\*$/.test(linea)

    if (esTituloSeccion) {
      const tituloLimpio = limpiarLineaMarkdown(linea.replace(/^#{1,3}\s+/, ''))
      y = verificarSaltoPagina(doc, y, 11)
      y += 2
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...COLORES.azulGecap)
      const wrapped = doc.splitTextToSize(tituloLimpio, anchoTexto)
      doc.text(wrapped, 14, y)
      y += wrapped.length * 5 + 1.5
      continue
    }

    // Viñetas (- o *)
    const esVinieta = /^[-*•]\s+/.test(linea)
    const textoPlano = limpiarLineaMarkdown(linea.replace(/^[-*•]\s+/, ''))
    const xInicio = esVinieta ? 19 : 14
    const anchoDisponible = esVinieta ? anchoTexto - 5 : anchoTexto

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.2)
    doc.setTextColor(...COLORES.texto)

    const wrapped = doc.splitTextToSize(textoPlano, anchoDisponible)
    const altoBloque = wrapped.length * 4.5 + 1.5
    y = verificarSaltoPagina(doc, y, altoBloque)

    if (esVinieta) {
      doc.setFillColor(...COLORES.rojo)
      doc.circle(16, y - 1.2, 0.9, 'F')
    }

    doc.text(wrapped, xInicio, y)
    y += altoBloque
  }

  return y
}

function dibujarPieDePaginaGlobal(doc) {
  const totalPaginas = doc.internal.getNumberOfPages()
  const anchoPagina = doc.internal.pageSize.getWidth()
  const altoPagina = doc.internal.pageSize.getHeight()

  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i)
    doc.setDrawColor(...COLORES.borde)
    doc.line(14, altoPagina - 13, anchoPagina - 14, altoPagina - 13)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...COLORES.gris)
    doc.text(
      'GECAP — Documento Oficial de Uso Institucional • Policía Nacional de Colombia',
      14,
      altoPagina - 8
    )
    doc.text(`Página ${i} de ${totalPaginas}`, anchoPagina - 14, altoPagina - 8, {
      align: 'right'
    })
  }
}

export const pdfReportService = {
  async generarReporteAnaliticoPdf({ metadatos, kpis, graficas, reporteMarkdown }) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const logoBase64 = await cargarLogoBase64('/LOGO_GECAP.png')

    let y = dibujarEncabezado(doc, logoBase64, metadatos)
    y = dibujarKpis(doc, y, kpis)
    y = dibujarGraficas(doc, y, graficas)
    dibujarReporteIA(doc, y + 2, reporteMarkdown)
    dibujarPieDePaginaGlobal(doc)

    const fechaArchivo = new Date().toISOString().slice(0, 10)
    doc.save(`GECAP_Informe_Tactico_${fechaArchivo}.pdf`)
  }
}