import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../services/supabase'
import { toast } from 'vue3-toastify'

import index from '../views/index.vue'
import registercitizen from '../views/registerCiudadano.vue'
import loginCiudadano from '../views/loginCiudadano.vue'
import homeCiudadano from '../views/homeCiudadano.vue'
import CrearAlerta from '../views/CrearAlerta.vue'
import ConfirmarReporte from '../views/confirmarReporte.vue'
import HistorialReportesView from '../views/HistorialReportesView.vue'
import HistorialDetalleView from '../views/HistorialDetalleView.vue'
import PerfilView from '../views/PerfilView.vue'
import MapaView from '../views/MapaView.vue'
import LoginOperadorView from '../views/LoginOperadorView.vue'
import MapaOperadorView from '../views/MapaOperadorView.vue'

const routes = [
  {
    path: '/',
    name: 'index',
    component: index
  },
  {
    path: '/registro',
    name: 'registro',
    component: registercitizen
  },
  {
    path: '/login',
    name: 'login',
    component: loginCiudadano
  },
  {
    path: '/homeCiudadano',
    name: 'homeciudadano',
    component: homeCiudadano,
    meta: { requiresAuth: true }
  },
  {
    path: '/crearReporte',
    name: 'crearReporte',
    component: CrearAlerta,
    meta: { requiresAuth: true }
  },
  {
    path: '/reporteConfirmado',
    name: 'reporteConfirmado',
    component: ConfirmarReporte,
    meta: { requiresAuth: true }
  },
  {
    path: '/olvidar-password',
    name: 'olvidar-password',
    component: () => import('../views/OlvidarPasswordView.vue')
  },
  {
    path: '/restablecer-password',
    name: 'restablecer-password',
    component: () => import('../views/RestablecerPasswordView.vue')
  },
  {
    path: '/historial',
    name: 'HistorialReportes',
    component: HistorialReportesView,
    meta: { requiresAuth: true }
  },
  {
    path: '/historial/:id',
    name: 'HistorialDetalle',
    component: HistorialDetalleView,
    meta: { requiresAuth: true }
  },
  {
    path: '/perfil',
    name: 'Perfil',
    component: PerfilView,
    meta: { requiresAuth: true }
  },
  {
    path: '/mapa',
    name: 'Mapa',
    component: MapaView,
    meta: { requiresAuth: true }
  },
  {
    path: '/policia/login',
    name: 'login-policia',
    component: LoginOperadorView,
  },
  {
    path: '/policia/mapa',
    name: 'mapa-policia',
    component: MapaOperadorView,
    meta: { requiresAuth: true, requiresOperator: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// GUARD DE NAVEGACIÓN GLOBAL (CIUDADANOS Y OPERADORES)
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresOperator = to.matched.some(record => record.meta.requiresOperator)

  // 1. Si la ruta es pública, permitir acceso sin restricciones
  if (!requiresAuth) {
    return next()
  }

  try {
    const { data: { session } } = await supabase.auth.getSession()

    // 2. Si es una ruta protegida para OPERADORES POLICIALES
    if (requiresOperator) {
      if (!session) {
        toast.warning('Acceso restringido. Debes iniciar sesión como operador.', {
          position: 'top-center',
          theme: 'dark'
        })
        return next({ name: 'login-policia' })
      }

      // Validar si el usuario autenticado está registrado en la tabla 'operadores'
      const { data: operador, error } = await supabase
        .from('operador_cuadrantes')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (error || !operador) {
        await supabase.auth.signOut()
        localStorage.removeItem('operador_gecap')
        toast.error('Cuenta no autorizada para el módulo operativo.', {
          position: 'top-center',
          theme: 'dark'
        })
        return next({ name: 'login-policia' })
      }

      return next()
    }

    // 3. Si es una ruta protegida para CIUDADANOS
    const usuarioLocal = localStorage.getItem('ciudadano_gecap')

    if (!session || !usuarioLocal) {
      localStorage.removeItem('ciudadano_gecap')
      
      toast.warning('Tu sesión ha expirado o no estás autenticado.', {
        position: 'top-center',
        theme: 'dark'
      })

      return next({ name: 'login' })
    }

    return next()

  } catch (error) {
    console.error('Error al validar la sesión:', error)
    toast.error('Error de autenticación. Inicia sesión nuevamente.', {
      position: 'top-center',
      theme: 'dark'
    })

    if (requiresOperator) {
      return next({ name: 'login-policia' })
    }
    return next({ name: 'login' })
  }
})
export default router