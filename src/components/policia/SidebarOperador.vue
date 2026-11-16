<script setup>
import { ref, computed } from 'vue'
import { RefreshCw, ChevronDown, ChevronUp, CheckSquare, Square, Siren, Bell, House } from 'lucide-vue-next'

const props = defineProps({
  bases: { type: Array, default: () => [] },
  alertas: { type: Array, default: () => [] },
  cargando: { type: Boolean, default: false },
  idsSeleccionados: { type: Array, default: () => [] },
  alertasSeleccionadas: { type: Array, default: () => [] }
})

const emit = defineEmits(['Back', 'centrar', 'centrarAlerta', 'recargar', 'update:idsSeleccionados', 'update:alertasSeleccionadas'])

// Control de acordeones
const mostrarBases = ref(true)
const mostrarAlertas = ref(true)

// Filtros
const filtroTipoBase = ref('TODOS')
const filtroEstadoAlerta = ref('TODAS')

// Catálogo oficial usando prefijos/códigos clave para coincidencia exacta sin importar sufijos
const ESTADOS_OFICIALES = [
  { label: 'Todas', value: 'TODAS', activeClass: 'bg-slate-600 text-white' },
  { label: 'Pendiente', value: 'PENDIENTE', activeClass: 'bg-red-600 text-white' },
  { label: '5.14 Desplazándose', value: '5.14', activeClass: 'bg-amber-600 text-white' },
  { label: '5.03 En Sitio', value: '5.03', activeClass: 'bg-blue-600 text-white' },
  { label: '5.50 Finalizado', value: '5.50', activeClass: 'bg-emerald-600 text-white' }
]

// Función auxiliar para verificar si una alerta coincide con el filtro seleccionado
const coincideConEstado = (alerta, filtro) => {
  if (filtro === 'TODAS') return true
  const estadoReal = (alerta.estado_actual || 'PENDIENTE').toUpperCase().trim()
  if (filtro === 'PENDIENTE') return estadoReal === 'PENDIENTE'
  return estadoReal.includes(filtro)
}

// Conteo rápido por estado
const conteoPorEstado = computed(() => {
  const conteo = {
    TODAS: props.alertas.length,
    PENDIENTE: 0,
    '5.14': 0,
    '5.03': 0,
    '5.50': 0
  }
  props.alertas.forEach((a) => {
    const est = (a.estado_actual || 'PENDIENTE').toUpperCase().trim()
    if (est === 'PENDIENTE') conteo.PENDIENTE += 1
    else if (est.includes('5.14')) conteo['5.14'] += 1
    else if (est.includes('5.03')) conteo['5.03'] += 1
    else if (est.includes('5.50')) conteo['5.50'] += 1
  })
  return conteo
})

// Filtrado dinámico de bases
const basesFiltradas = computed(() => {
  if (filtroTipoBase.value === 'TODOS') return props.bases
  return props.bases.filter(b => b.tipo?.toUpperCase().includes(filtroTipoBase.value))
})

// Filtrado dinámico de alertas
const alertasFiltradas = computed(() => {
  return props.alertas.filter(a => coincideConEstado(a, filtroEstadoAlerta.value))
})

// Estilos dinámicos para la etiqueta de estado de cada tarjeta
const obtenerBadgeEstado = (estadoRaw) => {
  const estado = (estadoRaw || 'PENDIENTE').toUpperCase()
  if (estado === 'PENDIENTE') return 'bg-red-500/20 text-red-400 border border-red-500/30'
  if (estado.includes('5.14')) return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
  if (estado.includes('5.03')) return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
  if (estado.includes('5.50')) return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
  return 'bg-slate-700 text-slate-300'
}

// Control de selección individual/masiva de bases
const estaBaseSeleccionada = (id) => props.idsSeleccionados.includes(id)
const toggleBase = (id) => {
  let nueva = [...props.idsSeleccionados]
  if (nueva.includes(id)) nueva = nueva.filter(i => i !== id)
  else nueva.push(id)
  emit('update:idsSeleccionados', nueva)
}

// Control de selección individual/masiva de alertas
const estaAlertaSeleccionada = (id) => props.alertasSeleccionadas.includes(id)
const toggleAlerta = (id) => {
  let nueva = [...props.alertasSeleccionadas]
  if (nueva.includes(id)) nueva = nueva.filter(i => i !== id)
  else nueva.push(id)
  emit('update:alertasSeleccionadas', nueva)
}

