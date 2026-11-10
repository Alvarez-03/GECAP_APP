<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Filter, Calendar, ShieldAlert, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { supabase } from '../services/supabase'
import { toast } from 'vue3-toastify'

// Importar los subcomponentes creados
import TarjetaAlerta from '../components/policia/TarjetaAlerta.vue'
import ModalEvidencias from '../components/ModalEvidencias.vue'
import ModalInforme from '../components/ModalInforme.vue'

const router = useRouter()
const alertas = ref([])
const cargando = ref(true)

// Filtros y Paginación
const busquedaTexto = ref('')
const estadoFiltro = ref('TODOS')
const fechaDesde = ref('')
const fechaHasta = ref('')
const paginaActual = ref(1)
const porPagina = 9

// Modales
const mostrarModalEvidencia = ref(false)
const evidenciasSeleccionadas = ref([])
const codigoActual = ref('')

const mostrarModalInforme = ref(false)
const reporteSeleccionado = ref(null)

const estadosDisponibles = [
  { id: 'TODOS', label: 'Todos los estados' },
  { id: 'PENDIENTE', label: 'Pendiente' },
  { id: '5.14', label: '5.14 Desplazándose' },
  { id: '5.03', label: '5.03 En sitio' },
  { id: '5.50', label: '5.50 Finalizado' }
]

const cargarAlertasGlobales = async () => {
  try {
    cargando.value = true
    const { data, error } = await supabase
      .from('alertas')
      .select('*, alerta_fotos(url_foto)')
      .order('created_at', { ascending: false })

    if (error) throw error
    alertas.value = data || []
  } catch (error) {
    toast.error('No se pudo cargar el listado de alertas.')
  } finally {
    cargando.value = false
  }
}

onMounted(() => { cargarAlertasGlobales() })

const alertasFiltradas = computed(() => {
  return alertas.value.filter(alerta => {
    const texto = busquedaTexto.value.toLowerCase()
    const coincideTexto = !texto ||
      alerta.codigo_seguimiento?.toLowerCase().includes(texto) ||
      alerta.nombre_ciudadano?.toLowerCase().includes(texto) ||
      alerta.ciudadano_documento?.toLowerCase().includes(texto) ||
      alerta.descripcion?.toLowerCase().includes(texto)

    const estadoActual = (alerta.estado_actual || 'PENDIENTE').toUpperCase()
    const coincideEstado = estadoFiltro.value === 'TODOS' || estadoActual.includes(estadoFiltro.value)

    let coincideFecha = true
    if (alerta.created_at) {
      const fechaAlerta = alerta.created_at.split('T')[0]
      if (fechaDesde.value && fechaAlerta < fechaDesde.value) coincideFecha = false
      if (fechaHasta.value && fechaAlerta > fechaHasta.value) coincideFecha = false
    }

    return coincideTexto && coincideEstado && coincideFecha
  })
})

watch([busquedaTexto, estadoFiltro, fechaDesde, fechaHasta], () => { paginaActual.value = 1 })

const totalPaginas = computed(() => Math.ceil(alertasFiltradas.value.length / porPagina) || 1)
const alertasPaginadas = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina
  return alertasFiltradas.value.slice(inicio, inicio + porPagina)
})

const cambiarPagina = (p) => { if (p >= 1 && p <= totalPaginas.value) paginaActual.value = p }

const abrirEvidencias = (alerta) => {
  if (alerta.alerta_fotos?.length > 0) {
    evidenciasSeleccionadas.value = alerta.alerta_fotos.map(f => f.url_foto)
    codigoActual.value = alerta.codigo_seguimiento
    mostrarModalEvidencia.value = true
  } else {
    toast.info('Este reporte no cuenta con evidencias fotográficas.')
  }
}

