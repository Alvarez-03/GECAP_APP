import { supabase } from './supabase'
import { verificacionService } from './verifikService'

// registrar ciudadano
export const registrarCiudadano = async (userData) => {
  try {
    // 1. Validar antecedentes con Verifik usando los datos correctos (userData)
    try {
      const resultadoVerificacion = await verificacionService.consultarAntecedentesPoliciales(
        userData.documentType, 
        userData.documentNumber
      )

      if (resultadoVerificacion.tieneAntecedentes) {
        throw new Error('El registro ha sido rechazado por políticas de seguridad ciudadana (antecedentes judiciales detectados).')
      }
    } catch (verifikError) {
      if (verifikError.message.includes('rechazado')) {
        throw verifikError
      }
      console.warn('Advertencia en validación externa:', verifikError.message)
    }

    if (!userData.email) {
      throw new Error('El correo electrónico es obligatorio.')
    }

    // 2. Crear autenticación en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new Error('Este correo electrónico ya se encuentra registrado en el sistema.')
      }
      throw new Error(authError.message)
    }

    const userId = authData.user?.id
    if (!userId) throw new Error('No se pudo obtener el identificador del usuario.')

    // 3. Insertar perfil en la tabla 'ciudadanos' usando 'user_id' de manera uniforme
    const { error: dbError } = await supabase
      .from('ciudadanos')
      .insert([
        {
          user_id: userId, 
          tipo_documento: userData.documentType,
          numero_documento: userData.documentNumber,
          nombre_completo: userData.fullName,
          email: userData.email,
          telefono: userData.phone,
          direccion: userData.neighborhood || null,
          rol: 'CIUDADANO'
        }
      ])

    if (dbError) {
      console.error('Error en base de datos:', dbError)
      throw new Error('Error al guardar el perfil del ciudadano en la base de datos.')
    }

    return { success: true, user: authData.user }
  } catch (error) {
    console.error('Error en el servicio de registro:', error.message)
    throw new Error(error.message || 'Ocurrió un error inesperado de conexión con el servidor.')
  }
}

// validar credenciales de ciudadano
export const iniciarSesionCiudadano = async (email, password) => {
  try {
    // 1. Autenticar credenciales en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (authError) {
      throw new Error('Correo o contraseña incorrectos.')
    }

    const userId = authData.user.id

    // 2. Buscar perfil en la tabla 'ciudadanos' usando 'user_id' (unificado con la BD)
    const { data: perfilData, error: perfilError } = await supabase
      .from('ciudadanos')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (perfilError) {
      console.warn('Advertencia al consultar el perfil:', perfilError.message)
    }

    // 3. Respaldo por correo si por alguna razón no lo encontró por user_id
    let perfilFinal = perfilData

    if (!perfilFinal) {
      const { data: perfilPorEmail } = await supabase
        .from('ciudadanos')
        .select('*')
        .eq('email', email)
        .maybeSingle()
      
      perfilFinal = perfilPorEmail
    }

    return { 
      success: true, 
      session: authData.session, 
      user: authData.user,
      perfil: perfilFinal || { email: authData.user.email, nombre_completo: 'Ciudadano' } 
    }
  } catch (error) {
    console.error('Error en inicio de sesión:', error.message)
    throw new Error(error.message || 'Error al iniciar sesión.')
  }
}

export const cerrarSesionCiudadano = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    localStorage.removeItem('ciudadano_gecap')
    
    return { success: true }
  } catch (error) {
    console.error('Error al cerrar sesión:', error.message)
    throw new Error('No se pudo cerrar la sesión correctamente.')
  }
}