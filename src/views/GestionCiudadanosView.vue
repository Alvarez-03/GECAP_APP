<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Users, Search, ArrowLeft, RefreshCw, Mail, Phone, MapPin, CreditCard, Shield, Loader2, UserCheck } from 'lucide-vue-next'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

// Importar servicio de ciudadanos
import { obtenerCiudadanosService } from '../services/ciudadanoService'

const router = useRouter()
const ciudadanos = ref([])
const cargando = ref(true)
const busqueda = ref('')

// Consultar datos de ciudadanos desde Supabase
const cargarCiudadanos = async () => {
  try {
    cargando.value = true
    ciudadanos.value = await obtenerCiudadanosService()
  } catch (error) {
    console.error('Error al cargar ciudadanos:', error)
    toast.error('No se pudo cargar la lista de ciudadanos.', { position: 'top-center' })
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  cargarCiudadanos()
})

// Filtrar ciudadanos por nombre, documento, email o teléfono en tiempo real
const ciudadanosFiltrados = computed(() => {
  if (!busqueda.value.trim()) return ciudadanos.value
  const query = busqueda.value.toLowerCase()
  return ciudadanos.value.filter(c => 
    (c.nombre_completo && c.nombre_completo.toLowerCase().includes(query)) ||
    (c.numero_documento && c.numero_documento.toLowerCase().includes(query)) ||
    (c.email && c.email.toLowerCase().includes(query)) ||
    (c.telefono && c.telefono.toLowerCase().includes(query)) ||
    (c.direccion && c.direccion.toLowerCase().includes(query))
  )
})

const volverAlDashboard = () => {
  router.push('/policia/MenuPrincipal')
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 text-slate-100 flex flex-col font-sans select-none">
    
    <!-- ENCABEZADO -->
    <header class="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
      <div class="flex items-center gap-3">
        <button 
          @click="volverAlDashboard"
          class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          title="Volver"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white">
          <img 
            src="/LOGO_GECAP.png" 
            alt="Escudo GECAP" 
            class="w-full h-full object-contain"
          />
        </div>
        <div>
          <h1 class="text-sm sm:text-base font-black tracking-wider uppercase text-white">
            GECAP — GESTIÓN DE CIUDADANOS
          </h1>
          <p class="text-[11px] text-slate-400 font-medium">
            Control, verificación de perfiles y cuentas de usuarios en la plataforma
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button 
          @click="cargarCiudadanos"
          class="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-base font-bold transition-all cursor-pointer"
          title="Actualizar datos"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': cargando }" />
          <span class="hidden sm:inline">Actualizar</span>
        </button>
      </div>
    </header>

    <!-- CUERPO PRINCIPAL -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col space-y-6">
      
      <!-- BARRA DE ACCIÓN Y BUSCADOR -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-none p-4 border-b-2 border-gecap-darkblue">
        <div class="relative w-full sm:w-96">
          <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -transform -translate-y-1/2" />
          <input 
            v-model="busqueda"
            type="text"
            placeholder="Buscar por nombre, documento, correo o teléfono..."
            class="w-full pl-10 pr-4 py-2.5 bg-gecap-darkblue text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gecap-blue transition-all font-medium"
          />
        </div>

        <div class="flex items-center gap-2 text-shadow-gecap-darkblue text-gecap-darkblue font-semibold self-start sm:self-center">
          <UserCheck class="w-4 h-4 text-gecap-darkblue" />
          <span>Total Ciudadanos: <strong class="text-gecap-green">{{ ciudadanos.length }}</strong></span>
        </div>
      </div>

      <!-- ESTADO DE CARGA -->
      <div v-if="cargando" class="flex-1 flex flex-col items-center justify-center py-20">
        <Loader2 class="w-10 h-10 animate-spin text-purple-500 mb-3" />
        <p class="text-sm text-slate-400 font-bold uppercase tracking-wider">Cargando ciudadanos desde base de datos...</p>
      </div>

      <!-- ESTADO VACÍO -->
      <div v-else-if="ciudadanosFiltrados.length === 0" class="flex-1 flex flex-col items-center justify-center py-20 bg-gecap-darkblue border border-slate-800/80 rounded-2xl">
        <Users class="w-12 h-12 text-slate-600 mb-3" />
        <p class="text-sm font-bold text-slate-300">No se encontraron ciudadanos registrados</p>
        <p class="text-sm text-slate-500 mt-1">Verifica los filtros de búsqueda o el estado de la tabla en Supabase.</p>
      </div>

      <!-- TABLA DE CIUDADANOS -->
      <div v-else class="bg-gecap-darkblue border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="text-center bg-gecap-darkblue/80 border-b border-slate-800 text-sm font-black tracking-wider text-slate-400">
                <th class="py-3.5 px-4">Ciudadano</th>
                <th class="py-3.5 px-4">Tipo de Documento</th>
                <th class="py-3.5 px-4">No. de Documento</th>
                <th class="py-3.5 px-4">Correo</th>
                <th class="py-3.5 px-4">Teléfono</th>
                <th class="py-3.5 px-4">Dirección / Sector</th>
                <th class="py-3.5 px-4">Fecha Registro</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 text-sm font-medium text-slate-300">
              <tr 
                v-for="c in ciudadanosFiltrados" 
                :key="c.id"
                class="hover:bg-slate-800/50 transition-colors"
              >
                <!-- Nombre -->
                <td class="text-center py-3.5 px-4">
                  <div class="flex items-center gap-3">
                    <div>
                      <span class="font-bold text-white uppercase block">{{ c.nombre_completo || 'Sin nombre' }}</span>
                    </div>
                  </div>
                </td>

                <!-- Documento -->
                <td class="text-center py-3.5 px-4">
                  <div class="flex flex-col gap-0.5">
                    <span class="items-center text-center gap-1 text-slate-200 font-bold">
                      {{ c.tipo_documento || 'CC' }}
                    </span>
                  </div>
                </td>
                <td class="text-center py-3.5 px-4">
                  <div class="flex flex-col gap-0.5">
                    <span class="inline-flex items-center gap-1 text-slate-200 font-bold">
                      {{ c.numero_documento || 'N/A' }}
                    </span>
                  </div>
                </td>

                <!-- Contacto -->
                <td class="text-center py-3.5 px-4">
                  <div class="flex flex-col items-center gap-1">
                    <span class="inline-flex items-center gap-1.5 text-slate-300">
                      {{ c.email || 'No registrado' }}
                    </span>
                  </div>
                </td>

                <!-- Contacto -->
                <td class="text-center py-3.5 px-4">
                  <div class="flex flex-col items-center gap-1">
                    <span class="inline-flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                      {{ c.telefono || 'Sin teléfono' }}
                    </span>
                  </div>
                </td>

                <!-- Dirección -->
                <td class="text-center py-3.5 px-4">
                  <span class="inline-flex items-center gap-1 text-slate-300 text-xs">
                    <MapPin class="w-3.5 h-3.5 text-red-400 shrink-0" />
                    {{ c.direccion || 'No especificada' }}
                  </span>
                </td>

                <!-- Fecha de creación -->
                <td class="text-center py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                  {{ c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/A' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </main>

    <!-- PIE DE PÁGINA -->
    <footer class="py-4 text-center border-t border-slate-900 bg-gecap-darkblue text-[11px] text-slate-500 font-medium">
      GECAP — Sistema Inteligente de Gestión Estratégica de Cuadrantes y Atención Policial © 2026
    </footer>

  </div>
</template>