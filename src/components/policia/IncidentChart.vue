<script setup>
import { computed } from 'prop-types';
import { Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale
} from 'chart.js';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);

// Recibir las métricas como props desde tu vista principal o store de Pinia
const props = defineProps({
  chartData: {
    type: Object,
    required: true,
    // Ejemplo esperado: { labels: ['Hurto', 'Riñas', 'Vandalismo', 'Tránsito'], datasets: [...] }
  }
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 12,
        font: {
          family: 'Inter, sans-serif',
          size: 12
        }
      }
    }
  }
};
</script>

<template>
  <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
        Incidencias por Categoría
      </h3>
      <span class="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full font-medium">
        Tiempo Real
      </span>
    </div>
    
    <!-- Contenedor con altura controlada para el canvas -->
    <div class="relative h-64 w-full">
      <Doughnut :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>