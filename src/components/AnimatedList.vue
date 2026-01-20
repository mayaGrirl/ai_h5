<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

interface Props {
  items: unknown[]
  delay?: number
  duration?: number
  stagger?: number
  animation?: 'fade-up' | 'fade-left' | 'fade-right' | 'scale' | 'none'
}

const props = withDefaults(defineProps<Props>(), {
  delay: 0,
  duration: 400,
  stagger: 50,
  animation: 'fade-up'
})

const visibleItems = ref<number[]>([])

const animateItems = () => {
  visibleItems.value = []

  props.items.forEach((_, index) => {
    setTimeout(() => {
      visibleItems.value.push(index)
    }, props.delay + index * props.stagger)
  })
}

onMounted(() => {
  animateItems()
})

watch(
  () => props.items,
  () => {
    animateItems()
  },
  { deep: true }
)

const getAnimationStyle = (index: number) => {
  const isVisible = visibleItems.value.includes(index)
  const baseStyle = {
    transition: `all ${props.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
    transitionDelay: `${index * props.stagger}ms`
  }

  if (props.animation === 'none') {
    return baseStyle
  }

  if (!isVisible) {
    switch (props.animation) {
      case 'fade-up':
        return { ...baseStyle, opacity: 0, transform: 'translateY(20px)' }
      case 'fade-left':
        return { ...baseStyle, opacity: 0, transform: 'translateX(20px)' }
      case 'fade-right':
        return { ...baseStyle, opacity: 0, transform: 'translateX(-20px)' }
      case 'scale':
        return { ...baseStyle, opacity: 0, transform: 'scale(0.9)' }
      default:
        return { ...baseStyle, opacity: 0 }
    }
  }

  return { ...baseStyle, opacity: 1, transform: 'translateY(0) translateX(0) scale(1)' }
}
</script>

<template>
  <div class="animated-list">
    <div
      v-for="(item, index) in items"
      :key="index"
      :style="getAnimationStyle(index)"
      class="animated-list-item"
    >
      <slot :item="item" :index="index" />
    </div>
  </div>
</template>

<style scoped>
.animated-list-item {
  will-change: transform, opacity;
}
</style>
