<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ShieldAlert, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { supabase } from '../services/supabase'
import { tiposReportesService } from '../services/tiposReportesService'
import { toast } from 'vue3-toastify'

// Importar subcomponentes modulares
import SidebarFiltros from '../components/policia/SidebarFiltros.vue'
import ChipsFiltrosActivos from '../components/policia/ChipsFiltrosActivos.vue'
import TarjetaAlerta from '../components/policia/TarjetaAlerta.vue'
import ModalEvidencias from '../components/ModalEvidencias.vue'
import ModalInforme from '../components/ModalInforme.vue'

const router = useRouter()
const route = useRoute()

const alertas = ref([])
const tiposReportesDB = ref([])
const cargando = ref(true)
const actualizandoFiltro = ref(false)

// Filtros y Paginación sincronizados con URL Query Params
const busquedaTexto = ref(route.query.busqueda || '')
const estadoFiltro = ref(route.query.estado || 'TODOS')
const tipoAlertaFiltro = ref(route.query.tipo || 'TODOS')
const evidenciaFiltro = ref(route.query.evidencia || 'TODOS')
const fechaDesde = ref(route.query.desde || '')
const fechaHasta = ref(route.query.hasta || '')
const paginaActual = ref(parseInt(route.query.pagina) || 1)
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

const opcionesEvidencia = [
  { id: 'TODOS', label: 'Todas las evidencias' },
  { id: 'CON', label: 'Con evidencias fotográficas' },
  { id: 'SIN', label: 'Sin evidencias' }
]

const cargarDatosIniciales = async () => {
  try {
    cargando.value = true
    const [resAlertas, resTipos] = await Promise.all([
      supabase.from('alertas').select('*, alerta_fotos(url_foto)').order('created_at', { ascending: false }),
      tiposReportesService.obtenerTodos(true)
    ])
    if (resAlertas.error) throw resAlertas.error
    alertas.value = resAlertas.data || []
    tiposReportesDB.value = resTipos || []
  } catch (error) {
    console.error(error)
    toast.error('No se pudo cargar la información del sistema.')
  } finally {
    cargando.value = false
  }
}

onMounted(() => { cargarDatosIniciales() })

const actualizarParametrosURL = () => {
  const query = {}
  if (busquedaTexto.value) query.busqueda = busquedaTexto.value
  if (estadoFiltro.value !== 'TODOS') query.estado = estadoFiltro.value
  if (tipoAlertaFiltro.value !== 'TODOS') query.tipo = tipoAlertaFiltro.value
  if (evidenciaFiltro.value !== 'TODOS') query.evidencia = evidenciaFiltro.value
  if (fechaDesde.value) query.desde = fechaDesde.value
  if (fechaHasta.value) query.hasta = fechaHasta.value
  if (paginaActual.value > 1) query.pagina = paginaActual.value
  router.replace({ query })
}

const limpiarFiltros = () => {
  busquedaTexto.value = ''
  estadoFiltro.value = 'TODOS'
  tipoAlertaFiltro.value = 'TODOS'
  evidenciaFiltro.value = 'TODOS'
  fechaDesde.value = ''
  fechaHasta.value = ''
  paginaActual.value = 1
  router.replace({ query: {} })
  toast.info('Filtros restablecidos', { autoClose: 1500, position: 'bottom-right' })
}

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
    const coincideTipo = tipoAlertaFiltro.value === 'TODOS' || alerta.tipo_alerta === tipoAlertaFiltro.value

    const tieneEvidencia = (alerta.alerta_fotos?.length || 0) > 0
    let coincideEvidencia = true
    if (evidenciaFiltro.value === 'CON') coincideEvidencia = tieneEvidencia
    if (evidenciaFiltro.value === 'SIN') coincideEvidencia = !tieneEvidencia

    let coincideFecha = true
    if (alerta.created_at) {
      const fechaAlerta = alerta.created_at.split('T')[0]
      if (fechaDesde.value && fechaAlerta < fechaDesde.value) coincideFecha = false
      if (fechaHasta.value && fechaAlerta > fechaHasta.value) coincideFecha = false
    }

    return coincideTexto && coincideEstado && coincideTipo && coincideEvidencia && coincideFecha
  })
})

const hayFiltrosActivos = computed(() => {
  return busquedaTexto.value !== '' ||
    estadoFiltro.value !== 'TODOS' ||
    tipoAlertaFiltro.value !== 'TODOS' ||
    evidenciaFiltro.value !== 'TODOS' ||
    fechaDesde.value !== '' ||
    fechaHasta.value !== ''
})

// 1. WATCHER EXCLUSIVO PARA FILTROS (Muestra Toast, resetea a pág 1 y actualiza URL)
let timeoutNotificacion = null
watch([busquedaTexto, estadoFiltro, tipoAlertaFiltro, evidenciaFiltro, fechaDesde, fechaHasta], () => { 
  if (cargando.value) return

  paginaActual.value = 1 
  actualizarParametrosURL()

  actualizandoFiltro.value = true
  setTimeout(() => { actualizandoFiltro.value = false }, 250)

  clearTimeout(timeoutNotificacion)
  timeoutNotificacion = setTimeout(() => {
    const cantidad = alertasFiltradas.value.length
    toast.success(`Vista actualizada: ${cantidad} ${cantidad === 1 ? 'reporte encontrado' : 'reportes encontrados'}`, {
      autoClose: 1800,
      position: 'bottom-right',
      hideProgressBar: true
    })
  }, 400)
})

// 2. WATCHER EXCLUSIVO PARA PAGINACIÓN (Solo cambia la página y URL silenciosamente, sin Toast)
watch(paginaActual, () => {
  if (cargando.value) return
  actualizarParametrosURL()
})

