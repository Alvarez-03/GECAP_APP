<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Building2,  MapPin,  Phone, Shield,  ArrowLeft,  Home,  ChevronDown, FileText,Sparkles} from 'lucide-vue-next'
import { cuadrantesService } from '../services/cuadrantesService'
import { toast } from 'vue3-toastify'

// Importar subcomponentes modulares
import SidebarCuadrantes from '../components/policia/SidebarCuadrantes.vue'
import ChipsFiltrosCuadrantes from '../components/policia/ChipsFiltrosCuadrantes.vue'

const router = useRouter()
const route = useRoute()

const cargando = ref(true)
const basesPoliciales = ref([])
const cuadrantesCompletos = ref([])
const actualizandoFiltro = ref(false)

// Estados del Sidebar de Filtros (Sincronizados con Query Params)
const filtroBusqueda = ref(route.query.busqueda || '')
const filtroTipo = ref(route.query.tipo || 'TODOS')
const filtroSector = ref(route.query.sector || 'TODOS')
const filtroBarrio = ref(route.query.barrio || 'TODOS')

// Control del acordeón por estación
const estacionesAbiertas = ref({})

const cargarDatosCuadrantes = async () => {
  try {
    cargando.value = true
    const [resBases, resCuadrantes] = await Promise.all([
      cuadrantesService.obtenerBasesPoliciales(),
      cuadrantesService.obtenerCuadrantesCompletos()
    ])

    if (resBases.error) throw resBases.error
    if (resCuadrantes.error) throw resCuadrantes.error

    basesPoliciales.value = resBases.data || []
    cuadrantesCompletos.value = resCuadrantes.data || []

    // Inicializar todas las estaciones abiertas por defecto
    basesPoliciales.value.forEach(base => {
      estacionesAbiertas.value[base.id] = true
    })

  } catch (error) {
    console.error('Error al cargar la estructura de cuadrantes:', error)
    toast.error('No se pudo cargar la información de cuadrantes y bases.')
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  cargarDatosCuadrantes()
})

// Sincronizar con URL y dar feedback visual con destello
let timeoutNotificacion = null
watch([filtroBusqueda, filtroTipo, filtroSector, filtroBarrio], () => {
  if (cargando.value) return

  const queryParams = {}
  
  if (filtroBusqueda.value.trim()) queryParams.busqueda = filtroBusqueda.value.trim()
  if (filtroTipo.value !== 'TODOS') queryParams.tipo = filtroTipo.value
  if (filtroSector.value !== 'TODOS') queryParams.sector = filtroSector.value
  if (filtroBarrio.value !== 'TODOS') queryParams.barrio = filtroBarrio.value

  router.replace({ query: queryParams })

  // Destello visual en el listado
  actualizandoFiltro.value = true
  setTimeout(() => {
    actualizandoFiltro.value = false
  }, 250)

  // Toast de notificación con debounce
  clearTimeout(timeoutNotificacion)
  timeoutNotificacion = setTimeout(() => {
    const cantidad = estructuraJerarquica.value.length
    toast.success(`Filtro aplicado: ${cantidad} ${cantidad === 1 ? 'base encontrada' : 'bases encontradas'}`, {
      autoClose: 1800,
      position: 'bottom-right',
      hideProgressBar: true
    })
  }, 400)
}, { deep: true })

const sectoresDisponibles = computed(() => {
  const sectores = basesPoliciales.value.map(b => b.sector).filter(Boolean)
  return [...new Set(sectores)]
})

const barriosDisponibles = computed(() => {
  const lista = []
  cuadrantesCompletos.value.forEach(cuadrante => {
    if (cuadrante.barrios_tulua) {
      cuadrante.barrios_tulua.forEach(b => {
        if (b.nombre_barrio) lista.push(b.nombre_barrio)
      })
    }
  })
  return [...new Set(lista)].sort()
})

const hayFiltrosActivos = computed(() => {
  return filtroBusqueda.value.trim() !== '' ||
    filtroTipo.value !== 'TODOS' ||
    filtroSector.value !== 'TODOS' ||
    filtroBarrio.value !== 'TODOS'
})

const limpiarFiltros = () => {
  filtroBusqueda.value = ''
  filtroTipo.value = 'TODOS'
  filtroSector.value = 'TODOS'
  filtroBarrio.value = 'TODOS'
  router.replace({ query: {} })
  toast.info('Filtros restablecidos', { autoClose: 1500, position: 'bottom-right' })
}

const toggleEstacion = (baseId) => {
  estacionesAbiertas.value[baseId] = !estacionesAbiertas.value[baseId]
}

