import { supabase } from './supabase'

// Obtener lista completa de operadores ordenados por fecha
export const obtenerOperadoresService = async () => {
  const { data, error } = await supabase
    .from('operador_cuadrantes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Obtener catálogo de cuadrantes
export const obtenerCuadrantesService = async () => {
  const { data, error } = await supabase.from('cuadrantes').select('*')
  if (error) throw error
  return data || []
}

// Registrar un nuevo operador (Auth + Tabla)
export const registrarOperadorService = async (operadorData, basePolicialId) => {
  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: operadorData.email,
    password: operadorData.password,
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      throw new Error('Este correo electrónico ya se encuentra registrado en el sistema de autenticación.')
    }
    throw new Error(authError.message)
  }

  const userId = authData.user?.id
  if (!userId) throw new Error('No se pudo obtener el identificador de usuario de OAuth.')

  // 2. Insertar en operador_cuadrantes
  const datosAInsertar = {
    user_id: userId,
    nombre_completo: operadorData.nombre_completo,
    placa_identificacion: operadorData.placa_identificacion,
    rango: operadorData.rango || 'Patrullero',
    rol: operadorData.rol || 'OPERADOR',
    email: operadorData.email,
    id_cuadrante: operadorData.id_cuadrante && operadorData.id_cuadrante !== '' ? operadorData.id_cuadrante : null,
    id_estacion: basePolicialId
  }

  const { error: dbError } = await supabase
    .from('operador_cuadrantes')
    .insert([datosAInsertar])

  if (dbError) throw dbError
  return true
}

// Actualizar un operador existente
export const actualizarOperadorService = async (id, operadorData, basePolicialId) => {
  const datosAActualizar = {
    nombre_completo: operadorData.nombre_completo,
    placa_identificacion: operadorData.placa_identificacion,
    rango: operadorData.rango || 'Patrullero',
    rol: operadorData.rol || 'OPERADOR',
    email: operadorData.email,
    id_cuadrante: operadorData.id_cuadrante && operadorData.id_cuadrante !== '' ? operadorData.id_cuadrante : null,
    id_estacion: basePolicialId
  }

  const { error: dbError } = await supabase
    .from('operador_cuadrantes')
    .update(datosAActualizar)
    .eq('id', id)

  if (dbError) throw dbError
  return true
}