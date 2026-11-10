<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Mic, MicOff, Video, Send, Loader2, MapPin, Volume2, Navigation, Check, ChevronRight, ChevronLeft } from 'lucide-vue-next'
import { toast } from 'vue3-toastify'
import { useGeolocation } from '@vueuse/core'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import HeaderCiudadano from '../components/ciudadano/HeaderCiudadano.vue'
import NavbarCiudadano from '../components/ciudadano/NavbarCiudadano.vue'
import CardTipoAlerta from '../components/ciudadano/CardTipoAlerta.vue'
import { crearAlertaController } from '../controllers/crearAlertaController'
import { setupSpeech } from '../utils/speechHelper'

const router = useRouter()
const route = useRoute()

const { coords, error: errorUbicacion } = useGeolocation({
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 10000
})

// Control de Pasos (Steps)
const currentStep = ref(1)

// Estados reactivos
const cargando = ref(true)
const enviando = ref(false)
const listaTiposReportes = ref([])
const tipoReporteSeleccionado = ref(null)
const descripcionAudio = ref('')
const grabandoVoz = ref(false)
const datosListos = ref(false)

// Estados para manejo de múltiples fotos de evidencia
const archivosFotos = ref([])
const previsualizacionesFotos = ref([])
const fileInputRef = ref(null)

// Coordenadas manuales o ajustadas por el usuario en el mapa
const latManual = ref(route.query.lat ? parseFloat(route.query.lat) : null)
const lngManual = ref(route.query.lng ? parseFloat(route.query.lng) : null)
const mostrarModalMapa = ref(false)
const mapContainerMini = ref(null)
let miniMap = null
let miniMarker = null

let recognitionInstance = null

// Inicializar helper de voz
const { iniciarReconocimientoVoz, leerTextoEnVozAlta } = setupSpeech({
  descripcionAudio,
  actualizarParametrosURL: (texto) => actualizarParametrosURL({ descripcion: texto }),
  grabandoVozRef: grabandoVoz,
  toast
})

const obtenerLatitudActual = () => {
  if (latManual.value !== null) return latManual.value
  if (coords.value.latitude && coords.value.latitude !== Infinity && coords.value.latitude !== 0) {
    return coords.value.latitude
  }
  return route.query.lat ? parseFloat(route.query.lat) : 4.0847
}

const obtenerLongitudActual = () => {
  if (lngManual.value !== null) return lngManual.value
  if (coords.value.longitude && coords.value.longitude !== Infinity && coords.value.longitude !== 0) {
    return coords.value.longitude
  }
  return route.query.lng ? parseFloat(route.query.lng) : -76.1954
}

const actualizarParametrosURL = (nuevosParametros = {}) => {
  const alertaSeleccionada = listaTiposReportes.value.find(item => item.id === tipoReporteSeleccionado.value)

  const lat = obtenerLatitudActual()
  const lng = obtenerLongitudActual()
  const accuracy = coords.value.accuracy ? Math.round(coords.value.accuracy) : (route.query.accuracy || '')

  router.replace({
    query: {
      ...route.query,
      tipo_id: tipoReporteSeleccionado.value || route.query.tipo_id || '',
      situacion: alertaSeleccionada?.situacion || route.query.situacion || '',
      codigo: alertaSeleccionada?.codigo || route.query.codigo || '',
      descripcion: descripcionAudio.value || route.query.descripcion || '',
      lat,
      lng,
      accuracy,
      ...nuevosParametros
    }
  })
}

watch(
  () => [coords.value.latitude, coords.value.longitude],
  ([nuevaLat, nuevaLng]) => {
    if (datosListos.value && nuevaLat && nuevaLng && nuevaLat !== Infinity && nuevaLng !== Infinity && latManual.value === null) {
      actualizarParametrosURL()
    }
  }
)

