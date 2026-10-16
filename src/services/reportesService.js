import { supabase } from './supabase'

export const reportesService = {
  async obtenerHistorialReportes(usuarioId) {
    try {
      const { data, error } = await supabase
        .from('alertas')
        .select(`
          id,
          codigo_seguimiento,
          ciudadano_documento,
          usuario_id,
          tipo_alerta,
          descripcion,
          latitud,
          longitud,
          id_cuadrante,
          estado_actual,
          created_at,
          estado_actual
        `)
        .eq('usuario_id', usuarioId)
        .order('created_at', { ascending: false })

      if (error) throw error
      console.log(data)
      return { success: true, reportes: data || [] }
    } catch (error) {
      console.error('Error al obtener historial:', error.message)
      throw new Error('No se pudo cargar el historial de reportes.')
    }
  }
}