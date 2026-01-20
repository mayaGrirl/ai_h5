<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { packExchange } from '@/api/customer'
import { toast } from '@/composables/useToast'
import PageHeader from '@/components/PageHeader.vue'

const { t } = useI18n()

const code = ref('')
const error = ref('')
const isSubmitting = ref(false)

// 验证
const validate = () => {
  error.value = ''
  if (!code.value.trim()) {
    error.value = t('gift.code-placeholder')
    return false
  }
  if (code.value.length > 20) {
    error.value = t('gift.code-max')
    return false
  }
  if (!/^[a-zA-Z0-9]+$/.test(code.value)) {
    error.value = t('gift.code-regex')
    return false
  }
  return true
}

// 过滤输入只允许字母和数字
const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  target.value = target.value.replace(/[^a-zA-Z0-9]/g, '')
  code.value = target.value
}

// 处理粘贴
const handlePaste = (e: ClipboardEvent) => {
  e.preventDefault()
  const text = e.clipboardData?.getData('text') || ''
  const filtered = text.replace(/[^a-zA-Z0-9]/g, '')
  code.value = filtered
}

// 提交
const handleSubmit = async () => {
  if (!validate()) return

  isSubmitting.value = true
  try {
    const res = await packExchange({ code: code.value })
    if (res.code === 200) {
      toast.success(res.message || '兑换成功')
      code.value = ''
    } else {
      toast.error(res.message || '兑换失败')
    }
  } catch (e) {
    toast.error('兑换失败')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#f5f7fb] pb-16">
    <PageHeader :title="t('mine.setting.gift')" />

    <div class="bg-gray-100 flex justify-center">
      <form @submit.prevent="handleSubmit" class="w-full bg-gray-100 px-3 py-4">
        <!-- 红包码 -->
        <div class="bg-white rounded-lg mb-3 overflow-hidden">
          <div class="flex items-center text-gray-600 px-4 py-3 pb-0">
            <span class="w-1 h-4 bg-red-600 rounded mr-2"></span>
            {{ t('gift.title') }}
          </div>
          <div class="flex items-center px-4 py-3 border-b">
            <label class="w-20 text-gray-700 flex-shrink-0">{{ t('gift.code-label') }}</label>
            <input
              :value="code"
              @input="handleInput"
              @paste="handlePaste"
              type="text"
              autocomplete="off"
              :placeholder="t('gift.code-placeholder')"
              class="text-gray-600 flex-1 placeholder-gray-400 focus:outline-none h-10"
            />
          </div>
          <p v-if="error" class="px-4 py-2 text-xs text-red-500">{{ error }}</p>
        </div>

        <!-- 确认按钮 -->
        <button
          type="submit"
          :disabled="isSubmitting"
          :class="[
            'mt-10 h-12 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white font-medium tracking-wide transition transform active:scale-95',
            isSubmitting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
          ]"
        >
          {{ isSubmitting ? t('common.form.button.submitting') : t('common.form.button.submit') }}
        </button>
      </form>
    </div>
  </div>
</template>