onMounted(async () => {
  try {
    cargando.value = true
    const data = await crearAlertaController.obtenerTodos()
    listaTiposReportes.value = data

    if (route.query.tipo_id) {
      const idParam = Number(route.query.tipo_id)
      const existe = listaTiposReportes.value.some(item => item.id === idParam)
      if (existe) tipoReporteSeleccionado.value = idParam
    }

    if (route.query.descripcion) {
      descripcionAudio.value = route.query.descripcion
    }

    recognitionInstance = iniciarReconocimientoVoz()
  } catch (error) {
    console.error('Error al cargar tipos de reportes:', error)
    toast.error('No se pudieron cargar las categorías de reporte.')
  } finally {
    cargando.value = false
    setTimeout(() => {
      datosListos.value = true
    }, 200)
  }
})

const abrirSelectorUbicacion = async () => {
  mostrarModalMapa.value = true
  await nextTick()
  
  const currentLat = obtenerLatitudActual()
  const currentLng = obtenerLongitudActual()

  if (!miniMap && mapContainerMini.value) {
    miniMap = L.map(mapContainerMini.value).setView([currentLat, currentLng], 15)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(miniMap)

    miniMarker = L.marker([currentLat, currentLng], { draggable: true }).addTo(miniMap)

    miniMarker.on('dragend', () => {
      const position = miniMarker.getLatLng()
      latManual.value = position.lat
      lngManual.value = position.lng
    })

    miniMap.on('click', (event) => {
      const { lat, lng } = event.latlng
      miniMarker.setLatLng([lat, lng])
      latManual.value = lat
      lngManual.value = lng
    })
  } else if (miniMap) {
    miniMap.setView([currentLat, currentLng], 15)
    miniMarker.setLatLng([currentLat, currentLng])
    miniMap.invalidateSize()
  }
}

const confirmarUbicacionManual = () => {
  mostrarModalMapa.value = false
  actualizarParametrosURL()
  toast.success('Ubicación ajustada correctamente.', { position: 'top-center' })
}

const seleccionarTipo = (id) => {
  tipoReporteSeleccionado.value = id
  actualizarParametrosURL({ tipo_id: id })
}

const handleInputTexto = (e) => {
  descripcionAudio.value = e.target.value
  actualizarParametrosURL({ descripcion: e.target.value })
}

const toggleGrabacionVoz = () => {
  if (!recognitionInstance) {
    toast.warning('El dictado por voz no está disponible.')
    return
  }

  if (grabandoVoz.value) {
    recognitionInstance.stop()
    grabandoVoz.value = false
  } else {
    try {
      recognitionInstance.start()
      grabandoVoz.value = true
      toast.info('Escuchando... Habla ahora.', { position: 'top-center' })
    } catch (e) {
      console.error(e)
      grabandoVoz.value = false
      toast.info('Escribe tu reporte en el campo de texto.')
    }
  }
}

// Navegación entre pasos
const siguientePaso = () => {
  if (currentStep.value === 1) {
    if (!tipoReporteSeleccionado.value) {
      toast.warning('Por favor selecciona un tipo de alerta.', { position: 'top-center' })
      return
    }
    currentStep.value = 2
  } else if (currentStep.value === 2) {
    if (!descripcionAudio.value.trim()) {
      toast.warning('Por favor escribe o dicta una descripción breve.', { position: 'top-center' })
      return
    }
    currentStep.value = 3
  }
}

const pasoAnterior = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// Funciones para manejar selección y previsualización de imágenes
const abrirSelectorEvidencia = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

const handleSeleccionarFotos = (event) => {
  const files = Array.from(event.target.files)
  if (!files.length) return

  if (archivosFotos.value.length + files.length > 4) {
    toast.warning('Puedes adjuntar un máximo de 4 fotos por reporte.', { position: 'top-center' })
    return
  }

  files.forEach(file => {
    if (!file.type.startsWith('image/')) {
      toast.error(`El archivo ${file.name} no es una imagen válida.`)
      return
    }
    archivosFotos.value.push(file)
    const previewUrl = URL.createObjectURL(file)
    previsualizacionesFotos.value.push(previewUrl)
  })

  event.target.value = ''
}

const eliminarFoto = (index) => {
  URL.revokeObjectURL(previsualizacionesFotos.value[index])
  previsualizacionesFotos.value.splice(index, 1)
  archivosFotos.value.splice(index, 1)
}

