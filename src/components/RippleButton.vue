<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  rounded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  loading: false,
  variant: 'primary',
  size: 'md',
  fullWidth: false,
  rounded: false
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

interface Ripple {
  id: number
  x: number
  y: number
  size: number
}

const ripples = ref<Ripple[]>([])
let rippleId = 0

const createRipple = (event: MouseEvent) => {
  if (props.disabled || props.loading) return

  const button = event.currentTarget as HTMLElement
  const rect = button.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = event.clientX - rect.left - size / 2
  const y = event.clientY - rect.top - size / 2

  const ripple: Ripple = {
    id: rippleId++,
    x,
    y,
    size
  }

  ripples.value.push(ripple)

  setTimeout(() => {
    ripples.value = ripples.value.filter((r) => r.id !== ripple.id)
  }, 600)

  emit('click', event)
}

const variantClasses = {
  primary: 'bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white hover:shadow-lg hover:shadow-red-500/25',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  outline: 'border-2 border-red-500 text-red-500 hover:bg-red-50',
  ghost: 'text-gray-600 hover:bg-gray-100',
  danger: 'bg-red-600 text-white hover:bg-red-700'
}

const sizeClasses = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base'
}
</script>

<template>
  <button
    type="button"
    :disabled="disabled || loading"
    @click="createRipple"
    :class="[
      'relative overflow-hidden font-medium transition-all duration-200 active:scale-[0.98]',
      'focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2',
      variantClasses[variant],
      sizeClasses[size],
      fullWidth ? 'w-full' : '',
      rounded ? 'rounded-full' : 'rounded-lg',
      (disabled || loading) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
    ]"
  >
    <!-- 涟漪效果 -->
    <span
      v-for="ripple in ripples"
      :key="ripple.id"
      class="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
      :style="{
        width: `${ripple.size}px`,
        height: `${ripple.size}px`,
        left: `${ripple.x}px`,
        top: `${ripple.y}px`
      }"
    />

    <!-- 加载状态 -->
    <span v-if="loading" class="absolute inset-0 flex items-center justify-center">
      <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
          fill="none"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </span>

    <!-- 按钮内容 -->
    <span :class="['flex items-center justify-center gap-2', loading ? 'invisible' : '']">
      <slot />
    </span>
  </button>
</template>

<style scoped>
@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}

.animate-ripple {
  animation: ripple 0.6s linear forwards;
}
</style>
