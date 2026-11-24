import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue3-toastify'
import { reportesService } from '../services/reportesService'
import { cuadrantesService } from '../services/cuadrantesService'

export const circularChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        boxWidth: 14,
        boxHeight: 14,
        font: { family: 'Inter, sans-serif', size: 12 },
        color: '#334155',
        padding: 16
      }
    }
  }
}

export const axisChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 10 }, color: '#64748b' }
    },
    y: {
      grid: { color: 'rgba(226, 232, 240, 0.8)' },
      ticks: { font: { size: 11 }, color: '#64748b', precision: 0 }
    }
  }
}

export function useMetricsAnalytics() {
  const router = useRouter()
  const route = useRoute()

  const cargandoDatos = ref(true)
  const actualizando = ref(false)
  const actualizandoFiltro = ref(false)

  // Estados de filtros sincronizados con URL query params
  const filtroBusqueda = ref(route.query.busqueda || '')
  const rangoTemporal = ref(route.query.rango || 'mes')
  const fechaInicio = ref(route.query.desde || '')
  const fechaFin = ref(route.query.hasta || '')
  const filtroEstacion = ref(route.query.estacion || 'TODOS')
  const filtroCuadrante = ref(route.query.cuadrante || 'TODOS')
  const filtroTipologia = ref(route.query.tipologia || 'TODOS')
  const filtroEstado = ref(route.query.estado || 'TODOS')

  const alertasRaw = ref([])
  const cuadrantesRaw = ref([])
  const basesRaw = ref([])

  const cargarDatosMetricas = async (esActualizacion = false) => {
    try {
      if (esActualizacion) actualizando.value = true
      else cargandoDatos.value = true

      const [resAlertas, resCuadrantes, resBases] = await Promise.all([
        reportesService.obtenerTodasLasAlertas(),
        cuadrantesService.obtenerCuadrantesCompletos(),
        cuadrantesService.obtenerBasesPoliciales()
      ])

      alertasRaw.value = resAlertas.alertas || []
      cuadrantesRaw.value = resCuadrantes.data || []
      basesRaw.value = resBases.data || []

      if (esActualizacion) {
        toast.success('Datos analíticos sincronizados en tiempo real.')
      }
    } catch (err) {
      console.error('Error al cargar datos para métricas:', err)
      toast.error('Error al sincronizar datos analíticos.')
    } finally {
      cargandoDatos.value = false
      actualizando.value = false
    }
  }

  const actualizarRangoRapido = (nuevoRango) => {
    fechaInicio.value = ''
    fechaFin.value = ''
    rangoTemporal.value = nuevoRango
  }

  const cuadrantesFiltradosPorEstacion = computed(() => {
    if (filtroEstacion.value === 'TODOS') return cuadrantesRaw.value
    return cuadrantesRaw.value.filter((c) => {
      const baseId = c.base_policial_id || c.id_estacion || c.id_base
      return !baseId || String(baseId) === String(filtroEstacion.value)
    })
  })

  const tipologiasDisponibles = computed(() =>
    [...new Set(alertasRaw.value.map((a) => a.tipo_alerta).filter(Boolean))].sort()
  )

  const hayFiltrosActivos = computed(
    () =>
      filtroBusqueda.value.trim() !== '' ||
      rangoTemporal.value !== 'mes' ||
      fechaInicio.value !== '' ||
      fechaFin.value !== '' ||
      filtroEstacion.value !== 'TODOS' ||
      filtroCuadrante.value !== 'TODOS' ||
      filtroTipologia.value !== 'TODOS' ||
      filtroEstado.value !== 'TODOS'
  )

  const limpiarFiltros = () => {
    filtroBusqueda.value = ''
    rangoTemporal.value = 'mes'
    fechaInicio.value = ''
    fechaFin.value = ''
    filtroEstacion.value = 'TODOS'
    filtroCuadrante.value = 'TODOS'
    filtroTipologia.value = 'TODOS'
    filtroEstado.value = 'TODOS'
    router.replace({ query: {} })
    toast.info('Filtros analíticos restablecidos', {
      autoClose: 1500,
      position: 'bottom-right'
    })
  }

  const alertasFiltradas = computed(() => {
    if (!alertasRaw.value.length) return []
    const ahora = new Date()
    const textoQuery = filtroBusqueda.value.trim().toLowerCase()
    const usaFechasPersonalizadas = Boolean(fechaInicio.value || fechaFin.value)

    return alertasRaw.value.filter((alerta) => {
      const fechaAlertaStr = alerta.created_at || alerta.fecha
      if (fechaAlertaStr) {
        const fechaAlerta = new Date(fechaAlertaStr)
        if (!isNaN(fechaAlerta.getTime())) {
          if (usaFechasPersonalizadas) {
            if (fechaInicio.value) {
              const inicio = new Date(`${fechaInicio.value}T00:00:00`)
              if (fechaAlerta < inicio) return false
            }
            if (fechaFin.value) {
              const fin = new Date(`${fechaFin.value}T23:59:59.999`)
              if (fechaAlerta > fin) return false
            }
          } else {
            if (
              rangoTemporal.value === 'hoy' &&
              (fechaAlerta.getDate() !== ahora.getDate() ||
                fechaAlerta.getMonth() !== ahora.getMonth() ||
                fechaAlerta.getFullYear() !== ahora.getFullYear())
            ) {
              return false
            }
            if (rangoTemporal.value === 'semana') {
              const hace7Dias = new Date()
              hace7Dias.setDate(ahora.getDate() - 7)
              if (fechaAlerta < hace7Dias) return false
            }
            if (
              rangoTemporal.value === 'mes' &&
              (fechaAlerta.getMonth() !== ahora.getMonth() ||
                fechaAlerta.getFullYear() !== ahora.getFullYear())
            ) {
              return false
            }
          }
        }
      }

      if (filtroEstacion.value !== 'TODOS') {
        const idRelacion = String(alerta.id_cuadrante || alerta.base_policial_id || '')
        const cuadAsociado = cuadrantesRaw.value.find((c) => String(c.id) === idRelacion)
        const estacionDeCuad = cuadAsociado
          ? String(cuadAsociado.base_policial_id || cuadAsociado.id_estacion || '')
          : ''
        if (
          idRelacion !== String(filtroEstacion.value) &&
          estacionDeCuad !== String(filtroEstacion.value)
        ) {
          return false
        }
      }

      if (filtroCuadrante.value !== 'TODOS') {
        if (String(alerta.id_cuadrante || '') !== String(filtroCuadrante.value)) return false
      }

      if (
        filtroTipologia.value !== 'TODOS' &&
        (alerta.tipo_alerta || '').toUpperCase() !== filtroTipologia.value.toUpperCase()
      ) {
        return false
      }

      if (
        filtroEstado.value !== 'TODOS' &&
        (alerta.estado_actual || '').toUpperCase() !== filtroEstado.value.toUpperCase()
      ) {
        return false
      }

      if (
        textoQuery &&
        !(
          (alerta.tipo_alerta || '').toLowerCase().includes(textoQuery) ||
          (alerta.estado_actual || '').toLowerCase().includes(textoQuery) ||
          String(alerta.id || '').toLowerCase().includes(textoQuery)
        )
      ) {
        return false
      }

      return true
    })
  })

  const totalAlertas = computed(() => alertasFiltradas.value.length)
  const alertasPendientes = computed(
    () => alertasFiltradas.value.filter((a) => a.estado_actual === 'PENDIENTE').length
  )
  const alertasFinalizadas = computed(
    () =>
      alertasFiltradas.value.filter(
        (a) => a.estado_actual === '5.50 - PROCEDIMIENTO FINALIZADO'
      ).length
  )
  const porcentajeEfectividad = computed(() =>
    totalAlertas.value === 0
      ? 0
      : Math.round((alertasFinalizadas.value / totalAlertas.value) * 100)
  )

  const tiposAlertaStats = computed(() => {
    const counts = {}
    alertasFiltradas.value.forEach((a) => {
      const t = a.tipo_alerta || 'OTRA EMERGENCIA'
      counts[t] = (counts[t] || 0) + 1
    })
    return Object.entries(counts).map(([tipo, cantidad]) => ({ tipo, cantidad }))
  })

  const doughnutData = computed(() => ({
    labels: tiposAlertaStats.value.map((i) => i.tipo),
    datasets: [
      {
        data: tiposAlertaStats.value.map((i) => i.cantidad),
        backgroundColor: [
          '#ef4444',
          '#3b82f6',
          '#f59e0b',
          '#10b981',
          '#8b5cf6',
          '#06b6d4',
          '#f43f5e',
          '#ec4899',
          '#84cc16'
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  }))

  const pieData = computed(() => ({
    labels: tiposAlertaStats.value.map((i) => i.tipo),
    datasets: [
      {
        data: tiposAlertaStats.value.map((i) => i.cantidad),
        backgroundColor: [
          '#0284c7',
          '#06b6d4',
          '#14b8a6',
          '#f43f5e',
          '#8b5cf6',
          '#eab308',
          '#6366f1',
          '#d946ef',
          '#10b981'
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  }))

  const hotspotsData = computed(() => {
    const conteo = {}
    alertasFiltradas.value.forEach((a) => {
      if (a.id_cuadrante) {
        conteo[a.id_cuadrante] = (conteo[a.id_cuadrante] || 0) + 1
      }
    })
    return {
      labels: cuadrantesRaw.value.map((c) => c.nombre || `Cuad. #${c.numero_zona}`),
      datasets: [
        {
          label: 'Incidentes',
          data: cuadrantesRaw.value.map((c) => conteo[c.id] || 0),
          backgroundColor: '#dc2626',
          borderRadius: 6
        }
      ]
    }
  })

  const horizontalHotspotsData = computed(() => {
    const conteo = {}
    basesRaw.value.forEach((b) => {
      conteo[String(b.id)] = { nombre: b.nombre, total: 0 }
    })

    alertasFiltradas.value.forEach((a) => {
      const baseId = String(a.id_cuadrante)
      if (baseId && conteo[baseId]) {
        conteo[baseId].total += 1
      }
    })

    return {
      labels: Object.values(conteo).map((b) => b.nombre),
      datasets: [
        {
          label: 'Volumen Zonal',
          data: Object.values(conteo).map((b) => b.total),
          backgroundColor: '#0284c7',
          borderRadius: 6
        }
      ]
    }
  })

  const hourlyDistributionData = computed(() => {
    const horas = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
    const conteoPorHora = new Array(24).fill(0)

    alertasFiltradas.value.forEach((a) => {
      const fechaStr = a.created_at || a.fecha
      if (fechaStr) {
        const fecha = new Date(fechaStr)
        if (!isNaN(fecha.getTime())) {
          conteoPorHora[fecha.getHours()] += 1
        }
      }
    })

    return {
      labels: horas,
      datasets: [
        {
          label: 'Reportes por Hora',
          data: conteoPorHora,
          backgroundColor: '#7c3aed',
          borderRadius: 5
        }
      ]
    }
  })

  const timelineLineData = computed(() => ({
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Incidentes Reportados',
        data: [4, 6, 5, 8, 12, 15, 9],
        borderColor: '#d97706',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.3
      }
    ]
  }))

  const statusBarsData = computed(() => {
    const enProceso = Math.max(
      0,
      totalAlertas.value - alertasPendientes.value - alertasFinalizadas.value
    )
    return {
      labels: ['Pendientes', 'En Proceso', 'Finalizados'],
      datasets: [
        {
          label: 'Casos',
          data: [alertasPendientes.value, enProceso, alertasFinalizadas.value],
          backgroundColor: ['#d97706', '#2563eb', '#059669'],
          borderRadius: 6
        }
      ]
    }
  })

  const nombreEstacionSeleccionada = computed(() => {
    if (filtroEstacion.value === 'TODOS') return 'Todas'
    return (
      basesRaw.value.find((b) => String(b.id) === String(filtroEstacion.value))?.nombre ||
      filtroEstacion.value
    )
  })

  const nombreCuadranteSeleccionado = computed(() => {
    if (filtroCuadrante.value === 'TODOS') return 'Todos'
    const c = cuadrantesRaw.value.find((item) => String(item.id) === String(filtroCuadrante.value))
    return c ? c.nombre || `Cuadrante #${c.numero_zona}` : filtroCuadrante.value
  })

  const etiquetaRangoActual = computed(() =>
    fechaInicio.value || fechaFin.value
      ? `${fechaInicio.value || 'Inicio'} a ${fechaFin.value || 'Actual'}`
      : rangoTemporal.value
  )

  const objetoMetricasParaIA = computed(() => ({
    municipio: 'Tuluá, Valle del Cauca',
    rango_temporal: etiquetaRangoActual.value,
    filtro_estacion: nombreEstacionSeleccionada.value,
    filtro_cuadrante: nombreCuadranteSeleccionado.value,
    filtro_tipologia: filtroTipologia.value,
    filtro_estado: filtroEstado.value,
    total_incidentes_filtrados: totalAlertas.value,
    incidentes_pendientes: alertasPendientes.value,
    incidentes_finalizados: alertasFinalizadas.value,
    efectividad_operativa_porcentaje: porcentajeEfectividad.value,
    total_bases_policiales: basesRaw.value.length,
    total_cuadrantes_operativos: cuadrantesRaw.value.length,
    reportes_con_evidencia_multimedia: alertasFiltradas.value.filter(
      (a) => a.alerta_fotos && a.alerta_fotos.length > 0
    ).length,
    desglose_por_tipo_emergencia: tiposAlertaStats.value,
    distribucion_horaria: hourlyDistributionData.value.labels
      .map((h, idx) => ({
        hora: h,
        reportes: hourlyDistributionData.value.datasets[0].data[idx]
      }))
      .filter((x) => x.reportes > 0),
    estado_sistema: 'Operativo en Tiempo Real con Supabase y GECAP'
  }))

  let timeoutNotificacion = null
  let timeoutTransicion = null

  watch(
    [
      filtroBusqueda,
      rangoTemporal,
      fechaInicio,
      fechaFin,
      filtroEstacion,
      filtroCuadrante,
      filtroTipologia,
      filtroEstado
    ],
    () => {
      if (cargandoDatos.value) return

      const queryParams = {}
      if (filtroBusqueda.value.trim()) queryParams.busqueda = filtroBusqueda.value.trim()
      if (rangoTemporal.value !== 'mes' && !fechaInicio.value && !fechaFin.value) {
        queryParams.rango = rangoTemporal.value
      }
      if (fechaInicio.value) queryParams.desde = fechaInicio.value
      if (fechaFin.value) queryParams.hasta = fechaFin.value
      if (filtroEstacion.value !== 'TODOS') queryParams.estacion = filtroEstacion.value
      if (filtroCuadrante.value !== 'TODOS') queryParams.cuadrante = filtroCuadrante.value
      if (filtroTipologia.value !== 'TODOS') queryParams.tipologia = filtroTipologia.value
      if (filtroEstado.value !== 'TODOS') queryParams.estado = filtroEstado.value

      router.replace({ query: queryParams })
      actualizandoFiltro.value = true
      clearTimeout(timeoutTransicion)
      timeoutTransicion = setTimeout(() => {
        actualizandoFiltro.value = false
      }, 250)

      clearTimeout(timeoutNotificacion)
      timeoutNotificacion = setTimeout(() => {
        toast.success(`Filtros aplicados: ${totalAlertas.value} incidentes analizados`, {
          autoClose: 1800,
          position: 'bottom-right',
          hideProgressBar: true
        })
      }, 400)
    },
    { deep: true }
  )

  onBeforeUnmount(() => {
    clearTimeout(timeoutNotificacion)
    clearTimeout(timeoutTransicion)
  })

  return {
    cargandoDatos,
    actualizando,
    actualizandoFiltro,
    filtroBusqueda,
    rangoTemporal,
    fechaInicio,
    fechaFin,
    filtroEstacion,
    filtroCuadrante,
    filtroTipologia,
    filtroEstado,
    basesRaw,
    cuadrantesFiltradosPorEstacion,
    tipologiasDisponibles,
    hayFiltrosActivos,
    totalAlertas,
    alertasPendientes,
    alertasFinalizadas,
    porcentajeEfectividad,
    doughnutData,
    pieData,
    hourlyDistributionData,
    hotspotsData,
    horizontalHotspotsData,
    timelineLineData,
    statusBarsData,
    nombreEstacionSeleccionada,
    nombreCuadranteSeleccionado,
    etiquetaRangoActual,
    objetoMetricasParaIA,
    cargarDatosMetricas,
    actualizarRangoRapido,
    limpiarFiltros
  }
}