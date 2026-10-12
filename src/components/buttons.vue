<script setup>
import { computed } from 'vue'
import { LogIn, LogOut, UserPlus } from 'lucide-vue-next'

const props = defineProps({
  // 'login' | 'logout' | 'custom'
  type: {
    type: String,
    default: 'custom'
  },
  text: {
    type: String,
    default: ''
  },
  icon: {
    type: Object,
    default: null
  },
  // 'primary' | 'secondary' | 'danger' | 'outline'
  variant: {
    type: String,
    default: 'primary'
  },
  to: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const handleClick = (event) => {
  if (!props.disabled) {
    emit('click', event)
  }
}

const buttonStyles = computed(() => {
  const base = "w-full md:w-auto font-bold py-3 px-5 rounded-xl shadow-xs transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2 text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"

  if (props.type === 'login') {
    return `${base} bg-white hover:bg-slate-100 border border-slate-300 text-slate-800`
  }
  
  if (props.type === 'logout') {
    return `${base} bg-red-50 hover:bg-red-100 border border-red-200 text-red-600`
  }

  if (props.type === 'register') {
    return `${base} bg-gecap-darkblue hover:bg-gecap-darkblue/90 text-white shadow-md`
  }

  switch (props.variant) {
    case 'primary':
      return `${base} bg-gecap-darkblue hover:bg-gecap-darkblue/90 text-white shadow-md`
    case 'danger':
      return `${base} bg-gecap-red hover:bg-red-700 text-white shadow-md`
    case 'outline':
      return `${base} bg-transparent hover:bg-slate-100 border border-slate-300 text-slate-700`
    case 'secondary':
    default:
      return `${base} bg-slate-200 hover:bg-slate-300 text-slate-800`
  }
})
</script>

<template>
  <component
    :is="to ? 'router-link' : 'button'"
    :to="to"
    :class="buttonStyles"
    :disabled="disabled"
    @click="handleClick"
  >
    <!-- 1. BOTÓN PREDEFINIDO INICIAR SESIÓN (CORREGIDO: v-if) -->
    <template v-if="type === 'login'">
      <LogIn class="w-4 h-4 text-slate-600" />
      <span>{{ text || 'Iniciar Sesión' }}</span>
    </template>

    <!-- 2. BOTÓN PREDEFINIDO CERRAR SESIÓN -->
    <template v-else-if="type === 'logout'">
      <LogOut class="w-4 h-4 text-red-600" />
      <span>{{ text || 'Cerrar Sesión' }}</span>
    </template>

    <template v-else-if="type === 'register'">
      <UserPlus class="w-4 h-4 text-white" />
      <span>{{ text || 'REGISTRARME' }}</span>
    </template>

    <!-- 3. BOTÓN PERSONALIZADO (CUSTOM) -->
    <template v-else>
      <component :is="icon" v-if="icon" class="w-4 h-4" />
      <span>
        <slot>{{ text }}</slot>
      </span>
    </template>
  </component>
</template>