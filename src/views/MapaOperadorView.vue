<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import { supabase } from '../services/supabase'
import { mapaService } from '../services/mapaService'
import { reportesService } from '../services/reportesService'
import SidebarOperador from '../components/policia/SidebarOperador.vue'
import PopupAlerta from '../components/policia/PopupAlerta.vue'

const router = useRouter()
const mapContainer = ref(null)
let map = null

const bases = ref([])
const alertas = ref([])
const idsSeleccionados = ref([])
const alertasSeleccionadas = ref([])
const cargando = ref(true)

// Referencia a la alerta seleccionada actualmente para abrir el Popup personalizado
const alertaActiva = ref(null)

let marcadoresBasesMap = {}
let marcadoresAlertasMap = {}
let canalAlertas = null

// Obtener jurisdicción del operador desde localStorage ('operador_gecap')
const obtenerJurisdiccionOperador = () => {
  try {
    const raw = localStorage.getItem('operador_gecap')
    if (!raw) return { idCuadrante: null, idEstacion: null }
    const operador = JSON.parse(raw)
    return {
      idCuadrante: operador?.id_cuadrante ? String(operador.id_cuadrante) : null,
      idEstacion: operador?.id_estacion ? String(operador.id_estacion) : null
    }
  } catch (e) {
    console.error('Error al leer operador_gecap de localStorage:', e)
    return { idCuadrante: null, idEstacion: null }
  }
}

// Validar si una alerta pertenece al cuadrante o estación del operador
const perteneceAlOperador = (alerta) => {
  const { idCuadrante, idEstacion } = obtenerJurisdiccionOperador()
  
  // Si el operador no tiene ninguno asignado en el storage, no mostrar alertas por seguridad
  if (!idCuadrante && !idEstacion) return false

  const idsPermitidos = [idCuadrante, idEstacion].filter(Boolean)
  const candidatosAlerta = [
    alerta?.id_cuadrante,
    alerta?.id_estacion,
    alerta?.base_policial_id
  ]
    .filter(Boolean)
    .map(String)

  return candidatosAlerta.some((id) => idsPermitidos.includes(id))
}

const solicitarPermisoNotificaciones = () => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

const mostrarNotificacionNativa = (alerta) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const titulo = `🚨 ¡NUEVA ALERTA RECIBIDA! [${alerta.codigo_seguimiento || 'S/C'}]`
    const opciones = {
      body: `Tipo: ${alerta.tipo_alerta || 'Emergencia'}\nDescripción: ${alerta.descripcion || 'Sin detalle'}`,
      icon: '/shield-icon.png',
      tag: alerta.id
    }

    const notificacion = new Notification(titulo, opciones)
    notificacion.onclick = () => {
      window.focus()
      centrarEnElemento(alerta)
      notificacion.close()
    }
  }
}

const reproducirVozAlerta = (alerta) => {
  try {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()

    const textoMensaje = `Atención. Nueva alerta recibida. Código ${alerta}`
    const utterance = new SpeechSynthesisUtterance(textoMensaje)
    utterance.lang = 'es-CO'
    utterance.rate = 1.0
    utterance.pitch = 1.1
    utterance.volume = 1.0

    window.speechSynthesis.speak(utterance)
  } catch (e) {
    console.warn('Error al reproducir la voz de alerta:', e)
  }
}

const mostrarToastAlerta = (alerta) => {
  const codigo = alerta.codigo_seguimiento || alerta.tipo_alerta || 'NUEVA ALERTA'
  toast.error(`🚨 ¡NUEVA ALERTA! Código: ${codigo}. Clic para enfocar en mapa.`, {
    position: 'top-right',
    autoClose: 8000,
    closeOnClick: true,
    pauseOnHover: true,
    onClick: () => {
      centrarEnElemento(alerta)
    }
  })
}

