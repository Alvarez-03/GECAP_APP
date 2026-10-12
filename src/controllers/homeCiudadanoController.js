import { perfilService } from '../services/perfilService'

export const homeCiudadanoController = {
  /**
   * Ejecuta la verificación de seguridad y carga la información inicial del usuario.
   * @param {Object} authStore - Store de Pinia de autenticación
   * @returns {Promise<string>} - Primer nombre del usuario
   */
  async inicializarVista(authStore) {
    // 1. Validar sesión global con Pinia / Supabase
    const isValid = await authStore.checkSession()
    if (!isValid || !authStore.isAuthenticated || !authStore.sesionActiva) {
      throw new Error('SESION_EXPIRADA')
    }

    // 2. Obtener el ID de usuario activo
    const userId = authStore.sesionActiva.user.id

    // 3. Obtener el perfil mediante el servicio
    const perfil = await perfilService.obtenerDatosCiudadano(userId)

    // 4. Retornar el primer nombre para mostrar en pantalla
    if (perfil && perfil.nombre_completo) {
      return perfil.nombre_completo.split(' ')[0]
    }

    return 'Ciudadano'
  }
}