const exportarPDF = () => {
  toast.info('Funcionalidad de exportación a PDF en desarrollo. Próximamente disponible.')
}

// Helpers de Identificación de Coincidencias Exactas para Resaltado
const esBarrioCoincidente = (nombreBarrio) => {
  if (!nombreBarrio) return false
  const bQuery = filtroBarrio.value.toUpperCase()
  const tQuery = filtroBusqueda.value.trim().toLowerCase()
  
  const matchSelectBarrio = bQuery !== 'TODOS' && nombreBarrio.toUpperCase() === bQuery
  const matchTextoBarrio = tQuery && nombreBarrio.toLowerCase().includes(tQuery)
  return matchSelectBarrio || matchTextoBarrio
}

const esEstacionCoincidente = (base) => {
  const tQuery = filtroBusqueda.value.trim().toLowerCase()
  if (!tQuery) return false
  return base.nombre.toLowerCase().includes(tQuery) || (base.sector && base.sector.toLowerCase().includes(tQuery))
}

const obtenerColorBadge = (tipo) => {
  if (!tipo) return 'bg-slate-800 text-slate-300 border-slate-700'
  const t = tipo.toLowerCase()
  if (t.includes('subestacion') || t.includes('subestación')) {
    return 'bg-blue-600 text-white border-blue-500'
  }
  if (t.includes('cai')) {
    return 'bg-emerald-600 text-white border-emerald-500'
  }
  return 'bg-slate-800 text-red-400 border-slate-700'
}

const obtenerColorIcono = (tipo) => {
  if (!tipo) return 'bg-slate-700 text-white'
  const t = tipo.toLowerCase()
  if (t.includes('subestacion') || t.includes('subestación')) {
    return 'bg-blue-600 text-white'
  }
  if (t.includes('cai')) {
    return 'bg-emerald-600 text-white'
  }
  return 'bg-red-600 text-white'
}

