<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronRight, ShieldAlert, Clock, Filter } from 'lucide-vue-next'
import { reportesService } from '../services/reportesService'
import { supabase } from '../services/supabase'
import { toast } from 'vue3-toastify'

import NavbarCiudadano from '../components/ciudadano/NavbarCiudadano.vue'
import HeaderCiudadano from '../components/ciudadano/HeaderCiudadano.vue'

const router = useRouter()
const reportes = ref([])
const loading = ref(true)

// Estado del filtro seleccionado ('TODOS' por defecto)
const filtroActivo = ref('TODOS')

// Lista de opciones de filtro basadas en los estados oficiales
const filtros = [
  { id: 'TODOS', label: 'Todos' },
  { id: 'PENDIENTE', label: 'Pendiente' },
  { id: '5.14', label: '5.14 Desplazándose' },
  { id: '5.03', label: '5.03 En sitio' },
  { id: '5.50', label: '5.50 Finalizado' }
]

// Reportes filtrados según el badge seleccionado
const reportesFiltrados = computed(() => {
  if (filtroActivo.value === 'TODOS') {
    return reportes.value
  }
  return reportes.value.filter(reporte => {
    const estadoReporte = (reporte.estado_actual || 'PENDIENTE').toUpperCase()
    return estadoReporte.includes(filtroActivo.value)
  })
})

// Función para formatear la hora/fecha estilo "Hoy, 04:15 p.m."
const formatearFechaHora = (fechaStr) => {
  if (!fechaStr) return 'Reciente'
  const fecha = new Date(fechaStr)
  const hoy = new Date()
  
  const esHoy = fecha.toDateString() === hoy.toDateString()
  const horaFormateada = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  if (esHoy) {
    return `Hoy, ${horaFormateada}`
  }
  
  return fecha.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }) + `, ${horaFormateada}`
}

onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const resultado = await reportesService.obtenerHistorialReportes(user.id)
    reportes.value = resultado.reportes
  } catch (error) {
    toast.error(error.message, { position: 'top-center' })
  } finally {
    loading.value = false
  }
})

const verDetalle = (reporteId) => {
  router.push(`/historial/${reporteId}`)
}
</script>

<template>
  <div class="w-full max-w-md mx-auto h-dvh flex flex-col bg-slate-100 font-sans relative overflow-hidden">
    
    <!-- Encabezado -->
    <HeaderCiudadano class="shrink-0 z-10 w-full" />

    <!-- Área de contenido con scroll -->
    <main class="flex-1 p-4 flex flex-col overflow-y-auto space-y-3">
      
      <!-- FILTROS POR BADGES (Desplazables horizontalmente) -->
      <div v-if="!loading && reportes.length > 0" class="flex gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        <button 
          v-for="filtro in filtros" 
          :key="filtro.id"
          @click="filtroActivo = filtro.id"
          :class="[
            'px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all shadow-xs cursor-pointer',
            filtroActivo === filtro.id 
              ? 'bg-slate-900 text-white shadow-md scale-105' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          ]"
        >
          {{ filtro.label }}
        </button>
      </div>

      <!-- Estado de Carga -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-slate-500 gap-2 my-auto">
        <div class="w-6 h-6 border-2 border-gecap-darkblue border-t-transparent rounded-full animate-spin"></div>
        <span class="text-xs font-semibold">Cargando tus reportes...</span>
      </div>

      <!-- Estado Vacío General -->
      <div 
        v-else-if="reportes.length === 0" 
        class="text-center py-12 px-6 bg-white rounded-2xl shadow-sm border border-slate-200/80 my-auto"
      >
        <ShieldAlert class="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <h3 class="text-sm font-bold text-slate-700 mb-1">Sin reportes registrados</h3>
        <p class="text-xs text-slate-500">Aquí aparecerá el historial de alertas y solicitudes que realices.</p>
      </div>

      <!-- Estado Vacío al Filtrar -->
      <div 
        v-else-if="reportesFiltrados.length === 0" 
        class="text-center py-12 px-6 bg-white rounded-2xl shadow-sm border border-slate-200/80 my-auto"
      >
        <Filter class="w-10 h-10 mx-auto text-slate-300 mb-2" />
        <h3 class="text-xs font-bold text-slate-700 mb-1">No hay reportes en este filtro</h3>
        <p class="text-[11px] text-slate-400">Intenta seleccionando otra categoría de estado arriba.</p>
      </div>

      <!-- Lista de Tarjetas Filtradas -->
      <div 
        v-else
        v-for="reporte in reportesFiltrados" 
        :key="reporte.id"
        @click="verDetalle(reporte.id)"
        class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 active:scale-[0.98] hover:border-gecap-darkblue transition-all duration-150 cursor-pointer select-none space-y-2 shrink-0"
      >
        <!-- Fila Superior: Tipo de Alerta y Estado con punto -->
        <div class="flex items-start justify-between gap-2">
          <span class="text-xs font-black text-slate-900 uppercase tracking-tight leading-snug">
            {{ reporte.tipo_alerta || 'ALERTA CIUDADANA' }}
          </span>
          
          <!-- Badge de Estado -->
          <div class="flex items-center gap-1.5 shrink-0 bg-slate-100 px-2.5 py-1 rounded-full">
            <span class="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span class="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
              {{ reporte.estado_actual || 'PENDIENTE' }}
            </span>
          </div>
        </div>

        <!-- Fila Central: Radicado -->
        <div>
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
            RADICADO #{{ reporte.codigo_seguimiento || 'S/N' }}
          </span>
        </div>

        <!-- Fila Inferior: Hora y Flecha -->
        <div class="flex items-center justify-between pt-1 border-t border-slate-100">
          <div class="flex items-center gap-1.5 text-slate-500">
            <Clock class="w-3.5 h-3.5 text-slate-400" />
            <span class="text-[11px] font-medium">
              {{ formatearFechaHora(reporte.created_at) }}
            </span>
          </div>

          <div class="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
            <ChevronRight class="w-4 h-4" />
          </div>
        </div>
      </div>

    </main>

    <!-- Barra de Navegación Inferior -->
    <div class="shrink-0 w-full z-30">
      <NavbarCiudadano />
    </div>
      
  </div>
</template>