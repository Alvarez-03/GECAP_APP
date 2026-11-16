<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue3-toastify'
import { Lock, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-vue-next'

import buttons from '../components/buttons.vue'
import { recuperarPasswordController } from '../controllers/recuperarPasswordController.js'

const router = useRouter()
const route = useRoute()

const form = ref({
  password: '',
  confirmPassword: ''
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')

const correoUsuario = route.query.email || ''

const handleRestablecer = async () => {
  if (!correoUsuario) {
    toast.error('Correo inválido o no especificado.', { position: 'top-center' })
    router.push('/olvidar-password')
    return
  }

  errorMessage.value = ''
  isSubmitting.value = true

  try {
    // Actualizar directamente en Supabase
    await recuperarPasswordController.cambiarPasswordDirecto({
      email: correoUsuario,
      password: form.value.password,
      confirmPassword: form.value.confirmPassword
    })

    toast.success('¡Contraseña actualizada con éxito en la base de datos!', {
      position: 'top-center'
    })

    router.push('/login')
  } catch (error) {
    errorMessage.value = error.message || 'Error al actualizar la contraseña.'
    toast.error(errorMessage.value, { position: 'top-center' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-md mx-auto min-h-dvh flex items-center justify-center p-4 bg-slate-100 font-sans">
    <div class="w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
      
      <!-- Encabezado -->
      <div class="bg-gecap-darkblue p-6 text-white text-center">
        <div class="w-20 h-20 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-white/10 backdrop-blur-xs">
          <img src="/LOGO_GECAP.png" alt="Logo GECAP" class="w-full h-full object-contain p-2" />
        </div>
        <h2 class="text-xl font-black">Nueva Contraseña</h2>
        <p class="text-blue-100 text-xs mt-1">Establece la nueva clave para <strong>{{ correoUsuario }}</strong></p>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleRestablecer" class="p-6 space-y-4">

        <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <div>
          <label class="block text-xs font-bold text-gecap-red mb-1">
            La contraseña debe contener caracteres especiales, un número y una letra mayúscula.
          </label>
        </div>

        <!-- Nueva Contraseña -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Nueva Contraseña *</label>
          <div class="relative">
            <Lock class="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'" 
              placeholder="Mínimo 6 caracteres"
              required
              class="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-gecap-darkblue/30 focus:border-gecap-darkblue"
            />
            <button 
              type="button" 
              @click="showPassword = !showPassword"
              class="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <component :is="showPassword ? EyeOff : Eye" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Confirmar Contraseña -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Confirmar Nueva Contraseña *</label>
          <div class="relative">
            <Lock class="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'" 
              placeholder="Repite la contraseña"
              required
              class="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-gecap-darkblue/30 focus:border-gecap-darkblue"
            />
            <button 
              type="button" 
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <component :is="showConfirmPassword ? EyeOff : Eye" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Botón -->
        <div class="pt-2">
          <buttons 
            type="custom" 
            variant="primary" 
            :disabled="isSubmitting"
            class="w-full"
          >
            <template #default>
              <div class="flex items-center justify-center gap-2">
                <ShieldCheck class="w-4 h-4" />
                <span>{{ isSubmitting ? 'ACTUALIZANDO EN SUPABASE...' : 'CAMBIAR CONTRASEÑA' }}</span>
              </div>
            </template>
          </buttons>
        </div>

      </form>

    </div>
  </div>
</template>