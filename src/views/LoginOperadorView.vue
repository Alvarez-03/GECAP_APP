<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { iniciarSesionOperador } from '../services/authService'
import { ShieldCheck, Lock, Mail, AlertCircle } from 'lucide-vue-next'

const router = useRouter()
const email = ref('')
const password = ref('')
const cargando = ref(false)
const mensajeError = ref('')

const handleLogin = async () => {
  mensajeError.value = ''
  cargando.value = true

  try {
    const resultado = await iniciarSesionOperador(email.value, password.value)
    if (resultado.success) {
      localStorage.setItem('operador_gecap', JSON.stringify(resultado.perfil))
      router.push('/policia/mapa')
    }
  } catch (error) {
    mensajeError.value = error.message || 'Credenciales inválidas o cuenta no autorizada.'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4 font-sans">
    <div class="w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl">
      
      <div class="flex flex-col items-center mb-8 text-center">
        <div class="w-32 h-32 rounded-full p-0.5 flex items-center justify-center overflow-hidden">
            <img 
            src="/LOGO_GECAP.png" 
            alt="Escudo GECAP" 
            class="w-full h-full object-contain"
            />
        </div>
        <h1 class="text-2xl font-black text-white uppercase tracking-wider">GECAP Tuluá</h1>
        <p class="text-sm text-slate-400 mt-1">Gestión Estratégica de Cuadrantes y Atención Policial para la Ciudad de Tuluá.</p>
      </div>

      <div v-if="mensajeError" class="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-sm">
        <AlertCircle class="w-5 h-5 shrink-0" />
        <span>{{ mensajeError }}</span>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <div>
          <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Correo Institucional</label>
          <div class="relative">
            <Mail class="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
            <input 
              v-model="email" 
              type="email" 
              required 
              placeholder="operador@policia.gov.co"
              class="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Contraseña</label>
          <div class="relative">
            <Lock class="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
            <input 
              v-model="password" 
              type="password" 
              required 
              placeholder="••••••••"
              class="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        <button 
          type="submit" 
          :disabled="cargando"
          class="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition duration-200 shadow-lg shadow-blue-600/30 flex items-center justify-center cursor-pointer disabled:opacity-50"
        >
          <span v-if="!cargando">Ingresar al Sistema</span>
          <span v-else class="animate-pulse">Autenticando...</span>
        </button>
      </form>

    </div>
  </div>
</template>