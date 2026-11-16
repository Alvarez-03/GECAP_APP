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
  <div class="bg-white border border-slate-200/90 text-slate-900 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-gecap-darkblue transition shadow-sm">
    
    <!-- Cabecera de la Tarjeta -->
    <div class="space-y-1.5">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-black tracking-widest px-2.5 py-1 bg-slate-100 text-red-600 rounded-lg uppercase border border-slate-200">
          #{{ alerta.codigo_seguimiento || 'S/N' }}
        </span>
        <span class="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 tracking-wide border border-amber-200">
          {{ alerta.estado_actual || 'PENDIENTE' }}
        </span>
      </div>

      <h3 class="text-xs font-black text-slate-800 uppercase tracking-tight pt-1">
        {{ alerta.tipo_alerta || 'INCIDENTE CIUDADANO' }}
      </h3>
    </div>

    <!-- Información General -->
    <div class="space-y-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
      <div class="flex items-center gap-2">
        <User class="w-3.5 h-3.5 text-gecap-darkblue shrink-0" />
        <span class="font-bold truncate">{{ alerta.nombre_ciudadano || 'Ciudadano anónimo' }}</span>
      </div>
      <div class="flex items-center gap-2">
        <Clock class="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span class="text-[11px] text-slate-500">{{ formatearFecha(alerta.created_at) }}</span>
      </div>
      <div class="flex items-center gap-2">
        <MapPin class="w-3.5 h-3.5 text-red-600 shrink-0" />
        <span class="font-mono text-[11px] text-slate-600">{{ alerta.latitud }}, {{ alerta.longitud }}</span>
      </div>
    </div>

    <!-- Botones de Acción -->
    <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
      <button 
        @click="$emit('verEvidencias', alerta)"
        class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-200"
      >
        <Video class="w-4 h-4 text-red-600" />
        Evidencias ({{ alerta.alerta_fotos?.length || 0 }})
      </button>

      <button 
        @click="$emit('verInforme', alerta)"
        class="px-3 py-2 bg-gecap-darkblue hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
      >
        <FileText class="w-4 h-4" />
        Ver Detalle
      </button>
    </div>

  </div>
</template>