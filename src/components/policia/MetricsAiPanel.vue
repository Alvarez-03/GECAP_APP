<!-- name=MetricsAiPanel.vue -->
<script setup>
import { Brain, Trash2, Loader2, FileText, ChevronRight } from 'lucide-vue-next'

defineProps({
  colapsado: Boolean,
  isLoading: Boolean,
  error: String,
  generatedReport: String,
  reporteHtmlFormateado: String,
  cargandoDatos: Boolean
})

const emit = defineEmits(['update:colapsado', 'limpiar', 'generar'])
</script>

<template>
  <!-- PANEL LATERAL DERECHO -->
  <div v-if="!colapsado" class="w-96 flex flex-col bg-white border-l border-slate-200 shrink-0 shadow-sm h-full z-20">
    
    <div class="bg-slate-900 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2.5">
        <Brain class="w-5 h-5 text-white animate-pulse" />
        <h2 class="text-sm font-black uppercase tracking-wider text-white">Informe Ejecutivo Gemini</h2>
      </div>
      
      <div class="flex items-center gap-2">
        <button 
          v-if="generatedReport" 
          @click="emit('limpiar')"
          class="text-xs text-slate-300 hover:text-red-400 flex items-center gap-1 transition cursor-pointer p-1"
          title="Limpiar informe"
        >
          <Trash2 class="w-4 h-4" />
        </button>
        <button 
          @click="emit('generar')"
          :disabled="isLoading || cargandoDatos"
          class="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow transition cursor-pointer"
        >
          <Brain class="w-4 h-4 text-white" />
          {{ isLoading ? 'Analizando...' : 'Generar' }}
        </button>

        <button 
          @click="emit('update:colapsado', true)"
          class="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer ml-1"
          title="Minimizar panel de IA"
        >
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>
    </div>

    <div class="flex-1 p-6 overflow-y-auto bg-slate-50/50 custom-scrollbar text-sm">
      
      <div v-if="isLoading" class="h-full flex flex-col items-center justify-center space-y-4 py-24">
        <Loader2 class="w-10 h-10 text-red-600 animate-spin" />
        <p class="text-xs font-bold text-slate-600 uppercase tracking-widest animate-pulse text-center">Analizando métricas y redactando informe...</p>
      </div>

      <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 p-5 rounded-xl text-sm space-y-2">
        <p class="font-black uppercase">Error al generar reporte:</p>
        <p>{{ error }}</p>
      </div>

      <div v-else-if="!generatedReport" class="h-full flex flex-col items-center justify-center text-center px-4 py-24">
        <FileText class="w-12 h-12 text-slate-300 mb-3" />
        <h3 class="text-sm font-bold text-slate-700">Listo para generar diagnóstico</h3>
        <p class="text-xs text-slate-500 mt-1">Haz clic en <strong class="text-slate-700">"Generar"</strong> para resumir la carga operativa de Tuluá en tiempo real.</p>
      </div>

      <div 
        v-else 
        class="prose prose-sm max-w-none text-slate-700 space-y-4 font-sans leading-relaxed"
        v-html="reporteHtmlFormateado"
      ></div>

    </div>

  </div>
</template>s