const enviarReporte = async () => {
  const latitud = obtenerLatitudActual()
  const longitud = obtenerLongitudActual()

  const LAT_DEFECTO = 4.0847
  const LNG_DEFECTO = -76.1954

  const usaCoordenadasPorDefecto = (latManual.value === null && (coords.value.latitude === Infinity || !coords.value.latitude)) && 
    (latitud === LAT_DEFECTO && longitud === LNG_DEFECTO)
    
  if (!latitud || !longitud || latitud === Infinity || usaCoordenadasPorDefecto) {
    toast.warning('Por favor define tu ubicación exacta en el mapa antes de enviar.', { position: 'top-center' })
    abrirSelectorUbicacion()
    return
  }

  const alertaSeleccionada = listaTiposReportes.value.find(item => item.id === tipoReporteSeleccionado.value)

  try {
    enviando.value = true

    const alertaCreada = await crearAlertaController.registrarAlerta({
      tipo_alerta: `${alertaSeleccionada?.codigo || ''}\n${alertaSeleccionada?.situacion || ''}`,
      descripcion: descripcionAudio.value || 'Sin descripción adicional',
      latitud,
      longitud
    }, archivosFotos.value)

    toast.success('¡Reporte registrado exitosamente!', { position: 'top-center' })

    router.push({
      path: '/reporteConfirmado',
      query: {
        codigo_seguimiento: alertaCreada.codigo_seguimiento,
        tipo_id: tipoReporteSeleccionado.value,
        situacion: alertaSeleccionada?.situacion || '',
        codigo: alertaSeleccionada?.codigo || '',
        descripcion: descripcionAudio.value || 'Sin descripción adicional',
        lat: latitud,
        lng: longitud,
        accuracy: Math.round(coords.value.accuracy || 0)
      }
    })
  } catch (error) {
    console.error('Error al guardar el reporte:', error)
  } finally {
    enviando.value = false
  }
}

const cancelarReporte = () => {
  router.push('/homeCiudadano')
}
</script>

