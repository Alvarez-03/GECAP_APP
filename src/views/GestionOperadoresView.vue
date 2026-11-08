<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Shield, Search, ArrowLeft, RefreshCw, Mail, UserPlus, Award, Radio, UserCheck, Loader2, Pencil } from 'lucide-vue-next'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import { 
  obtenerOperadoresService, 
  obtenerCuadrantesService, 
  registrarOperadorService, 
  actualizarOperadorService 
} from '../services/operadorService'
import OperadorModal from '../components/policia/OperadorModal.vue'

const router = useRouter()
const operadores = ref([])
const cargando = ref(true)
const busqueda = ref('')
const cuadrantesLista = ref([])

// Estados del Modal
const mostrarModal = ref(false)
const guardando = ref(false)
const operadorAEditar = ref(null) // null = creando, objeto = editando

// Cargar datos iniciales
const cargarDatos = async () => {
  try {
    cargando.value = true
    const [cuadrantesData, operadoresData] = await Promise.all([
      obtenerCuadrantesService(),
      obtenerOperadoresService()
    ])
    cuadrantesLista.value = cuadrantesData
    operadores.value = operadoresData
  } catch (error) {
    console.error('Error al cargar datos:', error)
    toast.error('No se pudo cargar la información del servidor.', { position: 'top-center' })
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  cargarDatos()
})

// Obtener nombre amigable del cuadrante
const obtenerNombreCuadrante = (idCuadrante) => {
  if (!idCuadrante) return 'Sin asignar'
  const cuadrante = cuadrantesLista.value.find(c => c.id === idCuadrante)
  return cuadrante ? (cuadrante.nombre || cuadrante.codigo || `Cuadrante (${idCuadrante.slice(0, 6)})`) : 'Cuadrante no encontrado'
}

// Abrir modal de Registro
const abrirModalRegistro = () => {
  operadorAEditar.value = null
  mostrarModal.value = true
}

// Abrir modal de Edición
const abrirModalEdicion = (op) => {
  operadorAEditar.value = op
  mostrarModal.value = true
}

// Guardar (Crear o Editar)
const manejarGuardado = async (formData) => {
  if (!formData.nombre_completo || !formData.placa_identificacion || !formData.email) {
    toast.warning('Por favor completa los campos obligatorios (Nombre, Placa, Email).', { position: 'top-center' })
    return
  }

  try {
    guardando.value = true

    // Resolver base policial (estación) asociada automáticamente al cuadrante elegido
    const cuadranteSeleccionado = cuadrantesLista.value.find(c => c.id === formData.id_cuadrante)
    const basePolicialId = cuadranteSeleccionado?.base_policial_id || null

    if (operadorAEditar.value) {
      // Editar
      await actualizarOperadorService(operadorAEditar.value.id, formData, basePolicialId)
      toast.success('¡Operador actualizado exitosamente!', { position: 'top-center' })
    } else {
      // Registrar
      if (!formData.password) {
        toast.warning('La contraseña es obligatoria para nuevos operadores.', { position: 'top-center' })
        guardando.value = false
        return
      }
      await registrarOperadorService(formData, basePolicialId)
      toast.success('¡Operador registrado exitosamente!', { position: 'top-center' })
    }

    mostrarModal.value = false
    await cargarDatos()
  } catch (error) {
    console.error('Error en operación:', error)
    toast.error(`Error: ${error.message || 'Error desconocido'}`, { position: 'top-center' })
  } finally {
    guardando.value = false
  }
}

