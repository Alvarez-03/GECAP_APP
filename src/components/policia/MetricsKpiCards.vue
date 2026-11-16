<!-- name=MetricsKpiCards.vue -->
<script setup>
import { FileText, AlertTriangle, CheckCircle2, BarChart3 } from 'lucide-vue-next'

defineProps({
  totalAlertas: Number,
  alertasPendientes: Number,
  alertasFinalizadas: Number,
  porcentajeEfectividad: Number
})
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
    
    <div class="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
      <div class="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-bl-full pointer-events-none"></div>
      <div class="flex items-center justify-between text-slate-500 mb-2">
        <span class="text-xs font-black uppercase tracking-wider">Total Incidentes</span>
        <FileText class="w-5 h-5 text-blue-600" />
      </div>
      <span class="text-3xl font-black text-slate-900">{{ totalAlertas }}</span>
      <span class="text-xs text-emerald-600 font-semibold mt-1.5">Filtrado activo</span>
    </div>

    <div class="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
      <div class="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-bl-full pointer-events-none"></div>
      <div class="flex items-center justify-between text-slate-500 mb-2">
        <span class="text-xs font-black uppercase tracking-wider">Pendientes</span>
        <AlertTriangle class="w-5 h-5 text-amber-600" />
      </div>
      <span class="text-3xl font-black text-amber-600">{{ alertasPendientes }}</span>
      <span class="text-xs text-amber-600 font-semibold mt-1.5">Requieren despacho</span>
    </div>

    <div class="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
      <div class="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full pointer-events-none"></div>
      <div class="flex items-center justify-between text-slate-500 mb-2">
        <span class="text-xs font-black uppercase tracking-wider">Finalizados</span>
        <CheckCircle2 class="w-5 h-5 text-emerald-600" />
      </div>
      <span class="text-3xl font-black text-emerald-600">{{ alertasFinalizadas }}</span>
      <span class="text-xs text-slate-500 font-semibold mt-1.5">Cierres exitosos</span>
    </div>

    <div class="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden">
      <div class="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-bl-full pointer-events-none"></div>
      <div class="flex items-center justify-between text-slate-500 mb-2">
        <span class="text-xs font-black uppercase tracking-wider">Efectividad</span>
        <BarChart3 class="w-5 h-5 text-red-600" />
      </div>
      <span class="text-3xl font-black text-slate-900">{{ porcentajeEfectividad }}%</span>
      <span class="text-xs text-emerald-600 font-semibold mt-1.5">Tasa de resolución</span>
    </div>

  </div>
</template>