<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { marked } from 'marked'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js'
import { ArrowLeft, BarChart3, RefreshCw, Loader2, Brain, ChevronLeft, FileDown } from 'lucide-vue-next'

import { useAiReportStore } from '../stores/aiReportStore'
import { useMetricsAnalytics } from '../composables/useMetricsAnalytics'
import { useMetricsPdfExport } from '../composables/useMetricsPdfExport'
import { toast } from 'vue3-toastify'

import MetricsFiltersSidebar from '../components/policia/MetricsFiltersSidebar.vue'
import MetricsActiveFiltersBar from '../components/policia/MetricsActiveFiltersBar.vue'
import MetricsKpiCards from '../components/policia/MetricsKpiCards.vue'
import MetricsChartsGrid from '../components/policia/MetricsChartsGrid.vue'
import MetricsAiPanel from '../components/policia/MetricsAiPanel.vue'

ChartJS.register(Title, Tooltip, Legend, ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Filler)

const router = useRouter()
const aiStore = useAiReportStore()
const { isLoading, generatedReport, error } = storeToRefs(aiStore)

const panelIaColapsado = ref(false)
const sidebarFiltrosColapsado = ref(false)
const chartsGridRef = ref(null)

const {
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
} = useMetricsAnalytics()

const { exportandoPdf, exportarReportePdf } = useMetricsPdfExport()

onMounted(() => {
  cargarDatosMetricas()
})

const handleGenerarReporte = async () => {
  if (totalAlertas.value === 0) {
    toast.warning('No hay suficientes datos de alertas con los filtros actuales para analizar.')
    return
  }
  panelIaColapsado.value = false
  await aiStore.generateTacticalReport(objetoMetricasParaIA.value)
  if (!aiStore.error) toast.success('¡Informe táctico generado con éxito!')
}

const handleExportarPdf = () => {
  exportarReportePdf({
    contenedorGraficas: chartsGridRef.value?.contenedorRef || null,
    kpis: {
      totalAlertas: totalAlertas.value,
      alertasPendientes: alertasPendientes.value,
      alertasFinalizadas: alertasFinalizadas.value,
      porcentajeEfectividad: porcentajeEfectividad.value
    },
    filtrosMeta: {
      rangoTemporal: etiquetaRangoActual.value.toUpperCase(),
      estacion: nombreEstacionSeleccionada.value,
      cuadrante: nombreCuadranteSeleccionado.value,
      tipologia: filtroTipologia.value,
      estado: filtroEstado.value
    },
    reporteMarkdown: generatedReport.value
  })
}

