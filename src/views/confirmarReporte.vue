<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MapPin, Shield } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

// Generar la fecha actual formateada (DD-MM-YYYY)
const fechaActual = computed(() => {
  const hoy = new Date()
  return `${String(hoy.getDate()).padStart(2, '0')}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${hoy.getFullYear()}`
})

// Mapear los query parameters recibidos en la redirección
const datosReporte = computed(() => {
  const latitud = route.query.lat ? Number(route.query.lat).toFixed(3) : '0.000'
  const longitud = route.query.lng ? Number(route.query.lng).toFixed(3) : '0.000'

  return {
    codigoSeguimiento: route.query.codigo_seguimiento || 'CAD-000',
    codigoTipo: route.query.codigo || 'S/C',
    situacion: route.query.situacion || 'ALERTA',
    descripcion: route.query.descripcion || 'Sin descripción adicional',
    lat: latitud,
    lng: longitud,
    fecha: fechaActual.value,
    comando: 'Comando de Distrito Tuluá'
  }
})

const volverAInicio = () => {
  router.push('/homeCiudadano')
}
</script>

<template>
  <div class="h-dvh bg-slate-100 flex justify-center items-center p-0 font-sans overflow-hidden">
    <div class="w-full h-full max-w-md bg-white shadow-2xl flex flex-col justify-between relative overflow-hidden">
      
      <!-- ENCABEZADO SUPERIOR -->
      <header class="bg-slate-900 text-white px-4 py-3.5 flex items-center gap-3 shadow-md shrink-0">
        <div class="w-9 h-9 rounded-full bg-slate-800 p-0.5 flex items-center justify-center shrink-0 border border-slate-700">
          <img 
            src="/LOGO_GECAP.png" 
            alt="Escudo GECAP" 
            class="w-full h-full object-contain"
          />
        </div>
        <h1 class="text-xs sm:text-sm font-black tracking-wider uppercase leading-tight text-slate-100">
          TU REPORTE FUE ENVIADO CON EXITO
        </h1>
      </header>

      <!-- CONTENIDO PRINCIPAL -->
      <main class="flex-1 px-5 py-4 flex flex-col items-center justify-around overflow-y-auto">
        
        <!-- INSIGNIA / EMBLEMA CENTRAL -->
        <div class="w-40 h-40 sm:w-48 sm:h-48 my-1 relative flex items-center justify-center">
          <img 
            src="/LOGO_GECAP.png" 
            alt="Emblema GECAP" 
            class="w-full h-full object-contain drop-shadow-xl"
          />
        </div>

        <!-- TARJETA DE DETALLES DEL REPORTE -->
        <div class="w-full bg-slate-100/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs text-center space-y-2.5">
          <h2 class="text-xs font-black text-slate-900 tracking-wider uppercase">
            NUMERO DE REPORTE
          </h2>
          
          <p class="text-sm sm:text-base font-black text-red-700 italic tracking-wide">
            {{ datosReporte.codigoSeguimiento }}
          </p>

          <div class="text-[11px] sm:text-xs text-slate-700 text-left font-medium leading-relaxed space-y-1.5 pt-1">
            <p><strong class="font-black text-slate-900">TIPO:</strong> {{ datosReporte.situacion.toUpperCase() }}</p>
            <p><strong class="font-black text-slate-900">UBICACION:</strong> {{ datosReporte.lat }}, {{ datosReporte.lng }}</p>
            <p><strong class="font-black text-slate-900">FECHA:</strong> {{ datosReporte.fecha }}</p>
            <p><strong class="font-black text-slate-900">COMANDO:</strong> {{ datosReporte.comando }}</p>
            <p class="uppercase"><strong class="font-black text-slate-900">REPORTE:</strong> {{ datosReporte.descripcion }}</p>
          </div>
        </div>

        <!-- BOTÓN DE ACCIÓN -->
        <div class="w-full pt-2">
          <button 
            @click="volverAInicio"
            class="w-full bg-red-700 hover:bg-red-800 text-white font-black py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer uppercase tracking-wider text-xs active:scale-98"
          >
            VOLVER A INICIO
          </button>
        </div>

        <!-- ESTADOS INFORMATIVOS INFERIORES -->
        <div class="w-full space-y-2 pt-1 pb-2">
          <div class="flex items-center justify-center gap-2 text-slate-800">
            <div class="w-5 h-5 rounded-full flex items-center justify-center shrink-0">
              <MapPin class="w-6 h-6 text-gecap-red" />
            </div>
            <span class="text-[10px] sm:text-[11px] font-black uppercase tracking-tight">
              TU UBICACIÓN ESTA SIENDO TOMADA
            </span>
          </div>

          <div class="flex items-center justify-center gap-2 text-slate-800">
            <div class="w-5 h-5 rounded-full flex items-center justify-center shrink-0">
              <Shield class="w-6 h-6 text-gecap-red" />
            </div>
            <span class="text-[10px] sm:text-[11px] font-black uppercase tracking-tight">
              ALERTANDO A LAS AUTORIDADES
            </span>
          </div>
        </div>

      </main>

    </div>
  </div>
</template>