<script setup>
import { User, Clock, MapPin, Video, FileText } from 'lucide-vue-next'

defineProps({
  alerta: Object
})

defineEmits(['verEvidencias', 'verInforme'])

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
</script>

<template>
  <div class="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-slate-700 transition shadow-xl">
    
    <!-- Cabecera de la Tarjeta -->
    <div class="space-y-1.5">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-black tracking-widest px-2.5 py-1 bg-slate-950 text-red-400 rounded-lg uppercase border border-slate-800">
          #{{ alerta.codigo_seguimiento || 'S/N' }}
        </span>
        <span class="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-slate-800 text-amber-400 tracking-wide border border-slate-700">
          {{ alerta.estado_actual || 'PENDIENTE' }}
        </span>
      </div>

      <h3 class="text-xs font-black text-white uppercase tracking-tight pt-1">
        {{ alerta.tipo_alerta || 'INCIDENTE CIUDADANO' }}
      </h3>
    </div>

    <!-- Información General -->
    <div class="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
      <div class="flex items-center gap-2">
        <User class="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span class="font-bold truncate">{{ alerta.nombre_ciudadano || 'Ciudadano anónimo' }}</span>
      </div>
      <div class="flex items-center gap-2">
        <Clock class="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span class="text-[11px] text-slate-400">{{ formatearFecha(alerta.created_at) }}</span>
      </div>
      <div class="flex items-center gap-2">
        <MapPin class="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span class="font-mono text-[11px] text-slate-400">{{ alerta.latitud }}, {{ alerta.longitud }}</span>
      </div>
    </div>

    <!-- Botones de Acción -->
    <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
      <button 
        @click="$emit('verEvidencias', alerta)"
        class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
      >
        <Video class="w-4 h-4 text-red-500" />
        Evidencias ({{ alerta.alerta_fotos?.length || 0 }})
      </button>

      <button 
        @click="$emit('verInforme', alerta)"
        class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
      >
        <FileText class="w-4 h-4" />
        Ver Informe
      </button>
    </div>

  </div>
</template>