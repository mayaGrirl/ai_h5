<script setup lang="ts">
import { ref } from 'vue'
import { ChevronLeft } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { cn } from '@/utils'

interface Props {
  title: string
  className?: string
  /** 指定返回地址，不传则返回上一页 */
  customBack?: string
  /** 是否显示返回按钮 */
  isShowBack?: boolean
  /** 是否透明背景 */
  transparent?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isShowBack: true,
  transparent: false
})

const router = useRouter()
const { t } = useI18n()

// 点击反馈
const isPressed = ref(false)

const handleBack = () => {
  isPressed.value = true
  setTimeout(() => {
    isPressed.value = false
    if (props.customBack) {
      router.replace(props.customBack)
    } else {
      router.back()
    }
  }, 100)
}
</script>

<template>
  <header
    :class="cn(
      'relative flex h-16 items-center text-white text-xl safe-area-top',
      transparent
        ? 'bg-transparent'
        : 'bg-gradient-to-r from-red-600 to-red-500 shadow-md',
      className
    )"
  >
    <!-- 左侧返回按钮 -->
    <button
      v-if="isShowBack"
      @click="handleBack"
      :class="[
        'absolute left-2 flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all duration-150',
        'text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20',
        isPressed ? 'scale-90' : 'scale-100'
      ]"
    >
      <ChevronLeft class="h-6 w-6" :stroke-width="2.5" />
      <span class="text-lg font-medium">{{ t('common.header.back') }}</span>
    </button>

    <!-- 中间标题 -->
    <h1 class="mx-auto text-lg font-semibold tracking-wide">
      {{ title }}
    </h1>

    <!-- 右侧插槽 -->
    <div class="absolute right-2">
      <slot name="right" />
    </div>
  </header>
</template>
