<!-- name=MetricsView.vue -->
<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { marked } from 'marked'
import { Doughnut, Bar, Line, Pie } from 'vue-chartjs'
import {Chart as ChartJS,Title,Tooltip,Legend,ArcElement,BarElement,CategoryScale,LinearScale,PointElement, LineElement} from 'chart.js'
import { ArrowLeft, BarChart3, ShieldAlert, Clock,  MapPin, RefreshCw, Loader2, PieChart, Activity, TrendingUp,  Filter,  X,Brain,ChevronLeft} from 'lucide-vue-next'

import { reportesService } from '../services/reportesService'
import { cuadrantesService } from '../services/cuadrantesService'
import { useAiReportStore } from '../stores/aiReportStore'
import { toast } from 'vue3-toastify'

// Importar subcomponentes modulares
import MetricsFiltersSidebar from '../components/policia/MetricsFiltersSidebar.vue'
import MetricsKpiCards from '../components/policia/MetricsKpiCards.vue'
import MetricsAiPanel from '../components/policia/MetricsAiPanel.vue'

ChartJS.register(Title, Tooltip, Legend, ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement)

const router = useRouter()
const route = useRoute()
const aiStore = useAiReportStore()
const { isLoading, generatedReport, error } = storeToRefs(aiStore)

const cargandoDatos = ref(true)
const actualizando = ref(false)
const actualizandoFiltro = ref(false)
const panelIaColapsado = ref(false)
const sidebarFiltrosColapsado = ref(false)

const filtroBusqueda = ref(route.query.busqueda || '')
const rangoTemporal = ref(route.query.rango || 'mes')
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

    if (esActualizacion) toast.success('Datos analíticos sincronizados en tiempo real.')
  } catch (err) {
    console.error('Error al cargar datos para métricas:', err)
    toast.error('Error al sincronizar datos analíticos.')
  } finally {
    cargandoDatos.value = false
    actualizando.value = false
  }
}

onMounted(() => { cargarDatosMetricas() })

let timeoutNotificacion = null
watch([filtroBusqueda, rangoTemporal, filtroTipologia, filtroEstado], () => {
  if (cargandoDatos.value) return

  const queryParams = {}
  if (filtroBusqueda.value.trim()) queryParams.busqueda = filtroBusqueda.value.trim()
  if (rangoTemporal.value !== 'mes') queryParams.rango = rangoTemporal.value
  if (filtroTipologia.value !== 'TODOS') queryParams.tipologia = filtroTipologia.value
  if (filtroEstado.value !== 'TODOS') queryParams.estado = filtroEstado.value

  router.replace({ query: queryParams })
  actualizandoFiltro.value = true
  setTimeout(() => { actualizandoFiltro.value = false }, 250)

  clearTimeout(timeoutNotificacion)
  timeoutNotificacion = setTimeout(() => {
    toast.success(`Filtros aplicados: ${totalAlertas.value} incidentes analizados`, { autoClose: 1800, position: 'bottom-right', hideProgressBar: true })
  }, 400)
}, { deep: true })

const tipologiasDisponibles = computed(() => [...new Set(alertasRaw.value.map(a => a.tipo_alerta).filter(Boolean))].sort())

const hayFiltrosActivos = computed(() => filtroBusqueda.value.trim() !== '' || rangoTemporal.value !== 'mes' || filtroTipologia.value !== 'TODOS' || filtroEstado.value !== 'TODOS')

const limpiarFiltros = () => {
  filtroBusqueda.value = ''
  rangoTemporal.value = 'mes'
  filtroTipologia.value = 'TODOS'
  filtroEstado.value = 'TODOS'
  router.replace({ query: {} })
  toast.info('Filtros analíticos restablecidos', { autoClose: 1500, position: 'bottom-right' })
}

