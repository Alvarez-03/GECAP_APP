<script setup>
import { ref, computed, watch } from 'vue'
import { X, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  modelValue: Boolean,
  evidencias: {
    type: Array,
    default: () => []
  },
  codigoSeguimiento: String
})

const emit = defineEmits(['update:modelValue'])

const currentIndex = ref(0)

watch(() => props.modelValue, (val) => {
  if (val) currentIndex.value = 0
})

const evidenciaActual = computed(() => {
  if (props.evidencias.length === 0) return ''
  return props.evidencias[currentIndex.value]
})

const siguienteFoto = () => {
  currentIndex.value = (currentIndex.value + 1) % props.evidencias.length
}

const anteriorFoto = () => {
  currentIndex.value = (currentIndex.value - 1 + props.evidencias.length) % props.evidencias.length
}

const cerrar = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black/90 z-50 flex flex-col justify-between p-4 backdrop-blur-md">
    <div class="flex items-center justify-between text-white py-2">
      <span class="text-xs font-black tracking-widest uppercase bg-white/10 px-3 py-1 rounded-full">
        Foto {{ currentIndex + 1 }} de {{ evidencias.length }} (RADICADO #{{ codigoSeguimiento }})
      </span>
      <button @click="cerrar" class="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer">
        <X class="w-6 h-6" />
      </button>
    </div>

    <div class="relative flex-1 flex items-center justify-center my-2 overflow-hidden">
      <button v-if="evidencias.length > 1" @click="anteriorFoto" class="absolute left-2 z-10 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all cursor-pointer">
        <ChevronLeft class="w-6 h-6" />
      </button>

      <div class="w-full h-full max-h-[70vh] flex items-center justify-center p-1">
        <img :src="evidenciaActual" alt="Evidencia en grande" class="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10" />
      </div>

      <button v-if="evidencias.length > 1" @click="siguienteFoto" class="absolute right-2 z-10 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all cursor-pointer">
        <ChevronRight class="w-6 h-6" />
      </button>
    </div>

    <div v-if="evidencias.length > 1" class="py-2 flex gap-2 overflow-x-auto justify-center max-w-full">
      <button 
        v-for="(foto, idx) in evidencias" 
        :key="idx"
        @click="currentIndex = idx"
        :class="[
          'w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer',
          currentIndex === idx ? 'border-red-600 scale-105' : 'border-white/20 opacity-50'
        ]"
      >
        <img :src="foto" class="w-full h-full object-cover" />
      </button>
    </div>
  </div>
</template>