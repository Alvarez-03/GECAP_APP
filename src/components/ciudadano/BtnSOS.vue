<script setup>
import { Siren } from 'lucide-vue-next'

defineEmits(['activar'])
</script>

<template>
  <div class="w-full bg-white rounded-3xl p-6 shadow-xl border border-slate-100 flex flex-col items-center text-center my-auto">
    <button 
      @click="$emit('activar')"
      class="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-linear-to-b from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-xl shadow-red-600/30 flex flex-col items-center justify-center p-4 transition-all transform active:scale-95 cursor-pointer border-4 border-white my-3 group"
    >
      <Siren class="w-12 h-12 mb-2 animate-pulse text-white" />
      <span class="text-xl sm:text-2xl font-black tracking-wider uppercase leading-tight">
        EMERGENCIA
      </span>
      <span class="text-xs sm:text-sm font-bold tracking-widest px-3 py-1 rounded-full mt-2 uppercase">
        TOCAR AQUÍ
      </span>
    </button>

    <h2 class="text-xl sm:text-2xl font-black text-slate-900 mt-4 mb-2">
      Presiona para reportar
    </h2>

    <p class="text-xs sm:text-sm font-bold text-red-700 max-w-xs leading-snug">
      Envía tu ubicación GPS en tiempo real y alerta a la Policía Nacional de Colombia.
    </p>
  </div>
</template>