const alertasFiltradas = computed(() => {
  if (!alertasRaw.value.length) return []
  const ahora = new Date()
  const textoQuery = filtroBusqueda.value.trim().toLowerCase()

  return alertasRaw.value.filter(alerta => {
    const fechaAlertaStr = alerta.created_at || alerta.fecha
    if (fechaAlertaStr) {
      const fechaAlerta = new Date(fechaAlertaStr)
      if (!isNaN(fechaAlerta.getTime())) {
        if (rangoTemporal.value === 'hoy' && (fechaAlerta.getDate() !== ahora.getDate() || fechaAlerta.getMonth() !== ahora.getMonth() || fechaAlerta.getFullYear() !== ahora.getFullYear())) return false
        if (rangoTemporal.value === 'semana') {
          const hace7Dias = new Date()
          hace7Dias.setDate(ahora.getDate() - 7)
          if (fechaAlerta < hace7Dias) return false
        }
        if (rangoTemporal.value === 'mes' && (fechaAlerta.getMonth() !== ahora.getMonth() || fechaAlerta.getFullYear() !== ahora.getFullYear())) return false
      }
    }
    if (filtroTipologia.value !== 'TODOS' && (alerta.tipo_alerta || '').toUpperCase() !== filtroTipologia.value.toUpperCase()) return false
    if (filtroEstado.value !== 'TODOS' && (alerta.estado_actual || '').toUpperCase() !== filtroEstado.value.toUpperCase()) return false
    if (textoQuery && !((alerta.tipo_alerta || '').toLowerCase().includes(textoQuery) || (alerta.estado_actual || '').toLowerCase().includes(textoQuery) || String(alerta.id || '').toLowerCase().includes(textoQuery))) return false
    return true
  })
})

const totalAlertas = computed(() => alertasFiltradas.value.length)
const alertasPendientes = computed(() => alertasFiltradas.value.filter(a => a.estado_actual === 'PENDIENTE').length)
const alertasFinalizadas = computed(() => alertasFiltradas.value.filter(a => a.estado_actual === '5.50 - PROCEDIMIENTO FINALIZADO').length)
const porcentajeEfectividad = computed(() => totalAlertas.value === 0 ? 0 : Math.round((alertasFinalizadas.value / totalAlertas.value) * 100))

const tiposAlertaStats = computed(() => {
  const counts = {}
  alertasFiltradas.value.forEach(a => { const t = a.tipo_alerta || 'OTRA EMERGENCIA'; counts[t] = (counts[t] || 0) + 1 })
  return Object.entries(counts).map(([tipo, cantidad]) => ({ tipo, cantidad }))
})

// Gráficas de Chart.js
const circularOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 14, boxHeight: 14, font: { family: 'Inter, sans-serif', size: 12 }, color: '#334155', padding: 16 } } } }
const axisOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#64748b' } }, y: { grid: { color: 'rgba(226, 232, 240, 0.8)' }, ticks: { font: { size: 11 }, color: '#64748b', precision: 0 } } } }