const totalPaginas = computed(() => Math.ceil(alertasFiltradas.value.length / porPagina) || 1)
const alertasPaginadas = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina
  return alertasFiltradas.value.slice(inicio, inicio + porPagina)
})

const cambiarPagina = (p) => { 
  if (p >= 1 && p <= totalPaginas.value) paginaActual.value = p 
}

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
  <div class="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans overflow-hidden">
    
    <!-- ENCABEZADO SUPERIOR -->
    <header class="bg-gecap-darkblue border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0 shadow-md z-10">
      <div class="flex items-center gap-3">
        <button @click="router.push('/policia/MenuPrincipal')" class="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition cursor-pointer">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-base font-black uppercase tracking-wider text-white">Gestión y Monitoreo de Alertas</h1>
          <p class="text-xs text-slate-300">Panel de control y seguimiento de incidentes ciudadanos en Tuluá</p>
        </div>
      </div>
      <div class="bg-white/10 px-4 py-1.5 rounded-full text-xs font-bold text-white border border-white/20 shadow-inner flex items-center gap-2">
        <span>Reportes:</span>
        <span class="bg-red-600 text-white px-2.5 py-0.5 rounded-md font-black transition-all">
          {{ alertasFiltradas.length }}
        </span>
      </div>
    </header>

    <!-- CUERPO PRINCIPAL -->
    <div class="flex-1 flex overflow-hidden">
      
      <!-- SIDEBAR MODULARIZADO -->
      <SidebarFiltros 
        v-model:busquedaTexto="busquedaTexto"
        v-model:estadoFiltro="estadoFiltro"
        v-model:tipoAlertaFiltro="tipoAlertaFiltro"
        v-model:evidenciaFiltro="evidenciaFiltro"
        v-model:fechaDesde="fechaDesde"
        v-model:fechaHasta="fechaHasta"
        :estadosDisponibles="estadosDisponibles"
        :tiposReportesDB="tiposReportesDB"
        :opcionesEvidencia="opcionesEvidencia"
        :hayFiltrosActivos="hayFiltrosActivos"
        @limpiar="limpiarFiltros"
      />

      <!-- CONTENEDOR DE TARJETAS Y PAGINACIÓN -->
      <main class="flex-1 p-6 overflow-y-auto flex flex-col justify-between bg-slate-100">
        <div>
          
          <!-- CHIPS DE FILTROS ACTIVOS -->
          <ChipsFiltrosActivos 
            v-if="hayFiltrosActivos"
            v-model:busquedaTexto="busquedaTexto"
            v-model:estadoFiltro="estadoFiltro"
            v-model:tipoAlertaFiltro="tipoAlertaFiltro"
            v-model:evidenciaFiltro="evidenciaFiltro"
            v-model:fechaDesde="fechaDesde"
            v-model:fechaHasta="fechaHasta"
          />

          <!-- Estado de Carga -->
          <div v-if="cargando" class="flex flex-col items-center justify-center py-24 space-y-3">
            <div class="w-8 h-8 border-4 border-gecap-darkblue border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs font-bold text-slate-500 uppercase tracking-widest">Sincronizando base de datos...</p>
          </div>

          <!-- Estado Vacío -->
          <div v-else-if="alertasFiltradas.length === 0" class="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 text-center px-4 shadow-sm">
            <ShieldAlert class="w-12 h-12 text-slate-300 mb-3" />
            <h3 class="text-sm font-bold text-slate-700">No se encontraron alertas con estos filtros</h3>
            <p class="text-xs text-slate-400 mt-1">Intenta ampliar el rango de fechas o restablecer los filtros.</p>
            <button 
              v-if="hayFiltrosActivos"
              @click="limpiarFiltros"
              class="mt-4 px-4 py-2 bg-gecap-darkblue text-white text-xs font-bold uppercase rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              Ver todas las alertas
            </button>
          </div>

          <!-- Cuadrícula de Tarjetas -->
          <div 
            v-else 
            :class="[
              'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-200',
              actualizandoFiltro ? 'opacity-40' : 'opacity-100'
            ]"
          >
            <TarjetaAlerta 
              v-for="alerta in alertasPaginadas" 
              :key="alerta.id" 
              :alerta="alerta"
              @verEvidencias="abrirEvidencias"
              @verInforme="verInforme"
            />
          </div>
        </div>

        <!-- PAGINACIÓN INFERIOR -->
        <div v-if="!cargando && totalPaginas > 1" class="flex items-center justify-between border-t border-slate-200 px-4 py-4 mt-6 bg-white rounded-2xl shadow-xs shrink-0">
          <span class="text-xs font-bold text-slate-600 uppercase">
            Página <span class="text-gecap-darkblue font-black">{{ paginaActual }}</span> de <span class="font-black">{{ totalPaginas }}</span>
          </span>

          <div class="flex items-center gap-2">
            <button 
              @click="cambiarPagina(paginaActual - 1)" 
              :disabled="paginaActual === 1" 
              class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase flex items-center gap-1 transition disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft class="w-4 h-4" /> Anterior
            </button>
            <button 
              @click="cambiarPagina(paginaActual + 1)" 
              :disabled="paginaActual === totalPaginas" 
              class="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1 transition disabled:opacity-40 cursor-pointer"
            >
              Siguiente <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

    </div>

    <!-- MODALES -->
    <ModalEvidencias v-model="mostrarModalEvidencia" :evidencias="evidenciasSeleccionadas" :codigoSeguimiento="codigoActual" />
    <ModalInforme v-model="mostrarModalInforme" :alerta="reporteSeleccionado" />

  </div>
</template>