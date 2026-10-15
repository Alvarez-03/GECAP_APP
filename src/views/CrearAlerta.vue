<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Mic, MicOff, Video, Send, Loader2, MapPin, Volume2 } from 'lucide-vue-next'
import { toast } from 'vue3-toastify'
import { useGeolocation } from '@vueuse/core'
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

// Estados reactivos
const cargando = ref(true)
const enviando = ref(false)
const listaTiposReportes = ref([])
const tipoReporteSeleccionado = ref(null)
const descripcionAudio = ref('')
const grabandoVoz = ref(false)
const datosListos = ref(false)

let recognitionInstance = null

// Inicializar helper de voz
const { iniciarReconocimientoVoz, leerTextoEnVozAlta } = setupSpeech({
  descripcionAudio,
  actualizarParametrosURL: (texto) => actualizarParametrosURL({ descripcion: texto }),
  grabandoVozRef: grabandoVoz,
  toast
})

const actualizarParametrosURL = (nuevosParametros = {}) => {
  const alertaSeleccionada = listaTiposReportes.value.find(item => item.id === tipoReporteSeleccionado.value)

  const lat = coords.value.latitude !== Infinity && coords.value.latitude !== 0 ? coords.value.latitude : (route.query.lat || '')
  const lng = coords.value.longitude !== Infinity && coords.value.longitude !== 0 ? coords.value.longitude : (route.query.lng || '')
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
    if (datosListos.value && nuevaLat && nuevaLng && nuevaLat !== Infinity && nuevaLng !== Infinity) {
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

const abrirSelectorEvidencia = () => {
  toast.info('Función de adjuntar fotos en desarrollo...', { position: 'top-center' })
}

const enviarReporte = async () => {
  const latitud = coords.value.latitude
  const longitud = coords.value.longitude

  if (!latitud || !longitud || latitud === Infinity || (latitud === 0 && longitud === 0)) {
    toast.warning('Obteniendo ubicación GPS, espera un momento...', { position: 'top-center' })
    return
  }

  if (!tipoReporteSeleccionado.value) {
    toast.warning('Por favor selecciona un tipo de alerta.', { position: 'top-center' })
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
    })

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
    toast.error('Ocurrió un error al registrar la alerta.')
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
      
      <!-- ENCABEZADO -->
      <HeaderCiudadano @salir="cancelarReporte" />

      <!-- CUERPO PRINCIPAL -->
      <main class="flex-1 px-4 py-4 flex flex-col justify-start overflow-y-auto space-y-4">
        
        <div class="text-center">
          <h2 class="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
            ENVIA TU REPORTE A LAS AUTORIDADES
          </h2>
        </div>

        <div v-if="cargando" class="flex flex-col items-center justify-center py-10">
          <Loader2 class="w-8 h-8 animate-spin text-red-600 mb-2" />
          <p class="text-xs text-slate-400 font-bold">Cargando tipos de alertas...</p>
        </div>

        <div v-else class="max-h-[300px] my-0.5 overflow-y-auto pr-1 space-y-2.5 scroll-smooth custom-scrollbar border-b-2 border-slate-200 pb-2">
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

        <div class="pt-1">
          <div class="flex items-center justify-between mb-1.5">
            <h3 class="text-[11px] font-black tracking-wider text-slate-500 uppercase">
              DESCRIPCIÓN Y AUDIO DEL REPORTE
            </h3>
            <button 
              type="button"
              @click="toggleGrabacionVoz"
              :class="[
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm cursor-pointer',
                grabandoVoz 
                  ? 'bg-red-600 text-white animate-pulse' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              ]"
            >
              <Mic v-if="!grabandoVoz" class="w-3.5 h-3.5 text-red-600" />
              <MicOff v-else class="w-3.5 h-3.5 text-white" />
              {{ grabandoVoz ? 'Escuchando...' : 'Dictar por voz' }}
            </button>
          </div>

          <div class="space-y-2.5">
            <div class="flex items-center justify-between mt-1">
                <span class="text-[10px] text-slate-400 font-medium">Escucha tu reporte antes de enviarlo:</span>
                <button 
                    type="button"
                    @click="leerTextoEnVozAlta(descripcionAudio)"
                    class="flex items-center gap-1 px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-[10px] font-bold transition-colors cursor-pointer"
                >
                <Volume2 class="w-3.5 h-3.5 text-gecap-darkblue" />
                 Reproducir audio
                </button>
            </div>
            <div class="relative">
              <textarea 
                :value="descripcionAudio"
                @input="handleInputTexto"
                rows="2"
                placeholder='Ej: "Dos sujetos sospechosos en moto negra merodeando..."'
                class="w-full p-2.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-none resize-none placeholder:text-slate-400 font-medium"
              ></textarea>
              
            </div>
            

            <div 
              @click="abrirSelectorEvidencia"
              class="flex items-center justify-between w-full p-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-slate-300 transition-all cursor-pointer select-none"
            >
              <div class="flex items-center gap-3.5">
                <div class="w-10 h-10 bg-red-700 rounded-xl flex items-center justify-center text-white shadow-inner flex-shrink-0">
                  <Video class="w-5 h-5" />
                </div>
                <div class="flex flex-col">
                  <span class="text-xs font-black tracking-wide text-slate-900 uppercase">
                    EVIDENCIA
                  </span>
                  <span class="text-[10px] font-medium text-slate-500 leading-tight mt-0.5">
                    TOMA FOTOS PARA EL REPORTE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-2 pb-1 space-y-2">
          <button 
            @click="enviarReporte"
            class="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-wider text-xs"
          >
            <Send class="w-4 h-4 text-red-500" />
            ENVIAR REPORTE
          </button>

          <button 
            @click="cancelarReporte"
            class="w-full text-center text-red-700 hover:text-red-800 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer py-0.5"
          >
            CANCELAR REPORTE
          </button>
        </div>

      </main>

      <div class="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-end justify-end">
        <span v-if="errorUbicacion" class="text-[11px] font-semibold text-red-500 flex items-center gap-1">
          <MapPin class="w-3.5 h-3.5" />
          Sin permiso de GPS / Sin ubicación
        </span>
        <span v-else-if="coords.latitude === Infinity" class="text-[11px] font-semibold text-slate-400 flex items-center gap-1 animate-pulse">
          <MapPin class="w-3.5 h-3.5 text-slate-400" />
          Obteniendo GPS...
        </span>
        <span v-else class="text-[11px] font-bold text-slate-600 flex items-center gap-1 tracking-tight">
          <MapPin class="w-3.5 h-3.5 text-red-600 animate-bounce" />
          GPS: {{ coords.latitude.toFixed(5) }}, {{ coords.longitude.toFixed(5) }}
        </span>
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