const cargarDatos = async () => {
  cargando.value = true
  const { idCuadrante, idEstacion } = obtenerJurisdiccionOperador()

  const [dataBases, resAlertas] = await Promise.all([
    mapaService.obtenerBasesPoliciales(),
    reportesService.obtenerAlertasPorOperador(idCuadrante, idEstacion)
  ])

  bases.value = dataBases || []
  // Doble validación en cliente por seguridad
  alertas.value = (resAlertas.alertas || []).filter(perteneceAlOperador)

  idsSeleccionados.value = bases.value.map((b) => b.id)

  const idsActualesAlertas = alertas.value.map((a) => a.id)
  if (alertasSeleccionadas.value.length === 0) {
    alertasSeleccionadas.value = idsActualesAlertas
  } else {
    const nuevasAlertas = idsActualesAlertas.filter((id) => !alertasSeleccionadas.value.includes(id))
    alertasSeleccionadas.value = [
      ...alertasSeleccionadas.value.filter((id) => idsActualesAlertas.includes(id)),
      ...nuevasAlertas
    ]
  }

  actualizarMapa()
  cargando.value = false
}

watch(
  () => [idsSeleccionados.value, alertasSeleccionadas.value],
  () => {
    actualizarMapa()
  },
  { deep: true }
)

const actualizarMapa = () => {
  if (!map) return

  // 1. Marcadores de Bases
  const idsBasesSeleccionadasStr = idsSeleccionados.value.map(String)

  Object.keys(marcadoresBasesMap).forEach((id) => {
    if (!idsBasesSeleccionadasStr.includes(String(id))) {
      map.removeLayer(marcadoresBasesMap[id])
      delete marcadoresBasesMap[id]
    }
  })

  bases.value.forEach((base) => {
    const baseIdStr = String(base.id)
    if (idsBasesSeleccionadasStr.includes(baseIdStr) && !marcadoresBasesMap[base.id]) {
      const lat = parseFloat(base.latitud ?? base.lat)
      const lng = parseFloat(base.longitud ?? base.lng)
      if (!isNaN(lat) && !isNaN(lng)) {
        marcadoresBasesMap[base.id] = L.marker([lat, lng], { icon: mapaService.crearIconoBase(base.tipo) })
          .addTo(map)
          .bindPopup(mapaService.crearContenidoPopup(base))
      }
    }
  })

  // 2. Marcadores de Alertas (filtradas por jurisdicción)
  const idsAlertasSeleccionadasStr = alertasSeleccionadas.value.map(String)

  Object.keys(marcadoresAlertasMap).forEach((id) => {
    if (!idsAlertasSeleccionadasStr.includes(String(id))) {
      map.removeLayer(marcadoresAlertasMap[id])
      delete marcadoresAlertasMap[id]
    }
  })

  alertas.value.forEach((alerta) => {
    const alertaIdStr = String(alerta.id)
    if (idsAlertasSeleccionadasStr.includes(alertaIdStr) && !marcadoresAlertasMap[alerta.id]) {
      const lat = parseFloat(alerta.latitud)
      const lng = parseFloat(alerta.longitud)

      if (!isNaN(lat) && !isNaN(lng)) {
        const codigoTipo = (alerta.tipo_alerta || '10-00').slice(0, 5)
        const estadoUpper = (alerta.estado_actual || 'PENDIENTE').toUpperCase()
        const esPendiente = estadoUpper === 'PENDIENTE'

        let colorPin = 'border-amber-500 text-amber-400' // 5.14 - DESPLAZANDOSE
        if (esPendiente) colorPin = 'border-red-500 text-red-400'
        else if (estadoUpper.includes('5.03')) colorPin = 'border-sky-500 text-sky-400'
        else if (estadoUpper.includes('5.50')) colorPin = 'border-emerald-500 text-emerald-400'

        const iconoAlerta = L.divIcon({
          className: 'custom-police-pin',
          html: `
            <div class="relative flex items-center justify-center group cursor-pointer">
              ${esPendiente ? '<span class="absolute -inset-1 rounded-full bg-red-500/40 animate-ping"></span>' : ''}
              <div class="relative flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 border-2 ${colorPin} rounded-full shadow-2xl backdrop-blur-md">
                <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <span class="text-[10px] font-black tracking-wider uppercase">${codigoTipo}</span>
              </div>
            </div>
          `,
          iconSize: [80, 30],
          iconAnchor: [40, 15]
        })

        const marker = L.marker([lat, lng], { icon: iconoAlerta }).addTo(map)

        marker.on('click', () => {
          alertaActiva.value = alerta
          map.flyTo([lat, lng], 16, { duration: 0.8 })
        })

        marcadoresAlertasMap[alerta.id] = marker
      }
    }
  })
}

