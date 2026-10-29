<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../services/supabase' // Importante para la suscripción
import { mapaService } from '../services/mapaService'
import { reportesService } from '../services/reportesService'
import { cerrarSesionOperador } from '../services/authService'
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

const cargarDatos = async () => {
  cargando.value = true
  const [dataBases, resAlertas] = await Promise.all([
    mapaService.obtenerBasesPoliciales(),
    reportesService.obtenerTodasLasAlertas()
  ])

  bases.value = dataBases || []
  alertas.value = resAlertas.alertas || []

  idsSeleccionados.value = bases.value.map(b => b.id)
  alertasSeleccionadas.value = alertas.value.map(a => a.id)

  actualizarMapa()
  cargando.value = false
}

const actualizarMapa = () => {
  if (!map) return

  // 1. Marcadores de Bases
  Object.keys(marcadoresBasesMap).forEach((id) => {
    if (!idsSeleccionados.value.includes(id)) {
      map.removeLayer(marcadoresBasesMap[id])
      delete marcadoresBasesMap[id]
    }
  })

  bases.value.forEach((base) => {
    if (idsSeleccionados.value.includes(base.id) && !marcadoresBasesMap[base.id]) {
      const lat = parseFloat(base.latitud ?? base.lat)
      const lng = parseFloat(base.longitud ?? base.lng)
      if (!isNaN(lat) && !isNaN(lng)) {
        marcadoresBasesMap[base.id] = L.marker([lat, lng], { icon: mapaService.crearIconoBase(base.tipo) })
          .addTo(map)
          .bindPopup(mapaService.crearContenidoPopup(base))
      }
    }
  })

  // 2. Marcadores de Alertas
  Object.keys(marcadoresAlertasMap).forEach((id) => {
    if (!alertasSeleccionadas.value.includes(id)) {
      map.removeLayer(marcadoresAlertasMap[id])
      delete marcadoresAlertasMap[id]
    }
  })

  alertas.value.forEach((alerta) => {
    if (alertasSeleccionadas.value.includes(alerta.id) && !marcadoresAlertasMap[alerta.id]) {
      const lat = parseFloat(alerta.latitud)
      const lng = parseFloat(alerta.longitud)

      if (!isNaN(lat) && !isNaN(lng)) {
        const codigoTipo = (alerta.tipo_alerta || '10-00').slice(0, 5)
        const esPendiente = alerta.estado_actual === 'PENDIENTE'

        const iconoAlerta = L.divIcon({
          className: 'custom-police-pin',
          html: `
            <div class="relative flex items-center justify-center group cursor-pointer">
              ${esPendiente ? '<span class="absolute -inset-1 rounded-full bg-red-500/40 animate-ping"></span>' : ''}
              <div class="relative flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 border-2 ${esPendiente ? 'border-red-500 text-red-400' : 'border-amber-500 text-amber-400'} rounded-full shadow-2xl backdrop-blur-md">
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

        // Al hacer clic en el pin del mapa, seleccionar la alerta para abrir el Popup en Vue
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
    alertaActiva.value = item // Abre el popup reactivo
  }
}

const handleActualizarEstado = async ({ id, nuevoEstado }) => {
  console.log('Actualizando estado de alerta:', id, nuevoEstado)
  // Aquí invocas tu servicio para guardar en Supabase el nuevo estado
  alertaActiva.value = null
}

onMounted(async () => {
  await nextTick()
  if (!mapContainer.value) return

  map = L.map(mapContainer.value, { zoomControl: true, minZoom: 11, maxZoom: 18 }).setView([4.0847, -76.1954], 14)

  const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY || ''
  const urlTile = cartoApiKey 
    ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png?key=${cartoApiKey}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  L.tileLayer(urlTile, { maxZoom: 18, maxNativeZoom: 19 }).addTo(map)

  await cargarDatos()
})

onUnmounted(() => {
  if (map) map.remove()
})

const handleLogout = async () => {
  await cerrarSesionOperador()
  router.push('/policia/login')
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
      @logout="handleLogout"
      @centrar="centrarEnElemento"
      @centrarAlerta="centrarEnElemento"
      @recargar="cargarDatos"
    />

    <main class="flex-1 h-full relative">
      <!-- Mapa Leaflet -->
      <div ref="mapContainer" class="w-full h-full z-0"></div>

      <!-- POPUP FLOTANTE REUTILIZABLE (PROTOTIPADO) -->
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