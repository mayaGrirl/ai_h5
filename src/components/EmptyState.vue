<script setup lang="ts">
import { Inbox } from 'lucide-vue-next'

interface Props {
  icon?: typeof Inbox
  title?: string
  description?: string
  actionText?: string
}

withDefaults(defineProps<Props>(), {
  title: '暂无数据'
})

const emit = defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 fade-in-up">
    <!-- 图标 -->
    <div class="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
      <component
        :is="icon || Inbox"
        class="w-10 h-10 text-gray-300"
      />
    </div>

    <!-- 标题 -->
    <h3 class="text-base font-medium text-gray-500 mb-1">
      {{ title }}
    </h3>

    <!-- 描述 -->
    <p v-if="description" class="text-sm text-gray-400 text-center max-w-xs">
      {{ description }}
    </p>

    <!-- 操作按钮 -->
    <button
      v-if="actionText"
      @click="emit('action')"
      class="mt-4 px-6 py-2 bg-red-500 text-white text-sm font-medium rounded-full hover:bg-red-600 active:scale-95 transition-all"
    >
      {{ actionText }}
    </button>
  </div>
</template>
