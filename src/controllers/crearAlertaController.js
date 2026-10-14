import { tiposReportesService } from '../services/tiposReportesService'
import { alertasService } from '../services/alertasService'

export const crearAlertaController = {
  //Obtiene todos los tipos de alertas/reportes activos
  async obtenerTodos() {
    try {
      const reportes = await tiposReportesService.obtenerTodos(true)
      return reportes
    } catch (error) {
      console.error('Error en crearAlertaController.obtenerTodos:', error.message)
      throw error
    }
  },

  async registrarAlerta(datosFormulario) {
    try {
      let documentoCiudadano = null
      let usuarioUuid = null

      const datosCiudadanoStorage = localStorage.getItem('ciudadano_gecap')
      if (datosCiudadanoStorage) {
        try {
          const ciudadanoObj = JSON.parse(datosCiudadanoStorage)
          documentoCiudadano = ciudadanoObj.numero_documento || null
          usuarioUuid = ciudadanoObj.user_id || null
        } catch (e) {
          console.error('Error al parsear ciudadano_gecap:', e)
        }
      }

      // Definir el payload después de extraer los datos
      const payload = {
        ciudadano_documento: documentoCiudadano,
        usuario_id: usuarioUuid,
        tipo_alerta: datosFormulario.tipo_alerta,
        descripcion: datosFormulario.descripcion,
        latitud: datosFormulario.latitud,
        longitud: datosFormulario.longitud
      }

      const respuesta = await alertasService.crearAlerta(payload)
      return respuesta
    } catch (error) {
      console.error('Error en controlador crearAlertaController:', error)
      throw error
    }
  }

  
}