const verInforme = (alerta) => {
  reporteSeleccionado.value = alerta
  mostrarModalInforme.value = true
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
    
    <!-- ENCABEZADO -->
    <header class="bg-gecap-darkblue border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-xs">
      <div class="flex items-center gap-3">
        <button @click="router.push('/policia/MenuPrincipal')" class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-base font-black uppercase tracking-wider text-white">Gestión y Monitoreo de Alertas</h1>
          <p class="text-xs text-white">Historial completo de reportes ciudadanos en Tuluá</p>
        </div>
      </div>
      <div class="bg-slate-100 px-4 py-1.5 rounded-full text-xs font-bold text-gecap-blue border border-slate-200 shadow-inner">
        Total Registros: <span class="font-black">{{ alertasFiltradas.length }}</span>
      </div>
    </header>

    <!-- FILTROS -->
    <div class="bg-white border-b border-slate-200 px-6 py-3 grid grid-cols-1 md:grid-cols-4 gap-3 shadow-xs">
      <div class="relative">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input v-model="busquedaTexto" type="text" placeholder="Buscar por radicado, ciudadano..." class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-600 transition" />
      </div>

      <div class="relative">
        <Filter class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <select v-model="estadoFiltro" class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none uppercase font-bold cursor-pointer">
          <option v-for="est in estadosDisponibles" :key="est.id" :value="est.id">{{ est.label }}</option>
        </select>
      </div>

      <div class="relative flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
        <Calendar class="w-4 h-4 text-slate-400 shrink-0" />
        <div class="flex flex-col w-full">
          <span class="text-[9px] font-black uppercase text-slate-400 leading-tight">Desde</span>
          <input v-model="fechaDesde" type="date" class="w-full bg-transparent text-xs text-slate-900 focus:outline-none cursor-pointer uppercase font-medium" />
        </div>
      </div>

      <div class="relative flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
        <Calendar class="w-4 h-4 text-slate-400 shrink-0" />
        <div class="flex flex-col w-full">
          <span class="text-[9px] font-black uppercase text-slate-400 leading-tight">Hasta</span>
          <input v-model="fechaHasta" type="date" class="w-full bg-transparent text-xs text-slate-900 focus:outline-none cursor-pointer uppercase font-medium" />
        </div>
      </div>
    </div>

    <!-- CONTENIDO -->
    <main class="flex-1 p-6 overflow-y-auto flex flex-col justify-between">
      <div>
        <div v-if="cargando" class="flex flex-col items-center justify-center py-24 space-y-3">
          <div class="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-xs font-bold text-slate-500 uppercase tracking-widest">Cargando base de datos de alertas...</p>
        </div>

        <div v-else-if="alertasFiltradas.length === 0" class="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 text-center px-4 shadow-sm">
          <ShieldAlert class="w-12 h-12 text-slate-300 mb-3" />
          <h3 class="text-sm font-bold text-slate-700">No se encontraron alertas</h3>
          <p class="text-xs text-slate-400 mt-1">Intenta ajustando los filtros de búsqueda o fechas.</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TarjetaAlerta 
            v-for="alerta in alertasPaginadas" 
            :key="alerta.id" 
            :alerta="alerta"
            @verEvidencias="abrirEvidencias"
            @verInforme="verInforme"
          />
        </div>
      </div>

      <!-- PAGINACIÓN -->
      <div v-if="!cargando && totalPaginas > 1" class="flex items-center justify-between border-t border-slate-200 px-4 py-4 mt-6 bg-white rounded-2xl shadow-xs">
        <span class="text-xs font-bold text-slate-600 uppercase">
          Página <span class="text-red-600 font-black">{{ paginaActual }}</span> de <span class="font-black">{{ totalPaginas }}</span>
        </span>

        <div class="flex items-center gap-2">
          <button @click="cambiarPagina(paginaActual - 1)" :disabled="paginaActual === 1" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase flex items-center gap-1 transition disabled:opacity-40 cursor-pointer">
            <ChevronLeft class="w-4 h-4" /> Anterior
          </button>
          <button @click="cambiarPagina(paginaActual + 1)" :disabled="paginaActual === totalPaginas" class="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1 transition disabled:opacity-40 cursor-pointer">
            Siguiente <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </main>

    <!-- MODALES MODULARIZADOS -->
    <ModalEvidencias v-model="mostrarModalEvidencia" :evidencias="evidenciasSeleccionadas" :codigoSeguimiento="codigoActual" />
    <ModalInforme v-model="mostrarModalInforme" :alerta="reporteSeleccionado" />

  </div>
</template>