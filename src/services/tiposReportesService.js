import { supabase } from './supabase'

export const tiposReportesService = {
  /**
   * 1. READ ALL - Obtener todos los tipos de reportes (ordenados por categoría y código)
   * @param {boolean} soloActivos - Si es true, retorna únicamente los registros activos
   */
  async obtenerTodos(soloActivos = true) {
    try {
      let query = supabase
        .from('tipos_reportes')
        .select('*')
        .order('categoria', { ascending: true })
        .order('codigo', { ascending: true })

      if (soloActivos) {
        query = query.eq('activo', true)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error al obtener tipos de reportes:', error.message)
      throw new Error('No se pudieron cargar los tipos de reportes: ' + error.message)
    }
  },

  /**
   * 2. READ BY ID - Obtener un tipo de reporte específico por su ID
   * @param {number} id
   */
  async obtenerPorId(id) {
    try {
      const { data, error } = await supabase
        .from('tipos_reportes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error(`Error al obtener tipo de reporte ${id}:`, error.message)
      throw new Error('Tipo de reporte no encontrado.')
    }
  },

  /**
   * 3. READ BY CATEGORIA - Obtener tipos de reportes agrupados o filtrados por categoría
   * @param {string} categoria
   */
  async obtenerPorCategoria(categoria) {
    try {
      const { data, error } = await supabase
        .from('tipos_reportes')
        .select('*')
        .eq('categoria', categoria)
        .eq('activo', true)
        .order('codigo', { ascending: true })

      if (error) throw error
      return data
    } catch (error) {
      console.error(`Error al filtrar por categoría ${categoria}:`, error.message)
      throw new Error('Error al consultar categorías.')
    }
  },

  /**
   * 4. CREATE - Crear un nuevo tipo de reporte (Administración)
   * @param {Object} nuevoReporte - Objeto con { categoria, situacion, codigo, descripcion, activo }
   */
  async crear(nuevoReporte) {
    try {
      const { data, error } = await supabase
        .from('tipos_reportes')
        .insert([
          {
            categoria: nuevoReporte.categoria,
            situacion: nuevoReporte.situacion,
            codigo: nuevoReporte.codigo,
            descripcion: nuevoReporte.descripcion,
            activo: nuevoReporte.activo ?? true
          }
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error al crear tipo de reporte:', error.message)
      throw new Error('No se pudo crear el tipo de reporte: ' + error.message)
    }
  },

  /**
   * 5. UPDATE - Actualizar un tipo de reporte existente por ID
   * @param {number} id 
   * @param {Object} datosActualizados - Campos a modificar
   */
  async actualizar(id, datosActualizados) {
    try {
      const { data, error } = await supabase
        .from('tipos_reportes')
        .update(datosActualizados)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error(`Error al actualizar tipo de reporte ${id}:`, error.message)
      throw new Error('No se pudo actualizar el registro: ' + error.message)
    }
  },

  /**
   * 6. TOGGLE STATUS (Soft Delete / Inactivar) - Inactivar o activar un tipo de reporte sin borrarlo de la BD
   * @param {number} id 
   * @param {boolean} estadoActivo 
   */
  async cambiarEstado(id, estadoActivo) {
    return await this.actualizar(id, { activo: estadoActivo })
  },

  /**
   * 7. DELETE (Hard Delete) - Eliminar físicamente un tipo de reporte por ID
   * @param {number} id 
   */
  async eliminar(id) {
    try {
      const { data, error } = await supabase
        .from('tipos_reportes')
        .delete()
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error(`Error al eliminar tipo de reporte ${id}:`, error.message)
      throw new Error('No se pudo eliminar el tipo de reporte: ' + error.message)
    }
  }
}