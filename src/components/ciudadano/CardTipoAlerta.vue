<script setup>
import { AlertCircle } from 'lucide-vue-next'

defineProps({
  titulo: {
    type: String,
    required: true
  },
  descripcion: {
    type: String,
    required: true
  },
  codigo: {
    type: String,
    required: false
  },
  seleccionado: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['seleccionar'])
</script>

<template>
  <div 
    @click="emit('seleccionar')"
    :class="[
      'flex items-center justify-between w-full p-3 bg-white rounded-2xl shadow-sm border transition-all cursor-pointer select-none',
      seleccionado 
        ? 'border-red-600 ring-2 ring-red-100 shadow-md' 
        : 'border-slate-100 hover:border-slate-300'
    ]"
  >
    <!-- Lado Izquierdo: Icono en caja roja -->
    <div class="flex items-center gap-3.5">
      <!-- Textos: Título (Situación) y Descripción -->
      <div class="flex flex-col">
        <div class="flex items-center gap-2">
          <span class="text-sm font-black tracking-wide text-slate-900 uppercase">
            {{ titulo }}
          </span>
        </div>
        <p class="text-[11px] font-medium text-slate-500 leading-tight mt-0.5 line-clamp-2">
          {{ descripcion }}
        </p>
      </div>
    </div>

    <!-- Lado Derecho: Indicador tipo Radio Button -->
    <div class="pl-3 flex-shrink-0">
      <div 
        :class="[
          'w-5 h-5 rounded-full border flex items-center justify-center transition-colors',
          seleccionado ? 'border-red-600 bg-red-50' : 'border-slate-300 bg-transparent'
        ]"
      >
        <div 
          v-if="seleccionado" 
          class="w-2.5 h-2.5 bg-red-600 rounded-full"
        />
      </div>
    </div>
  </div>
</template>