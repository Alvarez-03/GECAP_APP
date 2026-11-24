<script setup>
import { ref } from 'vue'
import { Doughnut, Bar, Line, Pie } from 'vue-chartjs'
import { PieChart, Activity, Clock, MapPin, Building, TrendingUp, ShieldAlert } from 'lucide-vue-next'
import { circularChartOptions, axisChartOptions } from '../../composables/useMetricsAnalytics'

defineProps({
  actualizandoFiltro: Boolean,
  panelIaColapsado: Boolean,
  doughnutData: Object,
  pieData: Object,
  hourlyDistributionData: Object,
  hotspotsData: Object,
  horizontalHotspotsData: Object,
  timelineLineData: Object,
  statusBarsData: Object
})

const contenedorRef = ref(null)
defineExpose({ contenedorRef })
</script>

<template>
  <div
    ref="contenedorRef"
    :class="[
      'grid grid-cols-1 gap-5 justify-center items-center transition-opacity duration-200',
      actualizandoFiltro ? 'opacity-40' : 'opacity-100',
      panelIaColapsado ? 'md:grid-cols-3' : 'md:grid-cols-2'
    ]"
  >
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
        <Doughnut :data="doughnutData" :options="circularChartOptions" />
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
        <Pie :data="pieData" :options="circularChartOptions" />
      </div>
    </div>

    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between md:col-span-3">
      <div>
        <div class="flex items-center justify-between mb-1">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock class="w-4 h-4 text-violet-600" /> Distribución Horaria de Reportes (24h)
          </h3>
          <span class="text-[11px] text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full font-semibold">Horas Pico</span>
        </div>
        <p class="text-xs text-slate-500 mb-4">Cantidad de incidentes registrados según la hora del día (00:00 a 23:00).</p>
      </div>
      <div class="relative h-64 w-full">
        <Bar :data="hourlyDistributionData" :options="axisChartOptions" />
      </div>
    </div>

    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between md:col-span-3">
      <div>
        <div class="flex items-center justify-between mb-1">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <MapPin class="w-4 h-4 text-red-600" /> Puntos Críticos por Cuadrante
          </h3>
          <span class="text-[11px] text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full font-semibold">Prioridad Alta</span>
        </div>
        <p class="text-xs text-slate-500 mb-4">Identificación de los cuadrantes con mayor densidad de denuncias.</p>
      </div>
      <div class="relative h-60 w-full">
        <Bar :data="hotspotsData" :options="axisChartOptions" />
      </div>
    </div>

    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between md:col-span-3">
      <div>
        <div class="flex items-center justify-between mb-1">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building class="w-4 h-4 text-blue-600" /> Carga por Base Policial / CAI
          </h3>
          <span class="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full font-semibold">Volumen Zonal</span>
        </div>
        <p class="text-xs text-slate-500 mb-4">Volumen de intervenciones asignadas por Subestación o CAI.</p>
      </div>
      <div class="relative h-60 w-full">
        <Bar :data="horizontalHotspotsData" :options="axisChartOptions" />
      </div>
    </div>

    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between md:col-span-3">
      <div>
        <div class="flex items-center justify-between mb-1">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp class="w-4 h-4 text-amber-600" /> Tendencia Semanal de Incidentes
          </h3>
          <span class="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">Comportamiento</span>
        </div>
        <p class="text-xs text-slate-500 mb-4">Evolución temporal del flujo de reportes en la semana.</p>
      </div>
      <div class="relative h-60 w-full">
        <Line :data="timelineLineData" :options="axisChartOptions" />
      </div>
    </div>

    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between md:col-span-3">
      <div>
        <div class="flex items-center justify-between mb-1">
          <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert class="w-4 h-4 text-indigo-600" /> Estado del Flujo Operativo de Casos
          </h3>
          <span class="text-[11px] text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full font-semibold">Gestión Activa</span>
        </div>
        <p class="text-xs text-slate-500 mb-4">Desglose actual de expedientes entre pendientes, en proceso y finalizados.</p>
      </div>
      <div class="relative h-60 w-full">
        <Bar :data="statusBarsData" :options="axisChartOptions" />
      </div>
    </div>
  </div>
</template>