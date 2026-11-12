<script setup>
import { CheckCircle2, X } from 'lucide-vue-next'

defineProps({
  filtroBusqueda: String,
  filtroTipo: String,
  filtroSector: String,
  filtroBarrio: String
})

defineEmits([
  'update:filtroBusqueda',
  'update:filtroTipo',
  'update:filtroSector',
  'update:filtroBarrio'
])
</script>

<template>
  <div class="mb-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-2">
    <span class="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1 mr-1">
      <CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" /> Filtros aplicados:
    </span>

    <span v-if="filtroBusqueda" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
      Búsqueda: "{{ filtroBusqueda }}"
      <button @click="$emit('update:filtroBusqueda', '')" class="text-slate-400 hover:text-red-600 cursor-pointer"><X class="w-3.5 h-3.5" /></button>
    </span>

    <span v-if="filtroBarrio !== 'TODOS'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
      Barrio: {{ filtroBarrio }}
      <button @click="$emit('update:filtroBarrio', 'TODOS')" class="text-amber-600 hover:text-red-600 cursor-pointer"><X class="w-3.5 h-3.5" /></button>
    </span>

    <span v-if="filtroTipo !== 'TODOS'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
      Tipo: {{ filtroTipo }}
      <button @click="$emit('update:filtroTipo', 'TODOS')" class="text-blue-600 hover:text-red-600 cursor-pointer"><X class="w-3.5 h-3.5" /></button>
    </span>

    <span v-if="filtroSector !== 'TODOS'" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
      Sector: {{ filtroSector }}
      <button @click="$emit('update:filtroSector', 'TODOS')" class="text-purple-600 hover:text-red-600 cursor-pointer"><X class="w-3.5 h-3.5" /></button>
    </span>
  </div>
</template>