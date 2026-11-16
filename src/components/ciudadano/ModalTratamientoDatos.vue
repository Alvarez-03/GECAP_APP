<script setup>
import { ShieldCheck, X, Lock } from 'lucide-vue-next'

defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  requiereAceptacion: {
    type: Boolean,
    default: false // Si es true muestra botón de "Aceptar y Continuar", si es false solo "Cerrar"
  }
})

const emit = defineEmits(['close', 'aceptar'])
</script>

<template>
  <transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden animate-scale-up">
        
        <!-- ENCABEZADO DEL MODAL -->
        <div class="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center text-red-500">
              <ShieldCheck class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-xs font-black tracking-wider uppercase">Tratamiento de Datos</h3>
              <p class="text-[10px] text-slate-400 font-medium">Política de Privacidad y Habeas Data</p>
            </div>
          </div>
          <button 
            @click="emit('close')"
            class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- CUERPO DE TEXTO LEGAL (SCROLLABLE) -->
        <div class="p-5 overflow-y-auto space-y-4 text-slate-700 text-xs leading-relaxed">
          <div class="flex items-start gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <Lock class="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p class="text-[11px] font-medium text-slate-600">
              En cumplimiento de la ley de protección de datos, tus información personal y de ubicación se gestionan bajo estrictos estándares de seguridad.
            </p>
          </div>

          <div>
            <h4 class="font-bold text-slate-900 mb-1 uppercase text-[11px]">1. Finalidad de la recolección</h4>
            <p>
              Los datos personales (nombre, número de documento y coordenadas GPS) recolectados a través de la plataforma GECAP serán utilizados exclusivamente para la gestión, geolocalización y atención oportuna de alertas de seguridad ciudadana por parte de las autoridades competentes.
            </p>
          </div>

          <div>
            <h4 class="font-bold text-slate-900 mb-1 uppercase text-[11px]">2. Autorización del usuario</h4>
            <p>
              El registro y envío de alertas implica la aceptación expresa y voluntaria para que el sistema almacene y procese sus datos con el único propósito operativo de salvaguardar la seguridad ciudadana.
            </p>
          </div>

          <div>
            <h4 class="font-bold text-slate-900 mb-1 uppercase text-[11px]">3. Derechos del titular</h4>
            <p>
              Como ciudadano, usted tiene derecho a conocer, actualizar y rectificar sus datos personales en cualquier momento a través de la configuración de su perfil en la plataforma.
            </p>
          </div>

          <div>
            <h4 class="font-bold text-slate-900 mb-1 uppercase text-[11px]">4. Confidencialidad</h4>
            <p>
              GECAP garantiza que la información suministrada no será cedida, comercializada ni compartida con terceros ajenos a las labores de control y seguridad institucional.
            </p>
          </div>
        </div>

        <!-- PIE DE PÁGINA / BOTONES -->
        <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
          <button 
            @click="emit('close')"
            class="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          
          <button 
            v-if="requiereAceptacion"
            @click="emit('aceptar')"
            class="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md"
          >
            Aceptar y Continuar
          </button>
        </div>

      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>