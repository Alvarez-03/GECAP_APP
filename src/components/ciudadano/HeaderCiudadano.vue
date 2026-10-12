<script setup>
import { LogOut, BellRing } from 'lucide-vue-next'

defineProps({
  nombre: String
})

defineEmits(['salir'])
</script>

<template>
  <header class="bg-gecap-darkblue text-white py-3 px-4 flex items-center justify-between shadow-md shrink-0">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-full bg-slate-900 p-0.5 flex items-center justify-center overflow-hidden">
        <img 
          src="/LOGO_GECAP.png" 
          alt="Escudo GECAP" 
          class="w-full h-full object-contain"
        />
      </div>
      <span class="text-sm font-black tracking-wider uppercase">GECAP</span>
    </div>
    
    <div class="flex items-center gap-3">
      <button @click="$emit('salir')" class="text-gecap-red hover:text-white transition cursor-pointer" title="Cerrar Sesión">
        <LogOut class="w-5 h-5" />
      </button>
    </div>
  </header>
</template>