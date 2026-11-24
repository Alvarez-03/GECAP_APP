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
          alerta_fotos(url_foto)
        `)
        .eq('usuario_id', usuarioId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, reportes: data || [] }
    } catch (error) {
      console.error('Error al obtener historial:', error.message)
      throw new Error('No se pudo cargar el historial de reportes.')
    }
  },

  async obtenerTodasLasAlertas() {
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
          nombre_ciudadano,
          alerta_fotos(url_foto)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, alertas: data || [] }
    } catch (error) {
      console.error('Error al obtener alertas globales:', error.message)
      return { success: false, alertas: [] }
    }
  },

  async obtenerAlertasPorOperador(idCuadrante, idEstacion) {
    try {
      const ids = [idCuadrante, idEstacion].filter(Boolean)
      if (ids.length === 0) {
        return { success: true, alertas: [] }
      }

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
          nombre_ciudadano,
          alerta_fotos(url_foto)
        `)
        .in('id_cuadrante', ids)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { success: true, alertas: data || [] }
    } catch (error) {
      console.error('Error al obtener alertas del operador:', error.message)
      return { success: false, alertas: [] }
    }
  },

  async actualizarEstadoAlerta(alertaId, nuevoEstado) {
    try {
      const { data, error } = await supabase
        .from('alertas')
        .update({ estado_actual: nuevoEstado })
        .eq('id', alertaId)
        .select()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error al actualizar el estado de la alerta:', error.message)
      return { success: false, error: error.message }
    }
  },

  async obtenerDictamenPorAlerta(alertaId) {
    try {
      if (!alertaId) return { data: null, error: null }

      const { data, error } = await supabase
        .from('alerta_dictamenes')
        .select('*')
        .eq('alerta_id', alertaId)
        .maybeSingle()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error al obtener dictamen de alerta:', error.message)
      return { data: null, error }
    }
  },

  async guardarDictamenAlerta({
    alertaId,
    operadorDocumento,
    patrullaResponsable,
    detallesProcedimiento,
    codigoPolicia = null,
    pdfDictamenUrl = null
  }) {
    const payload = {
      alerta_id: alertaId,
      operador_documento: String(operadorDocumento).trim(),
      patrulla_responsable: String(patrullaResponsable).trim(),
      detalles_procedimiento: String(detallesProcedimiento).trim(),
      codigo_policia: codigoPolicia ? String(codigoPolicia).trim() : null,
      pdf_dictamen_url: pdfDictamenUrl || null,
      fecha_cierre: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('alerta_dictamenes')
      .upsert(payload, { onConflict: 'alerta_id' })
      .select('*')
      .single()

    if (error) {
      console.error('Error al guardar en alerta_dictamenes:', error.message)
      throw error
    }

    return data
  }
}