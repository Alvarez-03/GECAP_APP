import { ref } from 'vue'
import { toast } from 'vue3-toastify'
import { pdfReportService } from '../services/pdfReportService'
import { obtenerOperadorLocalStorage } from '../utils/permisosOperador'

const DEFINICION_GRAFICAS = [
  { key: 'doughnut', titulo: 'Distribución por Tipología', subtitulo: 'Proporción por tipo de emergencia' },
  { key: 'pie', titulo: 'Participación Relativa', subtitulo: 'Peso frente al total de incidentes' },
  { key: 'hourly', titulo: 'Distribución Horaria (24h)', subtitulo: 'Comportamiento por hora del día' },
  { key: 'hotspots', titulo: 'Puntos Críticos por Cuadrante', subtitulo: 'Densidad de denuncias por zona' },
  { key: 'bases', titulo: 'Carga por Base Policial / CAI', subtitulo: 'Volumen asignado por estación' },
  { key: 'timeline', titulo: 'Tendencia Semanal', subtitulo: 'Evolución del flujo de reportes' },
  { key: 'status', titulo: 'Estado del Flujo Operativo', subtitulo: 'Pendientes, en proceso y finalizados' }
]

function canvasABase64ConFondoBlanco(canvas) {
  if (!canvas || !canvas.width || !canvas.height) return null

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = canvas.width
  tempCanvas.height = canvas.height

  const ctx = tempCanvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
  ctx.drawImage(canvas, 0, 0)

  return {
    imagenBase64: tempCanvas.toDataURL('image/png', 1.0),
    aspectRatio: canvas.width / canvas.height
  }
}

export function useMetricsPdfExport() {
  const exportandoPdf = ref(false)

  const capturarGraficasDesdeContenedor = (contenedorEl) => {
    if (!contenedorEl) return []

    const canvases = contenedorEl.querySelectorAll('canvas')
    return Array.from(canvases)
      .map((canvas, index) => {
        const captura = canvasABase64ConFondoBlanco(canvas)
        if (!captura) return null

        const meta = DEFINICION_GRAFICAS[index] || {
          titulo: `Gráfica Analítica #${index + 1}`,
          subtitulo: ''
        }

        return {
          titulo: meta.titulo,
          subtitulo: meta.subtitulo,
          imagenBase64: captura.imagenBase64,
          aspectRatio: captura.aspectRatio
        }
      })
      .filter(Boolean)
  }

  const exportarReportePdf = async ({
    contenedorGraficas,
    kpis,
    filtrosMeta,
    reporteMarkdown
  }) => {
    if (exportandoPdf.value) return

    try {
      exportandoPdf.value = true
      const operador = obtenerOperadorLocalStorage()
      const graficas = capturarGraficasDesdeContenedor(contenedorGraficas)

      await pdfReportService.generarReporteAnaliticoPdf({
        metadatos: {
          fechaGeneracion: new Date().toLocaleString('es-CO'),
          operador: operador?.nombre_completo
            ? `${operador.nombre_completo} (${operador.rol || 'OPERADOR'})`
            : 'Oficial de Turno',
          rangoTemporal: filtrosMeta.rangoTemporal,
          estacion: filtrosMeta.estacion,
          cuadrante: filtrosMeta.cuadrante,
          tipologia: filtrosMeta.tipologia,
          estado: filtrosMeta.estado
        },
        kpis,
        graficas,
        reporteMarkdown: reporteMarkdown || ''
      })

      toast.success('Informe PDF descargado correctamente.')
    } catch (err) {
      console.error('Error al exportar PDF táctico:', err)
      toast.error('No se pudo generar el archivo PDF.')
    } finally {
      exportandoPdf.value = false
    }
  }

  return {
    exportandoPdf,
    exportarReportePdf
  }
}