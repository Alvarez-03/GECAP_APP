// src/controllers/recuperarPasswordController.js
import { verificarCiudadanoPorEmail, actualizarPasswordCiudadano } from '../services/authService.js'

export const recuperarPasswordController = {
  obtenerDatosDesdeURL(query) {
    return {
      email: query.email ? String(query.email) : ''
    }
  },

  // Paso 1: Validar que el correo exista en la tabla 'ciudadanos'
  async verificarUsuarioExistente(email) {
    if (!email || !email.includes('@')) {
      throw new Error('Por favor ingresa un correo electrónico válido.')
    }

    return await verificarCiudadanoPorEmail(email)
  },

  // Paso 2: Cambiar contraseña con validaciones estrictas
  async cambiarPasswordDirecto({ email, password, confirmPassword }) {
    if (!password || password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.')
    }

    if (password !== confirmPassword) {
      throw new Error('Las contraseñas no coinciden.')
    }

    // Regla de seguridad: Mayúscula, Número y Carácter Especial
    const regexSeguridad = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/
    if (!regexSeguridad.test(password)) {
      throw new Error('La contraseña debe contener al menos un carácter especial, un número y una letra mayúscula.')
    }

    return await actualizarPasswordCiudadano(email, password)
  }
}