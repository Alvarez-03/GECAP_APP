import { registrarCiudadano, iniciarSesionCiudadano } from '../services/authService'

export const registroController = {
  /**
   * Valida las reglas de negocio del formulario de registro
   */
  validarFormulario(form) {
    if (!form.documentNumber || !form.fullName || !form.email || !form.phone || !form.password) {
      throw new Error('Por favor completa todos los campos obligatorios.')
    }

    const regexPassword = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/
    if (!regexPassword.test(form.password)) {
      throw new Error('La contraseña debe tener al menos 6 caracteres, incluir una mayúscula, un número y un carácter especial.')
    }

    if (form.password !== form.confirmPassword) {
      throw new Error('Las contraseñas ingresadas no coinciden.')
    }

    if (!form.acceptTerms) {
      throw new Error('Debes aceptar las políticas de seguridad y tratamiento de datos.')
    }
  },

  /**
   * Orquesta el registro y la redirección
   */
  async procesarRegistro(form, authStore) {
    // 1. Validar campos locales
    this.validarFormulario(form)

    // 2. Registrar en Supabase
    await registrarCiudadano(form)

    // 3. Intentar iniciar sesión automáticamente mediante el store de Pinia o servicio
    try {
      const respuestaLogin = await authStore.login(form.email, form.password)
      
      if (respuestaLogin?.perfil) {
        localStorage.setItem('ciudadano_gecap', JSON.stringify(respuestaLogin.perfil))
      }

      return {
        success: true,
        nombreUsuario: authStore.primerNombre || form.fullName.split(' ')[0]
      }
    } catch (loginError) {
      // Si Supabase exige confirmación de correo o el login falla por política de entorno,
      // guardamos un perfil básico provisional para permitir el acceso o redirigimos informando.
      console.warn('No se pudo iniciar sesión de forma automática tras el registro:', loginError)
      
      const perfilBasico = {
        nombre_completo: form.fullName,
        email: form.email,
        numero_documento: form.documentNumber
      }
      localStorage.setItem('ciudadano_gecap', JSON.stringify(perfilBasico))

      return {
        success: true,
        nombreUsuario: form.fullName.split(' ')[0]
      }
    }
  }
}