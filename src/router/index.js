import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../services/supabase'
import { toast } from 'vue3-toastify'

import index from '../views/index.vue'
import registercitizen from '../views/registerCiudadano.vue'
import loginCiudadano from '../views/loginCiudadano.vue'
import homeCiudadano from '../views/homeCiudadano.vue'
import CrearAlerta from '../views/CrearAlerta.vue'

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
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// GUARD DE NAVEGACIÓN GLOBAL
router.beforeEach(async (to, from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
    if (!requiresAuth) {
      return next()
    }
  
    try {
      const usuarioLocal = localStorage.getItem('ciudadano_gecap')
      const { data: { session } } = await supabase.auth.getSession()
  
      if (!session || !usuarioLocal) {
        localStorage.removeItem('ciudadano_gecap')
        
        toast.warning('Tu sesión ha expirado o no estás autenticado.', {
          position: 'top-center',
          theme: 'dark'
        })
  
        return next({ name: 'login' })
      }
  
      next()
    } catch (error) {
      console.error('Error al validar la sesión:', error)
      toast.error('Error de autenticación. Inicia sesión nuevamente.')
      return next({ name: 'login' })
    }
  })

export default router