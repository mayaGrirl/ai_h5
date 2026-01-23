<script setup lang="ts">
import { ref, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from '@/composables/useToast'
import { customerReceiveSms } from '@/api/customer'

const DURATION = 60

interface Props {
  modelValue?: string
  scene: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const { t } = useI18n()

const countdown = ref(0)
const isSending = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

// 倒计时逻辑
watch(countdown, (val) => {
  if (val <= 0) {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    return
  }

  timer = setTimeout(() => {
    countdown.value--
  }, 1000)
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
})

// 发送短信
const sendSms = async () => {
  if (isSending.value || countdown.value > 0) return

  isSending.value = true

  try {
    const { code, message } = await customerReceiveSms(props.scene)
    if (code !== 200) {
      toast.error(message || t('common.sms-verify_code-send-failed'))
    } else {
      toast.success(t('common.send-success'))
      countdown.value = DURATION
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : t('common.sms-verify_code-send-failed')
    toast.error(msg)
  } finally {
    isSending.value = false
  }
}

const handleInput = (e: Event) => {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <!-- 输入框 -->
  <input
    :value="modelValue"
    @input="handleInput"
    type="text"
    inputmode="numeric"
    pattern="[0-9]*"
    autocomplete="one-time-code"
    :placeholder="t('common.sms-verify_code-placeholder')"
    class="flex-1 min-w-0 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
  />
  <!-- 按钮 -->
  <button
    type="button"
    :disabled="disabled || isSending || countdown > 0"
    @click="sendSms"
    :class="[
      'shrink-0 h-8 px-3 rounded text-xs whitespace-nowrap transition',
      (disabled || isSending || countdown > 0)
        ? 'bg-gray-600 text-white cursor-not-allowed'
        : 'bg-blue-600 text-white active:scale-95 cursor-pointer'
    ]"
  >
    <template v-if="isSending">
      {{ t('common.sms-verify_code-sending') }}
    </template>
    <template v-else-if="countdown > 0">
      {{ countdown }}s
    </template>
    <template v-else>
      {{ t('common.sms-verify_code-send-btn') }}
    </template>
  </button>
</template>