const reporteHtmlFormateado = computed(() =>
  generatedReport.value ? marked(generatedReport.value) : ''
)
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-slate-100 text-slate-900 font-sans overflow-hidden select-none">

    <!-- HEADER SUPERIOR -->
    <header class="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0 shadow-md z-20">
      <div class="flex items-center gap-3">
        <button
          @click="router.push('/policia/MenuPrincipal')"
          class="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition cursor-pointer"
          title="Volver al Menú Principal"
        >
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
        <button
          @click="handleExportarPdf"
          :disabled="exportandoPdf || cargandoDatos"
          class="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
          title="Exportar métricas, gráficas e informe IA (si está generado) a PDF"
        >
          <Loader2 v-if="exportandoPdf" class="w-4 h-4 animate-spin" />
          <FileDown v-else class="w-4 h-4" />
          <span class="hidden md:inline">{{ exportandoPdf ? 'Generando PDF...' : 'Exportar PDF' }}</span>
        </button>

        <button
          @click="cargarDatosMetricas(true)"
          :disabled="actualizando || cargandoDatos"
          class="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition cursor-pointer shadow-sm"
        >
          <RefreshCw :class="['w-4 h-4 text-sky-400', { 'animate-spin': actualizando }]" />
          <span class="hidden md:inline">Sincronizar</span>
        </button>
      </div>
    </header>

    <div class="flex-1 flex overflow-hidden relative">

      <!-- SIDEBAR DE FILTROS -->
      <MetricsFiltersSidebar
        v-model:colapsado="sidebarFiltrosColapsado"
        v-model:filtroBusqueda="filtroBusqueda"
        :rangoTemporal="rangoTemporal"
        @update:rangoTemporal="actualizarRangoRapido"
        v-model:fechaInicio="fechaInicio"
        v-model:fechaFin="fechaFin"
        v-model:filtroEstacion="filtroEstacion"
        v-model:filtroCuadrante="filtroCuadrante"
        v-model:filtroTipologia="filtroTipologia"
        v-model:filtroEstado="filtroEstado"
        :basesDisponibles="basesRaw"
        :cuadrantesDisponibles="cuadrantesFiltradosPorEstacion"
        :tipologiasDisponibles="tipologiasDisponibles"
        :hayFiltrosActivos="hayFiltrosActivos"
        :totalAlertas="totalAlertas"
        @limpiar="limpiarFiltros"
      />

      <!-- CONTENEDOR PRINCIPAL -->
      <main class="flex-1 flex flex-col gap-5 overflow-y-auto p-6 bg-slate-100 custom-scrollbar transition-all duration-300">

        <MetricsActiveFiltersBar
          :hayFiltrosActivos="hayFiltrosActivos"
          :filtroBusqueda="filtroBusqueda"
          :rangoTemporal="rangoTemporal"
          :fechaInicio="fechaInicio"
          :fechaFin="fechaFin"
          :filtroEstacion="filtroEstacion"
          :filtroCuadrante="filtroCuadrante"
          :filtroTipologia="filtroTipologia"
          :filtroEstado="filtroEstado"
          :nombreEstacionSeleccionada="nombreEstacionSeleccionada"
          :nombreCuadranteSeleccionado="nombreCuadranteSeleccionado"
          @update:filtroBusqueda="filtroBusqueda = $event"
          @update:rangoTemporal="rangoTemporal = $event"
          @limpiar-fechas="fechaInicio = ''; fechaFin = ''"
          @update:filtroEstacion="filtroEstacion = $event"
          @update:filtroCuadrante="filtroCuadrante = $event"
          @update:filtroTipologia="filtroTipologia = $event"
          @update:filtroEstado="filtroEstado = $event"
          @limpiar-todos="limpiarFiltros"
        />

        <!-- SPINNER DE CARGA -->
        <div
          v-if="cargandoDatos"
          class="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm"
        >
          <Loader2 class="w-10 h-10 text-red-600 animate-spin mb-3" />
          <p class="text-sm font-bold text-slate-600">Sincronizando flujos operativos de GECAP...</p>
        </div>

        <template v-else>
          <MetricsKpiCards
            :totalAlertas="totalAlertas"
            :alertasPendientes="alertasPendientes"
            :alertasFinalizadas="alertasFinalizadas"
            :porcentajeEfectividad="porcentajeEfectividad"
          />

          <MetricsChartsGrid
            ref="chartsGridRef"
            :actualizandoFiltro="actualizandoFiltro"
            :panelIaColapsado="panelIaColapsado"
            :doughnutData="doughnutData"
            :pieData="pieData"
            :hourlyDistributionData="hourlyDistributionData"
            :hotspotsData="hotspotsData"
            :horizontalHotspotsData="horizontalHotspotsData"
            :timelineLineData="timelineLineData"
            :statusBarsData="statusBarsData"
          />
        </template>

      </main>

      <!-- PANEL LATERAL DE IA -->
      <MetricsAiPanel
        v-model:colapsado="panelIaColapsado"
        :isLoading="isLoading"
        :error="error"
        :generatedReport="generatedReport"
        :reporteHtmlFormateado="reporteHtmlFormateado"
        :cargandoDatos="cargandoDatos"
        :exportandoPdf="exportandoPdf"
        @limpiar="aiStore.limpiarReporte"
        @generar="handleGenerarReporte"
        @exportar-pdf="handleExportarPdf"
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