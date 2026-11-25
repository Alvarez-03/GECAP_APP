<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { toast } from 'vue3-toastify'
import { ChevronLeft, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-vue-next'
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

  if (form.email.trim().toLowerCase().endsWith('@policia.gov.co')) {
    errorMessage.value = 'El acceso a este portal ciudadano no está permitido para correos institucionales (@policia.gov.co).'
    toast.error(errorMessage.value, { position: 'top-center' })
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

const irAlRegistro = () => {
  router.push('/registro')
}

const volver = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-dvh lg:min-h-screen bg-slate-100 flex flex-col lg:items-center lg:justify-center lg:p-8 font-sans">

    <!-- ================================================= -->
    <!-- DISEÑO MÓVIL (< lg)                               -->
    <!-- ================================================= -->
    <div class="lg:hidden min-h-dvh flex flex-col bg-white">
      <!-- Cabecera superior oscura con resplandor sutil -->
      <div
        class="relative bg-gecap-darkblue text-white px-5 pt-5 pb-14 flex flex-col items-center text-center overflow-hidden"
        style="background-image: radial-gradient(circle at 50% 35%, rgba(30, 58, 138, 0.45), transparent 70%);"
      >
        <div class="w-full flex items-center justify-between mb-3 z-10">
          <button
            type="button"
            @click="volver"
            class="text-slate-200 hover:text-white transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
          >
            <ChevronLeft class="w-4 h-4" />
            <span>Volver</span>
          </button>
        </div>

        <div class="w-28 h-28 ring-2shadow-lg flex items-center justify-center overflow-hidden mb-3">
          <img
            src="/LOGO_GECAP.png"
            alt="Escudo GECAP"
            class="w-full h-full object-contain p-1.5"
          />
        </div>

        <h1 class="text-xl font-black tracking-wide text-white">GECAP</h1>
        <p class="text-[11px] text-slate-300 font-medium leading-snug max-w-[230px] mt-0.5">
          Gestión Estratégica de Cuadrantes y Atención Policial
        </p>
      </div>

      <!-- Tarjeta blanca redondeada superpuesta -->
      <div class="flex-1 -mt-6 bg-white rounded-t-3xl px-6 pt-7 pb-5 flex flex-col justify-between shadow-[0_-8px_24px_rgba(15,23,42,0.12)]">
        <div class="space-y-4">
          <div class="space-y-1">
            <h2 class="text-xl font-black text-slate-900 leading-tight">
              Ingresa para reportar alertas en Tuluá
            </h2>
            <p class="text-xs text-slate-500 font-medium">
              Usa tu correo y contraseña para acceder.
            </p>
          </div>

          <!-- Alerta de Error -->
          <div
            v-if="errorMessage"
            class="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-start gap-2"
          >
            <AlertCircle class="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{{ errorMessage }}</span>
          </div>

          <form @submit.prevent="handleLogin" class="space-y-4">
            <!-- Correo electrónico -->
            <div>
              <label class="block text-xs font-bold text-slate-800 mb-1.5">
                Correo electrónico
              </label>
              <div class="relative flex items-center">
                <Mail class="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  title="Correo electrónico"
                  v-model="form.email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  required
                  class="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 font-medium placeholder-slate-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <!-- Contraseña -->
            <div>
              <label class="block text-xs font-bold text-slate-800 mb-1.5">
                Contraseña
              </label>
              <div class="relative flex items-center">
                <Lock class="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  title="Contraseña"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Tu contraseña"
                  required
                  class="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-800 font-medium placeholder-slate-400 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 text-slate-400 hover:text-slate-700 cursor-pointer p-1 transition-colors"
                >
                  <component :is="showPassword ? EyeOff : Eye" class="w-4 h-4" />
                </button>
              </div>
              <div class="flex justify-end mt-1.5">
                <button
                  type="button"
                  @click="$router.push('/olvidar-password')"
                  class="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            <!-- Botón Ingresar -->
            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full bg-blue-400 hover:bg-blue-500 text-gecap-darkblue font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              <span>{{ isSubmitting ? 'Ingresando...' : 'Ingresar' }}</span>
              <ArrowRight v-if="!isSubmitting" class="w-4 h-4" />
            </button>
          </form>

          <div class="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
            <span>¿Aún no estás registrado? </span>
            <button
              type="button"
              @click="irAlRegistro"
              class="font-bold text-slate-900 underline hover:text-red-700 cursor-pointer transition-colors"
            >
              Regístrate
            </button>
          </div>
        </div>

        <p class="text-[10px] text-slate-400 text-center font-medium pt-6">
          Policía Nacional & Alcaldía Municipal
        </p>
      </div>
    </div>

    <!-- ================================================= -->
    <!-- DISEÑO ESCRITORIO (>= lg)                          -->
    <!-- ================================================= -->
    <div class="hidden lg:grid lg:grid-cols-12 w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden min-h-[540px]">

      <!-- Columna Izquierda: Marca e Insignia GECAP -->
      <div
        class="lg:col-span-5 bg-gecap-darkblue text-white p-8 flex flex-col justify-between relative"
        style="background-image: radial-gradient(circle at 50% 42%, rgba(30, 58, 138, 0.45), transparent 70%);"
      >
        <div>
          <button
            type="button"
            @click="volver"
            class="text-slate-200 hover:text-white transition cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
          >
            <ChevronLeft class="w-4 h-4" />
            <span>Volver</span>
          </button>
        </div>

        <div class="flex flex-col items-center text-center my-auto py-4">
          <div class="w-32 h-32 rounded-full flex items-center justify-center overflow-hidden mb-4">
            <img
              src="/LOGO_GECAP.png"
              alt="Escudo GECAP"
              class="w-full h-full object-contain p-2"
            />
          </div>
          <h1 class="text-2xl font-black tracking-wide text-white">GECAP</h1>
          <p class="text-xs text-slate-300 font-medium max-w-[220px] leading-relaxed mt-1">
            Gestión Estratégica de Cuadrantes y Atención Policial
          </p>
        </div>

        <div class="text-center text-[11px] text-slate-300/80 font-medium">
          Policía Nacional & Alcaldía Municipal
        </div>
      </div>

      <!-- Columna Derecha: Formulario -->
      <div class="lg:col-span-7 p-10 flex flex-col justify-center">
        <div class="w-full max-w-md mx-auto space-y-5">
          <div class="space-y-1">
            <h2 class="text-2xl font-black text-slate-900 leading-tight">
              Ingresa para reportar alertas en Tuluá
            </h2>
            <p class="text-xs text-slate-500 font-medium">
              Usa tu correo y contraseña para acceder.
            </p>
          </div>

          <!-- Alerta de Error -->
          <div
            v-if="errorMessage"
            class="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs flex items-start gap-2"
          >
            <AlertCircle class="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span>{{ errorMessage }}</span>
          </div>

          <form @submit.prevent="handleLogin" class="space-y-4">
            <!-- Correo electrónico -->
            <div>
              <label class="block text-xs font-bold text-slate-800 mb-1.5">
                Correo electrónico
              </label>
              <div class="relative flex items-center">
                <Mail class="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  title="Correo electrónico"
                  v-model="form.email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  required
                  class="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 font-medium placeholder-slate-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <!-- Contraseña -->
            <div>
              <label class="block text-xs font-bold text-slate-800 mb-1.5">
                Contraseña
              </label>
              <div class="relative flex items-center">
                <Lock class="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  title="Contraseña"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Tu contraseña"
                  required
                  class="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-800 font-medium placeholder-slate-400 focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 text-slate-400 hover:text-slate-700 cursor-pointer p-1 transition-colors"
                >
                  <component :is="showPassword ? EyeOff : Eye" class="w-4 h-4" />
                </button>
              </div>
              <div class="flex justify-end mt-1.5">
                <button
                  type="button"
                  @click="$router.push('/olvidar-password')"
                  class="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            <!-- Botón Ingresar -->
            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full bg-blue-400 hover:bg-blue-500 text-gecap-darkblue font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              <span>{{ isSubmitting ? 'Ingresando...' : 'Ingresar' }}</span>
              <ArrowRight v-if="!isSubmitting" class="w-4 h-4" />
            </button>
          </form>

          <div class="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            <span>¿Aún no estás registrado? </span>
            <button
              type="button"
              @click="irAlRegistro"
              class="font-bold text-slate-900 underline hover:text-red-700 cursor-pointer transition-colors"
            >
              Regístrate
            </button>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>