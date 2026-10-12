import axios from 'axios'

const VERIFIK_API_KEY = import.meta.env.VITE_VERIFIK_TOKEN || ''
const VERIFIK_BASE_URL = 'https://api.verifik.co/v2'

export const verificacionService = {
  async consultarAntecedentesPoliciales(tipoDocumento, numeroDocumento) {
    const options = {
      method: 'GET',
      url: `${VERIFIK_BASE_URL}/co/policia/consultar`,
      params: { 
        documentType: tipoDocumento, 
        documentNumber: numeroDocumento 
      },
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${VERIFIK_API_KEY}`
      }
    }

    try {
      const { data } = await axios.request(options)
      const resultado = data?.result || data
      console.log('--- RESPUESTA COMPLETA DE VERIFIK ---', data)
      const tieneAsuntosPendientes = resultado.hasRecords || resultado.status === 'ACTIVE' || false

      return {
        verificado: true,
        tieneAntecedentes: tieneAsuntosPendientes,
        detalles: resultado
      }
    } catch (error) {
      console.error('Error detallado al conectar con Verifik:', error.response?.data || error.message)
      throw new Error('No se pudo validar el estado judicial del documento en este momento.')
    }
  }
}