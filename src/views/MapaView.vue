<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import HeaderCiudadano from '../components/ciudadano/HeaderCiudadano.vue'
import NavbarCiudadano from '../components/ciudadano/NavbarCiudadano.vue'
import { mapaService } from '../services/mapaService'
import { Navigation } from 'lucide-vue-next'
import { MapPin,Phone } from 'lucide-vue-next'

const router = useRouter()
const mapContainer = ref(null)
let map = null
let userMarker = null
const cargandoUbicacion = ref(false)

// Función para crear un pin SVG seguro
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

onMounted(async () => {
  // Esperar a que el DOM esté completamente renderizado
  await nextTick()
  if (!mapContainer.value) return

  // 1. Inicializar mapa centrado en Tuluá por defecto
  map = L.map(mapContainer.value, { 
    zoomControl: false,
    minZoom: 12, // Evita que el usuario se aleje demasiado
    maxZoom: 18  // Límite exacto donde las imágenes del mapa se ven perfectas
  }).setView([4.0847, -76.1954], 13)

  const cartoApiKey = import.meta.env.VITE_CARTO_API_KEY || ''

  // 2. Capa base de CARTO / OpenStreetMap
  const urlTile = cartoApiKey 
    ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png?key=${cartoApiKey}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  L.tileLayer(urlTile, { maxZoom: 18, maxNativeZoom: 19, attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(map)

  // 3. Consultar la base de datos de Supabase y dibujar estaciones y CAIs
  const data = await mapaService.obtenerBasesPoliciales()

  if (Array.isArray(data)) {
    data.forEach((base) => {
      const lat = parseFloat(base.latitud ?? base.lat)
      const lng = parseFloat(base.longitud ?? base.lng)

      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        const pinIcon = crearIconoBase(base.tipo)

        const popupContent = document.createElement('div')
        popupContent.className = 'font-sans p-1 min-w-[160px]'
        popupContent.innerHTML = `
          <h4 class="text-xs font-black text-slate-800 uppercase leading-tight">${base.nombre || 'Estación'}</h4>
          
          ${base.direccion ? `
            <p class="text-[11px] text-slate-600 mt-1 font-medium flex items-center gap-1">
              <svg class="w-3 h-3 shrink-0 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span>${base.direccion}</span>
            </p>` : ''}
            
          ${base.telefono ? `
            <p class="text-[11px] text-slate-600 mt-0.5 font-medium flex items-center gap-1">
              <svg class="w-3 h-3 shrink-0 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              <span>${base.telefono}</span>
            </p>` : ''}
        `
        L.marker([lat, lng], { icon: pinIcon })
          .addTo(map)
          .bindPopup(popupContent, {
            closeButton: false,
            className: 'custom-leaflet-popup'
          })
      }
    })
  }

  // Nota: Ya no llamamos a centrarEnUsuario() aquí para evitar que desplace el mapa fuera de Tuluá al abrir.
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

// Función para cuando el usuario presione el botón flotante de ubicación
const centrarEnUsuario = () => {
  if (!navigator.geolocation || !map) return
  cargandoUbicacion.value = true

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords
      
      if (userMarker) {
        userMarker.setLatLng([latitude, longitude])
      } else {
        userMarker = L.circleMarker([latitude, longitude], {
          radius: 8,
          fillColor: '#2563eb',
          color: '#ffffff',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.9
        }).addTo(map).bindPopup('<span class="text-xs font-bold">Tu Ubicación Actual</span>')
      }

      map.setView([latitude, longitude], 16)
      cargandoUbicacion.value = false
    },
    (error) => {
      console.warn('Ubicación no obtenida:', error.message)
      cargandoUbicacion.value = false
    },
    { enableHighAccuracy: true }
  )
}
</script>

<template>
  <div class="w-full max-w-md mx-auto h-dvh flex flex-col bg-slate-100 font-sans overflow-hidden select-none">
    
    <!-- Encabezado -->
    <HeaderCiudadano class="shrink-0 z-10" />

    <!-- Contenedor del Mapa -->
    <main class="flex-1 relative w-full h-full">
      <div ref="mapContainer" class="w-full h-full z-0"></div>

      <!-- Botón Flotante para Mi Ubicación (GPS) -->
      <button 
        @click="centrarEnUsuario"
        class="absolute bottom-6 right-4 z-10 bg-white text-slate-800 p-3 rounded-full shadow-lg border border-slate-200 active:scale-95 transition cursor-pointer flex items-center justify-center"
        :class="{ 'animate-pulse': cargandoUbicacion }"
        aria-label="Centrar en mi ubicación"
      >
        <Navigation class="w-5 h-5 text-gecap-darkblue" />
      </button>
    </main>

    <!-- Barra de Navegación Inferior -->
    <NavbarCiudadano class="shrink-0 z-10" />

  </div>
</template>

<style>
.custom-police-pin {
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