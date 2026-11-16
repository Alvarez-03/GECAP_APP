<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'
import NavbarCiudadano from '../components/ciudadano/NavbarCiudadano.vue'
import HeaderCiudadano from '../components/ciudadano/HeaderCiudadano.vue'
import { useAuthStore } from '../stores/authStore'
import Buttons from '../components/buttons.vue'

const router = useRouter()
const authStore = useAuthStore()

// Propiedad computada reactiva desde Pinia
const usuario = computed(() => authStore.usuario || authStore.user)
const loading = computed(() => authStore.loading)

onMounted(async () => {
  try {
    // Si por alguna razón el store está vacío al entrar directamente por URL en móvil,
    // intentamos recuperarlo de respaldo con el localStorage o la sesión de Pinia
    if (!usuario.value) {
      const usuarioGuardado = localStorage.getItem('usuario_gecap')
      if (usuarioGuardado) {
        // Si tienes una acción en tu store para setear el usuario, úsala:
        // authStore.setUsuario(JSON.parse(usuarioGuardado))
      } else {
        // Solo si realmente no hay rastro en ningún lado, mandamos al login
        router.push('/login')
      }
    }
  } catch (error) {
    console.error('Error al cargar el perfil desde Pinia:', error)
    toast.error('No se pudo cargar la información del perfil.', { position: 'top-center' })
    router.push('/login')
  }
})
</script>

<template>
  <!-- Contenedor Principal Bloqueado a la Altura del Viewport -->
  <div class="w-full max-w-md mx-auto h-dvh flex flex-col bg-slate-100 font-sans overflow-hidden select-none">
    
    <!-- Encabezado -->
    <HeaderCiudadano class="shrink-0" />

    <!-- Contenido Principal -->
    <main class="flex-1 px-4 py-3 flex flex-col justify-between overflow-hidden">
      
      <div v-if="loading" class="flex-1 flex items-center justify-center text-slate-500 text-xs">
        Cargando perfil...
      </div>

      <div v-else class="flex-1 flex flex-col justify-around py-3">
        
        <!-- Tarjeta de Identificación del Usuario -->
        <div class="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 text-center space-y-1">
          <div class="w-16 h-16 bg-gecap-darkblue text-white rounded-full border-4 border-amber-300 flex items-center justify-center mx-auto shadow-inner text-xl font-black uppercase">
            {{ usuario?.nombre_completo ? usuario.nombre_completo.charAt(0) : 'U' }}
          </div>
          <div>
            <h2 class="text-base font-black text-slate-800 uppercase tracking-wide">
              {{ usuario?.nombre_completo || 'Ciudadano' }}
            </h2>
            <p class="text-base text-slate-500 truncate px-2">{{ usuario?.email }}</p>
          </div>
          
          <div class="bg-white rounded-2xl p-3.5  space-y-1">
            <h3 class="text-[18px] font-black text-gecap-darkblue tracking-wide">Información Personal</h3>
            
            <div class="space-y-1.5 text-[14px] text-slate-700">
              <div class="flex items-center justify-between py-1 border-b border-slate-400">
                <span class="font-bold text-gecap-blue">No. Documento</span>
                <span class="font-semibold text-slate-800">{{ usuario?.tipo_documento }} {{ usuario?.numero_documento }}</span>
              </div>
              <div class="flex items-center justify-between py-1 border-b border-slate-400">
                <span class="font-bold text-gecap-blue">Teléfono</span>
                <span class="font-semibold text-slate-800">{{ usuario?.telefono || 'No registrado' }}</span>
              </div>
              <div class="flex items-center justify-between py-1">
                <span class="font-bold text-gecap-blue">Estado</span>
                <span class="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[14px]">Activo</span>
              </div>
            </div>
          </div>

          <Buttons id="Btn_edit_perfil" tittle="Boton editar perfil" text="Editar Perfil" @click=""/>

        </div>
      </div>

    </main>

    <!-- Barra de Navegación Inferior -->
    <NavbarCiudadano class="shrink-0" />

  </div>
</template>