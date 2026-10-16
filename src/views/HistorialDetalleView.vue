<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Video, X } from 'lucide-vue-next'
import { supabase } from '../services/supabase'

const router = useRouter()
const route = useRoute()
const reporte = ref(null)
const mostrarModalEvidencia = ref(false)
const evidenciaUrl = ref('')

onMounted(async () => {
  const reporteId = route.params.id
  const { data, error } = await supabase
    .from('alertas')
    .select('*, alerta_fotos(url_foto), alerta_estados(estado, created_at)')
    .eq('id', reporteId)
    .single()

  if (!error && data) {
    reporte.value = data
    if (data.alerta_fotos && data.alerta_fotos.length > 0) {
      evidenciaUrl.value = data.alerta_fotos[0].url_foto
    }
  }
})

const abrirEvidencia = () => {
  if (evidenciaUrl.value) {
    mostrarModalEvidencia.value = true
  }
}
</script>

<template>
  <div class="w-full max-w-md mx-auto min-h-dvh flex flex-col bg-slate-100 font-sans pb-10">
    
    <!-- Encabezado -->
    <div class="bg-gecap-darkblue p-6 text-white text-center shadow-md relative">
      <button @click="router.push('/historial')" class="absolute top-6 left-4 text-white hover:text-slate-200 cursor-pointer">
        <ArrowLeft class="w-6 h-6" />
      </button>
      <span class="text-s font-black text-shadow-gecap-background uppercase tracking-wide block">Gecap Detalles de Reporte</span>
    </div>

    <div class="p-4 space-y-4 flex-1">

    <h1 class="text-sm font-black text-center text-gecap-darkblue mt-0.5">RADICADO #{{ reporte?.codigo_seguimiento || 'S/N' }}</h1>
    <h2 class="text-xs font-black text-center text-gecap-red uppercase tracking-wide block">{{ reporte?.tipo_alerta || 'ALERTA' }}</h2>

      
      <!-- Botón Ver Evidencia -->
      <button 
        @click="abrirEvidencia"
        class="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 font-bold text-xs shadow-xs cursor-pointer transition"
      >
        <Video class="w-5 h-5 text-slate-700" />
        <span>VER EVIDENCIA</span>
      </button>

      <!-- Información Reportada -->
      <div class="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-2">
        <h3 class="text-xs font-black text-red-600 uppercase text-center tracking-wide">INFORMACIÓN REPORTADA</h3>
        <p class="text-[11px] text-slate-700 leading-relaxed font-medium">
          <strong>UBICACIÓN:</strong> {{ reporte?.latitud || 'N/A' }}, {{ reporte?.longitud || 'N/A' }}<br/>
          <strong>DESCRIPCIÓN:</strong> {{ reporte?.descripcion || 'Sin descripción.' }}
        </p>
      </div>

      <!-- Estado Actual -->
      <div class="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 text-center">
        <span class="text-[10px] font-black text-red-600 uppercase block mb-1">ESTADO ACTUAL</span>
        <span class="text-xs font-bold text-slate-800 bg-amber-100 text-amber-800 py-1 px-3 rounded-lg inline-block">
          {{ reporte?.estado_actual || 'PENDIENTE' }}
        </span>
      </div>

      <!-- Historial de Estados (Timeline) -->
      <div class="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
        <h3 class="text-xs font-black text-red-600 uppercase text-center tracking-wide">HISTORIAL DE ESTADOS</h3>
        
        <div class="space-y-2">
          <div class="flex items-center gap-3 text-xs">
            <span class="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
            <span class="text-slate-700 font-medium">ASIGNADO A COMANDO CENTRAL DE TULUÁ</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Modal Visor de Evidencia -->
    <div v-if="mostrarModalEvidencia" class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
      <div class="bg-white rounded-3xl max-w-sm w-full p-4 relative shadow-2xl space-y-3">
        <div class="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 class="text-xs font-black text-red-600 uppercase text-center w-full">
            EVIDENCIA DE RADICADO #{{ reporte?.codigo_seguimiento || 'S/N' }}
          </h3>
          <button @click="mostrarModalEvidencia = false" class="absolute right-4 text-slate-400 hover:text-slate-700 cursor-pointer">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div class="rounded-2xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center">
          <img :src="evidenciaUrl || 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600'" alt="Evidencia" class="w-full h-full object-cover" />
        </div>
      </div>
    </div>

  </div>
</template>