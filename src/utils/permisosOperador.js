export const ROLES_SISTEMA = {
    OPERADOR: 'OPERADOR',
    SUPERVISOR: 'SUPERVISOR',
    ADMIN: 'ADMIN'
  }
  
  export const PERMISOS_POR_MODULO = {
    mapa: ['OPERADOR', 'SUPERVISOR', 'ADMIN'],
    despacho: ['OPERADOR', 'SUPERVISOR', 'ADMIN'],
    cuadrantes: ['SUPERVISOR', 'ADMIN'],
    estadisticas: ['SUPERVISOR', 'ADMIN'],
    usuarios: ['SUPERVISOR', 'ADMIN'],
    operadores: ['ADMIN']
  }
  
  const normalizarRol = (rol = '') => String(rol).trim().toUpperCase()
  
  export function tienePermisoPorRol(rol, rolesPermitidos = []) {
    const rolNorm = normalizarRol(rol)
    if (!rolNorm || !Array.isArray(rolesPermitidos) || rolesPermitidos.length === 0) {
      return false
    }
    return rolesPermitidos.some((permitido) => normalizarRol(permitido) === rolNorm)
  }
  
  export function obtenerOperadorLocalStorage() {
    try {
      const raw = localStorage.getItem('operador_gecap')
      return raw ? JSON.parse(raw) : null
    } catch (err) {
      console.error('Error al leer operador_gecap de localStorage:', err)
      return null
    }
  }