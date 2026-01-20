<script setup lang="ts">
interface Props {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  lines?: number
  animated?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'text',
  animated: true,
  lines: 1
})

const getSize = (value: string | number | undefined, fallback: string) => {
  if (value === undefined) return fallback
  if (typeof value === 'number') return `${value}px`
  return value
}

const variantClasses = {
  text: 'rounded',
  circular: 'rounded-full',
  rectangular: 'rounded-none',
  rounded: 'rounded-lg'
}
</script>

<template>
  <div class="skeleton-wrapper">
    <template v-if="variant === 'text' && lines > 1">
      <div
        v-for="i in lines"
        :key="i"
        :class="[
          'bg-gray-200',
          variantClasses[variant],
          animated ? 'skeleton-shimmer' : ''
        ]"
        :style="{
          width: i === lines ? '60%' : getSize(width, '100%'),
          height: getSize(height, '1rem'),
          marginBottom: i < lines ? '0.5rem' : '0'
        }"
      />
    </template>
    <div
      v-else
      :class="[
        'bg-gray-200',
        variantClasses[variant],
        animated ? 'skeleton-shimmer' : ''
      ]"
      :style="{
        width: getSize(width, variant === 'circular' ? '40px' : '100%'),
        height: getSize(height, variant === 'circular' ? '40px' : '1rem')
      }"
    />
  </div>
</template>

<style scoped>
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
