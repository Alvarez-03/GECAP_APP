import { supabase } from './supabase'

export const cuadrantesService = {
  // 1. Obtener todos los cuadrantes con su Base Policial y sus Barrios asociados
  async obtenerCuadrantesCompletos() {
    try {
      const { data, error } = await supabase
        .from('cuadrantes')
        .select(`
          *,
          bases_policiales (*),
          barrios_tulua (*)
        `)
        .order('numero_zona', { ascending: true })

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error al obtener cuadrantes completos:', error)
      return { data: [], error }
    }
  },

  // 2. Obtener solo las bases policiales (para los selectores de formularios)
  async obtenerBasesPoliciales() {
    try {
      const { data, error } = await supabase
        .from('bases_policiales')
        .select('*')
        .order('nombre', { ascending: true })

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error al obtener bases policiales:', error)
      return { data: [], error }
    }
  },

  // 3. Obtener todos los barrios de Tuluá
  async obtenerBarrios() {
    try {
      const { data, error } = await supabase
        .from('barrios_tulua')
        .select('*, cuadrantes(nombre)')
        .order('nombre_barrio', { ascending: true })

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error al obtener barrios:', error)
      return { data: [], error }
    }
  },

  // 4. Crear o actualizar un Cuadrante
  async guardarCuadrante(cuadranteData, id = null) {
    try {
      if (id) {
        // Actualizar
        const { data, error } = await supabase
          .from('cuadrantes')
          .update(cuadranteData)
          .eq('id', id)
          .select()
        if (error) throw error
        return { data, error: null }
      } else {
        // Insertar nuevo
        const { data, error } = await supabase
          .from('cuadrantes')
          .insert([cuadranteData])
          .select()
        if (error) throw error
        return { data, error: null }
      }
    } catch (error) {
      console.error('Error al guardar cuadrante:', error)
      return { data: null, error }
    }
  },

  // 5. Asignar un barrio a un cuadrante (actualiza el cuadrante_id en barrios_tulua)
  async asignarBarrioACuadrante(barrioId, cuadranteId) {
    try {
      const { data, error } = await supabase
        .from('barrios_tulua')
        .update({ cuadrante_id: cuadranteId })
        .eq('id', barrioId)
        .select()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Error al asignar barrio:', error)
      return { data: null, error }
    }
  },

  // 6. Eliminar un cuadrante
  async eliminarCuadrante(id) {
    try {
      // Primero desvinculamos los barrios asociados para evitar errores de llave foránea
      await supabase
        .from('barrios_tulua')
        .update({ cuadrante_id: null })
        .eq('cuadrante_id', id)

      // Luego eliminamos el cuadrante
      const { error } = await supabase
        .from('cuadrantes')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error al eliminar cuadrante:', error)
      return { error }
    }
  }
}