// Mostrar u ocultar las alertas actualmente visibles según el filtro activo
const seleccionarAlertasFiltradas = () => {
  const idsFiltrados = alertasFiltradas.value.map(a => a.id)
  const combinados = Array.from(new Set([...props.alertasSeleccionadas, ...idsFiltrados]))
  emit('update:alertasSeleccionadas', combinados)
}

const deseleccionarAlertasFiltradas = () => {
  if (filtroEstadoAlerta.value === 'TODAS') {
    emit('update:alertasSeleccionadas', [])
  } else {
    const idsFiltrados = new Set(alertasFiltradas.value.map(a => a.id))
    emit('update:alertasSeleccionadas', props.alertasSeleccionadas.filter(id => !idsFiltrados.has(id)))
  }
}

const seleccionarTodasEstaciones = () => emit('update:idsSeleccionados', props.bases.map(b => b.id))
const deseleccionarTodasEstaciones = () => emit('update:idsSeleccionados', [])
</script>

<template>
  <aside class="h-full w-80 bg-slate-800 border-r border-slate-700 flex flex-col z-10 shrink-0 shadow-xl font-sans">
    
    <!-- Topbar -->
    <div class="p-4 border-b border-slate-700 flex items-center justify-between">
      <div class="flex items-center gap-2 text-white">
        <span class="font-black tracking-wide text-sm uppercase">Centro de Control</span>
      </div>
      <button @click="$emit('Back')" title="Volver al Menú Principal" class="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition cursor-pointer">
        <House class="w-5 h-5" />
      </button>
    </div>

    <!-- Estado Operativo -->
    <div class="p-4 bg-slate-900/50 border-b border-slate-700/60 flex items-center justify-between">
      <div class="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
        <span>Red Operativa Activa</span>
      </div>
      <button @click="$emit('recargar')" class="text-slate-400 hover:text-white transition cursor-pointer" title="Actualizar datos">
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': cargando }" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto custom-scroll">
      
      <!-- SECCIÓN 1: ACORDEÓN DE ALERTAS Y REPORTES -->
      <div class="border-b border-slate-700/60 bg-slate-900/40">
        <button @click="mostrarAlertas = !mostrarAlertas" class="w-full p-3 flex items-center justify-between text-left hover:bg-slate-700/30 transition cursor-pointer">
          <div class="flex items-center gap-2">
            <Bell class="w-4 h-4 text-red-500" />
            <span class="text-xs font-black text-slate-200 uppercase tracking-wider">
              Alertas y Reportes ({{ alertasSeleccionadas.length }}/{{ alertas.length }})
            </span>
            <span v-if="conteoPorEstado.PENDIENTE > 0" class="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
          </div>
          <component :is="mostrarAlertas ? ChevronUp : ChevronDown" class="w-4 h-4 text-slate-400" />
        </button>

        <!-- Filtros de Alertas con Estados Oficiales -->
        <div v-if="mostrarAlertas" class="p-3 space-y-2.5">
          <div class="grid grid-cols-2 gap-1.5">
            <button
              v-for="est in ESTADOS_OFICIALES"
              :key="est.value"
              @click="filtroEstadoAlerta = est.value"
              class="py-1.5 px-2 rounded-lg text-[9.5px] font-bold uppercase transition cursor-pointer flex items-center justify-between gap-1"
              :class="[
                est.value === 'TODAS' ? 'col-span-2' : '',
                filtroEstadoAlerta === est.value ? est.activeClass + ' shadow' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              ]"
            >
              <span class="truncate">{{ est.label }}</span>
              <span class="px-1.5 py-0.2 bg-black/25 rounded text-[9px] font-black">
                {{ conteoPorEstado[est.value] ?? 0 }}
              </span>
            </button>
          </div>

          <div class="flex justify-between text-[10px] text-slate-400 px-1">
            <button @click="seleccionarAlertasFiltradas" class="hover:text-white transition underline cursor-pointer">
              Mostrar {{ filtroEstadoAlerta === 'TODAS' ? 'todas' : 'filtradas' }}
            </button>
            <button @click="deseleccionarAlertasFiltradas" class="hover:text-red-400 transition underline cursor-pointer">
              Ocultar {{ filtroEstadoAlerta === 'TODAS' ? 'todas' : 'filtradas' }}
            </button>
          </div>

          <!-- Lista de Alertas -->
          <div v-if="alertasFiltradas.length === 0" class="text-center py-6 text-[11px] text-slate-500">
            No hay alertas en estado <span class="text-slate-300 font-bold">{{ filtroEstadoAlerta }}</span>.
          </div>

          <div v-else class="space-y-2 max-h-60 overflow-y-auto custom-scroll pt-1">
            <div 
              v-for="alerta in alertasFiltradas" 
              :key="alerta.id"
              class="p-2 bg-slate-900/60 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg transition flex items-center gap-2.5"
            >
              <button @click.stop="toggleAlerta(alerta.id)" class="text-slate-400 hover:text-red-400 transition cursor-pointer shrink-0">
                <CheckSquare v-if="estaAlertaSeleccionada(alerta.id)" class="w-4 h-4 text-red-500" />
                <Square v-else class="w-4 h-4 text-slate-600" />
              </button>

              <div class="flex-1 min-w-0 cursor-pointer" @click="$emit('centrarAlerta', alerta)">
                <div class="flex items-center justify-between gap-1">
                  <span class="text-xs font-bold text-white truncate">{{ alerta.tipo_alerta || 'Alerta Ciudadana' }}</span>
                  <span class="px-1.5 py-0.5 rounded text-[7.5px] font-black uppercase shrink-0" :class="obtenerBadgeEstado(alerta.estado_actual)">
                    {{ alerta.estado_actual || 'PENDIENTE' }}
                  </span>
                </div>
                <p class="text-[10px] text-slate-400 truncate mt-0.5">{{ alerta.descripcion || 'Sin descripción' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN 2: ACORDEÓN DE BASES Y CAIS -->
      <div class="border-b border-slate-700/60 bg-slate-900/20">
        <button @click="mostrarBases = !mostrarBases" class="w-full p-3 flex items-center justify-between text-left hover:bg-slate-700/30 transition cursor-pointer">
          <div class="flex items-center gap-2">
            <Siren class="w-4 h-4 text-gecap-blue" />
            <span class="text-xs font-black text-slate-300 uppercase tracking-wider">
              Bases y CAIs ({{ idsSeleccionados.length }}/{{ bases.length }})
            </span>
          </div>
          <component :is="mostrarBases ? ChevronUp : ChevronDown" class="w-4 h-4 text-slate-400" />
        </button>

        <div v-if="mostrarBases" class="p-3 space-y-2">
          <div class="flex gap-1.5">
            <button @click="filtroTipoBase = 'TODOS'" class="flex-1 py-1 px-2 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer" :class="filtroTipoBase === 'TODOS' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'">Todos</button>
            <button @click="filtroTipoBase = 'CAI'" class="flex-1 py-1 px-2 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer" :class="filtroTipoBase === 'CAI' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'">CAIs</button>
            <button @click="filtroTipoBase = 'ESTACION'" class="flex-1 py-1 px-2 rounded-lg text-[10px] font-bold uppercase transition cursor-pointer" :class="filtroTipoBase === 'ESTACION' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'">Estaciones</button>
          </div>

          <div class="flex justify-between text-[10px] text-slate-400 px-1">
            <button @click="seleccionarTodasEstaciones" class="hover:text-white transition underline cursor-pointer">Mostrar todos</button>
            <button @click="deseleccionarTodasEstaciones" class="hover:text-red-400 transition underline cursor-pointer">Ocultar todos</button>
          </div>

          <div class="space-y-2 max-h-56 overflow-y-auto custom-scroll pt-1">
            <div v-for="base in basesFiltradas" :key="base.id" class="p-2.5 bg-slate-900/40 hover:bg-slate-700/50 border border-slate-700/40 rounded-xl transition flex items-center gap-3">
              <button @click.stop="toggleBase(base.id)" class="text-slate-400 hover:text-blue-400 transition cursor-pointer shrink-0">
                <CheckSquare v-if="estaBaseSeleccionada(base.id)" class="w-4 h-4 text-blue-500" />
                <Square v-else class="w-4 h-4 text-slate-600" />
              </button>

              <div class="flex-1 min-w-0 cursor-pointer" @click="$emit('centrar', base)">
                <div class="flex items-center justify-between gap-1">
                  <h4 class="text-xs font-bold text-white truncate">{{ base.nombre }}</h4>
                  <span class="px-1.5 py-0.5 rounded text-[7px] font-black uppercase shrink-0" :class="base.tipo?.toUpperCase().includes('CAI') ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'">
                    {{ base.tipo }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Footer del Sidebar -->
    <div class="p-3 border-t border-slate-700 text-center text-[10px] text-slate-500 font-mono">
      GECAP v1.0 • Tuluá
    </div>
  </aside>
</template>

<style scoped>
.custom-scroll::-webkit-scrollbar { width: 5px; }
.custom-scroll::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.4); border-radius: 4px; }
.custom-scroll::-webkit-scrollbar-thumb { background: rgba(51, 65, 85, 0.8); border-radius: 4px; }
.custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(71, 85, 105, 1); }
</style>