// Estructura jerárquica con lógica de barrios asociados completos
const estructuraJerarquica = computed(() => {
  const textoQuery = filtroBusqueda.value.toLowerCase()
  const tipoQuery = filtroTipo.value.toUpperCase()
  const sectorQuery = filtroSector.value.toUpperCase()
  const barrioQuery = filtroBarrio.value.toUpperCase()

  return basesPoliciales.value.map(base => {
    if (tipoQuery !== 'TODOS') {
      const tipoBase = (base.tipo || '').toUpperCase()
      if (!tipoBase.includes(tipoQuery)) return null
    }

    if (sectorQuery !== 'TODOS') {
      const sectorBase = (base.sector || '').toUpperCase()
      if (sectorBase !== sectorQuery) return null
    }

    const cuadrantesDeEstaBase = cuadrantesCompletos.value.filter(c => c.base_policial_id === base.id)

    if (barrioQuery !== 'TODOS') {
      let baseContieneBarrio = false
      cuadrantesDeEstaBase.forEach(cuadrante => {
        const tieneBarrio = (cuadrante.barrios_tulua || []).some(
          b => b.nombre_barrio.toUpperCase() === barrioQuery
        )
        if (tieneBarrio) baseContieneBarrio = true
      })
      if (!baseContieneBarrio) return null
    }

    const cuadrantesMapeados = cuadrantesDeEstaBase.map(cuadrante => {
      const barrios = cuadrante.barrios_tulua || []
      
      const barriosFiltrados = barrios.filter(b => {
        if (!textoQuery) return true
        return (
          b.nombre_barrio.toLowerCase().includes(textoQuery) ||
          (b.comuna_o_zona && b.comuna_o_zona.toLowerCase().includes(textoQuery))
        )
      })

      return {
        ...cuadrante,
        barrios_tulua: barriosFiltrados
      }
    }).filter(cuadrante => {
      if (!textoQuery) return true
      const coincideCuadrante = cuadrante.nombre.toLowerCase().includes(textoQuery) || String(cuadrante.numero_zona).includes(textoQuery)
      const coincideBarrio = cuadrante.barrios_tulua.length > 0
      return coincideCuadrante || coincideBarrio
    })

    if (textoQuery) {
      const coincideBase = base.nombre.toLowerCase().includes(textoQuery) || base.direccion?.toLowerCase().includes(textoQuery)
      if (!coincideBase && cuadrantesMapeados.length === 0) return null
    }

    return {
      ...base,
      cuadrantes: cuadrantesMapeados
    }
  }).filter(Boolean)
})
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-slate-100 text-slate-900 font-sans overflow-hidden">
    
    <!-- ENCABEZADO SUPERIOR -->
    <header class="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0 shadow-md z-10">
      <div class="flex items-center gap-3">
        <button 
          @click="router.push('/policia/MenuPrincipal')" 
          class="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition cursor-pointer"
          title="Volver al Menú"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-base font-black uppercase tracking-wider text-white">Gestión de Estaciones y Cuadrantes</h1>
          <p class="text-xs text-slate-400">Panel de control y jerarquía operativa de seguridad</p>
        </div>
      </div>
      
      <div class="flex items-center gap-3">
        <button 
          @click="exportarPDF"
          class="bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition cursor-pointer"
          title="Exportar información a PDF"
        >
          <FileText class="w-4 h-4" /> Exportar PDF
        </button>

        <div class="bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold text-red-400 border border-slate-700 shadow-inner flex items-center gap-2">
          <Shield class="w-4 h-4" />
          Bases Operativas: <span class="font-black text-white">{{ basesPoliciales.length }}</span>
        </div>
      </div>
    </header>

    <!-- CUERPO PRINCIPAL CON ALTURA EXACTA -->
    <div class="flex-1 flex overflow-hidden">
      
      <!-- SIDEBAR LATERAL MODULARIZADO -->
      <SidebarCuadrantes 
        v-model:filtroBusqueda="filtroBusqueda"
        v-model:filtroTipo="filtroTipo"
        v-model:filtroSector="filtroSector"
        v-model:filtroBarrio="filtroBarrio"
        :barriosDisponibles="barriosDisponibles"
        :sectoresDisponibles="sectoresDisponibles"
        :basesPolicialesLength="basesPoliciales.length"
        :estructuraLength="estructuraJerarquica.length"
        :hayFiltrosActivos="hayFiltrosActivos"
        @limpiar="limpiarFiltros"
      />

      <!-- CONTENEDOR PRINCIPAL DE RESULTADOS -->
      <main class="flex-1 h-full overflow-y-auto p-6 bg-slate-100 flex flex-col justify-between">
        
        <div>
          <!-- CHIPS DE FILTROS ACTIVOS MODULARIZADOS -->
          <ChipsFiltrosCuadrantes 
            v-if="hayFiltrosActivos"
            v-model:filtroBusqueda="filtroBusqueda"
            v-model:filtroTipo="filtroTipo"
            v-model:filtroSector="filtroSector"
            v-model:filtroBarrio="filtroBarrio"
          />

          <!-- SPINNER DE CARGA -->
          <div v-if="cargando" class="flex flex-col items-center justify-center py-24 space-y-3">
            <div class="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs font-bold text-slate-500 uppercase tracking-widest">Sincronizando información...</p>
          </div>

          <!-- ESTADO VACÍO -->
          <div v-else-if="estructuraJerarquica.length === 0" class="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200 text-center px-4 shadow-sm">
            <h3 class="text-sm font-bold text-slate-700">No se encontraron estaciones con los filtros aplicados</h3>
            <p class="text-xs text-slate-400 mt-1">Prueba cambiando los parámetros de búsqueda en el panel lateral.</p>
            <button 
              @click="limpiarFiltros"
              class="mt-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase px-4 py-2 rounded-xl transition cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>

          <!-- LISTADO TIPO ACORDEÓN -->
          <div 
            v-else 
            :class="[
              'space-y-4 transition-opacity duration-200',
              actualizandoFiltro ? 'opacity-40' : 'opacity-100'
            ]"
          >
            
            <!-- CADA ESTACIÓN / CAI / SUBESTACIÓN -->
            <div 
              v-for="base in estructuraJerarquica" 
              :key="base.id"
              :class="[
                'bg-white border rounded-2xl shadow-sm overflow-hidden transition-all duration-300',
                esEstacionCoincidente(base) ? 'border-amber-500 ring-2 ring-amber-400/50 shadow-md' : 'border-slate-200'
              ]"
            >
              <!-- Cabecera de la Estación (Acordeón) -->
              <div 
                @click="toggleEstacion(base.id)"
                class="bg-slate-900 text-white px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-800 transition"
              >
                <div class="flex items-center gap-3">
                  <div :class="['p-2.5 rounded-xl shadow-md transition-colors', obtenerColorIcono(base.tipo)]">
                    <Building2 class="w-6 h-6" />
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span :class="['text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border', obtenerColorBadge(base.tipo)]">
                        {{ base.tipo || 'ESTACIÓN' }}
                      </span>
                      <span v-if="base.sector" class="text-[10px] font-bold uppercase text-slate-400">
                        Sector: {{ base.sector }}
                      </span>
                      <!-- Indicador visual si la estación coincide exactamente con la búsqueda -->
                      <span v-if="esEstacionCoincidente(base)" class="text-[9px] font-black uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles class="w-3 h-3" /> Coincidencia
                      </span>
                    </div>
                    <h2 class="text-sm font-black tracking-wide uppercase text-white mt-0.5">
                      {{ base.nombre }}
                    </h2>
                  </div>
                </div>

                <div class="flex items-center justify-between md:justify-end gap-4">
                  <div class="flex flex-wrap items-center gap-3 text-xs text-slate-300 bg-slate-950/50 px-4 py-2 rounded-xl border border-slate-800">
                    <div class="flex items-center gap-1.5">
                      <MapPin class="w-3.5 h-3.5 text-red-500 shrink-0" />
                      <span class="truncate max-w-[180px]">{{ base.direccion || 'Sin dirección' }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 font-mono hidden sm:flex">
                      <Phone class="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{{ base.telefono || 'N/A' }}</span>
                    </div>
                  </div>

                  <div class="p-2 bg-slate-800 rounded-xl text-slate-300 transition-transform duration-300" :class="{ 'rotate-180': estacionesAbiertas[base.id] }">
                    <ChevronDown class="w-5 h-5" />
                  </div>
                </div>
              </div>

              <!-- Contenido Desplegable: Cuadrantes y Barrios -->
              <div v-show="estacionesAbiertas[base.id]" class="p-6 bg-slate-50/60 space-y-4 border-t border-slate-200 animate-in fade-in duration-200">
                
                <div v-if="base.cuadrantes.length === 0" class="text-xs text-slate-400 italic py-3 text-center bg-white rounded-xl border border-dashed border-slate-200">
                  No hay cuadrantes asociados a esta base policial actualmente.
                </div>

                <!-- TARJETAS DE CUADRANTES -->
                <div 
                  v-for="cuadrante in base.cuadrantes" 
                  :key="cuadrante.id"
                  class="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3"
                >
                  <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-black text-xs">
                        #{{ cuadrante.numero_zona }}
                      </div>
                      <div>
                        <h3 class="text-xs font-black text-slate-900 uppercase tracking-tight">
                          {{ cuadrante.nombre }}
                        </h3>
                        <p class="text-[11px] text-slate-500 italic">
                          {{ cuadrante.descripcion_geografica || 'Sin descripción geográfica detallada.' }}
                        </p>
                      </div>
                    </div>

                    <div class="flex items-center gap-3">
                      <div class="bg-slate-100 px-3 py-1 rounded-lg text-xs font-mono font-bold text-slate-700 border border-slate-200 flex items-center gap-1.5">
                        <Phone class="w-3.5 h-3.5 text-red-600" />
                        Tel: {{ cuadrante.telefono_contacto || 'N/A' }}
                      </div>
                      <div class="bg-red-50 text-red-700 px-2.5 py-1 rounded-lg text-[11px] font-black uppercase border border-red-100">
                        Barrios: {{ cuadrante.barrios_tulua?.length || 0 }}
                      </div>
                    </div>
                  </div>

                  <!-- LISTADO DE BARRIOS (CON RESALTADO INTELIGENTE) -->
                  <div>
                    <p class="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                      <Home class="w-3 h-3 text-slate-400" /> Barrios y Zonas bajo su jurisdicción:
                    </p>

                    <div v-if="!cuadrante.barrios_tulua || cuadrante.barrios_tulua.length === 0" class="text-[11px] text-slate-400 italic">
                      Ningún barrio asignado que coincida con la búsqueda.
                    </div>

                    <div v-else class="flex flex-wrap gap-1.5">
                      <div 
                        v-for="barrio in cuadrante.barrios_tulua" 
                        :key="barrio.id"
                        :class="[
                          'border px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                          esBarrioCoincidente(barrio.nombre_barrio)
                            ? 'bg-amber-200 border-amber-500 text-amber-950 shadow-md ring-2 ring-amber-400 scale-105'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                        ]"
                      >
                        <!-- Punto indicador -->
                        <span 
                          class="w-1.5 h-1.5 rounded-full" 
                          :class="esBarrioCoincidente(barrio.nombre_barrio) ? 'bg-amber-600' : 'bg-red-500'"
                        ></span>

                        <span>{{ barrio.nombre_barrio }}</span>

                        <span v-if="barrio.comuna_o_zona" class="text-[10px] font-normal text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {{ barrio.comuna_o_zona }}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>

        <!-- FOOTER INFORMATIVO -->
        <div class="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
          GECAP — Sistema Estratégico de Cuadrantes y Estaciones Policiales en Tuluá
        </div>

      </main>

    </div>

  </div>
</template>