<script setup>
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useGeolocation } from '@vueuse/core'

import { Loader2, MapPin } from 'lucide-vue-next'
import { toast } from 'vue3-toastify'
import { cerrarSesionCiudadano } from '../services/authService'
import { perfilService } from '../services/perfilService'
import { homeCiudadanoController } from '../controllers/homeCiudadanoController'

import HeaderCiudadano from '../components/ciudadano/HeaderCiudadano.vue'
import BotonPanico from '../components/ciudadano/BtnSOS.vue'
import NavbarCiudadano from '../components/ciudadano/NavbarCiudadano.vue'

const router = useRouter()
const isLoading = ref(true)
const authStore = useAuthStore()
const nombreUsuario = ref('Ciudadano')
const { coords, error: errorUbicacion } = useGeolocation()

onMounted(async () => {
  try {
    // El controlador se encarga de todo el flujo de negocio y validación
    const nombre = await homeCiudadanoController.inicializarVista(authStore)
    nombreUsuario.value = nombre
  } catch (err) {
    console.error('Error en homeCiudadano:', err)
    
    if (err.message === 'SESION_EXPIRADA') {
      toast.warning('Tu sesión ha expirado o no estás autenticado.', {
        position: 'top-center',
        theme: 'dark'
      })
      router.push({ name: 'login', query: { expired: 'true' } })
    } else {
      toast.error('Error al cargar la información del usuario.')
    }
  } finally {
    isLoading.value = false
  }
})

const solicitarCierreSesion = () => {
  toast(
    ({ closeToast }) =>
      h('div', { class: 'flex flex-col gap-2 p-1' }, [
        h('p', { class: 'font-bold text-xs text-slate-800' }, '¿Estás seguro de que deseas cerrar sesión?'),
        h('div', { class: 'flex justify-end gap-2 mt-1' }, [
          h(
            'button',
            {
              class: 'bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-3 py-1 rounded-lg text-xs cursor-pointer transition',
              onClick: () => closeToast()
            },
            'Cancelar'
          ),
          h(
            'button',
            {
              class: 'bg-red-700 hover:bg-red-800 text-white font-bold px-3 py-1 rounded-lg text-xs cursor-pointer transition',
              onClick: async () => {
                closeToast()
                await ejecutarCierreSesion()
              }
            },
            'Sí, Salir'
          )
        ])
      ]),
    {
      position: 'top-center',
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      icon: false
    }
  )
}

const ejecutarCierreSesion = async () => {
  try {
    await cerrarSesionCiudadano()
    authStore.logout()
    perfilService.limpiarPerfilLocal()
    
    toast.info('Has cerrado sesión correctamente.', {
      position: 'top-center',
      autoClose: 2500
    })

    router.push('/login')
  } catch (error) {
    toast.error('Error al cerrar sesión: ' + error.message, {
      position: 'top-center'
    })
  }
}

const activarEmergencia = () => router.push('/crear-alerta')
</script>

<template>
  <!-- PANTALLA DE CARGA -->
  <div v-if="isLoading" class="h-dvh bg-slate-900 flex flex-col items-center justify-center text-white p-4">
    <Loader2 class="w-10 h-10 animate-spin text-red-600 mb-3" />
    <p class="text-xs font-bold tracking-widest uppercase text-slate-300">Verificando sesión...</p>
  </div>

  <!-- PANTALLA PRINCIPAL -->
  <div v-else class="h-dvh bg-slate-100 flex justify-center items-center p-0 font-sans overflow-hidden">
    <div class="w-full h-full max-w-md bg-white shadow-2xl flex flex-col justify-between relative overflow-hidden">
      
      <!-- ENCABEZADO -->
      <HeaderCiudadano @salir="solicitarCierreSesion" />

      <!-- CUERPO PRINCIPAL -->
      <main class="flex-1 px-6 py-6 flex flex-col justify-start overflow-y-auto">
        <div class="mb-6">
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900">
            Hola, <span class="text-slate-900">{{ nombreUsuario }}</span>
          </h1>
        </div>

        <!-- BOTÓN DE PÁNICO -->
        <BotonPanico @activar="activarEmergencia" />

      <div class="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
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
      </main>

      <!-- NAVEGACIÓN INFERIOR -->
      <NavbarCiudadano />

    </div>
  </div>
</template>