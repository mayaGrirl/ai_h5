<script setup lang="ts">
interface Props {
  count?: number
  max?: number
  dot?: boolean
  variant?: 'primary' | 'danger' | 'warning' | 'success' | 'info'
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  animate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  max: 99,
  dot: false,
  variant: 'danger',
  position: 'top-right',
  animate: false
})

const displayCount = () => {
  if (props.count === undefined) return ''
  return props.count > props.max ? `${props.max}+` : props.count
}

const variantClasses = {
  primary: 'bg-red-500',
  danger: 'bg-red-500',
  warning: 'bg-amber-500',
  success: 'bg-emerald-500',
  info: 'bg-blue-500'
}

const positionClasses = {
  'top-right': 'top-0 right-0 -translate-y-1/2 translate-x-1/2',
  'top-left': 'top-0 left-0 -translate-y-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-0 right-0 translate-y-1/2 translate-x-1/2',
  'bottom-left': 'bottom-0 left-0 translate-y-1/2 -translate-x-1/2'
}
</script>

<template>
  <div class="relative inline-flex">
    <slot />
    <span
      v-if="dot || (count !== undefined && count > 0)"
      :class="[
        'absolute flex items-center justify-center text-white text-xs font-medium',
        variantClasses[variant],
        positionClasses[position],
        dot
          ? 'w-2.5 h-2.5 rounded-full'
          : 'min-w-[18px] h-[18px] px-1 rounded-full',
        animate && 'animate-pulse'
      ]"
    >
      <template v-if="!dot">{{ displayCount() }}</template>
    </span>
  </div>
</template>