// Filtrar operadores en tiempo real
const operadoresFiltrados = computed(() => {
  if (!busqueda.value.trim()) return operadores.value
  const query = busqueda.value.toLowerCase()
  return operadores.value.filter(op => 
    (op.nombre_completo && op.nombre_completo.toLowerCase().includes(query)) ||
    (op.placa_identificacion && op.placa_identificacion.toLowerCase().includes(query)) ||
    (op.email && op.email.toLowerCase().includes(query)) ||
    (op.rango && op.rango.toLowerCase().includes(query))
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
        <button @click="volverAlDashboard" class="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer" title="Volver">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-white">
          <img src="/LOGO_GECAP.png" alt="Escudo GECAP" class="w-full h-full object-contain" />
        </div>
        <div>
          <h1 class="text-sm sm:text-base font-black tracking-wider uppercase text-white">
            GECAP — GESTIÓN DE OPERADORES
          </h1>
          <p class="text-[11px] text-slate-400 font-medium">
            Control y supervisión de personal adscrito a cuadrantes policiales
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button @click="cargarDatos" class="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-base font-bold transition-all cursor-pointer" title="Actualizar datos">
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
          <input v-model="busqueda" type="text" placeholder="Buscar por nombre, placa, correo o rango..." class="w-full pl-10 pr-4 py-2.5 bg-gecap-darkblue text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-gecap-blue transition-all font-medium" />
        </div>

        <div class="flex flex-row gap-3">
          <button @click="abrirModalRegistro" class="flex items-center gap-2 bg-gecap-blue hover:bg-gecap-blue/80 text-white px-4 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer">
            <UserPlus class="w-4 h-4" />
            <span>Registrar Operador</span>
          </button>

          <div class="flex items-center gap-2 text-shadow-gecap-darkblue text-gecap-darkblue font-semibold self-start sm:self-center">
            <UserCheck class="w-4 h-4 text-gecap-darkblue" />
            <span>Total Registrados: <strong class="text-gecap-green">{{ operadores.length }}</strong></span>
          </div>
        </div>
      </div>

      <!-- ESTADO DE CARGA -->
      <div v-if="cargando" class="flex-1 flex flex-col items-center justify-center py-20">
        <Loader2 class="w-10 h-10 animate-spin text-purple-500 mb-3" />
        <p class="text-sm text-slate-400 font-bold uppercase tracking-wider">Cargando operadores desde base de datos...</p>
      </div>

      <!-- ESTADO VACÍO -->
      <div v-else-if="operadoresFiltrados.length === 0" class="flex-1 flex flex-col items-center justify-center py-20 bg-gecap-darkblue border border-slate-800/80 rounded-2xl">
        <Shield class="w-12 h-12 text-slate-600 mb-3" />
        <p class="text-sm font-bold text-slate-300">No se encontraron operadores registrados</p>
        <p class="text-sm text-slate-500 mt-1">Verifica los filtros de búsqueda o el estado de la tabla en Supabase.</p>
      </div>

      <!-- TABLA DE OPERADORES -->
      <div v-else class="bg-gecap-darkblue border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gecap-darkblue/80 border-b border-slate-800 text-sm font-black tracking-wider text-slate-400">
                <th class="py-3.5 px-4">Nombre Usuario</th>
                <th class="py-3.5 px-4">Placa y Rango</th>
                <th class="py-3.5 px-4">Correo Institucional</th>
                <th class="py-3.5 px-4">Rol del Sistema</th>
                <th class="py-3.5 px-4">Cuadrante Asignado</th>
                <th class="py-3.5 px-4">Fecha Registro</th>
                <th class="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800/60 text-sm font-medium text-slate-300">
              <tr v-for="op in operadoresFiltrados" :key="op.id" class="hover:bg-slate-800/50 transition-colors">
                
                <td class="py-3.5 px-4">
                  <span class="font-bold text-white uppercase block">{{ op.nombre_completo || 'Sin nombre' }}</span>                 
                </td>

                <td class="py-3.5 px-4">
                  <div class="flex flex-col gap-0.5">
                    <span class="inline-flex items-center gap-1 text-slate-200 font-bold">
                      <Award class="w-3.5 h-3.5 text-gecap-green shrink-0" />
                      Rango: {{ op.rango || 'Sin rango' }}
                    </span>
                    <span class="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400">
                      <Shield class="w-3 h-3 text-purple-400 shrink-0" />
                      Placa: {{ op.placa_identificacion || 'N/A' }}
                    </span>
                  </div>
                </td>

                <td class="py-3.5 px-4">
                  <span class="inline-flex items-center gap-1.5 text-slate-300">
                    <Mail class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {{ op.email || 'No registrado' }}
                  </span>
                </td>

                <td class="py-3.5 px-4">
                  <span class="px-2.5 py-1 rounded-full text-sm font-black uppercase tracking-wider bg-gecap-blue/10 text-gecap-blue border border-gecap-blue/30 inline-block">
                    {{ op.rol || 'OPERADOR' }}
                  </span>
                </td>

                <td class="py-3.5 px-4">
                  <span class="inline-flex items-center gap-1 text-xs text-emerald-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-semibold">
                    <Radio class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {{ obtenerNombreCuadrante(op.id_cuadrante) }}
                  </span>
                </td>

                <td class="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                  {{ op.created_at ? new Date(op.created_at).toLocaleDateString() : 'N/A' }}
                </td>

                <td class="py-3.5 px-4 text-center">
                  <button @click="abrirModalEdicion(op)" class="p-2 bg-gecap-blue/20 hover:bg-gecap-blue text-white rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center shadow" title="Editar Operador">
                    <Pencil class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </main>

    <!-- COMPONENTE MODAL MODULARIZADO -->
    <OperadorModal 
      v-model="mostrarModal"
      :operadorAEditar="operadorAEditar"
      :cuadrantesLista="cuadrantesLista"
      :guardando="guardando"
      @guardar="manejarGuardado"
    />

    <!-- PIE DE PÁGINA -->
    <footer class="py-4 text-center border-t border-slate-900 bg-gecap-darkblue text-[11px] text-slate-500 font-medium">
      GECAP — Sistema Inteligente de Gestión Estratégica de Cuadrantes y Atención Policial © 2026
    </footer>

  </div>
</template>