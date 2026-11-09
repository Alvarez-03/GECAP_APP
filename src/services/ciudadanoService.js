import { supabase } from './supabase'

// Obtener lista completa de ciudadanos registrados ordenados por fecha
export const obtenerCiudadanosService = async () => {
  const { data, error } = await supabase
    .from('ciudadanos')
    .select('*')

  if (error) throw error
  return data || []
}