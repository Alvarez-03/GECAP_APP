<script setup>
import { Search, RotateCcw, SlidersHorizontal } from 'lucide-vue-next'

defineProps({
  filtroBusqueda: String,
  filtroTipo: String,
  filtroSector: String,
  filtroBarrio: String,
  barriosDisponibles: Array,
  sectoresDisponibles: Array,
  basesPolicialesLength: Number,
  estructuraLength: Number,
  hayFiltrosActivos: Boolean
})

defineEmits([
  'update:filtroBusqueda',
  'update:filtroTipo',
  'update:filtroSector',
  'update:filtroBarrio',
  'limpiar'
])
</script>

<template>
  <aside class="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 h-full overflow-y-auto shadow-sm">
    
    <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
      <div class="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-wider">
        <SlidersHorizontal class="w-4 h-4 text-red-600" />
        <span>Filtros Operativos</span>
      </div>
      <button 
        v-if="hayFiltrosActivos"
        @click="$emit('limpiar')"
        class="text-[11px] font-bold text-red-600 hover:bg-red-50 flex items-center gap-1 transition cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-red-200 shadow-2xs"
        title="Restablecer filtros"
      >
        <RotateCcw class="w-3 h-3" /> Limpiar
      </button>
    </div>

    <div class="p-4 space-y-5">
      
      <!-- 1. Búsqueda por texto libre -->
      <div class="space-y-1.5">
        <label class="text-[11px] font-black uppercase tracking-wider text-slate-700 block">Búsqueda General</label>
        <span class="text-[11px] text-slate-500 leading-tight block">
          Filtra por nombre de estación, dirección o número de cuadrante.
        </span>
        <div class="relative pt-0.5">
          <Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            :value="filtroBusqueda"
            @input="$emit('update:filtroBusqueda', $event.target.value)"
            type="text" 
            placeholder="Ej: Centro, CAI, Cuadrante 3..." 
            class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-600 transition"
          />
        </div>
      </div>

      <!-- 2. Filtro por Barrio -->
      <div class="space-y-1.5 pt-3 border-t border-slate-100">
        <label class="text-[11px] font-black uppercase tracking-wider text-slate-700 block">Filtrar por Barrio</label>
        <span class="text-[11px] text-slate-500 leading-tight block">Ubica rápidamente qué cuadrante cubre un barrio específico.</span>
        <div class="pt-0.5">
          <select 
            :value="filtroBarrio"
            @change="$emit('update:filtroBarrio', $event.target.value)"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-red-600 transition cursor-pointer"
          >
            <option value="TODOS">Todos los barrios</option>
            <option v-for="barrio in barriosDisponibles" :key="barrio" :value="barrio">
              {{ barrio }}
            </option>
          </select>
        </div>
      </div>

      <!-- 3. Filtro por Tipo de Base -->
      <div class="space-y-1.5 pt-3 border-t border-slate-100">
        <label class="text-[11px] font-black uppercase tracking-wider text-slate-700 block">Tipo de Instalación</label>
        <span class="text-[11px] text-slate-500 leading-tight block">Clasifica entre subestaciones principales o CAI.</span>
        <div class="space-y-1 pt-1">
          <label class="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-700 transition">
            <input 
              type="radio" 
              :checked="filtroTipo === 'TODOS'"
              @change="$emit('update:filtroTipo', 'TODOS')"
              class="text-red-600 focus:ring-red-500 cursor-pointer" 
            />
            <span>Todas las instalaciones</span>
          </label>
          <label class="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-700 transition">
            <input 
              type="radio" 
              :checked="filtroTipo === 'SUBESTACION'"
              @change="$emit('update:filtroTipo', 'SUBESTACION')"
              class="text-blue-600 focus:ring-blue-500 cursor-pointer" 
            />
            <span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-blue-600"></span> Subestaciones</span>
          </label>
          <label class="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer text-xs font-bold text-slate-700 transition">
            <input 
              type="radio" 
              :checked="filtroTipo === 'CAI'"
              @change="$emit('update:filtroTipo', 'CAI')"
              class="text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
            />
            <span class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-600"></span> CAI</span>
          </label>
        </div>
      </div>

      <!-- 4. Filtro por Sector Geográfico -->
      <div class="space-y-1.5 pt-3 border-t border-slate-100">
        <label class="text-[11px] font-black uppercase tracking-wider text-slate-700 block">Sector / Zona</label>
        <span class="text-[11px] text-slate-500 leading-tight block">Agrupa las bases según su jurisdicción territorial.</span>
        <div class="pt-0.5">
          <select 
            :value="filtroSector"
            @change="$emit('update:filtroSector', $event.target.value)"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-red-600 transition cursor-pointer"
          >
            <option value="TODOS">Todos los sectores</option>
            <option v-for="sector in sectoresDisponibles" :key="sector" :value="sector">
              Sector {{ sector }}
            </option>
          </select>
        </div>
      </div>

    </div>

    <div class="mt-auto p-4 bg-slate-50 border-t border-slate-200 text-center shrink-0">
      <p class="text-[11px] font-bold text-slate-600">
        Mostrando <span class="font-black text-slate-900">{{ estructuraLength }}</span> de <span class="font-black text-slate-900">{{ basesPolicialesLength }}</span> bases
      </p>
    </div>

  </aside>
</template>