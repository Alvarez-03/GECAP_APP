<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { 
  User, 
  Video, 
  FileText, 
  Send, 
  Minimize2, 
  ChevronDown,
  GripHorizontal 
} from 'lucide-vue-next'

const props = defineProps({
  alerta: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['cerrar', 'actualizarEstado', 'ingresarCodigo', 'verEvidencia', 'reportarCod'])

// Estado local para el selector de estado inicializado directamente desde la base de datos
const estadoSeleccionado = ref(props.alerta.estado_actual || 'PENDIENTE')

// Lógica para hacer la ventana arrastrable (Draggable)
const posicion = ref({ x: 0, y: 0 })
const arrastrando = ref(false)
const inicioDrag = ref({ x: 0, y: 0 })

const iniciarArrastre = (e) => {
  arrastrando.value = true
  inicioDrag.value = {
    x: e.clientX - posicion.value.x,
    y: e.clientY - posicion.value.y
  }
  window.addEventListener('mousemove', arrastrar)
  window.addEventListener('mouseup', detenerArrastre)
}

const arrastrar = (e) => {
  if (!arrastrando.value) return
  posicion.value = {
    x: e.clientX - inicioDrag.value.x,
    y: e.clientY - inicioDrag.value.y
  }
}

const detenerArrastre = () => {
  arrastrando.value = false
  window.removeEventListener('mousemove', arrastrar)
  window.removeEventListener('mouseup', detenerArrastre)
}

onUnmounted(() => {
  detenerArrastre()
})

watch(() => props.alerta, (nuevaAlerta) => {
  if (nuevaAlerta) {
    // Sincroniza el estado actual que viene de la BD cada vez que cambia o se selecciona otra alerta
    estadoSeleccionado.value = nuevaAlerta.estado_actual || 'PENDIENTE'
    posicion.value = { x: 0, y: 0 }
  }
}, { immediate: true })

const handleEnviarReporte = () => {
  emit('actualizarEstado', {
    id: props.alerta.id,
    nuevoEstado: estadoSeleccionado.value
  })
}
</script>

<template>
  <div 
    class="w-96 bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 font-sans overflow-hidden text-slate-800 select-none animate-in fade-in zoom-in-95 duration-200 z-50"
    :style="{ transform: `translate3d(${posicion.x}px, ${posicion.y}px, 0)` }"
  >
    
    <!-- ENCABEZADO CON CONTROL DE ARRASTRE -->
    <div 
      @mousedown="iniciarArrastre"
      class="bg-white p-3 border-b-2 border-slate-900 flex items-center justify-between cursor-grab active:cursor-grabbing hover:bg-slate-50 transition"
      title="Mantén presionado para mover el panel"
    >
      <div class="flex items-center gap-2 pointer-events-none">
        <GripHorizontal class="w-4 h-4 text-slate-400 shrink-0" />
        <div>
          <h3 class="text-[15px] font-black text-red-700 tracking-wider uppercase leading-tight">
            {{ alerta.tipo_alerta || 'ALERTA DE HURTO' }}
          </h3>
          <p class="text-[15px] font-black text-red-800 tracking-wide">
            RADICADO #{{ alerta.codigo_seguimiento || '****' }}
          </p>
        </div>
      </div>

      <button 
        @click.stop="$emit('cerrar')" 
        class="text-slate-800 hover:text-red-600 transition p-1 cursor-pointer"
        title="Cerrar Popup"
      >
        <Minimize2 class="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>

    <!-- CUERPO DE LA VENTANA -->
    <div class="p-3 space-y-2.5">
      
      <!-- FILA SUPERIOR: REPORTANTE Y ACCIONES -->
      <div class="">
        <!-- Tarjeta Reportante -->
        <div class="col-span-7 bg-slate-200/90 p-2 rounded-xl flex items-center gap-2 ">
          <div class="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center shrink-0">
            <User class="w-8 h-8" />
          </div>
          <div class="min-w-0">
            <p class="text-[12px] font-black text-red-700 uppercase tracking-wider">REPORTANTE</p>
            <p class="text-[15px] font-bold text-slate-900 truncate leading-tight uppercase">
              {{ alerta.nombre_ciudadano || 'JUAN GUILLERMO CUADRADO' }}
            </p>
            <p class="text-[12px] font-semibold text-slate-600">
              CC: {{ alerta.ciudadano_documento || '1106388495' }}
            </p>
          </div>
        </div>
      </div>
      <!-- Botones de Acción Derecha -->
      <div class="grid grid-cols-2 gap-1.5">
          <button 
            @click="$emit('verEvidencia', alerta)"
            class="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl p-1.5 flex items-center justify-center gap-1.5 border border-slate-300 transition cursor-pointer"
          >
            <Video class="w-6 h-6 shrink-0 fill-slate-800" />
            <span class="text-[12px] font-black uppercase tracking-tight leading-tight">VER EVIDENCIA</span>
          </button>

          <button 
            @click="$emit('ingresarCodigo', alerta)"
            class="flex-1 bg-red-700 hover:bg-red-800 text-white rounded-xl p-1.5 flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <FileText class="w-6 h-6 shrink-0" />
            <span class="text-[12px] font-black uppercase tracking-tight leading-tight">INGRESAR 5.03</span>
          </button>
        </div>

      <!-- INFORMACIÓN REPORTADA -->
      <div class="bg-slate-200/90 p-2.5 rounded-xl ">
        <p class="text-[12px] font-black text-red-700 uppercase tracking-wider text-center mb-1">
          INFORMACIÓN REPORTADA
        </p>
        <p class="text-[12px] font-bold text-slate-800 uppercase">
          UBICACION: <span class="font-normal text-slate-700">{{ alerta.latitud ? `${alerta.latitud}, ${alerta.longitud}` : '4.230, -76.120' }}</span>
        </p>
        <p class="text-[12px] font-bold text-slate-800 uppercase leading-snug mt-0.5">
          DESCRIPCIÓN: <span class="font-normal text-slate-700 uppercase">{{ alerta.descripcion || 'DOS HOMBRES EN MOTO HURTARON N-MAX NEGRA DE PLACAS HEP-361 BARRIO EL JARDIN' }}</span>
        </p>
      </div>

      <!-- UNIDAD ASIGNADA -->
      <div class="bg-slate-200/90 p-2 rounded-xl text-center ">
        <p class="text-[12px] font-black text-red-700 uppercase tracking-wider">UNIDAD</p>
        <p class="text-xs font-black text-slate-900 tracking-wide mt-0.5 uppercase">
          {{ alerta.unidad_cuadrante || 'P-010' }}
        </p>
      </div>

      <!-- SELECTOR DE ESTADO -->
      <div class="bg-slate-200/90 p-2 rounded-xl ">
        <p class="text-[12px] font-black text-red-700 uppercase tracking-wider text-center mb-1">ESTADO</p>
        <div class="relative">
          <select 
            v-model="estadoSeleccionado"
            class="w-full bg-white text-slate-900 text-[12px] font-bold rounded-xl px-3 py-1.5 pr-7 appearance-none shadow-sm border border-slate-300 focus:outline-none cursor-pointer uppercase"
          >
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="5.14 - DESPLAZANDOSE">5.14 - DESPLAZANDOSE</option>
            <option value="5.03 - EN SITIO (INVESTIGACIÓN)">5.03 - EN SITIO</option>
            <option value="5.50 - PROCEDIMIENTO FINALIZADO">5.50 - PROCEDIMIENTO FINALIZADO</option>
          </select>
          <ChevronDown class="w-4 h-4 text-slate-700 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none stroke-[3]" />
        </div>
      </div>

      <!-- BOTONES DE ACCIÓN INFERIOR -->
      <div class="space-y-1.5 pt-1">
        <button 
          @click="handleEnviarReporte"
          class="w-full bg-slate-950 hover:bg-slate-900 text-white rounded-xl py-2 px-3 flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
        >
          <Send class="w-4 h-4 fill-white shrink-0" />
          <span class="text-xs font-black tracking-wider uppercase">ACTUALIZAR REPORTE</span>
        </button>

        <button 
          @click="$emit('reportarCod', alerta)"
          class="w-full bg-white hover:bg-red-50 text-red-700 border-2 border-red-700 rounded-xl py-1.5 px-3 flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
        >
          <Send class="w-4 h-4 fill-red-700 text-red-700 shrink-0" />
          <span class="text-xs font-black tracking-wider uppercase">REPORTAR COD(999)</span>
        </button>
      </div>

    </div>
  </div>
</template>