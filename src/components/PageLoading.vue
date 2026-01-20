<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
}

withDefaults(defineProps<Props>(), {
  size: 'md',
  fullScreen: false
})

const { t } = useI18n()

const sizeClasses = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3'
}
</script>

<template>
  <div
    :class="[
      'flex items-center justify-center',
      fullScreen ? 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50' : 'h-40'
    ]"
  >
    <div class="flex flex-col items-center gap-3">
      <!-- 精美的加载动画 -->
      <div class="relative">
        <!-- 外圈 -->
        <div
          :class="[
            'rounded-full border-gray-200 animate-pulse',
            sizeClasses[size]
          ]"
        />
        <!-- 内圈旋转 -->
        <div
          :class="[
            'absolute inset-0 rounded-full border-transparent border-t-red-500 border-r-red-500/50 spin-smooth',
            sizeClasses[size]
          ]"
        />
        <!-- 点缀光效 -->
        <div
          :class="[
            'absolute inset-0 rounded-full border-transparent border-b-orange-400/30 spin-smooth',
            sizeClasses[size]
          ]"
          style="animation-duration: 1.5s; animation-direction: reverse;"
        />
      </div>
      <!-- 加载文字 -->
      <span class="text-sm text-gray-500 animate-pulse">
        {{ text || t('common.loading') }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.spin-smooth {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
