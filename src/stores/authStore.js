import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../services/supabase'
import { iniciarSesionCiudadano, cerrarSesionCiudadano } from '../services/authService'

export const useAuthStore = defineStore('auth', () => {
  // Estado reactivo inicializado desde localStorage
  const usuario = ref(JSON.parse(localStorage.getItem('ciudadano_gecap')) || null)
  const sesionActiva = ref(null)

  // Propiedades computadas útiles
  const isAuthenticated = computed(() => !!usuario.value)
  const primerNombre = computed(() => {
    if (!usuario.value || !usuario.value.nombre_completo) return 'Ciudadano'
    return usuario.value.nombre_completo.split(' ')[0]
  })

  // Acción de Login
  const login = async (email, password) => {
    const respuesta = await iniciarSesionCiudadano(email, password)
    if (respuesta.perfil) {
      usuario.value = respuesta.perfil
      sesionActiva.value = respuesta.session
      localStorage.setItem('ciudadano_gecap', JSON.stringify(respuesta.perfil))
    }
    return respuesta
  }

  // Acción de Logout
  const logout = async () => {
    await cerrarSesionCiudadano()
    usuario.value = null
    sesionActiva.value = null
    localStorage.removeItem('ciudadano_gecap')
  }

  // Cargar sesión inicial si existe token en Supabase
  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      await logout()
      return false
    }
    sesionActiva.value = session
    return true
  }

  return {
    usuario,
    sesionActiva,
    isAuthenticated,
    primerNombre,
    login,
    logout,
    checkSession
  }
})