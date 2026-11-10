<script setup>
import { X } from 'lucide-vue-next'

defineProps({
  modelValue: Boolean,
  alerta: Object
})

defineEmits(['update:modelValue'])

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
  <div v-if="modelValue && alerta" class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white border border-slate-200 text-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Cabecera -->
      <div class="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
        <div>
          <span class="text-[10px] font-black uppercase tracking-widest text-red-600">Informe de Incidente</span>
          <h3 class="text-sm font-black text-slate-900">Radicado #{{ alerta.codigo_seguimiento }}</h3>
        </div>
        <button @click="$emit('update:modelValue', false)" class="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg transition-colors cursor-pointer">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Contenido -->
      <div class="p-6 space-y-4 overflow-y-auto text-xs text-slate-700">
        <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>
            <strong class="text-[10px] uppercase font-black text-slate-400 block">Tipo de Alerta:</strong>
            <span class="text-slate-900 font-black uppercase">{{ alerta.tipo_alerta }}</span>
          </div>
          <div>
            <strong class="text-[10px] uppercase font-black text-slate-400 block">Estado Actual:</strong>
            <span class="text-amber-600 font-black uppercase">{{ alerta.estado_actual || 'PENDIENTE' }}</span>
          </div>
        </div>

        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
          <strong class="text-[10px] uppercase font-black text-slate-400 block">Información del Ciudadano:</strong>
          <p class="text-slate-900 font-bold">{{ alerta.nombre_ciudadano || 'No registrado' }}</p>
          <p class="text-slate-500 font-mono">CC: {{ alerta.ciudadano_documento || 'N/A' }}</p>
        </div>

        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
          <strong class="text-[10px] uppercase font-black text-slate-400 block">Fecha y Ubicación GPS:</strong>
          <p class="text-slate-700">{{ formatearFecha(alerta.created_at) }}</p>
          <p class="text-blue-600 font-mono">Coordenadas: {{ alerta.latitud }}, {{ alerta.longitud }}</p>
        </div>

        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
          <strong class="text-[10px] uppercase font-black text-slate-400 block">Descripción del Incidente:</strong>
          <p class="text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
            "{{ alerta.descripcion || 'Sin descripción detallada.' }}"
          </p>
        </div>
      </div>

      <!-- Pie -->
      <div class="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
        <button 
          @click="$emit('update:modelValue', false)"
          class="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
        >
          Cerrar Informe
        </button>
      </div>

    </div>
  </div>
</template>