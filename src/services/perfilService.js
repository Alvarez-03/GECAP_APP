import { supabase } from './supabase'

export const perfilService = {
  /**
   * Obtiene los datos del ciudadano desde localStorage o los consulta a Supabase usando el user_id.
   */
  async obtenerDatosCiudadano(userId) {
    // 1. Intentar leer de localStorage primero
    const usuarioGuardado = localStorage.getItem('ciudadano_gecap')
    if (usuarioGuardado) {
      try {
        const perfil = JSON.parse(usuarioGuardado)
        if (perfil.nombre_completo) {
          return perfil
        }
      } catch (e) {
        console.error('Error al parsear el perfil local:', e)
      }
    }

    // 2. Si no está en local o está incompleto, consultar la base de datos de Supabase
    const { data: perfilData, error } = await supabase
      .from('ciudadanos')
      .select('*')
      .eq('user_id', userId) // Usamos 'user_id' que es la columna correcta en tu tabla
      .maybeSingle()

    if (error || !perfilData) {
      throw new Error('No se encontró información del ciudadano en el sistema.')
    }

    // Guardar en caché local para próximas consultas rápidas
    localStorage.setItem('ciudadano_gecap', JSON.stringify(perfilData))
    return perfilData
  },

  /**
   * Limpia los datos locales del perfil al cerrar sesión
   */
  limpiarPerfilLocal() {
    localStorage.removeItem('ciudadano_gecap')
  }
}