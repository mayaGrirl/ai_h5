<script setup lang="ts">
/**
 * 拦截全局错误提示页面
 */
const handleReload = () => {
  location.reload()
}
</script>

<template>
  <div class="flex h-screen flex-col items-center justify-center bg-gray-100">
    <div class="text-center">
      <div class="mb-4">
        <svg class="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 class="text-lg font-semibold text-red-600">
        页面出现异常
      </h2>
      <p class="mt-2 text-sm text-gray-500">
        请尝试刷新页面
      </p>
      <button
        @click="handleReload"
        class="mt-4 rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 transition-colors active:scale-95"
      >
        刷新页面
      </button>
    </div>
  </div>
</template>
