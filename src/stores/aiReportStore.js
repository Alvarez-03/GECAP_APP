import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAiReportStore = defineStore('aiReport', () => {
  const isLoading = ref(false)
  const generatedReport = ref('')
  const error = ref(null)

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''

  // Lista de modelos en orden de prioridad (si el primero da 503, salta al siguiente)
  const MODELOS_DISPONIBLES = [
    'gemini-3.5-flash-lite',
  ]

  const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  const generateTacticalReport = async (metricsData) => {
    isLoading.value = true
    error.value = null
    generatedReport.value = ''

    try {
      if (!apiKey) {
        throw new Error('La clave API de Gemini (VITE_GEMINI_API_KEY) no está configurada en el archivo .env')
      }

      const prompt = `Actúa como Analista Jefe de Inteligencia y Estrategia de Seguridad Ciudadana, con más de 15 años de experiencia en análisis predictivo, georreferenciación del delito y optimización de pie de fuerza para la Policía Nacional de Colombia. 

Estás procesando las métricas operativas en tiempo real del sistema GECAP (Gestión Estratégica de Cuadrantes y Atención Policial) en el municipio de Tuluá, Valle del Cauca. El objetivo principal de este informe es aligerar la carga cognitiva y de gestión de tiempo del oficial jefe o comandante de estación, entregándole un diagnóstico táctico inmediato que le permita reasignar patrullajes y priorizar recursos sin tener que interpretar datos crudos.

Objeto JSON con las métricas y registros actuales:
${JSON.stringify(metricsData, null, 2)}

INSTRUCCIONES DE ANÁLISIS:
- Realiza un análisis cruzado de los datos: relaciona los tiempos de respuesta con la densidad de incidentes y los cuadrantes más afectados para detectar cuellos de botella operativos.
- Identifica patrones anómalos o concentraciones críticas que requieran intervención inmediata.
- Mantén un tono estrictamente formal, institucional, técnico, analítico y enfocado en la toma de decisiones tácticas policiales.
- No incluyas introducciones conversacionales ni menciones que eres una inteligencia artificial; ve directo al formato requerido.

Genera un Informe Ejecutivo Táctico formal, redactado en un Markdown limpio y estructurado exactamente bajo las siguientes 4 secciones:

1. **Resumen Ejecutivo de Situación**
   - Síntesis de alto nivel del estado de seguridad actual en Tuluá basada estrictamente en el volumen, tipología y criticidad de los reportes ciudadanos procesados en el periodo.
   - Indicadores clave de rendimiento (KPIs) agregados y su lectura estratégica.

2. **Puntos Críticos y Hotspots (Georreferenciación Táctica)**
   - Identificación nominal y priorizada de las zonas, comunas, cuadrantes o barrios con mayor incidencia delictiva o reportes ciudadanos recurrentes.
   - Análisis de la concentración del riesgo (correlación entre tipo de incidente y zona geográfica).

3. **Evaluación de Tiempos y Operatividad**
   - Análisis crítico del rendimiento del tiempo de respuesta (desde el reporte ciudadano en GECAP hasta el cierre o atención en terreno por parte de las unidades).
   - Detección de posibles saturaciones operativas en bases policiales o cuadrantes específicos debido al volumen de casos.

4. **Recomendaciones Tácticas y Preventivas**
   - Propuestas de acción concretas, directas y viables para el mando operativo (ej. reasignación dinámica de patrullajes, puntos de control móviles preventivos, o refuerzo en horarios pico identificados).
   - Líneas de acción orientadas a la optimización de los tiempos de reacción y disuasión del delito.`;

      let textoGenerado = null
      let ultimoError = null

      for (const modelo of MODELOS_DISPONIBLES) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`

          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          })

          const data = await response.json()

          if (response.status === 503) {
            console.warn(`Modelo ${modelo} saturado (503). Probando siguiente modelo...`)
            ultimoError = data.error?.message
            await esperar(1500)
            continue
          }

          if (!response.ok) {
            // Si el modelo alternativo no existe (404), saltamos al siguiente sin romper el flujo
            if (response.status === 404) continue
            throw new Error(data.error?.message || `Error HTTP: ${response.status}`)
          }

          textoGenerado = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (textoGenerado) break

        } catch (err) {
          ultimoError = err.message
        }
      }

      if (textoGenerado) {
        generatedReport.value = textoGenerado
      } else {
        throw new Error(ultimoError || 'Todos los modelos de Gemini están temporalmente saturados. Intenta de nuevo en 1 minuto.')
      }

    } catch (err) {
      console.error('Error al generar informe táctico con Gemini:', err)
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  const limpiarReporte = () => {
    generatedReport.value = ''
    error.value = null
  }

  return {
    isLoading,
    generatedReport,
    error,
    generateTacticalReport,
    limpiarReporte
  }
})