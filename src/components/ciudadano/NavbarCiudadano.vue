<script setup>
import { Home, Map, FileText, User, AlertTriangle } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()

const irAInicio = () => router.push('/dashboard')
const irAMapa = () => router.push('/mapa')
const irAHistorial = () => router.push('/historial')
const irAPerfil = () => router.push('/perfil')
const activarEmergencia = () => router.push('/crear-alerta')
</script>

<template>
  <nav class="bg-gecap-darkblue text-white h-16 px-4 flex items-center justify-around relative shrink-0">
    <button @click="irAInicio" class="flex flex-col items-center gap-1 text-red-500 hover:text-red-400 cursor-pointer">
      <Home class="w-5 h-5" />
      <span class="text-[10px] font-bold tracking-wider">INICIO</span>
    </button>

    <button @click="irAMapa" class="flex flex-col items-center gap-1 text-slate-400 hover:text-white cursor-pointer">
      <Map class="w-5 h-5" />
      <span class="text-[10px] font-bold tracking-wider">MAPA</span>
    </button>

    <div class="w-12"></div>

    <button @click="irAHistorial" class="flex flex-col items-center gap-1 text-slate-400 hover:text-white cursor-pointer">
      <FileText class="w-5 h-5" />
      <span class="text-[10px] font-bold tracking-wider">HISTORIAL</span>
    </button>

    <button @click="irAPerfil" class="flex flex-col items-center gap-1 text-slate-400 hover:text-white cursor-pointer">
      <User class="w-5 h-5" />
      <span class="text-[10px] font-bold tracking-wider">PERFIL</span>
    </button>

    <!-- Botón flotante central SOS -->
    <div class="absolute -top-6 left-1/2 transform -translate-x-1/2">
      <button 
        @click="activarEmergencia"
        class="w-14 h-14 rounded-full bg-red-700 hover:bg-red-800 text-white shadow-lg border-2 border-white flex flex-col items-center justify-center p-1 cursor-pointer transition-transform active:scale-95"
      >
        <AlertTriangle class="w-5 h-5 text-white" />
        <span class="text-[7px] font-black uppercase leading-none mt-0.5">SOS</span>
      </button>
    </div>
  </nav>
</template>