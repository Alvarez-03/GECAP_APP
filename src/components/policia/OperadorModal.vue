<script setup>
import { ref, watch } from 'vue'
import { UserPlus, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  modelValue: Boolean,
  operadorAEditar: Object,
  cuadrantesLista: Array,
  guardando: Boolean
})

const emit = defineEmits(['update:modelValue', 'guardar'])

// JSON con los rangos oficiales de la Policía Nacional de Colombia
const rangosPoliciales = {
  "Oficiales - Generales": ["General", "Mayor General", "Brigadier General"],
  "Oficiales - Superiores": ["Coronel", "Teniente Coronel", "Mayor"],
  "Oficiales - Subalternos": ["Capitán", "Teniente", "Subteniente"],
  "Nivel Ejecutivo": ["Comisario", "Subcomisario", "Intendente Jefe", "Intendente", "Subintendente", "Patrullero"],
  "Categoría Patrulleros de Policía": ["Patrullero de Policía"],
  "Suboficiales (En Extinción)": ["Sargento Mayor", "Sargento Primero", "Sargento Viceprimero", "Sargento Segundo", "Cabo Primero", "Cabo Segundo"],
  "Agentes (En Extinción)": ["Agente del Cuerpo Profesional", "Agente del Cuerpo Profesional Especial"],
  "Personal en Formación": ["Alférez", "Cadete", "Estudiante"],
  "Servicio Militar": ["Auxiliar de Policía"]
}

const form = ref({
  nombre_completo: '',
  placa_identificacion: '',
  rango: '',
  rol: 'OPERADOR',
  email: '',
  password: '',
  id_cuadrante: ''
})

// Sincronizar formulario cuando se abre para editar o registrar
watch(() => props.operadorAEditar, (nuevoVal) => {
  if (nuevoVal) {
    form.value = { ...nuevoVal, password: '' }
  } else {
    form.value = {
      nombre_completo: '',
      placa_identificacion: '',
      rango: '',
      rol: 'OPERADOR',
      email: '',
      password: '',
      id_cuadrante: ''
    }
  }
}, { immediate: true })

const cerrar = () => {
  emit('update:modelValue', false)
}

const enviar = () => {
  emit('guardar', form.value)
}
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
    <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Cabecera -->
      <div class="p-4 bg-gecap-darkblue border-b border-gecap-darkblue flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-gecap-blue/20 border border-gecap-blue/30 text-white flex items-center justify-center">
            <UserPlus class="w-4 h-4" />
          </div>
          <h3 class="text-sm font-black uppercase tracking-wider text-white">
            {{ operadorAEditar ? 'Editar Operador' : 'Registrar Nuevo Operador' }}
          </h3>
        </div>
      </div>

      <!-- Formulario con Scroll -->
      <div class="p-6 space-y-4 overflow-y-auto flex-1">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div class="sm:col-span-2 space-y-1.5">
            <label class="text-base font-black tracking-wider text-gecap-darkblue">Nombre Completo *</label>
            <input v-model="form.nombre_completo" type="text" placeholder="Ej: Teniente Carlos Pérez" class="w-full px-3.5 py-2.5 bg-white border-2 border-gecap-blue rounded-xl text-base text-gecap-darkblue placeholder:text-gecap-darkblue focus:outline-none focus:ring-2 focus:ring-gecap-blue" />
          </div>

          <div class="space-y-1.5">
            <label class="text-base font-black tracking-wider text-gecap-darkblue">Placa de Identificación *</label>
            <input v-model="form.placa_identificacion" type="text" placeholder="Ej: PL-92812" class="w-full px-3.5 py-2.5 bg-white border-2 border-gecap-blue rounded-xl text-base text-gecap-darkblue placeholder:text-gecap-darkblue focus:outline-none focus:ring-2 focus:ring-gecap-blue" />
          </div>

          <div class="space-y-1.5">
            <label class="text-base font-black tracking-wider text-gecap-darkblue">Rango Policial</label>
            <select v-model="form.rango" class="w-full px-3.5 py-2.5 bg-white border-2 border-gecap-blue rounded-xl text-base text-gecap-darkblue focus:outline-none focus:ring-2 focus:ring-gecap-blue">
              <option value="" disabled>Selecciona un rango...</option>
              <optgroup v-for="(rangos, categoria) in rangosPoliciales" :key="categoria" :label="categoria">
                <option v-for="rango in rangos" :key="rango" :value="rango">{{ rango }}</option>
              </optgroup>
            </select>
          </div>

          <div class="sm:col-span-2 space-y-1.5">
            <label class="text-base font-black tracking-wider text-gecap-darkblue">Correo Electrónico *</label>
            <input v-model="form.email" type="email" placeholder="Ej: operador.tulua@policia.gov.co" class="w-full px-3.5 py-2.5 bg-white border-2 border-gecap-blue rounded-xl text-base text-gecap-darkblue focus:outline-none focus:ring-2 focus:ring-gecap-blue" />
          </div>

          <div class="sm:col-span-2 space-y-1.5">
            <label class="text-base font-black tracking-wider text-gecap-darkblue">
              Contraseña de Acceso {{ operadorAEditar ? '(Opcional)' : '*' }}
            </label>
            <input v-model="form.password" type="password" :placeholder="operadorAEditar ? 'Opcional' : 'Mínimo 6 caracteres'" class="w-full px-3.5 py-2.5 bg-white border-2 border-gecap-blue rounded-xl text-base text-gecap-darkblue focus:outline-none focus:ring-2 focus:ring-gecap-blue" />
          </div>

          <div class="space-y-1.5">
            <label class="text-base font-black tracking-wider text-gecap-darkblue">Rol en el Sistema</label>
            <select v-model="form.rol" class="w-full px-3.5 py-2.5 bg-white border-2 border-gecap-blue rounded-xl text-base text-gecap-darkblue focus:outline-none focus:ring-2 focus:ring-gecap-blue">
              <option value="OPERADOR">OPERADOR</option>
              <option value="SUPERVISOR">SUPERVISOR</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          <div class="space-y-1.5 sm:col-span-2">
            <label class="text-base font-black tracking-wider text-gecap-darkblue">Asignar Cuadrante (La estación se asignará automáticamente)</label>
            <select v-model="form.id_cuadrante" class="w-full px-3.5 py-2.5 bg-white border-2 border-gecap-blue rounded-xl text-base text-gecap-darkblue focus:outline-none focus:ring-2 focus:ring-gecap-blue"> 
              <option value="" disabled>Selecciona un cuadrante...</option>
              <option v-for="c in cuadrantesLista" :key="c.id" :value="c.id">
                {{ c.nombre || c.codigo || `Cuadrante (${c.id.slice(0, 6)})` }}
              </option>
            </select>
          </div>

        </div>
      </div>

      <!-- Pie del modal -->
      <div class="p-4 bg-gecap-darkblue border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
        <button @click="cerrar" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-base font-bold transition-colors cursor-pointer">
          Cancelar
        </button>
        <button @click="enviar" :disabled="guardando" class="px-5 py-2 bg-gecap-blue hover:bg-gecap-blue/80 text-white rounded-xl text-base font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50">
          <Loader2 v-if="guardando" class="w-4 h-4 animate-spin" />
          {{ guardando ? 'Guardando...' : (operadorAEditar ? 'Actualizar Operador' : 'Guardar Operador') }}
        </button>
      </div>

    </div>
  </div>
</template>