<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut } from 'lucide-vue-next'
import { toast } from 'vue3-toastify'
import NavbarCiudadano from '../components/ciudadano/NavbarCiudadano.vue'
import HeaderCiudadano from '../components/ciudadano/HeaderCiudadano.vue'

const router = useRouter()
const usuario = ref(null)
const loading = ref(true)

onMounted(() => {
  try {
    const usuarioGuardado = localStorage.getItem('usuario_gecap')
    if (usuarioGuardado) {
      usuario.value = JSON.parse(usuarioGuardado)
    } else {
      router.push('/login')
    }
  } catch (error) {
    console.error('Error al leer el localStorage:', error)
    toast.error('No se pudo cargar la información del perfil.', { position: 'top-center' })
  } finally {
    loading.value = false
  }
})

</script>

<template>
  <!-- Contenedor Principal Bloqueado a la Altura del Viewport -->
  <div class="w-full max-w-md mx-auto h-dvh flex flex-col bg-slate-100 font-sans overflow-hidden select-none">
    
    <!-- Encabezado -->
    <HeaderCiudadano class="shrink-0" />

    <!-- Contenido Principal (Fit sin scroll) -->
    <main class="flex-1 px-4 py-3 flex flex-col justify-between overflow-hidden">
      
      <div v-if="loading" class="flex-1 flex items-center justify-center text-slate-500 text-xs">
        Cargando perfil...
      </div>

      <div v-else class="flex-1 flex flex-col justify-around py-3">
        
        <!-- Tarjeta de Identificación del Usuario -->
        <div class="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 text-center space-y-1">
          <div class="w-16 h-16 bg-gecap-darkblue text-white rounded-full flex items-center justify-center mx-auto shadow-inner text-xl font-black uppercase">
            {{ usuario?.nombre_completo ? usuario.nombre_completo.charAt(0) : 'U' }}
          </div>
          <div>
            <h2 class="text-xs font-black text-slate-800 uppercase tracking-wide">
              {{ usuario?.nombre_completo || 'Ciudadano' }}
            </h2>
            <p class="text-[11px] text-slate-500 truncate px-2">{{ usuario?.email }}</p>
          </div>
        </div>

        <!-- Detalles de Cuenta y Datos Personales -->
        <div class="bg-white rounded-2xl p-3.5 shadow-xs border border-slate-200/80 space-y-1">
          <h3 class="text-[10px] font-black text-red-600 uppercase tracking-wide">INFORMACIÓN PERSONAL</h3>
          
          <div class="space-y-1.5 text-[11px] text-slate-700">
            <div class="flex items-center justify-between py-1 border-b border-slate-100">
              <span class="font-bold text-slate-500">Documento</span>
              <span class="font-semibold text-slate-800">{{ usuario?.tipo_documento }} {{ usuario?.numero_documento }}</span>
            </div>
            <div class="flex items-center justify-between py-1 border-b border-slate-100">
              <span class="font-bold text-slate-500">Teléfono</span>
              <span class="font-semibold text-slate-800">{{ usuario?.telefono || 'No registrado' }}</span>
            </div>
            <div class="flex items-center justify-between py-1 border-b border-slate-100">
              <span class="font-bold text-slate-500">Correo Electrónico</span>
              <span class="font-semibold text-slate-800 truncate max-w-[150px]">{{ usuario?.email }}</span>
            </div>
            <div class="flex items-center justify-between py-1 border-b border-slate-100">
              <span class="font-bold text-slate-500">Rol</span>
              <span class="font-semibold text-slate-800 uppercase">{{ usuario?.rol }}</span>
            </div>
            <div class="flex items-center justify-between py-1">
              <span class="font-bold text-slate-500">Estado</span>
              <span class="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[9px]">Activo</span>
            </div>
          </div>
        </div>

      </div>

    </main>

    <!-- Barra de Navegación Inferior -->
    <NavbarCiudadano class="shrink-0" />

  </div>
</template>