import { supabase } from './supabase'
import { toast } from 'vue3-toastify'

export const alertasService = {
  async crearAlerta(payload) {
    const codigoSeguimiento = 'CAD-' + Math.floor(100 + Math.random() * 900)

    // 1. Crear la alerta principal mediante RPC
    const { data, error } = await supabase.rpc('crear_alerta_segura', {
      p_codigo_seguimiento: codigoSeguimiento,
      p_ciudadano_documento: payload.ciudadano_documento || null,
      p_tipo_alerta: payload.tipo_alerta || null,
      p_descripcion: payload.descripcion || null,
      p_latitud: Number(payload.latitud),
      p_longitud: Number(payload.longitud),
      p_nombre_ciudadano: payload.nombre_ciudadano
    })

    if (error) {
      toast.error('Error al registrar la alerta: ' + error.message)
      throw error
    }

    // 2. Obtener el UUID real consultando la tabla 'alertas'
    let query = supabase
      .from('alertas')
      .select('id, codigo_seguimiento')
      .eq('latitud', Number(payload.latitud))
      .eq('longitud', Number(payload.longitud))
      .order('created_at', { ascending: false })
      .limit(1)

    if (payload.ciudadano_documento) {
      query = query.eq('ciudadano_documento', payload.ciudadano_documento)
    }

    const { data: alertaEncontrada, error: errorBusqueda } = await query.single()

    if (errorBusqueda || !alertaEncontrada) {
      toast.error('No se pudo recuperar el identificador único de la alerta.')
      throw new Error('No se pudo recuperar el identificador único (UUID) de la alerta.')
    }

    const alertaId = alertaEncontrada.id

    // 3. Subir archivos al Storage y relacionarlos en 'alerta_fotos'
    if (payload.archivos && payload.archivos.length > 0 && alertaId) {
      for (const archivo of payload.archivos) {
        const fileName = `${alertaId}/${Date.now()}_${archivo.name.replace(/\s+/g, '_')}`
        
        const { error: uploadError } = await supabase.storage
          .from('evidencia-reportes')
          .upload(fileName, archivo)

        if (uploadError) {
          toast.error(`Error al subir la imagen ${archivo.name}: ${uploadError.message}`)
          continue
        }

        const { data: publicUrlData } = supabase.storage
          .from('evidencia-reportes')
          .getPublicUrl(fileName)

        const urlFoto = publicUrlData.publicUrl

        const { error: insertFotoError } = await supabase
          .from('alerta_fotos')
          .insert([
            {
              alerta_id: alertaId,
              url_foto: urlFoto
            }
          ])

        if (insertFotoError) {
          toast.error('Error al guardar la relación de la foto: ' + insertFotoError.message)
        }
      }
    }

    return alertaEncontrada
  }
}