<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Image as ImageIcon, X, ChevronLeft, ChevronRight, MapPin, FileText, Clock, ShieldCheck, AlertCircle } from 'lucide-vue-next'
import { supabase } from '../services/supabase'

const router = useRouter()
const route = useRoute()
const reporte = ref(null)
const cargando = ref(true)

// Estados para el carrusel y modal de evidencias
const mostrarModalEvidencia = ref(false)
const evidenciasList = ref([])
const currentIndex = ref(0)

// Imagen actual en el carrusel
const evidenciaActual = computed(() => {
  if (evidenciasList.value.length === 0) return ''
  return evidenciasList.value[currentIndex.value]
})

// Función para formatear la fecha y hora de la alerta
const formatearFecha = (fechaStr) => {
  if (!fechaStr) return 'N/A'
  const fecha = new Date(fechaStr)
  return fecha.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  try {
    cargando.value = true
    const reporteId = route.params.id
    
    const { data, error } = await supabase
      .from('alertas')
      .select('*, alerta_fotos(url_foto), alerta_estados(estado, created_at)')
      .eq('id', reporteId)
      .single()

    if (!error && data) {
      reporte.value = data
      if (data.alerta_fotos && data.alerta_fotos.length > 0) {
        evidenciasList.value = data.alerta_fotos.map(f => f.url_foto)
      }
    }
  } catch (e) {
    console.error('Error al cargar detalle:', e)
  } finally {
    cargando.value = false
  }
})

const abrirEvidencia = (index = 0) => {
  if (evidenciasList.value.length > 0) {
    currentIndex.value = index
    mostrarModalEvidencia.value = true
  }
}

const siguienteFoto = () => {
  if (evidenciasList.value.length > 0) {
    currentIndex.value = (currentIndex.value + 1) % evidenciasList.value.length
  }
}

const anteriorFoto = () => {
  if (evidenciasList.value.length > 0) {
    currentIndex.value = (currentIndex.value - 1 + evidenciasList.value.length) % evidenciasList.value.length
  }
}
</script>

