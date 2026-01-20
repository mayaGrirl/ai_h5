<script setup lang="ts">
import { ref, computed } from 'vue'
import { RefreshCw } from 'lucide-vue-next'

interface Props {
  loading?: boolean
  pullText?: string
  releaseText?: string
  loadingText?: string
  successText?: string
  threshold?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  pullText: '下拉刷新',
  releaseText: '释放刷新',
  loadingText: '刷新中...',
  successText: '刷新成功',
  threshold: 80
})

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const startY = ref(0)
const pullDistance = ref(0)
const isPulling = ref(false)
const status = ref<'pull' | 'release' | 'loading' | 'success'>('pull')

const statusText = computed(() => {
  switch (status.value) {
    case 'release':
      return props.releaseText
    case 'loading':
      return props.loadingText
    case 'success':
      return props.successText
    default:
      return props.pullText
  }
})

const pullProgress = computed(() => {
  return Math.min(pullDistance.value / props.threshold, 1)
})

const handleTouchStart = (e: TouchEvent) => {
  if (props.loading) return
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  if (scrollTop <= 0) {
    startY.value = e.touches[0].clientY
    isPulling.value = true
  }
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isPulling.value || props.loading) return

  const currentY = e.touches[0].clientY
  const distance = currentY - startY.value

  if (distance > 0) {
    // 阻尼效果
    pullDistance.value = Math.min(distance * 0.5, props.threshold * 1.5)
    status.value = pullDistance.value >= props.threshold ? 'release' : 'pull'

    // 阻止默认滚动
    if (distance > 10) {
      e.preventDefault()
    }
  }
}

const handleTouchEnd = () => {
  if (!isPulling.value) return

  isPulling.value = false

  if (pullDistance.value >= props.threshold && !props.loading) {
    status.value = 'loading'
    emit('refresh')
  } else {
    pullDistance.value = 0
    status.value = 'pull'
  }
}

// 外部调用完成刷新
const finish = (success = true) => {
  if (success) {
    status.value = 'success'
    setTimeout(() => {
      pullDistance.value = 0
      status.value = 'pull'
    }, 500)
  } else {
    pullDistance.value = 0
    status.value = 'pull'
  }
}

defineExpose({ finish })
</script>

<template>
  <div
    class="pull-refresh-container"
    @touchstart.passive="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchEnd"
  >
    <!-- 下拉指示器 -->
    <div
      class="pull-refresh-header flex items-center justify-center gap-2 text-gray-500 text-sm overflow-hidden transition-all duration-200"
      :style="{ height: `${pullDistance}px` }"
    >
      <div
        class="transition-transform duration-200"
        :style="{
          transform: status === 'loading' ? 'none' : `rotate(${pullProgress * 180}deg)`
        }"
      >
        <RefreshCw
          :size="20"
          :class="[
            'transition-all',
            status === 'loading' ? 'animate-spin text-red-500' : 'text-gray-400'
          ]"
        />
      </div>
      <span
        :class="[
          'transition-colors',
          status === 'release' || status === 'loading' ? 'text-red-500' : 'text-gray-400'
        ]"
      >
        {{ statusText }}
      </span>
    </div>

    <!-- 内容区域 -->
    <div
      class="pull-refresh-content transition-transform duration-200"
      :style="{ transform: `translateY(${Math.min(pullDistance, props.threshold)}px)` }"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.pull-refresh-container {
  position: relative;
  overflow: hidden;
}

.pull-refresh-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  transform: translateY(-100%);
}

.pull-refresh-content {
  will-change: transform;
}
</style>
