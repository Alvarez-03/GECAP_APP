<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import HeaderCiudadano from '../components/ciudadano/HeaderCiudadano.vue'
import NavbarCiudadano from '../components/ciudadano/NavbarCiudadano.vue'
import { mapaService } from '../services/mapaService'
import { reportesService } from '../services/reportesService'
import { Navigation } from 'lucide-vue-next'

const router = useRouter()
const mapContainer = ref(null)
let map = null
let userMarker = null
const cargandoUbicacion = ref(false)

// Estados de visibilidad de las capas
const mostrarEstaciones = ref(true)
const mostrarAlertas = ref(true)

// Grupos de capas de Leaflet para control fluido sin saltos
let estacionesLayer = null
let alertasLayer = null

// Función para crear un pin SVG seguro para Bases / CAIs
const crearIconoBase = (tipo) => {
  const esCAI = tipo?.toUpperCase().includes('CAI')
  const colorBg = esCAI ? 'bg-red-600' : 'bg-gecap-darkblue'
  const iconoTexto = esCAI ? 'CAI' : 'POL'

  return L.divIcon({
    className: 'custom-police-pin',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="${colorBg} text-white font-black text-[10px] px-2 py-1 rounded-full shadow-md border-2 border-white flex items-center gap-1 min-w-[36px] justify-center tracking-wider">
          <span>${iconoTexto}</span>
        </div>
        <div class="absolute -bottom-1.5 w-2 h-2 ${colorBg} rotate-45 border-r border-b border-white"></div>
      </div>
    `,
    iconSize: [40, 30],
    iconAnchor: [20, 30],
    popupAnchor: [0, -28]
  })
}

// Función para crear un pin dinámico para las Alertas Ciudadanas
const crearIconoAlerta = (alerta) => {
  const codigoTipo = (alerta.tipo_alerta || 'ALERTA').slice(0, 6)
  const esPendiente = alerta.estado_actual === 'PENDIENTE'

  return L.divIcon({
    className: 'custom-alerta-pin',
    html: `
      <div class="relative flex items-center justify-center">
        ${esPendiente ? '<span class="absolute -inset-1 rounded-full bg-red-500/40 animate-ping"></span>' : ''}
        <div class="relative flex items-center gap-1 px-2.5 py-1 bg-slate-900/95 border-2 ${esPendiente ? 'border-red-500 text-red-400' : 'border-amber-500 text-amber-400'} rounded-full shadow-lg backdrop-blur-md">
          <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span class="text-[9px] font-black tracking-wider uppercase">${codigoTipo}</span>
        </div>
      </div>
    `,
    iconSize: [70, 28],
    iconAnchor: [35, 14],
    popupAnchor: [0, -16]
  })
}

// Control reactivo para mostrar u ocultar el grupo de estaciones sin recrear elementos
watch(mostrarEstaciones, (nuevoValor) => {
  if (!map || !estacionesLayer) return
  if (nuevoValor) {
    map.addLayer(estacionesLayer)
  } else {
    map.removeLayer(estacionesLayer)
  }
})

// Control reactivo para mostrar u ocultar el grupo de alertas sin recrear elementos
watch(mostrarAlertas, (nuevoValor) => {
  if (!map || !alertasLayer) return
  if (nuevoValor) {
    map.addLayer(alertasLayer)
  } else {
    map.removeLayer(alertasLayer)
  }
})

onMounted(async () => {
  await nextTick()
  if (!mapContainer.value) return

  // 1. Inicializar mapa centrado en Tuluá
  map = L.map(mapContainer.value, { 
    zoomControl: false,
    minZoom: 12, 
    maxZoom: 18  
  }).setView([4.0847, -76.1954], 13)

  const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY || ''

  // 2. Capa base de mapas
  const urlTile = cartoApiKey 
    ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png?key=${cartoApiKey}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  L.tileLayer(urlTile, { maxZoom: 18, maxNativeZoom: 19, attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(map)

  // 3. Inicializar los grupos de capas y añadirlos al mapa por defecto
  estacionesLayer = L.layerGroup().addTo(map)
  alertasLayer = L.layerGroup().addTo(map)

  // 4. Consultar datos una sola vez y poblar los grupos de capas
  try {
    const [basesData, resAlertas] = await Promise.all([
      mapaService.obtenerBasesPoliciales(),
      reportesService.obtenerTodasLasAlertas()
    ])

    const cachedBases = Array.isArray(basesData) ? basesData : []
    const cachedAlertas = Array.isArray(resAlertas) ? resAlertas : (resAlertas?.alertas || [])

    // Poblar capa de Estaciones / CAIs
    cachedBases.forEach((base) => {
      const lat = parseFloat(base.latitud ?? base.lat)
      const lng = parseFloat(base.longitud ?? base.lng)

      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        const pinIcon = crearIconoBase(base.tipo)
        const popupContent = document.createElement('div')
        popupContent.className = 'font-sans p-1 min-w-[160px]'
        popupContent.innerHTML = `
          <h4 class="text-xs font-black text-slate-800 uppercase leading-tight">${base.nombre || 'Estación'}</h4>
          ${base.direccion ? `<p class="text-[11px] text-slate-600 mt-1 font-medium">📍 ${base.direccion}</p>` : ''}
          ${base.telefono ? `<p class="text-[11px] text-slate-600 mt-0.5 font-medium">📞 ${base.telefono}</p>` : ''}
        `
        L.marker([lat, lng], { icon: pinIcon })
          .bindPopup(popupContent, { closeButton: false, className: 'custom-leaflet-popup' })
          .addTo(estacionesLayer)
      }
    })

    // Poblar capa de Alertas Ciudadanas
    cachedAlertas.forEach((alerta) => {
      const lat = parseFloat(alerta.latitud)
      const lng = parseFloat(alerta.longitud)

      if (!isNaN(lat) && !isNaN(lng)) {
        const alertaIcon = crearIconoAlerta(alerta)
        const fechaFormateada = alerta.created_at 
          ? new Date(alerta.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
          : 'Reciente'

        const popupAlertaContent = document.createElement('div')
        popupAlertaContent.className = 'font-sans p-1 min-w-[240px] max-w-[280px] space-y-3'
        popupAlertaContent.innerHTML = `
          <!-- Cabecera: Tipo de Alerta y Código de Seguimiento -->
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <span class="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-200 px-2.5 py-0.5 rounded-md">
              ${alerta.tipo_alerta || 'Emergencia'}
            </span>
          </div>

          <!-- Cuerpo: Descripción del Ciudadano -->
          <div class="space-y-1">
            <span class="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Descripción del ciudadano
            </span>
            <p class="text-xs font-semibold text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 shadow-inner">
              "${alerta.descripcion || 'Sin descripción detallada'}"
            </p>
          </div>

          <!-- Pie del Popup: Estado Actual -->
          <div class="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
            <span class="text-slate-500 font-medium">Estado:</span>
            <span class="font-black uppercase tracking-wider text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
              ${alerta.estado_actual || 'PENDIENTE'}
            </span>
          </div>
        `
        L.marker([lat, lng], { icon: alertaIcon })
          .bindPopup(popupAlertaContent, { closeButton: false, className: 'custom-leaflet-popup' })
          .addTo(alertasLayer)
      }
    })

  } catch (error) {
    console.error('❌ Error crítico al cargar elementos en el mapa del ciudadano:', error)
  }
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})


</script>

<template>
  <div class="w-full max-w-md mx-auto h-dvh flex flex-col bg-slate-100 font-sans overflow-hidden select-none">
    
    <!-- Encabezado -->
    <HeaderCiudadano class="shrink-0 z-10" />

    <!-- Contenedor del Mapa -->
    <main class="flex-1 relative w-full h-full">
      <div ref="mapContainer" class="w-full h-full z-0"></div>

      <!-- CONTENEDOR ESTABLE DE PÍLDORAS (Usa border-2 fijo en ambos estados para evitar saltos de tamaño) -->
      <div class="absolute bottom-7 left-0 right-0 z-20 flex items-center justify-center gap-2 px-4 pointer-events-none">
        
        <!-- Botón Estaciones / CAI -->
        <button 
          @click="mostrarEstaciones = !mostrarEstaciones"
          :class="mostrarEstaciones ? 'bg-slate-900 text-white border-indigo-500 shadow-lg' : 'bg-slate-800/60 text-slate-400 border-slate-700/60'"
          class="pointer-events-auto px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md transition-all cursor-pointer flex items-center gap-2 shadow-xl active:scale-95 border-2"
        >
          <span class="w-2 h-2 rounded-full transition-colors" :class="mostrarEstaciones ? 'bg-indigo-400 animate-pulse' : 'bg-slate-500'"></span>
          Estaciones / CAI
        </button>

        <!-- Botón Alertas Ciudadanas -->
        <button 
          @click="mostrarAlertas = !mostrarAlertas"
          :class="mostrarAlertas ? 'bg-slate-900 text-white border-red-500 shadow-lg' : 'bg-slate-800/60 text-slate-400 border-slate-700/60'"
          class="pointer-events-auto px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider backdrop-blur-md transition-all cursor-pointer flex items-center gap-2 shadow-xl active:scale-95 border-2"
        >
          <span class="w-2 h-2 rounded-full transition-colors" :class="mostrarAlertas ? 'bg-red-400 animate-pulse' : 'bg-slate-500'"></span>
          Alertas
        </button>

      </div>

    </main>

    <!-- Barra de Navegación Inferior -->
    <NavbarCiudadano class="shrink-0 z-10" />

  </div>
</template>

<style>
.custom-police-pin, .custom-alerta-pin {
  background: transparent !important;
  border: none !important;
}

.leaflet-popup-content-wrapper {
  border-radius: 12px !important;
  padding: 4px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.leaflet-container {
  width: 100%;
  height: 100%;
}
</style>