<template>
  <div class="w-full max-w-md mx-auto min-h-dvh flex flex-col bg-slate-100 font-sans pb-10">
    
    <!-- ENCABEZADO SUPERIOR -->
    <div class="bg-gecap-darkblue px-4 py-5 text-white shadow-md relative flex items-center justify-center">
      <button 
        @click="router.push('/historial')" 
        class="absolute left-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
      >
        <ArrowLeft class="w-5 h-5" />
      </button>
      <h1 class="text-sm font-black uppercase tracking-wider text-center">Detalle del Reporte</h1>
    </div>

    <!-- CONTENIDO PRINCIPAL -->
    <div class="p-4 space-y-4 flex-1">

      <!-- SPINNER DE CARGA -->
      <div v-if="cargando" class="flex flex-col items-center justify-center py-20 space-y-3">
        <div class="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs font-bold text-slate-400 uppercase">Cargando información...</p>
      </div>

      <template v-else-if="reporte">
        
        <!-- ENCABEZADO DE RADICADO Y TIPO -->
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 text-center space-y-1">
          <span class="inline-block px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black tracking-widest uppercase">
            RADICADO #{{ reporte.codigo_seguimiento || 'S/N' }}
          </span>
          <h2 class="text-sm font-black text-gecap-red uppercase tracking-tight pt-1">
            {{ reporte.tipo_alerta || 'ALERTA CIUDADANA' }}
          </h2>
        </div>

        <!-- SECCIÓN DE EVIDENCIAS (CARRUSEL PREVIO / MINI GALERÍA) -->
        <div v-if="evidenciasList.length > 0" class="space-y-2">
          <div class="flex items-center justify-between px-1">
            <span class="text-[11px] font-black text-slate-400 uppercase tracking-wider">Evidencias Adjuntas ({{ evidenciasList.length }})</span>
          </div>
          
          <div class="grid grid-cols-4 gap-2">
            <div 
              v-for="(foto, idx) in evidenciasList" 
              :key="idx"
              @click="abrirEvidencia(idx)"
              class="relative aspect-square rounded-xl overflow-hidden bg-slate-900 border-2 border-slate-200 hover:border-red-600 shadow-sm cursor-pointer group transition-all"
            >
              <img :src="foto" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                <ImageIcon class="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
              </div>
            </div>
          </div>
        </div>

        <!-- INFORMACIÓN REPORTADA (CON FECHA Y HORA) -->
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div class="flex items-center gap-2 border-b border-slate-100 pb-2">
            <FileText class="w-4 h-4 text-red-600" />
            <h3 class="text-xs font-black text-slate-800 uppercase tracking-wide">Información del Incidente</h3>
          </div>
          
          <div class="space-y-2.5 text-xs text-slate-700">
            <!-- Fecha y Hora del Reporte -->
            <div class="flex items-start gap-2">
              <Clock class="w-4 h-4 text-gecap-blue shrink-0 mt-0.5" />
              <div>
                <strong class="text-slate-900 block text-[10px] uppercase font-black">Fecha y Hora:</strong>
                <span class="text-[11px] font-medium">{{ formatearFecha(reporte.created_at) }}</span>
              </div>
            </div>

            <!-- Ubicación GPS -->
            <div class="flex items-start gap-2">
              <MapPin class="w-4 h-4 text-gecap-blue shrink-0 mt-0.5" />
              <div>
                <strong class="text-slate-900 block text-[10px] uppercase font-black">Ubicación GPS:</strong>
                <span class="font-mono text-[11px]">{{ reporte.latitud }}, {{ reporte.longitud }}</span>
              </div>
            </div>

            <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
              <strong class="text-slate-900 block text-[10px] uppercase font-black">Descripción:</strong>
              <p class="text-slate-600 leading-relaxed font-medium italic">
                "{{ reporte.descripcion || 'Sin descripción adicional.' }}"
              </p>
            </div>
          </div>
        </div>

        <!-- ESTADO ACTUAL -->
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <AlertCircle class="w-5 h-5 text-amber-600" />
            <span class="text-xs font-black text-slate-700 uppercase">Estado Actual</span>
          </div>
          <span class="text-xs font-black text-amber-800 bg-amber-100 py-1.5 px-3 rounded-xl uppercase tracking-wider shadow-inner">
            {{ reporte.estado_actual || 'PENDIENTE' }}
          </span>
        </div>

        <!-- HISTORIAL DE ESTADOS (TIMELINE) -->
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
          <div class="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Clock class="w-4 h-4 text-red-600" />
            <h3 class="text-xs font-black text-slate-800 uppercase tracking-wide">Historial de Seguimiento</h3>
          </div>
          
          <div class="space-y-3 pl-2">
            <div class="relative pl-6 border-l-2 border-slate-200 pb-1">
              <div class="absolute -left-[7px] top-0 w-3 h-3 rounded-full bg-gecap-darkblue ring-4 ring-slate-100"></div>
              <span class="text-[10px] font-bold text-slate-400 block">Comando Central Tuluá</span>
              <p class="text-xs font-bold text-slate-800">Alerta recibida y asignada a cuadrante</p>
            </div>
          </div>
        </div>

      </template>

      <div v-else class="text-center py-20">
        <p class="text-xs font-bold text-slate-400">No se encontró información para este reporte.</p>
      </div>

    </div>

    <!-- MODAL CARRUSEL DE EVIDENCIAS EN GRANDE -->
    <div v-if="mostrarModalEvidencia" class="fixed inset-0 bg-black/85 z-50 flex flex-col justify-between p-4 backdrop-blur-md animate-fade-in">
      
      <!-- Barra Superior del Modal -->
      <div class="flex items-center justify-between text-white py-2">
        <span class="text-xs font-black tracking-widest uppercase bg-white/10 px-3 py-1 rounded-full">
          Foto {{ currentIndex + 1 }} de {{ evidenciasList.length }}
        </span>
        <button 
          @click="mostrarModalEvidencia = false" 
          class="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
        >
          <X class="w-6 h-6" />
        </button>
      </div>

      <!-- Contenedor Central del Carrusel -->
      <div class="relative flex-1 flex items-center justify-center my-2 overflow-hidden">
        
        <!-- Botón Anterior -->
        <button 
          v-if="evidenciasList.length > 1"
          @click="anteriorFoto"
          class="absolute left-2 z-10 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all cursor-pointer backdrop-blur-sm"
        >
          <ChevronLeft class="w-6 h-6" />
        </button>

        <!-- Imagen Ampliada -->
        <div class="w-full h-full max-h-[65vh] flex items-center justify-center p-1">
          <img 
            :src="evidenciaActual" 
            alt="Evidencia ampliada" 
            class="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10" 
          />
        </div>

        <!-- Botón Siguiente -->
        <button 
          v-if="evidenciasList.length > 1"
          @click="siguienteFoto"
          class="absolute right-2 z-10 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all cursor-pointer backdrop-blur-sm"
        >
          <ChevronRight class="w-6 h-6" />
        </button>
      </div>

      <!-- Miniaturas inferiores para navegación rápida -->
      <div v-if="evidenciasList.length > 1" class="py-2 flex gap-2 overflow-x-auto justify-center max-w-full scrollbar-none">
        <button 
          v-for="(foto, idx) in evidenciasList" 
          :key="idx"
          @click="currentIndex = idx"
          :class="[
            'w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer shadow-md',
            currentIndex === idx ? 'border-red-600 scale-105 ring-2 ring-red-600/50' : 'border-white/20 opacity-50 hover:opacity-100'
          ]"
        >
          <img :src="foto" class="w-full h-full object-cover" />
        </button>
      </div>

    </div>

  </div>
</template>