import { supabase } from './supabase'

export const alertasService = {
  async crearAlerta(payload) {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      // Generar un código de seguimiento único simple
      const codigoSeguimiento = 'CAD-' + Math.floor(100 + Math.random() * 900)

      // Llamada segura a la función RPC de Supabase (Evita el error 42501 manteniendo RLS activo)
      const { data, error } = await supabase.rpc('crear_alerta_segura', {
        p_codigo_seguimiento: codigoSeguimiento,
        p_ciudadano_documento: payload.ciudadano_documento || null,
        p_tipo_alerta: payload.tipo_alerta || null,
        p_descripcion: payload.descripcion || null,
        p_latitud: Number(payload.latitud),
        p_longitud: Number(payload.longitud),
        p_nombre_ciudadano: payload.nombre_ciudadano
      })

      if (error) throw error

      // La función RPC devuelve directamente el objeto insertado
      return data
    } catch (error) {
      console.error('Error al insertar la alerta en Supabase:', error.message)
      throw error
    }
  }
}