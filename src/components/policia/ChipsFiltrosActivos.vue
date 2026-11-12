<script setup>
import { CheckCircle2, X } from 'lucide-vue-next'

defineProps({
  busquedaTexto: String,
  estadoFiltro: String,
  tipoAlertaFiltro: String,
  evidenciaFiltro: String,
  fechaDesde: String,
  fechaHasta: String
})

defineEmits([
  'update:busquedaTexto',
  'update:estadoFiltro',
  'update:tipoAlertaFiltro',
  'update:evidenciaFiltro',
  'update:fechaDesde',
  'update:fechaHasta'
])
</script>

<template>
  <div class="mb-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-2">
    <span class="text-sm font-black uppercase tracking-wider text-gecap-darkblue flex items-center gap-1 mr-1">
      <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" /> Filtros aplicados:
    </span>

    <span v-if="busquedaTexto" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
      Texto: "{{ busquedaTexto }}"
      <button @click="$emit('update:busquedaTexto', '')" class="text-slate-400 hover:text-red-600 cursor-pointer"><X class="w-3.5 h-3.5" /></button>
    </span>

    <span v-if="estadoFiltro !== 'TODOS'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
      Estado: {{ estadoFiltro }}
      <button @click="$emit('update:estadoFiltro', 'TODOS')" class="text-amber-600 hover:text-red-600 cursor-pointer"><X class="w-3.5 h-3.5" /></button>
    </span>

    <span v-if="tipoAlertaFiltro !== 'TODOS'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
      Tipo: {{ tipoAlertaFiltro }}
      <button @click="$emit('update:tipoAlertaFiltro', 'TODOS')" class="text-blue-600 hover:text-red-600 cursor-pointer"><X class="w-3.5 h-3.5" /></button>
    </span>

    <span v-if="evidenciaFiltro !== 'TODOS'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
      Evidencias: {{ evidenciaFiltro === 'CON' ? 'Con fotos' : 'Sin fotos' }}
      <button @click="$emit('update:evidenciaFiltro', 'TODOS')" class="text-purple-600 hover:text-red-600 cursor-pointer"><X class="w-3.5 h-3.5" /></button>
    </span>

    <span v-if="fechaDesde" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
      Desde: {{ fechaDesde }}
      <button @click="$emit('update:fechaDesde', '')" class="text-emerald-600 hover:text-red-600 cursor-pointer"><X class="w-3.5 h-3.5" /></button>
    </span>

    <span v-if="fechaHasta" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
      Hasta: {{ fechaHasta }}
      <button @click="$emit('update:fechaHasta', '')" class="text-emerald-600 hover:text-red-600 cursor-pointer"><X class="w-3.5 h-3.5" /></button>
    </span>
  </div>
</template>