const doughnutData = computed(() => ({ labels: tiposAlertaStats.value.map(i => i.tipo), datasets: [{ data: tiposAlertaStats.value.map(i => i.cantidad), backgroundColor: ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#f43f5e', '#ec4899', '#84cc16'], borderWidth: 2, borderColor: '#ffffff' }] }))
const pieData = computed(() => ({ labels: tiposAlertaStats.value.map(i => i.tipo), datasets: [{ data: tiposAlertaStats.value.map(i => i.cantidad), backgroundColor: ['#0284c7', '#06b6d4', '#14b8a6', '#f43f5e', '#8b5cf6', '#eab308', '#6366f1', '#d946ef', '#10b981'], borderWidth: 2, borderColor: '#ffffff' }] }))

const hotspotsData = computed(() => {
  const conteo = {}
  alertasFiltradas.value.forEach(a => { if (a.cuadrante_id) conteo[a.cuadrante_id] = (conteo[a.cuadrante_id] || 0) + 1 })
  return { labels: cuadrantesRaw.value.map(c => c.nombre || `Cuad. #${c.numero_zona}`), datasets: [{ label: 'Incidentes', data: cuadrantesRaw.value.map(c => conteo[c.id] || 0), backgroundColor: '#dc2626', borderRadius: 6 }] }
})

const horizontalHotspotsData = computed(() => {
  const conteo = {}
  basesRaw.value.forEach(b => { conteo[b.id] = { nombre: b.nombre, total: 0 } })
  alertasFiltradas.value.forEach(a => {
    const cuad = cuadrantesRaw.value.find(c => c.id === a.cuadrante_id)
    if (cuad && conteo[cuad.base_policial_id]) conteo[cuad.base_policial_id].total += 1
  })
  return { labels: Object.values(conteo).map(b => b.nombre), datasets: [{ label: 'Volumen Zonal', data: Object.values(conteo).map(b => b.total), backgroundColor: '#0284c7', borderRadius: 6 }] }
})

const timelineLineData = computed(() => ({ labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], datasets: [{ label: 'Incidentes Reportados', data: [4, 6, 5, 8, 12, 15, 9], borderColor: '#d97706', backgroundColor: 'rgba(245, 158, 11, 0.1)', fill: true, tension: 0.3 }] }))
const responseTimesBarData = computed(() => ({ labels: ['Riñas', 'Hurto', 'Ruido', 'Emergencia Vial', 'Otros'], datasets: [{ label: 'Minutos Promedio', data: [6.2, 4.8, 9.5, 7.1, 5.5], backgroundColor: '#059669', borderRadius: 6 }] }))
const statusBarsData = computed(() => {
  const enProceso = Math.max(0, totalAlertas.value - alertasPendientes.value - alertasFinalizadas.value)
  return { labels: ['Pendientes', 'En Proceso', 'Finalizados'], datasets: [{ label: 'Casos', data: [alertasPendientes.value, enProceso, alertasFinalizadas.value], backgroundColor: ['#d97706', '#2563eb', '#059669'], borderRadius: 6 }] }
})

const objetoMetricasParaIA = computed(() => ({
  municipio: "Tuluá, Valle del Cauca",
  rango_temporal: rangoTemporal.value,
  filtro_tipologia: filtroTipologia.value,
  filtro_estado: filtroEstado.value,
  total_incidentes_filtrados: totalAlertas.value,
  incidentes_pendientes: alertasPendientes.value,
  incidentes_finalizados: alertasFinalizadas.value,
  efectividad_operativa_porcentaje: porcentajeEfectividad.value,
  total_bases_policiales: basesRaw.value.length,
  total_cuadrantes_operativos: cuadrantesRaw.value.length,
  reportes_con_evidencia_multimedia: alertasFiltradas.value.filter(a => a.alerta_fotos && a.alerta_fotos.length > 0).length,
  desglose_por_tipo_emergencia: tiposAlertaStats.value,
  estado_sistema: "Operativo en Tiempo Real con Supabase y GECAP"
}))

const handleGenerarReporte = async () => {
  if (totalAlertas.value === 0) { toast.warning('No hay suficientes datos de alertas con los filtros actuales para analizar.'); return }
  panelIaColapsado.value = false
  await aiStore.generateTacticalReport(objetoMetricasParaIA.value)
  if (!aiStore.error) toast.success('¡Informe táctico generado con éxito!')
}

const reporteHtmlFormateado = computed(() => generatedReport.value ? marked(generatedReport.value) : '')
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-slate-100 text-slate-900 font-sans overflow-hidden select-none">
    
    <!-- HEADER SUPERIOR -->
    <header class="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0 shadow-md z-20">
      <div class="flex items-center gap-3">
        <button @click="router.push('/policia/MenuPrincipal')" class="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition cursor-pointer" title="Volver al Menú Principal">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
            <BarChart3 class="w-5 h-5 text-red-500" /> GECAP — Centro de Mando y Analítica Táctica
          </h1>
          <p class="text-xs text-slate-400">Monitoreo operacional en tiempo real</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button @click="cargarDatosMetricas(true)" :disabled="actualizando || cargandoDatos" class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition cursor-pointer shadow-sm">
          <RefreshCw :class="['w-4 h-4 text-sky-400', { 'animate-spin': actualizando }]" />
          <span class="hidden md:inline">Sincronizar</span>
        </button>
      </div>
    </header>

    <div class="flex-1 flex overflow-hidden relative">
      
      <!-- SIDEBAR DE FILTROS MODULARIZADO -->
      <MetricsFiltersSidebar 
        v-model:colapsado="sidebarFiltrosColapsado"
        v-model:filtroBusqueda="filtroBusqueda"
        v-model:rangoTemporal="rangoTemporal"
        v-model:filtroTipologia="filtroTipologia"
        v-model:filtroEstado="filtroEstado"
        :tipologiasDisponibles="tipologiasDisponibles"
        :hayFiltrosActivos="hayFiltrosActivos"
        :totalAlertas="totalAlertas"
        @limpiar="limpiarFiltros"
      />

      <!-- CONTENEDOR PRINCIPAL -->
      <main class="flex-1 flex flex-col gap-5 overflow-y-auto p-6 bg-slate-100 custom-scrollbar transition-all duration-300">
        
        <!-- CHIPS DE FILTROS ACTIVOS -->
        <div v-if="hayFiltrosActivos" class="bg-white border border-slate-200 p-3 rounded-2xl flex flex-wrap items-center gap-2 shadow-sm">
          <span class="text-[11px] font-bold uppercase text-slate-500 mr-2 flex items-center gap-1">
            <Filter class="w-3 h-3 text-red-600" /> Filtros Activos:
          </span>

          <div v-if="filtroBusqueda.trim()" class="bg-slate-100 text-slate-800 text-xs px-3 py-1 rounded-xl border border-slate-200 flex items-center gap-1.5 font-medium">
            <span>Búsqueda: "{{ filtroBusqueda }}"</span>
            <button @click="filtroBusqueda = ''" class="hover:text-red-600"><X class="w-3.5 h-3.5" /></button>
          </div>

          <div v-if="rangoTemporal !== 'mes'" class="bg-slate-100 text-slate-800 text-xs px-3 py-1 rounded-xl border border-slate-200 flex items-center gap-1.5 font-medium">
            <span>Rango: {{ rangoTemporal.toUpperCase() }}</span>
            <button @click="rangoTemporal = 'mes'" class="hover:text-red-600"><X class="w-3.5 h-3.5" /></button>
          </div>

          <div v-if="filtroTipologia !== 'TODOS'" class="bg-slate-100 text-slate-800 text-xs px-3 py-1 rounded-xl border border-slate-200 flex items-center gap-1.5 font-medium">
            <span>Tipo: {{ filtroTipologia }}</span>
            <button @click="filtroTipologia = 'TODOS'" class="hover:text-red-600"><X class="w-3.5 h-3.5" /></button>
          </div>

          <div v-if="filtroEstado !== 'TODOS'" class="bg-slate-100 text-slate-800 text-xs px-3 py-1 rounded-xl border border-slate-200 flex items-center gap-1.5 font-medium">
            <span>Estado: {{ filtroEstado }}</span>
            <button @click="filtroEstado = 'TODOS'" class="hover:text-red-600"><X class="w-3.5 h-3.5" /></button>
          </div>

          <button @click="limpiarFiltros" class="ml-auto text-xs text-red-600 hover:text-red-700 font-bold underline cursor-pointer">
            Limpiar filtros
          </button>
        </div>

        <!-- SPINNER DE CARGA -->
        <div v-if="cargandoDatos" class="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 class="w-10 h-10 text-red-600 animate-spin mb-3" />
          <p class="text-sm font-bold text-slate-600">Sincronizando flujos operativos de GECAP...</p>
        </div>

        <template v-else>
          <!-- TARJETAS DE KPIs (MODULARIZADO) -->
          <MetricsKpiCards 
            :totalAlertas="totalAlertas"
            :alertasPendientes="alertasPendientes"
            :alertasFinalizadas="alertasFinalizadas"
            :porcentajeEfectividad="porcentajeEfectividad"
          />

          <!-- BENTO GRID DE GRÁFICAS -->
          <div :class="['grid grid-cols-1 gap-5 justify-center items-center transition-opacity duration-200', actualizandoFiltro ? 'opacity-40' : 'opacity-100', panelIaColapsado ? 'md:grid-cols-3' : 'md:grid-cols-2']">
            
            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between md:col-span-3">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <h3 class="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <PieChart class="w-5 h-5 text-sky-600" /> Distribución por Tipología de Alerta
                  </h3>
                  <span class="text-xs text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full font-semibold">Proporción</span>
                </div>
                <p class="text-xs text-slate-500 mb-4">Clasificación porcentual de los incidentes según el tipo de emergencia reportada por la ciudadanía.</p>
              </div>
              <div class="relative h-80 w-full flex items-center justify-center">
                <Doughnut :data="doughnutData" :options="circularOptions" />
              </div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between md:col-span-3">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <h3 class="text-base font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Activity class="w-5 h-5 text-purple-600" /> Participación Relativa de Eventos
                  </h3>
                  <span class="text-xs text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full font-semibold">Porcentaje</span>
                </div>
                <p class="text-xs text-slate-500 mb-4">Peso relativo de cada tipología frente al volumen total de incidentes activos en el sistema.</p>
              </div>
              <div class="relative h-80 w-full flex items-center justify-center">
                <Pie :data="pieData" :options="circularOptions" />
              </div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <MapPin class="w-4 h-4 text-red-600" /> Puntos Críticos por Cuadrante
                  </h3>
                  <span class="text-[11px] text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full font-semibold">Prioridad Alta</span>
                </div>
                <p class="text-xs text-slate-500 mb-4">Identificación de los cuadrantes con mayor densidad de denuncias.</p>
              </div>
              <div class="relative h-60 w-full"><Bar :data="hotspotsData" :options="axisOptions" /></div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Building class="w-4 h-4 text-blue-600" /> Carga por Base Policial / CAI
                  </h3>
                  <span class="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full font-semibold">Volumen Zonal</span>
                </div>
                <p class="text-xs text-slate-500 mb-4">Volumen de intervenciones asignadas por Subestación o CAI.</p>
              </div>
              <div class="relative h-60 w-full"><Bar :data="horizontalHotspotsData" :options="axisOptions" /></div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp class="w-4 h-4 text-amber-600" /> Tendencia Semanal de Incidentes
                  </h3>
                  <span class="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">Comportamiento</span>
                </div>
                <p class="text-xs text-slate-500 mb-4">Evolución temporal del flujo de reportes en la semana.</p>
              </div>
              <div class="relative h-60 w-full"><Line :data="timelineLineData" :options="axisOptions" /></div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Clock class="w-4 h-4 text-emerald-600" /> Tiempos de Respuesta
                  </h3>
                  <span class="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">Minutos</span>
                </div>
                <p class="text-xs text-slate-500 mb-4">Promedio en minutos que tardan las patrullas en atender emergencias.</p>
              </div>
              <div class="relative h-60 w-full"><Bar :data="responseTimesBarData" :options="axisOptions" /></div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between md:col-span-1">
              <div>
                <div class="flex items-center justify-between mb-1">
                  <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert class="w-4 h-4 text-indigo-600" /> Estado del Flujo Operativo de Casos
                  </h3>
                  <span class="text-[11px] text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full font-semibold">Gestión Activa</span>
                </div>
                <p class="text-xs text-slate-500 mb-4">Desglose actual de expedientes entre pendientes, en proceso y finalizados.</p>
              </div>
              <div class="relative h-60 w-full"><Bar :data="statusBarsData" :options="axisOptions" /></div>
            </div>

          </div>
        </template>

      </main>

      <!-- PANEL LATERAL DE IA (MODULARIZADO) -->
      <MetricsAiPanel 
        v-model:colapsado="panelIaColapsado"
        :isLoading="isLoading"
        :error="error"
        :generatedReport="generatedReport"
        :reporteHtmlFormateado="reporteHtmlFormateado"
        :cargandoDatos="cargandoDatos"
        @limpiar="aiStore.limpiarReporte"
        @generar="handleGenerarReporte"
      />

      <!-- BOTÓN FLOTANTE DE IA -->
      <transition name="fade">
        <button 
          v-if="panelIaColapsado"
          @click="panelIaColapsado = false"
          class="fixed bottom-6 right-6 z-50 bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 text-white p-4 rounded-full shadow-2xl flex items-center justify-center gap-2.5 transition transform hover:scale-105 cursor-pointer group"
          title="Abrir Informe Ejecutivo Gemini"
        >
          <Brain class="w-6 h-6 animate-pulse text-white" />
          <span class="text-xs font-black uppercase tracking-wider text-white hidden sm:inline">Informe IA</span>
          <ChevronLeft class="w-5 h-5 text-white" />
        </button>
      </transition>

    </div>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(241, 245, 249, 0.6); }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(203, 213, 225, 1); border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 1); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>