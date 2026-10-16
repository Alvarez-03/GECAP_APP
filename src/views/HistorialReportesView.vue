<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronRight, ShieldAlert, ArrowLeft } from 'lucide-vue-next'
import { reportesService } from '../services/reportesService'
import { supabase } from '../services/supabase'
import { toast } from 'vue3-toastify'

import NavbarCiudadano from '../components/ciudadano/NavbarCiudadano.vue'
import HeaderCiudadano from '../components/ciudadano/HeaderCiudadano.vue'

const router = useRouter()
const reportes = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Usamos el id del usuario autenticado que corresponde a usuario_id en la tabla
    console.log(user.id)
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
    <div class="w-full max-w-md mx-auto min-h-dvh flex flex-col bg-slate-100 font-sans relative">
      
      <!-- Encabezado (Fijo en la parte superior) -->
      <HeaderCiudadano class="sticky top-0 z-10 w-full" />
  
      <!-- Contenido Scrollable con padding inferior suficiente para el Navbar -->
      <main class="flex-1 p-4 space-y-3 overflow-y-auto pb-28">
        
        <!-- Estado de Carga -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
          <div class="w-6 h-6 border-2 border-gecap-darkblue border-t-transparent rounded-full animate-spin"></div>
          <span class="text-xs font-semibold">Cargando tus reportes...</span>
        </div>
  
        <!-- Estado Vacío -->
        <div 
          v-else-if="reportes.length === 0" 
          class="text-center py-12 px-6 bg-white rounded-2xl shadow-sm border border-slate-200/80 my-auto"
        >
          <ShieldAlert class="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 class="text-sm font-bold text-slate-700 mb-1">Sin reportes registrados</h3>
          <p class="text-xs text-slate-500">Aquí aparecerá el historial de alertas y solicitudes que realices.</p>
        </div>
  
        <!-- Lista de Tarjetas de Reporte -->
        <div 
          v-else
          v-for="reporte in reportes" 
          :key="reporte.id"
          @click="verDetalle(reporte.id)"
          class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex items-center justify-between active:scale-[0.98] hover:border-gecap-darkblue transition-all duration-150 cursor-pointer select-none"
        >
          <div class="flex-1 pr-3">
            <span class="text-[11px] font-black text-red-600 uppercase tracking-wider block">
              {{ reporte.tipo_alerta || 'ALERTA DE HURTO' }}
            </span>
            <span class="text-xs font-bold text-slate-800 block mt-0.5">
              RADICADO #{{ reporte.codigo_seguimiento || 'S/N' }}
            </span>
          </div>
          
          <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
            <ChevronRight class="w-5 h-5" />
          </div>
        </div>
  
      </main>
  
      <!-- Barra de Navegación Inferior (Fija) -->
      <NavbarCiudadano/>
        
    </div>
  </template>