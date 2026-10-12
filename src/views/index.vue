<script setup>
import { ref } from 'vue'
import {ShieldCheck, Siren, UserPlus, MapPin, IdCard, LogIn, AlertCircle,Radio} from 'lucide-vue-next'
import buttons from '../components/buttons.vue'
import { useRouter } from 'vue-router'
import { supabase } from '../services/supabase'

const router = useRouter()

const irAlRegistro = () => {
  router.push('/registro')
}

const irAlLogin = () => {
  router.push('/login')
}
</script>

<template>
  <!-- Contenedor global responsivo -->
  <div class="min-h-screen bg-slate-100 text-slate-800 flex justify-center items-center p-0 font-sans">
    
    <div class="w-full max-w-md md:max-w-5xl bg-white min-h-screen md:min-h-0 md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200">
      
      <header class="w-full md:w-5/12 bg-linear-to-b from-gecap-darkblue to-gecap-darkblue/90 text-white p-6 md:p-10 flex flex-col justify-between text-center md:text-left relative">
        
        <div>

          <!-- LOGO INSTITUCIONAL -->
          <div class="my-4 md:my-8 flex justify-center md:justify-start">
            <div class="w-24 h-24 md:w-52 md:h-52 p-2 backdrop-blur-sm flex flex-auto">
              <img 
                src="/LOGO_GECAP.png" 
                alt="Logo GECAP" 
                class="w-full h-full object-contain rounded-xl"
              />
            </div>
          </div>

          <h1 class="text-2xl md:text-4xl font-black tracking-tight text-white leading-tight">
            Alerta Ciudadana
          </h1>
          <p class="text-blue-100 text-xs md:text-sm mt-2 max-w-xs mx-auto md:mx-0 leading-relaxed">
            Gestión Estratégica de Cuadrantes y Atención Policial para la Ciudad de Tuluá. Tu seguridad conectada en tiempo real.
          </p>
        </div>

        <div class="hidden md:grid grid-cols-1 gap-3 mt-8 pt-6 border-t border-blue-800/60">
          <div class="flex items-center space-x-3 text-blue-100 text-xs">
            <ShieldCheck class="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Conexión directa con la Central de Policía</span>
          </div>
          <div class="flex items-center space-x-3 text-blue-100 text-xs">
            <MapPin class="w-5 h-5 text-blue-300 shrink-0" />
            <span>Respuesta rápida mediante geolocalización GPS</span>
          </div>
        </div>

      </header>

      <!-- SECCIÓN DERECHA / CUERPO Y FORMULARIOS DE ACCIÓN (En escritorio toma 7/12 de ancho) -->
      <main class="w-full md:w-7/12 p-6 md:p-10 flex-1 flex flex-col justify-between space-y-6 bg-slate-50/50">
        
        <!-- Mensaje de Validación Obligatoria de Identidad -->
        <div class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs">
          <div class="flex items-start space-x-3">
            <AlertCircle class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 class="text-xs md:text-sm font-bold text-amber-900">Registro de identidad obligatorio</h3>
              <p class="text-[11px] md:text-xs text-amber-800 mt-0.5 leading-relaxed">
                Por seguridad de la comunidad y protocolos de la Policía Nacional, debes registrarte con tu <strong class="font-semibold">nombre completo y cédula</strong> para validar la veracidad de cada reporte.
              </p>
            </div>
          </div>
        </div>

        <!-- Tarjeta Central de Acción: REGISTRO CIUDADANO -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-xs md:text-left md:flex md:items-center md:justify-between md:gap-6">
          <div class="flex-1">
            <h2 class="text-base md:text-lg font-bold text-slate-900">¿Eres nuevo en la plataforma?</h2>
            <p class="text-xs text-slate-600 mt-1 mb-4 md:mb-0">
              Crea tu perfil ciudadano en menos de 2 minutos para habilitar el envío de alertas.
            </p>
          </div>
          
          <div class="md:w-48 shrink-0">
            <buttons type="register" text="REGISTRARME" @click="irAlRegistro" />
          </div>
        </div>

        <!-- Botón secundario para simular intento de alerta sin registro -->
        <div class="text-center">
          <span 
            class="w-full bg-red-50 border border-red-200 text-red-700 font-semibold py-3 px-4 rounded-xl text-xs md:text-sm flex items-center justify-center space-x-2 transition cursor-pointer">
            <Siren class="w-4 h-4 text-red-600 animate-pulse shrink-0" />
            <span>¿Quieres enviar una alerta de emergencia?</span>
        </span>
        </div>

        <!-- Ventajas de la plataforma -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-white p-3.5 rounded-xl border border-slate-200 text-center md:text-left flex flex-col md:flex-row items-center md:space-x-3">
            <div class="p-2 bg-blue-50 rounded-lg text-blue-600 mb-1 md:mb-0">
              <IdCard class="w-5 h-5" />
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-800">Reporte Identificado</h4>
              <p class="text-[10px] md:text-[11px] text-slate-500 leading-tight">Seguridad y control de la ciudad.</p>
            </div>
          </div>
          
          <div class="bg-white p-3.5 rounded-xl border border-slate-200 text-center md:text-left flex flex-col md:flex-row items-center md:space-x-3">
            <div class="p-2 bg-blue-50 rounded-lg text-blue-600 mb-1 md:mb-0">
              <MapPin class="w-5 h-5" />
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-800">GPS en Vivo</h4>
              <p class="text-[10px] md:text-[11px] text-slate-500 leading-tight">Geolocalización exacta.</p>
            </div>
          </div>
        </div>

        <!-- FOOTER / OPCIÓN DE INGRESO -->
        <footer class="pt-4 border-t border-slate-200 text-center md:flex md:items-center md:justify-between md:text-left">
          <p class="text-xs text-slate-600 mb-2 md:mb-0">
            ¿Ya te habías registrado anteriormente?
          </p>
          <buttons type="login" @click="irAlLogin" />
        </footer>

      </main>

    </div>
  </div>
</template>

<style scoped>
/* Estilos adicionales opcionales */
</style>