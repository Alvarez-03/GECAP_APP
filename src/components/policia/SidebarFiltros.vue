<script setup>
import { Search, Filter, Calendar, RotateCcw, SlidersHorizontal } from 'lucide-vue-next'

defineProps({
  busquedaTexto: String,
  estadoFiltro: String,
  tipoAlertaFiltro: String,
  evidenciaFiltro: String,
  fechaDesde: String,
  fechaHasta: String,
  estadosDisponibles: Array,
  tiposReportesDB: Array,
  opcionesEvidencia: Array,
  hayFiltrosActivos: Boolean
})

defineEmits([
  'update:busquedaTexto',
  'update:estadoFiltro',
  'update:tipoAlertaFiltro',
  'update:evidenciaFiltro',
  'update:fechaDesde',
  'update:fechaHasta',
  'limpiar'
])
</script>

<template>
  <aside class="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-sm overflow-y-auto">
    <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
      <div class="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-wider">
        <SlidersHorizontal class="w-4 h-4 text-gecap-darkblue" />
        <span>Filtros de Búsqueda</span>
      </div>
      <button 
        v-if="hayFiltrosActivos"
        @click="$emit('limpiar')" 
        title="Restablecer filtros"
        class="text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-1 transition cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-red-200 shadow-2xs"
      >
        <RotateCcw class="w-3 h-3" /> Limpiar
      </button>
    </div>

    <div class="p-4 space-y-5">
      
      <!-- Búsqueda General -->
      <div class="space-y-1.5">
        <label class="text-sm font-black uppercase tracking-wider text-slate-700 block">Búsqueda general</label>
        <span class="text-[11px] text-slate-500 leading-tight block">
          Filtra por código CAD, nombre, documento o palabras clave.
        </span>
        <div class="relative pt-0.5">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            :value="busquedaTexto" 
            @input="$emit('update:busquedaTexto', $event.target.value)"
            type="text" 
            placeholder="Ej: CAD-651, Carlos, ruido..." 
            class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-gecap-darkblue transition" 
          />
        </div>
      </div>

      <!-- Filtro por Estado -->
      <div class="space-y-1.5 pt-3 border-t border-slate-100">
        <label class="text-sm font-black uppercase tracking-wider text-slate-700 block">Estado de atención</label>
        <span class="text-[11px] text-slate-500 leading-tight block">Muestra reportes según su fase operativa policial.</span>
        <div class="relative pt-0.5">
          <Filter class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <select 
            :value="estadoFiltro" 
            @change="$emit('update:estadoFiltro', $event.target.value)"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none uppercase font-bold cursor-pointer"
          >
            <option v-for="est in estadosDisponibles" :key="est.id" :value="est.id">{{ est.label }}</option>
          </select>
        </div>
      </div>

      <!-- Filtro por Tipo de Alerta -->
      <div class="space-y-1.5 pt-3 border-t border-slate-100">
        <label class="text-sm font-black uppercase tracking-wider text-slate-700 block">Tipo de incidente</label>
        <span class="text-[11px] text-slate-500 leading-tight block">Clasifica según tipificación oficial y códigos.</span>
        <div class="pt-0.5">
          <select 
            :value="tipoAlertaFiltro" 
            @change="$emit('update:tipoAlertaFiltro', $event.target.value)"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none uppercase font-bold cursor-pointer"
          >
            <option value="TODOS">Todos los tipos de reporte</option>
            <option v-for="tipo in tiposReportesDB" :key="tipo.id" :value="tipo.situacion">
              {{ tipo.codigo }} - {{ tipo.situacion }}
            </option>
          </select>
        </div>
      </div>

      <!-- Filtro por Evidencias -->
      <div class="space-y-1.5 pt-3 border-t border-slate-100">
        <label class="text-sm font-black uppercase tracking-wider text-slate-700 block">Evidencias multimedia</label>
        <span class="text-[11px] text-slate-500 leading-tight block">Separa casos con material fotográfico adjunto.</span>
        <div class="pt-0.5">
          <select 
            :value="evidenciaFiltro" 
            @change="$emit('update:evidenciaFiltro', $event.target.value)"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none uppercase font-bold cursor-pointer"
          >
            <option v-for="ev in opcionesEvidencia" :key="ev.id" :value="ev.id">{{ ev.label }}</option>
          </select>
        </div>
      </div>

      <!-- Filtros de Fechas -->
      <div class="space-y-2 pt-3 border-t border-slate-100">
        <label class="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Calendar class="w-3.5 h-3.5 text-gecap-darkblue" /> Rango de fechas
        </label>
        <span class="text-[11px] text-slate-500 leading-tight block">Acota el historial por fecha exacta de registro.</span>
        <div class="space-y-2 pt-1">
          <div>
            <span class="text-sm font-bold text-slate-600 uppercase block mb-0.5">Fecha inicial (Desde)</span>
            <input 
              :value="fechaDesde" 
              @input="$emit('update:fechaDesde', $event.target.value)"
              type="date" 
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-gecap-darkblue uppercase font-medium cursor-pointer" 
            />
          </div>
          <div>
            <span class="text-sm font-bold text-slate-600 uppercase block mb-0.5">Fecha límite (Hasta)</span>
            <input 
              :value="fechaHasta" 
              @input="$emit('update:fechaHasta', $event.target.value)"
              type="date" 
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-gecap-darkblue uppercase font-medium cursor-pointer" 
            />
          </div>
        </div>
      </div>

    </div>
  </aside>
</template>