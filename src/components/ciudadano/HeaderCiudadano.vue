<script setup>
import { h } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut } from 'lucide-vue-next'
import { toast } from 'vue3-toastify'
import { useAuthStore } from '../../stores/authStore'
import { cerrarSesionCiudadano } from '../../services/authService'
import { perfilService } from '../../services/perfilService'

defineProps({
  nombre: String
})

const router = useRouter()
const authStore = useAuthStore()
const emit = defineEmits(['salir'])

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

    // Si la vista padre necesita reaccionar antes de redirigir, emitimos el evento
    emit('salir')

    router.push('/login')
  } catch (error) {
    toast.error('Error al cerrar sesión: ' + error.message, {
      position: 'top-center'
    })
  }
}
</script>

<template>
  <header class="bg-gecap-darkblue text-white py-3 px-4 flex items-center justify-between shadow-md shrink-0">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-full bg-slate-900 p-0.5 flex items-center justify-center overflow-hidden">
        <img 
          src="/LOGO_GECAP.png" 
          alt="Escudo GECAP" 
          class="w-full h-full object-contain"
        />
      </div>
      <span class="text-sm font-black tracking-wider uppercase">GECAP</span>
    </div>
    
    <div class="flex items-center gap-3">
      <button @click="solicitarCierreSesion" class="text-gecap-red font-extrabold hover:text-white transition-colors cursor-pointer flex items-center gap-1" title="Cerrar Sesión">
        <LogOut class="w-5 h-5" />
        <span>Salir</span>
      </button>
    </div>
  </header>
</template>