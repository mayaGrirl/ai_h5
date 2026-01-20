<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary'
}

withDefaults(defineProps<Props>(), {
  position: 'bottom-right',
  size: 'md',
  variant: 'primary'
})

const emit = defineEmits<{
  (e: 'click'): void
}>()

const isPressed = ref(false)

const handleClick = () => {
  isPressed.value = true
  setTimeout(() => {
    isPressed.value = false
  }, 150)
  emit('click')
}

const positionClasses = {
  'bottom-right': 'bottom-20 right-4',
  'bottom-left': 'bottom-20 left-4',
  'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2'
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-14 h-14'
}

const variantClasses = {
  primary: 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30',
  secondary: 'bg-white text-gray-800 shadow-lg border border-gray-100'
}
</script>

<template>
  <button
    @click="handleClick"
    :class="[
      'fixed z-40 rounded-full flex items-center justify-center transition-all duration-200',
      'hover:scale-110 active:scale-95',
      positionClasses[position],
      sizeClasses[size],
      variantClasses[variant],
      isPressed ? 'scale-95' : ''
    ]"
  >
    <slot />
  </button>
</template>
