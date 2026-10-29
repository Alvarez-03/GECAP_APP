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
export const verificarCiudadanoPorEmail = async (email) => {
  try {
    if (!email || !email.includes('@')) {
      throw new Error('Por favor ingresa un correo electrónico válido.')
    }

    const emailLimpio = email.trim().toLowerCase()

    // Usar la RPC con SECURITY DEFINER para omitir bloqueos por RLS
    const { data: existe, error } = await supabase.rpc('existe_correo_ciudadano', {
      p_email: emailLimpio
    })

    if (error) {
      console.error('Error al consultar RPC:', error.message)
      throw new Error('Error al consultar el correo en la base de datos.')
    }

    if (!existe) {
      throw new Error('El correo electrónico no se encuentra registrado en el sistema.')
    }

    return { success: true }
  } catch (error) {
    throw new Error(error.message || 'Error al validar el correo.')
  }
}

// Actualizar contraseña mediante la función RPC segura en Supabase Auth
export const actualizarPasswordCiudadano = async (email, nuevaPassword) => {
  try {
    const { error } = await supabase.rpc('actualizar_password_por_email', {
      p_email: email.trim().toLowerCase(),
      p_nuevo_password: nuevaPassword
    })

    if (error) {
      console.error('Error en RPC actualizar password:', error.message)

      
      if (error.message && error.message.includes('La nueva contraseña no puede ser igual')) {
        throw new Error('La nueva contraseña no puede ser igual a la contraseña que ya tenías registrada.')
      }

      throw new Error('No se pudo conectar con el servidor para actualizar la contraseña.')
    }

    return { success: true }
  } catch (error) {
    console.error('Error al cambiar la contraseña:', error.message)
    throw new Error(error.message || 'Ocurrió un error al actualizar la contraseña.')
  }
}

// ==========================================
// SECCIÓN: OPERADORES POLICIALES
// ==========================================

// Iniciar sesión operador policial
export const iniciarSesionOperador = async (email, password) => {
  try {
    // 1. Autenticar credenciales en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (authError) {
      throw new Error('Credenciales inválidas o no autorizadas.')
    }

    const userId = authData.user.id

    // 2. Consultar el perfil en la tabla de operador_cuadrantes
    const { data: operadorData, error: operadorError } = await supabase
      .from('operador_cuadrantes')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (operadorError) {
      console.warn('Advertencia al consultar perfil de operador:', operadorError.message)
    }

    return {
      success: true,
      session: authData.session,
      user: authData.user,
      perfil: operadorData || { email: authData.user.email, rol: 'OPERADOR' }
    }
  } catch (error) {
    console.error('Error en inicio de sesión de operador:', error.message)
    throw new Error(error.message || 'Error al iniciar sesión como operador.')
  }
}

// Cerrar sesión general / operador
export const cerrarSesionOperador = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    localStorage.removeItem('operador_gecap')
    return { success: true }
  } catch (error) {
    console.error('Error al cerrar sesión de operador:', error.message)
    throw new Error('No se pudo cerrar la sesión.')
  }
}