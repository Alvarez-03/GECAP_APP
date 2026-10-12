<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue3-toastify'
import { ChevronLeft, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-vue-next'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Datos del formulario
const form = reactive({
  email: '',
  password: ''
})

// Estados de interfaz
const showPassword = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')

// Detectar parámetro de sesión expirada al cargar
onMounted(() => {
  if (route.query.expired === 'true') {
    errorMessage.value = 'Tu sesión ha expirado o no has iniciado sesión. Por favor, ingresa nuevamente.'
  }
})

const handleLogin = async () => {
  errorMessage.value = ''

  if (!form.email || !form.password) {
    toast.error('Por favor ingresa tu correo y contraseña.')
    return
  }

  isSubmitting.value = true

  try {
    await authStore.login(form.email, form.password)

    toast.success(`¡Bienvenido de nuevo, ${authStore.primerNombre}!`, {
      position: 'top-center',
      theme: 'colored'
    })

    router.push('/homeCiudadano')
  } catch (error) {
    errorMessage.value = error.message || 'Error al iniciar sesión'
    toast.error(errorMessage.value, { position: 'top-center' })
  } finally {
    isSubmitting.value = false
  }
}

const irAlRegistro = () => { router.push('/registro') }
const volver = () => { router.push('/') }
</script>

<template>
  <div class="h-dvh lg:min-h-screen bg-slate-100 flex items-center justify-center p-0 lg:p-8 font-sans overflow-hidden">
    
    <!-- TARJETA DE LOGIN RESPONSIVA -->
    <div class="w-full h-full lg:h-auto lg:max-w-4xl bg-white lg:rounded-3xl shadow-2xl border-0 lg:border border-slate-200/80 overflow-hidden flex flex-col justify-between">
      
      <!-- GRILLA 1 COL EN MÓVIL / 2 COLS EN PC -->
      <div class="grid grid-cols-1 lg:grid-cols-2 lg:h-auto flex-1">
        
        <!-- ================================================= -->
        <!-- COLUMNA IZQUIERDA: ESCUDO E INSIGNIA GECAP         -->
        <!-- ================================================= -->
        <div class="bg-gecap-darkblue text-white max-h-64 md:max-h-full p-4 sm:p-6 lg:p-10 flex flex-col justify-between items-center text-center relative shrink-0">
          
          <!-- Botón Volver y Header Móvil -->
          <div class="w-full flex items-center justify-between">
            <button 
              @click="volver" 
              type="button"
              class="text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1 group text-xs font-semibold"
            >
              <ChevronLeft class="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Volver</span>
            </button>
            <span class="text-[10px] tracking-widest text-slate-400 uppercase font-black lg:hidden">
              INICIAR SESIÓN
            </span>
          </div>

          <!-- Escudo Centrado -->
          <div class="sm:py-4 sm:space-y-3">
            <div class="flex justify-center">
              <div class="w-32 h-32 sm:w-28 sm:h-28 lg:w-40 lg:h-40 rounded-full p-1 bg-slate-900 flex items-center justify-center overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <img 
                  src="/LOGO_GECAP.png" 
                  alt="Escudo GECAP" 
                  class="w-full h-full object-contain p-1.5"
                />
              </div>
            </div>

            <div class="space-y-0.5">
              <h1 class="text-base sm:text-lg lg:text-2xl font-black tracking-tight text-white">
                GECAP ALERTA
              </h1>
              <p class="text-[10px] sm:text-xs lg:text-sm text-slate-300 font-medium max-w-xs mx-auto">
                Plataforma de Alertas y Reportes Ciudadanos
              </p>
            </div>
          </div>

          <!-- Pie Institucional en PC -->
          <div class="hidden lg:block text-[11px] text-slate-400 font-semibold tracking-wide">
            Policía Nacional & Alcaldía Municipal
          </div>
        </div>

        <!-- ================================================= -->
        <!-- COLUMNA DERECHA: FORMULARIO DE ACCESO             -->
        <!-- ================================================= -->
        <div class="px-5 py-4 sm:p-8 lg:p-10  overflow-y-auto">
          
          <!-- BLOQUE SUPERIOR Y CENTRAL: Título + Formulario -->
          <div class="w-full space-y-3 sm:space-y-5 my-auto">
            
            <!-- Encabezado de Formulario -->
            <div class="text-center lg:text-left space-y-0.5">
              <h2 class="text-red-700 font-black text-sm lg:text-base tracking-wide uppercase">
                INGRESA PARA GENERAR REPORTES
              </h2>
              <p class="text-[11px] text-xs text-slate-500 font-semibold">
                Introduce tus credenciales para acceder
              </p>
            </div>

            <!-- Alerta de Error -->
            <div 
              v-if="errorMessage" 
              class="bg-red-50 border border-red-200 text-red-700 p-2 rounded-xl text-xs flex items-center gap-2 text-left"
            >
              <AlertCircle class="w-4 h-4 shrink-0 text-red-600" />
              <span>{{ errorMessage }}</span>
            </div>

            <!-- Formulario de Entrada -->
            <form @submit.prevent="handleLogin" class="space-y-3 sm:space-y-4 text-left w-full">
              
              <!-- Campo: Correo Electrónico -->
              <div>
                <label class="block text-[11px] text-xs font-black text-slate-800 uppercase tracking-wide mb-1">
                  CORREO ELECTRÓNICO
                </label>
                <div class="relative flex items-center border-b-2 border-slate-700 py-1 focus-within:border-red-700 transition-colors">
                  <Mail class="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 mr-2 shrink-0" />
                  <input 
                    v-model="form.email"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    required
                    class="w-full bg-transparent text-slate-800 text-sm font-semibold focus:outline-none placeholder-slate-400"
                  />
                </div>
              </div>

              <!-- Campo: Contraseña -->
              <div>
                <label class="block text-[11px] text-xs font-black text-slate-800 uppercase tracking-wide mb-1">
                  CONTRASEÑA
                </label>
                <div class="relative flex items-center border-b-2 border-slate-700 py-1 focus-within:border-red-700 transition-colors">
                  <Lock class="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 mr-2 shrink-0" />
                  <input 
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="************"
                    required
                    class="w-full bg-transparent text-slate-800 text-sm font-semibold focus:outline-none placeholder-slate-400 pr-8"
                  />
                  <button 
                    type="button" 
                    @click="showPassword = !showPassword"
                    class="absolute right-0 text-slate-400 hover:text-slate-700 cursor-pointer p-1 transition-colors"
                  >
                    <component :is="showPassword ? EyeOff : Eye" class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Botón Ingresar -->
              <div class="pt-1">
                <button 
                  type="submit"
                  :disabled="isSubmitting"
                  class="w-full bg-[#b91c1c] hover:bg-[#991b1b] text-white font-black py-2.5 sm:py-3.5 px-4 rounded-xl text-base tracking-wider uppercase shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {{ isSubmitting ? 'INGRESANDO...' : 'INGRESAR' }}
                </button>
              </div>

            </form>
          </div>

          <!-- ENLACES INFERIORES: Pegados abajo en la pantalla -->
          <div class="space-y-1 pt-2 sm:pt-3 border-t border-slate-100 text-center lg:text-left shrink-0 pb-1">
            <div>
              <button 
                type="button" 
                class="text-slate-600 font-bold text-[11px] sm:text-xs hover:text-slate-900 underline cursor-pointer transition-colors"
                @click="alert('Contacta al administrador del sistema para recuperar tu acceso.')"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <div>
              <button 
                type="button" 
                @click="irAlRegistro"
                class="text-[#b91c1c] font-black text-[11px] sm:text-xs underline hover:text-red-800 cursor-pointer uppercase tracking-wide transition-colors"
              >
                ¿Aún no estás registrado?
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  </div>
</template>