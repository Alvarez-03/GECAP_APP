<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MapPin, ShieldAlert, BarChart3, Users, UserCog, Radio, ArrowRight, LogOut } from 'lucide-vue-next'
import { cerrarSesionOperador } from '../services/authService'
import {
  PERMISOS_POR_MODULO,
  tienePermisoPorRol,
  obtenerOperadorLocalStorage
} from '../utils/permisosOperador'
import { toast } from 'vue3-toastify'

const router = useRouter()
const operador = ref(null)

onMounted(() => {
  operador.value = obtenerOperadorLocalStorage()
})

const rolActual = computed(() => (operador.value?.rol || '').trim().toUpperCase())

const todasLasFunciones = [
  {
    id: 'mapa',
    titulo: 'Mapa y Monitoreo',
    descripcion: 'Visualización en tiempo real de CAIs, cuadrantes y alertas activas.',
    icono: MapPin,
    colorBadge: 'bg-red-500/10 text-red-400 border-red-500/30',
    ruta: '/policia/mapa',
    disponible: true,
    colorAnimation: 'group-hover:via-red-500',
    rolesPermitidos: PERMISOS_POR_MODULO.mapa
  },
  {
    id: 'despacho',
    titulo: 'Todas las Alertas',
    descripcion: 'Información detallada de alertas de la ciudad de Tuluá.',
    icono: ShieldAlert,
    colorBadge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    ruta: '/policia/AlertasReporte',
    disponible: true,
    colorAnimation: 'group-hover:via-amber-500',
    rolesPermitidos: PERMISOS_POR_MODULO.despacho
  },
  {
    id: 'cuadrantes',
    titulo: 'Gestión de Cuadrantes',
    descripcion: 'Administración estratégica de cuadrantes de policía y cobertura de atención en Tuluá.',
    icono: Radio,
    colorBadge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    ruta: '/policia/cuadrantes',
    disponible: true,
    colorAnimation: 'group-hover:via-blue-500',
    rolesPermitidos: PERMISOS_POR_MODULO.cuadrantes
  },
  {
    id: 'estadisticas',
    titulo: 'Indicadores y Metricas de reportes de la ciudad',
    descripcion: 'Análisis de métricas de gestión, tiempos de respuesta y mapas de calor delictivo.',
    icono: BarChart3,
    colorBadge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    ruta: '/policia/dashboard-bi',
    disponible: true,
    colorAnimation: 'group-hover:via-emerald-500',
    rolesPermitidos: PERMISOS_POR_MODULO.estadisticas
  },
  {
    id: 'usuarios',
    titulo: 'Gestión de Ciudadanos',
    descripcion: 'Administración, verificación de perfiles y control de cuentas de usuarios en la plataforma.',
    icono: Users,
    colorBadge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    colorAnimation: 'group-hover:via-indigo-500',
    ruta: '/policia/ciudadanos',
    disponible: true,
    rolesPermitidos: PERMISOS_POR_MODULO.usuarios
  },
  {
    id: 'operadores',
    titulo: 'Gestión de Operadores',
    descripcion: 'Control de accesos, asignación de turnos y permisos para el personal del centro de control.',
    icono: UserCog,
    colorBadge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    colorAnimation: 'group-hover:via-purple-500',
    ruta: '/policia/operadores',
    disponible: true,
    rolesPermitidos: PERMISOS_POR_MODULO.operadores
  }
]

const funcionesOperador = computed(() =>
  todasLasFunciones.filter((item) => tienePermisoPorRol(rolActual.value, item.rolesPermitidos))
)

const navegarA = (item) => {
  if (!item.disponible) {
    toast.info('Módulo en desarrollo para el próximo sprint.', { position: 'top-center' })
    return
  }

  if (!tienePermisoPorRol(rolActual.value, item.rolesPermitidos)) {
    toast.error('Tu rol no tiene permisos para acceder a este módulo.', {
      position: 'top-center',
      theme: 'dark'
    })
    return
  }

  router.push(item.ruta)
}

const handleLogout = async () => {
  await cerrarSesionOperador()
  localStorage.removeItem('operador_gecap')
  router.push('/policia/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 text-slate-100 flex flex-col font-sans select-none">

    <!-- ENCABEZADO INSTITUCIONAL -->
    <header class="bg-gecap-darkblue border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
      <div class="flex items-center gap-3">
        <div class="w-14 h-14 rounded-xl flex items-center justify-center text-white font-black shadow-lg">
          <img
            src="/LOGO_GECAP.png"
            alt="Escudo GECAP"
            class="w-full h-full object-contain"
          />
        </div>
        <div>
          <h1 class="text-base font-black text-white">
            GECAP — Centro De Control Operativo
          </h1>
          <p class="text-[11px] text-slate-400 font-medium">
            Rango: <span class="text-slate-200 font-bold">{{ operador?.nombre_completo || 'Oficial de Turno' }}</span>
            <span v-if="rolActual" class="ml-2 text-emerald-400 font-bold">
              Permisos • {{ rolActual }}
            </span>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <button
          @click="handleLogout"
          class="flex items-center gap-2 bg-slate-800 hover:bg-red-600/20 hover:border-red-500/50 border border-slate-700 text-slate-300 hover:text-red-400 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          <LogOut class="w-4 h-4" />
          <span class="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </div>
    </header>

    <!-- CONTENIDO PRINCIPAL / TARJETAS DE ACCESO -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col justify-center space-y-6">

      <div>
        <h2 class="text-[20px] font-bold tracking-tight text-gecap-darkblue">
          Módulos y Funciones Asignadas
        </h2>
        <p class="text-lg text-gecap-blue mt-0.5">
          Selecciona una tarjeta para ingresar al panel operativo correspondiente a tu rol.
        </p>
      </div>

      <div v-if="funcionesOperador.length === 0" class="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <p class="text-sm font-bold text-amber-400">
          Tu rol ({{ rolActual || 'Sin rol definido' }}) no tiene módulos operativos habilitados.
        </p>
      </div>

      <!-- GRID DE TARJETAS -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="item in funcionesOperador"
          :key="item.id"
          @click="navegarA(item)"
          class="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 shadow-xl group cursor-pointer relative overflow-hidden"
        >
          <div :class="[
            'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-transparent transition-all duration-500',
            item.colorAnimation
          ]"></div>

          <div>
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner" :class="item.colorBadge">
                <component :is="item.icono" class="w-6 h-6" />
              </div>
              <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                Activo
              </span>
            </div>

            <h3 :class="['text-sm font-black text-white uppercase tracking-wide transition-colors', item.colorAnimation]">
              {{ item.titulo }}
            </h3>

            <p class="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
              {{ item.descripcion }}
            </p>
          </div>

          <div class="pt-6 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
            <span>Ingresar al módulo</span>
            <div :class="['w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center transition-all shadow', item.colorAnimation]">
              <ArrowRight class="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

    </main>

    <!-- PIE DE PÁGINA -->
    <footer class="py-4 text-center border-t border-slate-900 bg-slate-950 text-[11px] text-slate-500 font-medium">
      GECAP — Sistema Inteligente de Gestión Estratégica de Cuadrantes y Atención Policial © 2026
    </footer>

  </div>
</template>