const centrarEnElemento = (item) => {
  const lat = parseFloat(item.latitud ?? item.lat)
  const lng = parseFloat(item.longitud ?? item.lng)
  if (map && !isNaN(lat) && !isNaN(lng)) {
    map.flyTo([lat, lng], 16, { duration: 1.2 })
    alertaActiva.value = item
  }
}

const handleActualizarEstado = async ({ id, nuevoEstado }) => {
  const resultado = await reportesService.actualizarEstadoAlerta(id, nuevoEstado)

  if (resultado.success) {
    toast.success(`Estado actualizado a: ${nuevoEstado}`)
    await cargarDatos()
  } else {
    toast.error('No se pudo actualizar el estado en la base de datos.')
  }
}

onMounted(async () => {
  solicitarPermisoNotificaciones()

  await nextTick()
  if (!mapContainer.value) return

  map = L.map(mapContainer.value, { zoomControl: true, minZoom: 11, maxZoom: 18 }).setView([4.0847, -76.1954], 14)

  const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY || ''
  const urlTile = cartoApiKey
    ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png?key=${cartoApiKey}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  L.tileLayer(urlTile, { maxZoom: 18, maxNativeZoom: 19 }).addTo(map)

  await cargarDatos()

  // ESCUCHA EN TIEMPO REAL FILTRADA POR JURISDICCIÓN DEL OPERADOR
  canalAlertas = supabase
    .channel('cambios-alertas-operador')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'alertas' },
      async (payload) => {
        const nuevaAlerta = payload.new
        // Ignorar alertas que no correspondan al cuadrante o estación del operador
        if (!perteneceAlOperador(nuevaAlerta)) return

        await cargarDatos()
        mostrarToastAlerta(nuevaAlerta)
        reproducirVozAlerta(nuevaAlerta.tipo_alerta)
        mostrarNotificacionNativa(nuevaAlerta)
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'alertas' },
      async (payload) => {
        // Recargar si la alerta actualizada pertenece al operador o ya estaba en su mapa
        const afectaOperador =
          perteneceAlOperador(payload.new) ||
          alertas.value.some((a) => String(a.id) === String(payload.new?.id))

        if (afectaOperador) {
          await cargarDatos()
        }
      }
    )
    .subscribe()
})

onUnmounted(() => {
  if (canalAlertas) {
    supabase.removeChannel(canalAlertas)
  }
  if (map) map.remove()
})

const handleBack = async () => {
  router.push('/policia/MenuPrincipal')
}
</script>

<template>
  <div class="w-screen h-screen flex bg-slate-900 font-sans overflow-hidden select-none">
    <SidebarOperador 
      :bases="bases"
      :alertas="alertas"
      :cargando="cargando"
      v-model:idsSeleccionados="idsSeleccionados"
      v-model:alertasSeleccionadas="alertasSeleccionadas"
      @Back="handleBack"
      @centrar="centrarEnElemento"
      @centrarAlerta="centrarEnElemento"
      @recargar="cargarDatos"
    />

    <main class="flex-1 h-full relative">
      <div ref="mapContainer" class="w-full h-full z-0"></div>

      <div 
        v-if="alertaActiva" 
        class="absolute top-6 right-6 z-20"
      >
        <PopupAlerta 
          :alerta="alertaActiva"
          @cerrar="alertaActiva = null"
          @actualizarEstado="handleActualizarEstado"
        />
      </div>
    </main>
  </div>
</template>