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

  async obtenerTodosLosDictamenes() {
    try {
      const { data, error } = await supabase
        .from('alerta_dictamenes')
        .select('*')
        .order('fecha_cierre', { ascending: false })

      if (error) throw error
      return { success: true, dictamenes: data || [] }
    } catch (error) {
      console.error('Error al obtener dictámenes:', error.message)
      return { success: false, dictamenes: [] }
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
    pdfDictamenUrl = null,
    datosFormulario = {}
  }) {
    const payload = {
      alerta_id: alertaId,
      operador_documento: String(operadorDocumento).trim(),
      patrulla_responsable: String(patrullaResponsable).trim(),
      detalles_procedimiento: String(detallesProcedimiento).trim(),
      codigo_policia: codigoPolicia ? String(codigoPolicia).trim() : null,
      pdf_dictamen_url: pdfDictamenUrl || null,
      fecha_cierre: new Date().toISOString(),

      // Campos detallados del modal
      ciudad_municipio: datosFormulario.ciudadMunicipio || null,
      fecha_reporte: datosFormulario.fecha || null,
      hora_inicio: datosFormulario.horaInicio || null,
      hora_finalizacion: datosFormulario.horaFinalizacion || null,
      unidad_texto: datosFormulario.unidadTexto || null,
      numero_radicado: datosFormulario.numeroRadicado || null,
      direccion_exacta: datosFormulario.direccionExacta || null,
      jefe_patrulla: datosFormulario.jefePatrulla || null,
      acompanante: datosFormulario.acompanante || null,
      medio_transporte: datosFormulario.medioTransporte || null,
      origen_requerimiento: datosFormulario.origenRequerimiento || null,
      motivo_inicial: datosFormulario.motivoInicial || null,
      calidad_persona: datosFormulario.calidadPersona || null,
      nombre_persona: datosFormulario.nombrePersona || null,
      documento_persona: datosFormulario.documentoPersona || null,
      edad_persona: datosFormulario.edadPersona || null,
      direccion_persona: datosFormulario.direccionPersona || null,
      telefono_persona: datosFormulario.telefonoPersona || null,
      llegada_lugar: datosFormulario.llegadaLugar || null,
      desarrollo_intervencion: datosFormulario.desarrolloIntervencion || null,
      actuaciones_medidas: datosFormulario.actuacionesMedidas || null,
      elementos_incautados: datosFormulario.elementosIncautados || null,
      estado_caso: datosFormulario.estadoCaso || null,
      novedades_procedimiento: datosFormulario.novedadesProcedimiento || null,
      firma1_nombre: datosFormulario.firma1Nombre || null,
      firma1_id: datosFormulario.firma1Id || null,
      firma1_cargo: datosFormulario.firma1Cargo || null,
      firma2_nombre: datosFormulario.firma2Nombre || null,
      firma2_id: datosFormulario.firma2Id || null,
      firma2_cargo: datosFormulario.firma2Cargo || null
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