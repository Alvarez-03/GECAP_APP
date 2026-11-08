<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MapPin, ShieldAlert, BarChart3, Users, UserCog, Radio, ArrowRight, LogOut } from 'lucide-vue-next'
import { cerrarSesionOperador } from '../services/authService'
import { toast } from 'vue3-toastify'

const router = useRouter()
const operador = ref(null)

onMounted(() => {
  const usuarioGuardado = localStorage.getItem('usuario_gecap')
  if (usuarioGuardado) {
    operador.value = JSON.parse(usuarioGuardado)
  }
})

// Módulos y funciones asignadas al operador según permisos
const funcionesOperador = [
  {
    id: 'mapa',
    titulo: 'Mapa y Monitoreo',
    descripcion: 'Visualización en tiempo real de CAIs, cuadrantes y alertas activas.',
    icono: MapPin,
    colorBadge: 'bg-red-500/10 text-red-400 border-red-500/30',
    ruta: '/policia/mapa',
    disponible: true,
    colorAnimation: "group-hover:via-red-500"
  },
  {
    id: 'despacho',
    titulo: 'Todas las Alertas',
    descripcion: 'Información detallada de alertas de la ciudad de Tuluá.',
    icono: ShieldAlert,
    colorBadge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    ruta: '/policia/AlertasDetalle',
    disponible: false,
    colorAnimation: "group-hover:via-amber-500"
  },
  {
    id: 'cuadrantes',
    titulo: 'Gestión de Cuadrantes',
    descripcion: 'Administración estratégica de cuadrantes de policía y cobertura de atención en Tuluá.',
    icono: Radio,
    colorBadge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    ruta: '/policia/cuadrantes',
    disponible: false,
    colorAnimation: "group-hover:via-blue-500"
  },
  {
    id: 'estadisticas',
    titulo: 'Indicadores y Metricas de reportes de la ciudad',
    descripcion: 'Análisis de métricas de gestión, tiempos de respuesta y mapas de calor delictivo.',
    icono: BarChart3,
    colorBadge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    ruta: '/policia/dashboard-bi',
    disponible: false,
    colorAnimation: "group-hover:via-emerald-500"
  },
  {
    id: 'usuarios',
    titulo: 'Gestión de Ciudadanos',
    descripcion: 'Administración, verificación de perfiles y control de cuentas de usuarios en la plataforma.',
    icono: Users,
    colorBadge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    claseHover: 'group-hover:via-indigo-500',
    colorAnimation: 'group-hover:text-indigo-400',
    ruta: '/policia/usuarios',
    disponible: false,
    colorAnimation: "group-hover:via-indigo-500"
  },
  {
    id: 'operadores',
    titulo: 'Gestión de Operadores',
    descripcion: 'Control de accesos, asignación de turnos y permisos para el personal del centro de control.',
    icono: UserCog,
    colorBadge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    claseHover: 'group-hover:via-purple-500',
    colorAnimation: 'group-hover:text-purple-400',
    ruta: '/policia/operadores',
    disponible: true,
    colorAnimation: "group-hover:via-purple-500"
  },
]

const navegarA = (ruta, disponible) => {
  if (!disponible) {
    toast.info('Módulo en desarrollo para el próximo sprint.', { position: 'top-center' })
    return
  }
  router.push(ruta)
}

const handleLogout = async () => {
  await cerrarSesionOperador()
  router.push('/policia/login')
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 text-slate-100 flex flex-col font-sans select-none">
    
    <!-- ENCABEZADO INSTITUCIONAL -->
    <header class="bg-gecap-darkblue border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
      <div class="flex items-center gap-3">
        <div class="w-14 h-14 rounded-xl flex items-center justify-center text-white font-black shadow-lg ">
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
            Operador: <span class="text-slate-200 font-bold ">{{ operador?.nombre_completo || 'Oficial de Turno' }}</span>
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
          Selecciona una tarjeta para ingresar al panel operativo correspondiente.
        </p>
      </div>

      <!-- GRID DE TARJETAS -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          v-for="item in funcionesOperador" 
          :key="item.id"
          @click="navegarA(item.ruta, item.disponible)"
          class="bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 shadow-xl group cursor-pointer relative overflow-hidden"
        >
          <!-- Efecto de brillo superior al hacer hover -->
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