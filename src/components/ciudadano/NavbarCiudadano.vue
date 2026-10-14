<script setup>
import { Home, Map, FileText, User, Siren } from 'lucide-vue-next'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const esActiva = (path) => route.path === path
const esCrearReporte = () => route.path === '/crearReporte'

const irAInicio = () => router.push('/homeCiudadano')
const irAMapa = () => router.push('/mapa')
const irAHistorial = () => router.push('/historial')
const irAPerfil = () => router.push('/perfil')
const activarEmergencia = () => router.push('/crearReporte')
</script>

<template>
  <nav 
    :class="[
      'bg-gecap-darkblue text-white h-16 px-4 flex items-center relative shrink-0 transition-all',
      esCrearReporte() ? 'justify-between px-8' : 'justify-around'
    ]"
  >
    
    <!-- BOTÓN INICIO -->
    <button 
      @click="irAInicio" 
      :class="[
        'flex flex-col items-center gap-1 cursor-pointer transition-colors',
        esActiva('/homeCiudadano') ? 'text-red-500 hover:text-red-400' : 'text-slate-400 hover:text-white'
      ]"
    >
      <Home class="w-5 h-5" />
      <span class="text-[10px] font-bold tracking-wider">INICIO</span>
    </button>

    <!-- BOTÓN MAPA -->
    <button 
      @click="irAMapa" 
      :class="[
        'flex flex-col items-center gap-1 cursor-pointer transition-colors',
        esActiva('/mapa') ? 'text-red-500 hover:text-red-400' : 'text-slate-400 hover:text-white'
      ]"
    >
      <Map class="w-5 h-5" />
      <span class="text-[10px] font-bold tracking-wider">MAPA</span>
    </button>

    <!-- Espacio central para el botón flotante (Solo se muestra fuera de crearReporte) -->
    <div v-if="!esCrearReporte()" class="w-12"></div>

    <!-- BOTÓN HISTORIAL -->
    <button 
      @click="irAHistorial" 
      :class="[
        'flex flex-col items-center gap-1 cursor-pointer transition-colors',
        esActiva('/historial') ? 'text-red-500 hover:text-red-400' : 'text-slate-400 hover:text-white'
      ]"
    >
      <FileText class="w-5 h-5" />
      <span class="text-[10px] font-bold tracking-wider">HISTORIAL</span>
    </button>

    <!-- BOTÓN PERFIL -->
    <button 
      @click="irAPerfil" 
      :class="[
        'flex flex-col items-center gap-1 cursor-pointer transition-colors',
        esActiva('/perfil') ? 'text-red-500 hover:text-red-400' : 'text-slate-400 hover:text-white'
      ]"
    >
      <User class="w-5 h-5" />
      <span class="text-[10px] font-bold tracking-wider">PERFIL</span>
    </button>

    <!-- Botón flotante central SOS (Se oculta en /crearReporte) -->
    <div v-if="!esCrearReporte()" class="absolute -top-6 left-1/2 transform -translate-x-1/2">
      <button 
        @click="activarEmergencia"
        class="w-16 h-16 rounded-full bg-red-700 hover:bg-red-800 text-white shadow-lg border-2 border-white flex flex-col items-center justify-center p-1 cursor-pointer transition-transform active:scale-95"
      >
        <Siren class="w-10 h-10 text-white" />
      </button>
    </div>
  </nav>
</template>