<template>
  <div class="h-dvh bg-slate-100 flex justify-center items-center p-0 font-sans overflow-hidden">
    <div class="w-full h-full max-w-md bg-white shadow-2xl flex flex-col justify-between relative overflow-hidden">
      
      <HeaderCiudadano @salir="cancelarReporte" />

      <!-- BARRA DE PROGRESO DE PASOS -->
      <div class="bg-gecap-background px-4 py-2.5 flex items-center justify-between text-gecap-darkblue border-b border-slate-800">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-gecap-blue text-white flex items-center justify-center text-xs font-black">
            {{ currentStep }}
          </span>
          <span class="text-xs font-black uppercase tracking-wider">
            {{ currentStep === 1 ? 'Tipo de Alerta' : currentStep === 2 ? 'Descripción' : 'Evidencias' }}
          </span>
        </div>
        <span class="text-[10px] font-bold text-gecap-darkblue">Paso {{ currentStep }} de 3</span>
      </div>

      <main class="flex-1 px-4 py-4 flex flex-col justify-start overflow-y-auto space-y-4">
        
        <!-- PASO 1: ELEGIR TIPO DE REPORTE -->
        <div v-if="currentStep === 1" class="space-y-3">
          <div class="text-center">
            <h2 class="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
              SELECCIONA EL TIPO DE ALERTA
            </h2>
            <p class="text-xs text-slate-500 font-medium mt-0.5">Elige la situación que mejor describa el incidente</p>
          </div>

          <div v-if="cargando" class="flex flex-col items-center justify-center py-10">
            <Loader2 class="w-8 h-8 animate-spin text-red-600 mb-2" />
            <p class="text-base text-slate-400 font-bold">Cargando tipos de alertas...</p>
          </div>

          <div v-else class="max-h-[340px] overflow-y-auto pr-1 space-y-2.5 scroll-smooth custom-scrollbar pb-2">
            <CardTipoAlerta 
              v-for="item in listaTiposReportes"
              :key="item.id"
              :titulo="item.situacion"
              :descripcion="item.descripcion"
              :codigo="item.codigo"
              :seleccionado="tipoReporteSeleccionado === item.id"
              @seleccionar="seleccionarTipo(item.id)"
            />
          </div>

          <div class="pt-2">
            <button 
              @click="siguientePaso"
              class="w-full bg-gecap-red hover:bg-gecap-red/80 text-white font-black py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-wider text-base"
            >
              Siguiente
              <ChevronRight class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- PASO 2: DESCRIPCIÓN Y AUDIO -->
        <div v-if="currentStep === 2" class="space-y-4">
          <div class="text-center">
            <h2 class="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
              DESCRIPCIÓN DEL REPORTE
            </h2>
            <p class="text-xs text-slate-500 font-medium mt-0.5">Escribe detalles o usa el dictado por voz</p>
          </div>

          <div class="pt-1">
            <button 
              type="button"
              @click="toggleGrabacionVoz"
              :class="[
                'flex items-center mb-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer w-full justify-center gap-2',
                grabandoVoz 
                  ? 'bg-gecap-darkblue/70 text-white animate-pulse' 
                  : 'bg-gecap-darkblue text-white hover:bg-gecap-darkblue/90'
              ]"
            >
              <Mic v-if="!grabandoVoz" class="w-4 h-4 text-white" />
              <MicOff v-else class="w-4 h-4 text-white" />
              {{ grabandoVoz ? ' Escuchando... Habla ahora' : ' Dictar por voz descripción' }}
            </button>

            <div class="space-y-2.5 mt-2">
              <div class="flex items-center justify-between mt-1">
                <span class="text-[12px] text-slate-400 font-medium">Escucha tu reporte antes de continuar:</span>
                <button 
                  type="button"
                  @click="leerTextoEnVozAlta(descripcionAudio)"
                  class="flex items-center gap-1 px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-[11px] font-bold transition-colors cursor-pointer"
                >
                  <Volume2 class="w-4 h-4 text-gecap-darkblue" />
                  Reproducir audio
                </button>
              </div>

              <div class="relative">
                <textarea 
                  :value="descripcionAudio"
                  @input="handleInputTexto"
                  rows="4"
                  placeholder='Ej: "Dos sujetos sospechosos en moto negra merodeando..."'
                  class="w-full p-3 text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none resize-none placeholder:text-slate-400 font-medium"
                ></textarea>
              </div>
            </div>
          </div>

          <div class="flex gap-2 pt-4">
            <button 
              @click="pasoAnterior"
              class="w-1/3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black py-3 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer uppercase text-xs"
            >
              <ChevronLeft class="w-4 h-4" />
              Atrás
            </button>
            <button 
              @click="siguientePaso"
              class="w-2/3 bg-gecap-red hover:bg-gecap-red/80 text-white font-black py-3 rounded-xl shadow-lg flex items-center justify-center gap-1 transition-all cursor-pointer uppercase text-xs"
            >
              Siguiente
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- PASO 3: EVIDENCIAS Y ENVÍO -->
        <div v-if="currentStep === 3" class="space-y-4">
          <div class="text-center">
            <h2 class="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
              AGREGAR EVIDENCIAS (FOTOS)
            </h2>
            <p class="text-xs text-slate-500 font-medium mt-0.5">Puedes adjuntar hasta 4 fotografías opcionales</p>
          </div>

          <div class="space-y-3">
            <!-- Input file oculto -->
            <input 
              ref="fileInputRef"
              type="file" 
              accept="image/*" 
              multiple 
              class="hidden" 
              @change="handleSeleccionarFotos"
            />

            <!-- BOTÓN DE EVIDENCIA -->
            <div 
              @click="abrirSelectorEvidencia"
              class="flex items-center justify-between w-full p-3 bg-gecap-darkblue rounded-2xl shadow-sm border border-slate-100 hover:border-slate-300 transition-all cursor-pointer select-none"
            >
              <div class="flex items-center gap-3.5">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-inner flex-shrink-0">
                  <Video class="w-6 h-6" />
                </div>
                <div class="flex flex-col">
                  <span class="text-sm font-black tracking-wide text-white uppercase">
                    Tomar o Elegir Fotos {{ archivosFotos.length > 0 ? `(${archivosFotos.length}/4)` : '' }}
                  </span>
                  <span class="text-[10px] font-medium text-white/80 leading-tight mt-0.5">
                    Adjunta pruebas para las autoridades.
                  </span>
                </div>
              </div>
            </div>

            <!-- Previsualización de fotos -->
            <div v-if="previsualizacionesFotos.length > 0" class="grid grid-cols-4 gap-2 pt-1">
              <div v-for="(img, idx) in previsualizacionesFotos" :key="idx" class="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-300 shadow-sm">
                <img :src="img" class="w-full h-full object-cover" />
                <button 
                  type="button" 
                  @click.stop="eliminarFoto(idx)"
                  class="absolute top-1 right-1 bg-slate-900/80 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <div class="flex gap-2 pt-4">
            <button 
              @click="pasoAnterior"
              class="w-1/3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black py-3 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer uppercase text-xs"
            >
              <ChevronLeft class="w-4 h-4" />
              Atrás
            </button>
            <button 
              @click="enviarReporte"
              :disabled="enviando"
              class="w-2/3 bg-gecap-red hover:bg-gecap-red/80 text-white font-black py-3 rounded-xl shadow-lg flex items-center justify-center gap-1 transition-all cursor-pointer uppercase text-xs"
            >
              <Loader2 v-if="enviando" class="w-4 h-4 animate-spin text-white" />
              <Send v-else class="w-4 h-4 text-white" />
              {{ enviando ? 'Enviando...' : 'Enviar Reporte' }}
            </button>
          </div>
        </div>

      </main>

      <!-- Pie con GPS y Selector de Ubicación -->
      <div class="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-1.5 overflow-hidden">
          <span v-if="errorUbicacion || coords.latitude === Infinity" class="text-[10px] font-semibold text-gecap-blue flex items-center gap-1">
            <MapPin class="w-3.5 h-3.5 shrink-0" />
            <span>Sin GPS / Ajusta la ubicación</span>
          </span>
          <span v-else class="text-[10px] font-bold text-slate-600 flex items-center gap-1 tracking-tight truncate">
            <MapPin class="w-3.5 h-3.5 text-gecap-blue shrink-0 animate-bounce" />
            <span class="truncate">GPS: {{ obtenerLatitudActual().toFixed(5) }}, {{ obtenerLongitudActual().toFixed(5) }}</span>
          </span>
        </div>

        <button 
          type="button"
          @click="abrirSelectorUbicacion"
          class="px-2.5 py-1 bg-gecap-darkblue hover:bg-gecap-darkblue text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all shadow-sm cursor-pointer shrink-0"
        >
          <Navigation class="w-3 h-3" />
          Cambiar Ubicación
        </button>
      </div>

      <!-- Modal Mapa -->
      <div v-if="mostrarModalMapa" class="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4">
        <div class="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col h-[450px]">
          
          <div class="p-3 bg-slate-900 text-white flex items-center justify-between">
            <div>
              <h3 class="text-base font-black uppercase tracking-wider">Ajustar Ubicación del Incidente</h3>
              <p class="text-[10px] text-slate-400">Mueve el mapa o arrastra el marcador rojo al lugar exacto</p>
            </div>
            <button @click="mostrarModalMapa = false" class="text-slate-400 hover:text-white font-bold text-base p-1">✕</button>
          </div>

          <div ref="mapContainerMini" class="flex-1 w-full z-10"></div>

          <div class="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
            <span class="text-[10px] text-slate-500 font-mono">
              Lat: {{ obtenerLatitudActual().toFixed(4) }}, Lng: {{ obtenerLongitudActual().toFixed(4) }}
            </span>
            <button 
              @click="confirmarUbicacionManual"
              class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-base font-black uppercase tracking-wider flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Check class="w-4 h-4" />
              Confirmar Ubicación
            </button>
          </div>

        </div>
      </div>

      <NavbarCiudadano />

    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 8px;
}
</style>