<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue3-toastify'
import { Mail, ArrowLeft, KeyRound, AlertCircle } from 'lucide-vue-next'

import buttons from '../components/buttons.vue'
import { recuperarPasswordController } from '../controllers/recuperarPasswordController.js'

const router = useRouter()
const route = useRoute()

const email = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const datosListos = ref(false)

onMounted(() => {
  const datos = recuperarPasswordController.obtenerDatosDesdeURL(route.query)
  email.value = datos.email

  setTimeout(() => {
    datosListos.value = true
  }, 100)
})

const sincronizarURL = () => {
  if (!datosListos.value) return
  router.replace({
    query: { ...route.query, email: email.value || undefined }
  })
}

watch(email, sincronizarURL)

const handleSubmit = async () => {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    // 1. Verificar si el usuario realmente existe en Supabase
    await recuperarPasswordController.verificarUsuarioExistente(email.value)
    
    toast.success('Usuario verificado. Procede a ingresar tu nueva clave.', { position: 'top-center' })

    // 2. Redirigir directamente al cambio de clave pasando el correo en la URL
    router.push({
      path: '/restablecer-password',
      query: { email: email.value }
    })

  } catch (error) {
    errorMessage.value = error.message || 'Error al validar el correo.'
    toast.error(errorMessage.value, { position: 'top-center' })
  } finally {
    isSubmitting.value = false
  }
}

const volverAlLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="w-full max-w-md mx-auto min-h-dvh flex items-center justify-center p-4 bg-slate-100 font-sans">
    <div class="w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
      
      <!-- Encabezado -->
      <div class="bg-gecap-darkblue p-6 text-white relative text-center">
        <button 
          @click="volverAlLogin" 
          class="absolute top-4 left-4 text-white hover:text-slate-200 transition flex items-center gap-1 text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft class="w-6 h-6" />
        </button>

        <div class="w-20 h-20 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-white/10 backdrop-blur-xs">
          <img src="/LOGO_GECAP.png" alt="Logo GECAP" class="w-full h-full object-contain p-2" />
        </div>
        <h2 class="text-xl font-black">Recuperar Contraseña</h2>
        <p class="text-blue-100 text-xs mt-1">Ingresa tu correo registrado para cambiar tu clave</p>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">

        <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico *</label>
          <div class="relative">
            <Mail class="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              v-model="email"
              type="email" 
              placeholder="ciudadano@correo.com"
              required
              class="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-gecap-darkblue/30 focus:border-gecap-darkblue"
            />
          </div>
        </div>

        <div class="pt-2">
          <buttons 
            type="custom" 
            variant="primary" 
            :disabled="isSubmitting"
            class="w-full"
          >
            <template #default>
              <div class="flex items-center justify-center gap-2">
                <KeyRound class="w-4 h-4" />
                <span>{{ isSubmitting ? 'VERIFICANDO...' : 'CONTINUAR' }}</span>
              </div>
            </template>
          </buttons>
        </div>

        <div class="text-center pt-2 border-t border-slate-100">
          <button 
            type="button" 
            @click="volverAlLogin" 
            class="text-xs text-gecap-darkblue font-bold hover:underline cursor-pointer"
          >
            Volver a Iniciar Sesión
          </button>
        </div>

      </form>

    </div>
  </div>
</template>