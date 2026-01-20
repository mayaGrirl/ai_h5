<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Inbox } from 'lucide-vue-next'

interface Props {
  description?: string
  actionText?: string
}

const props = defineProps<Props>()
const { t } = useI18n()

const emit = defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 px-4 fade-in-up">
    <!-- 图标容器 -->
    <div class="relative mb-4">
      <!-- 背景装饰圆 -->
      <div class="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full scale-150 opacity-50" />
      <!-- 主图标 -->
      <div class="relative w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-white flex items-center justify-center shadow-inner">
        <Inbox class="w-10 h-10 text-gray-300" :stroke-width="1.5" />
      </div>
    </div>

    <!-- 描述文字 -->
    <p class="text-sm text-gray-400 text-center max-w-[200px]">
      {{ props.description || t('common.empty-description') }}
    </p>

    <!-- 操作按钮 -->
    <button
      v-if="actionText"
      @click="emit('action')"
      class="mt-5 px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-full shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 active:scale-95 transition-all duration-200"
    >
      {{ actionText }}
    </button>
  </div>
</template>

<style scoped>
.fade-in-up {
  animation: fade-in-up 0.4s ease-out;
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
