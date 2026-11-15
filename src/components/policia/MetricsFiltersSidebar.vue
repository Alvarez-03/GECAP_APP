<!-- name=MetricsFiltersSidebar.vue -->
<script setup>
import { Search, Filter, ChevronRight, ChevronLeft } from 'lucide-vue-next'

defineProps({
  colapsado: Boolean,
  filtroBusqueda: String,
  rangoTemporal: String,
  filtroTipologia: String,
  filtroEstado: String,
  tipologiasDisponibles: Array,
  hayFiltrosActivos: Boolean,
  totalAlertas: Number
})

const emit = defineEmits([
  'update:colapsado',
  'update:filtroBusqueda',
  'update:rangoTemporal',
  'update:filtroTipologia',
  'update:filtroEstado',
  'limpiar'
])
</script>

<template>
  <aside :class="['bg-white border-r border-slate-200 flex flex-col h-full shrink-0 shadow-sm z-10 transition-all duration-300 hidden xl:flex', colapsado ? 'w-16 items-center py-4' : 'w-80']">
    
    <!-- SI ESTÁ COLAPSADO -->
    <div v-if="colapsado" class="flex flex-col items-center h-full justify-between cursor-pointer" @click="emit('update:colapsado', false)" title="Abrir Filtros Analíticos">
      <div class="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition">
        <ChevronRight class="w-5 h-5 text-red-600" />
      </div>
      <div class="py-4 flex flex-col items-center gap-2">
        <Filter class="w-6 h-6 text-red-600 animate-pulse" />
        <span class="text-[10px] font-black uppercase tracking-widest text-slate-600 [writing-mode:vertical-lr] rotate-180">
          Filtros
        </span>
      </div>
      <div class="w-2 h-2 rounded-full bg-red-600 animate-pulse"></div>
    </div>

    <!-- SI ESTÁ DESPLEGADO -->
    <template v-else>
      <div class="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div class="flex items-center gap-2 text-slate-800">
          <Filter class="w-4 h-4 text-red-600" />
          <h2 class="text-xs font-black uppercase tracking-wider">Filtros Analíticos</h2>
        </div>
        
        <div class="flex items-center gap-2">
          <button 
            v-if="hayFiltrosActivos"
            @click="emit('limpiar')"
            class="text-[11px] text-red-600 hover:text-red-700 font-bold uppercase transition cursor-pointer"
          >
            Limpiar
          </button>
          <button 
            @click="emit('update:colapsado', true)"
            class="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition cursor-pointer ml-1"
            title="Minimizar panel de filtros"
          >
            <ChevronLeft class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div class="p-5 flex-1 overflow-y-auto space-y-5 custom-scrollbar text-xs">
        
        <!-- Búsqueda General -->
        <div class="space-y-2">
          <label class="text-[11px] font-bold uppercase text-slate-600">Búsqueda General</label>
          <div class="relative">
            <Search class="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              :value="filtroBusqueda"
              @input="emit('update:filtroBusqueda', $event.target.value)"
              type="text"
              placeholder="ID, tipo o estado..."
              class="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-800 focus:outline-none focus:border-red-600 transition"
            />
          </div>
        </div>

        <!-- Rango Temporal -->
        <div class="space-y-2">
          <label class="text-[11px] font-bold uppercase text-slate-600">Rango Temporal</label>
          <div class="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button 
              @click="emit('update:rangoTemporal', 'hoy')" 
              :class="['py-2 text-[11px] font-bold rounded-lg transition cursor-pointer text-center', rangoTemporal === 'hoy' ? 'bg-red-600 text-white shadow' : 'text-slate-600 hover:text-slate-900']"
            >
              Hoy
            </button>
            <button 
              @click="emit('update:rangoTemporal', 'semana')" 
              :class="['py-2 text-[11px] font-bold rounded-lg transition cursor-pointer text-center', rangoTemporal === 'semana' ? 'bg-red-600 text-white shadow' : 'text-slate-600 hover:text-slate-900']"
            >
              Semana
            </button>
            <button 
              @click="emit('update:rangoTemporal', 'mes')" 
              :class="['py-2 text-[11px] font-bold rounded-lg transition cursor-pointer text-center', rangoTemporal === 'mes' ? 'bg-red-600 text-white shadow' : 'text-slate-600 hover:text-slate-900']"
            >
              Mes
            </button>
          </div>
        </div>

        <!-- Tipología de Alerta -->
        <div class="space-y-2">
          <label class="text-[11px] font-bold uppercase text-slate-600">Tipología de Alerta</label>
          <select 
            :value="filtroTipologia"
            @change="emit('update:filtroTipologia', $event.target.value)"
            class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-red-600 transition cursor-pointer"
          >
            <option value="TODOS">Todas las tipologías</option>
            <option v-for="tipo in tipologiasDisponibles" :key="tipo" :value="tipo">
              {{ tipo }}
            </option>
          </select>
        </div>

        <!-- Estado Operativo -->
        <div class="space-y-2">
          <label class="text-[11px] font-bold uppercase text-slate-600">Estado Operativo</label>
          <select 
            :value="filtroEstado"
            @change="emit('update:filtroEstado', $event.target.value)"
            class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-red-600 transition cursor-pointer"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="EN PROCESO">EN PROCESO</option>
            <option value="5.50 - PROCEDIMIENTO FINALIZADO">FINALIZADO</option>
          </select>
        </div>

      </div>

      <div class="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-600 flex items-center justify-between font-bold">
        <span>Registros analizados:</span>
        <span class="text-white bg-slate-900 px-2.5 py-1 rounded-lg">{{ totalAlertas }}</span>
      </div>
    </template>
  </aside>
</template>