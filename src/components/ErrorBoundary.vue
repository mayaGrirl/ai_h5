<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'

defineProps<{
  fallback?: boolean
}>()

const hasError = ref(false)
const errorMessage = ref('')

// 捕获子组件错误
onErrorCaptured((err: Error) => {
  hasError.value = true
  errorMessage.value = err.message
  console.error('ErrorBoundary caught error:', err)
  // 返回 false 阻止错误继续传播
  return false
})

// 重置错误状态
const resetError = () => {
  hasError.value = false
  errorMessage.value = ''
}

// 刷新页面
const handleReload = () => {
  resetError()
  window.location.reload()
}

defineExpose({
  resetError,
  hasError
})
</script>

<template>
  <slot v-if="!hasError" />
  <slot v-else name="fallback">
    <!-- 默认的错误回退UI -->
    <div class="flex h-screen flex-col items-center justify-center bg-gray-100">
      <h2 class="text-lg font-semibold text-red-600">
        页面出现异常
      </h2>
      <p v-if="errorMessage" class="mt-2 text-sm text-gray-500">
        {{ errorMessage }}
      </p>
      <button
        @click="handleReload"
        class="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
      >
        刷新页面
      </button>
    </div>
  </slot>
</template>
