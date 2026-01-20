<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { setSecurityPass } from '@/api/customer'
import { toast } from '@/composables/useToast'
import { SAFE_QUESTION_OPTIONS } from '@/constants'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

const isSubmitting = ref(false)

const formData = ref({
  safe_ask: '',
  answer: ''
})
const errors = ref<Record<string, string>>({})

// 判断是否已设置密保问题
const isAlreadySet = !!authStore.currentCustomer?.securitypass

// 验证表单
const validate = () => {
  errors.value = {}

  if (!formData.value.safe_ask) {
    errors.value.safe_ask = t('mine.toolcase.question-options.default')
    return false
  }

  if (!formData.value.answer) {
    errors.value.answer = t('common.form.placeholder.enter') + t('mine.toolcase.form-label.answer')
    return false
  }

  if (formData.value.answer.length > 50) {
    errors.value.answer = t('mine.security-settings.group-account.password.answer-max')
    return false
  }

  return true
}

// 提交表单
const handleSubmit = async () => {
  if (!validate()) return

  isSubmitting.value = true
  try {
    const res = await setSecurityPass({
      safe_ask: formData.value.safe_ask,
      answer: formData.value.answer
    })

    if (res.code === 200) {
      toast.success(res.message || '设置成功')
      router.back()
    } else {
      toast.error(res.message || '设置失败')
    }
  } catch (error) {
    toast.error('设置失败')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen justify-center bg-[#eef3f8]">
    <div class="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
      <PageHeader :title="t('mine.security-settings.group-pay.security')" />

      <main class="px-3 pb-20 pt-3">
        <form @submit.prevent="handleSubmit" class="mt-5">
          <!-- 密保问题 -->
          <div class="bg-white rounded-xl shadow-sm p-2">
            <div class="flex justify-center items-center">
              <label class="w-1/5 text-gray-700">{{ t('mine.toolcase.form-label.question') }}</label>
              <select
                v-model="formData.safe_ask"
                :disabled="isAlreadySet"
                class="w-4/5 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
              >
                <option value="">{{ t('mine.toolcase.question-options.default') }}</option>
                <option
                  v-for="option in SAFE_QUESTION_OPTIONS"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ t(option.i18nKey) }}
                </option>
              </select>
            </div>
            <p v-if="errors.safe_ask" class="mt-1 text-xs text-red-500">{{ errors.safe_ask }}</p>
          </div>

          <!-- 答案 -->
          <div class="bg-white rounded-xl shadow-sm p-2 mt-2">
            <div class="flex justify-center items-center">
              <label class="w-1/5 text-gray-700">{{ t('mine.toolcase.form-label.answer') }}</label>
              <input
                v-model="formData.answer"
                type="text"
                :disabled="isAlreadySet"
                :placeholder="t('common.form.placeholder.enter') + t('mine.toolcase.form-label.answer')"
                class="w-4/5 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
              />
            </div>
            <p v-if="errors.answer" class="mt-1 text-xs text-red-500">{{ errors.answer }}</p>
          </div>

          <!-- 温馨提示 -->
          <div class="rounded-lg mb-3 overflow-hidden">
            <div class="flex items-center text-gray-600 px-4 py-3 pb-0">
              <span class="w-1 h-4 bg-red-600 rounded mr-2"></span>
              {{ t('mine.security-settings.group-account.password.tip') }}
            </div>
            <div class="px-4 py-3 text-gray-600">
              <p class="relative pl-3 text-gray-600 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-1 before:rounded-full before:bg-red-400">
                {{ t('mine.security-settings.group-account.question.tip-1') }}
              </p>
              <p class="relative pl-3 text-red-600 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-1 before:rounded-full before:bg-red-400">
                {{ t('mine.security-settings.group-account.question.tip-2') }}
              </p>
            </div>
          </div>

          <!-- 确认按钮 -->
          <button
            type="submit"
            :disabled="isSubmitting || isAlreadySet"
            :class="[
              'mt-10 h-12 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white font-medium tracking-wide transition transform active:scale-95',
              (isSubmitting || isAlreadySet) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            ]"
          >
            {{ isSubmitting ? t('common.form.button.submitting') : t('common.form.button.submit') }}
          </button>
        </form>
      </main>

      <div class="h-14"></div>
    </div>
  </div>
</template>
