<script setup>
import { Filter, X } from 'lucide-vue-next'

defineProps({
  hayFiltrosActivos: Boolean,
  filtroBusqueda: String,
  rangoTemporal: String,
  fechaInicio: String,
  fechaFin: String,
  filtroEstacion: String,
  filtroCuadrante: String,
  filtroTipologia: String,
  filtroEstado: String,
  nombreEstacionSeleccionada: String,
  nombreCuadranteSeleccionado: String
})

const emit = defineEmits([
  'update:filtroBusqueda',
  'update:rangoTemporal',
  'limpiar-fechas',
  'update:filtroEstacion',
  'update:filtroCuadrante',
  'update:filtroTipologia',
  'update:filtroEstado',
  'limpiar-todos'
])
</script>

<template>
  <div
    v-if="hayFiltrosActivos"
    class="bg-white border border-slate-200 p-3 rounded-2xl flex flex-wrap items-center gap-2 shadow-sm"
  >
    <span class="text-[11px] font-bold uppercase text-slate-500 mr-2 flex items-center gap-1">
      <Filter class="w-3 h-3 text-red-600" /> Filtros Activos:
    </span>

    <div
      v-if="filtroBusqueda.trim()"
      class="bg-slate-100 text-slate-800 text-xs px-3 py-1 rounded-xl border border-slate-200 flex items-center gap-1.5 font-medium"
    >
      <span>Búsqueda: "{{ filtroBusqueda }}"</span>
      <button @click="emit('update:filtroBusqueda', '')" class="hover:text-red-600 cursor-pointer">
        <X class="w-3.5 h-3.5" />
      </button>
    </div>

    <div
      v-if="rangoTemporal !== 'mes' && !fechaInicio && !fechaFin"
      class="bg-slate-100 text-slate-800 text-xs px-3 py-1 rounded-xl border border-slate-200 flex items-center gap-1.5 font-medium"
    >
      <span>Rango: {{ rangoTemporal.toUpperCase() }}</span>
      <button @click="emit('update:rangoTemporal', 'mes')" class="hover:text-red-600 cursor-pointer">
        <X class="w-3.5 h-3.5" />
      </button>
    </div>

    <div
      v-if="fechaInicio || fechaFin"
      class="bg-slate-100 text-slate-800 text-xs px-3 py-1 rounded-xl border border-slate-200 flex items-center gap-1.5 font-medium"
    >
      <span>Fechas: {{ fechaInicio || '...' }} a {{ fechaFin || '...' }}</span>
      <button @click="emit('limpiar-fechas')" class="hover:text-red-600 cursor-pointer">
        <X class="w-3.5 h-3.5" />
      </button>
    </div>

    <div
      v-if="filtroEstacion !== 'TODOS'"
      class="bg-slate-100 text-slate-800 text-xs px-3 py-1 rounded-xl border border-slate-200 flex items-center gap-1.5 font-medium"
    >
      <span>Base: {{ nombreEstacionSeleccionada }}</span>
      <button @click="emit('update:filtroEstacion', 'TODOS')" class="hover:text-red-600 cursor-pointer">
        <X class="w-3.5 h-3.5" />
      </button>
    </div>

    <div
      v-if="filtroCuadrante !== 'TODOS'"
      class="bg-slate-100 text-slate-800 text-xs px-3 py-1 rounded-xl border border-slate-200 flex items-center gap-1.5 font-medium"
    >
      <span>Cuadrante: {{ nombreCuadranteSeleccionado }}</span>
      <button @click="emit('update:filtroCuadrante', 'TODOS')" class="hover:text-red-600 cursor-pointer">
        <X class="w-3.5 h-3.5" />
      </button>
    </div>

    <div
      v-if="filtroTipologia !== 'TODOS'"
      class="bg-slate-100 text-slate-800 text-xs px-3 py-1 rounded-xl border border-slate-200 flex items-center gap-1.5 font-medium"
    >
      <span>Tipo: {{ filtroTipologia }}</span>
      <button @click="emit('update:filtroTipologia', 'TODOS')" class="hover:text-red-600 cursor-pointer">
        <X class="w-3.5 h-3.5" />
      </button>
    </div>

    <div
      v-if="filtroEstado !== 'TODOS'"
      class="bg-slate-100 text-slate-800 text-xs px-3 py-1 rounded-xl border border-slate-200 flex items-center gap-1.5 font-medium"
    >
      <span>Estado: {{ filtroEstado }}</span>
      <button @click="emit('update:filtroEstado', 'TODOS')" class="hover:text-red-600 cursor-pointer">
        <X class="w-3.5 h-3.5" />
      </button>
    </div>

    <button
      @click="emit('limpiar-todos')"
      class="ml-auto text-xs text-red-600 hover:text-red-700 font-bold underline cursor-pointer"
    >
      Limpiar filtros
    </button>
  </div>
</template>