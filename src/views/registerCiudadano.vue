<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'
import { User, IdCard, Phone, MapPin, Lock, ShieldCheck, AlertCircle, ArrowLeft, Mail, Eye, EyeOff } from 'lucide-vue-next'

import buttons from '../components/buttons.vue'

import { useAuthStore } from '../stores/authStore'
import { registroController } from '../controllers/registroCiudadanoController.js'

const router = useRouter()
const authStore = useAuthStore()

const emit = defineEmits(['registered', 'go-login', 'back'])

const form = reactive({
  documentType: 'CC',
  documentNumber: '',
  fullName: '',
  email: '',
  phone: '',
  neighborhood: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Estado de validación y carga
const isSubmitting = ref(false)
const errorMessage = ref('')

const irAlLogin = () => {
  router.push('/login')
}

const handleRegister = async () => {
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    // Delegamos la validación y el proceso completo al controlador
    const resultado = await registroController.procesarRegistro(form, authStore)

    toast.success(`¡Bienvenido, ${resultado.nombreUsuario}! Cuenta registrada con éxito.`, {
      position: 'top-center',
      theme: 'colored'
    })

    // Redirección directa a /homeCiudadano
    router.push('/homeCiudadano')

  } catch (error) {
    errorMessage.value = error.message || 'Ocurrió un error al procesar el registro en el servidor.'
    toast.error(errorMessage.value, { position: 'top-center' })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-md md:max-w-2xl mx-auto bg-white md:rounded-3xl shadow-xl border border-slate-200 overflow-hidden font-sans">
    
    <!-- Encabezado del Formulario -->
    <div class="bg-gecap-darkblue p-6 text-white relative">
      <router-link 
        to="/" 
        class="top-4 left-4 text-white hover:text-white transition flex items-center gap-1 text-xs font-semibold cursor-pointer"
      >
        <ArrowLeft class="w-8 h-8" />
        <span>Volver</span>
      </router-link>

      <div class="text-center flex items-center justify-around pt-5">
        <div class="w-24 h-24 rounded-2xl mx-auto mb-2 backdrop-blur-xs">
            <img 
                src="/LOGO_GECAP.png" 
                alt="Logo GECAP" 
                class="w-full h-full object-contain rounded-xl"
            />
        </div>
        <div>
            <h2 class="text-xl md:text-2xl font-black">Registro de Ciudadano</h2>
            <p class="text-blue-100 text-xs mt-1">Regístrate como ciudadano para emitir alertas de seguridad</p>
        </div>     
      </div>
    </div>

    <!-- Cuerpo del Formulario -->
    <form @submit.prevent="handleRegister" class="p-6 md:p-8 space-y-4">

      <!-- Alerta de Error visual -->
      <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-center gap-2">
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- TIPO Y NÚMERO DE DOCUMENTO -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="md:col-span-1">
          <label class="block text-xs font-bold text-slate-700 mb-1">Tipo Documento*</label>
          <select 
            v-model="form.documentType"
            class="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-gecap-darkblue/30 focus:border-gecap-darkblue"
          >
            <option value="CC">Cédula (CC)</option>
            <option value="CE">Cédula Ext. (CE)</option>
            <option value="PP">Pasaporte</option>
          </select>
        </div>

        <div class="md:col-span-2">
          <label class="block text-xs font-bold text-slate-700 mb-1">Número de Documento *</label>
          <div class="relative">
            <IdCard class="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              v-model="form.documentNumber"
              type="text" 
              placeholder="Ej: 1118234567"
              required
              class="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-gecap-darkblue/30 focus:border-gecap-darkblue"
            />
          </div>
        </div>
      </div>

      <!-- NOMBRE COMPLETO -->
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
        <div class="relative">
          <User class="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input 
            v-model="form.fullName"
            type="text" 
            placeholder="Nombres y Apellidos como en tu documento"
            required
            class="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-gecap-darkblue/30 focus:border-gecap-darkblue"
          />
        </div>
      </div>

      <!-- CORREO DEL CIUDADAN@ -->
      <div>
        <label class="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico *</label>
        <div class="relative">
          <Mail class="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input 
            v-model="form.email"
            type="email" 
            placeholder="ciudadano@correo.com"
            required
            class="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-gecap-darkblue/30 focus:border-gecap-darkblue"
          />
        </div>
      </div>

      <!-- TELÉFONO Y DIRECCIÓN -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Teléfono Móvil *</label>
          <div class="relative">
            <Phone class="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              v-model="form.phone"
              type="tel" 
              placeholder="Ej: 3001234567"
              required
              class="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-gecap-darkblue/30 focus:border-gecap-darkblue"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Dirección de tu vivienda</label>
          <div class="relative">
            <MapPin class="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              v-model="form.neighborhood"
              type="text" 
              placeholder="Ej: CARRERA 12 # 8 - 45"
              class="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-gecap-darkblue/30 focus:border-gecap-darkblue"
            />
          </div>
        </div>
      </div>

      <!-- REQUISITO DE CONTRASEÑA -->
      <div>
        <label class="block text-xs font-bold text-gecap-red mb-1">Para que tu contraseña sea segura debe contener caracteres especiales, un número y una letra mayúscula.</label>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <!-- Contraseña -->
        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Contraseña *</label>
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
          <label class="block text-xs font-bold text-slate-700 mb-1">Confirmar Contraseña *</label>
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
      </div>
    
      <!-- TÉRMINOS Y TRATAMIENTO DE DATOS -->
      <div class="pt-2">
        <label class="flex items-start gap-2.5 cursor-pointer">
          <input 
            v-model="form.acceptTerms"
            type="checkbox" 
            class="mt-0.5 rounded border-slate-300 text-gecap-darkblue focus:ring-gecap-darkblue shrink-0"
          />
          <span class="text-[11px] text-slate-600 leading-snug">
            Acepto el uso de mis datos personales de acuerdo con las políticas de seguridad ciudadana de la Policía Nacional y GECAP.
          </span>
        </label>
      </div>

      <!-- BOTÓN PRINCIPAL DE REGISTRO -->
      <div class="pt-2 flex justify-center">
        <buttons 
          type="custom" 
          variant="primary" 
          :disabled="isSubmitting"
          class="w-full"
        >
          <template #default>
            <div class="flex items-center justify-center gap-2">
              <ShieldCheck v-if="!isSubmitting" class="w-4 h-4" />
              <span>{{ isSubmitting ? 'CREANDO CUENTA...' : 'CREAR CUENTA' }}</span>
            </div>
          </template>
        </buttons>
      </div>

      <!-- ENLACE PARA INICIAR SESIÓN -->
      <div class="text-center pt-2 border-t border-slate-100">
        <p class="text-xs text-slate-600">
          ¿Ya tienes una cuenta registrada? 
          <button 
            type="button" 
            @click="irAlLogin" 
            class="text-gecap-darkblue font-bold hover:underline cursor-pointer ml-1"
          >
            Iniciar Sesión
          </button>
        </p>
      </div>

    </form>
  </div>
</template>