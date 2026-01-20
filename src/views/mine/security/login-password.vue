<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Eye, EyeOff } from 'lucide-vue-next'
import { updateLoginPassword } from '@/api/customer'
import { getBlockByIdentifier, httpConfigRKey } from '@/api/common'
import { toast } from '@/composables/useToast'
import { SAFE_QUESTION_OPTIONS } from '@/constants'
import { useAuthStore } from '@/stores/auth'
import SodiumEncryptor from '@/utils/sodium'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

const loading = ref(true)
const tipContent = ref('')
const showPassword = ref(false)
const isSubmitting = ref(false)
const publicKey = ref('')

const formData = ref({
  safe_ask: '',
  answer: '',
  password: '',
  confirm_password: ''
})
const errors = ref<Record<string, string>>({})

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

  if (!formData.value.password || formData.value.password.length < 8) {
    errors.value.password = t('mine.security-settings.group-account.password.login-password-min')
    return false
  }

  if (formData.value.password !== formData.value.confirm_password) {
    errors.value.confirm_password = t('mine.security-settings.group-account.password.confirm-password-eq')
    return false
  }

  return true
}

// 提交表单
const handleSubmit = async () => {
  if (!validate()) return

  isSubmitting.value = true
  try {
    // 加密密码
    const encryptedPassword = await SodiumEncryptor.encrypt(formData.value.password, publicKey.value)
    const encryptedConfirmPassword = await SodiumEncryptor.encrypt(formData.value.confirm_password, publicKey.value)

    const res = await updateLoginPassword({
      safe_ask: formData.value.safe_ask,
      answer: formData.value.answer,
      password: encryptedPassword,
      confirm_password: encryptedConfirmPassword
    })

    if (res.code === 200) {
      toast.success(res.message || '修改成功')
      // 清理登录状态
      authStore.logout()
      // 跳转登录页
      router.replace('/auth/login')
    } else {
      toast.error(res.message || '修改失败')
    }
  } catch (error) {
    toast.error('修改失败')
  } finally {
    isSubmitting.value = false
  }
}

// 加载提示内容
onMounted(async () => {
  try {
    const res = await getBlockByIdentifier('customer_reset_login_password_tips')
    tipContent.value = res.data?.content || ''
  } catch (error) {
    console.error('加载提示内容失败', error)
  } finally {
    loading.value = false
  }

  // 获取公钥
  httpConfigRKey().then(({ data, code }) => {
    if (code === 200) publicKey.value = data.key
  })
})
</script>

<template>
  <div class="flex min-h-screen justify-center bg-[#eef3f8]">
    <div class="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
      <PageHeader :title="t('mine.setting.edit-password')" />

      <div class="bg-gray-100 flex justify-center">
        <form @submit.prevent="handleSubmit" class="w-full bg-gray-100 px-3 py-4">
          <!-- 修改登录密码 -->
          <div class="bg-white rounded-lg mb-3 overflow-hidden">
            <div class="flex items-center text-gray-600 px-4 py-3 pb-0">
              <span class="w-1 h-4 bg-red-600 rounded mr-2"></span>
              {{ t('mine.security-settings.group-account.password.login-password') }}
            </div>
            <div class="flex items-center px-4 py-3 border-b">
              <label class="w-2/7 text-gray-700">{{ t('mine.security-settings.group-account.password.login-password') }}</label>
              <div class="w-5/7 relative">
                <input
                  v-model="formData.password"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="t('mine.security-settings.group-account.password.login-password-placeholder')"
                  class="text-gray-600 placeholder-gray-400 focus:outline-none h-10 w-full pr-10"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  <Eye v-if="showPassword" :size="18" />
                  <EyeOff v-else :size="18" />
                </button>
              </div>
            </div>
            <p v-if="errors.password" class="mt-1 px-4 text-xs text-red-500">{{ errors.password }}</p>

            <div class="flex items-center px-4 py-3">
              <label class="w-2/7 text-gray-700">{{ t('mine.security-settings.group-account.password.confirm-password') }}</label>
              <div class="w-5/7 relative">
                <input
                  v-model="formData.confirm_password"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="t('mine.security-settings.group-account.password.confirm-password-placeholder')"
                  class="text-gray-600 placeholder-gray-400 focus:outline-none h-10 w-full pr-10"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  <Eye v-if="showPassword" :size="18" />
                  <EyeOff v-else :size="18" />
                </button>
              </div>
            </div>
            <p v-if="errors.confirm_password" class="mt-1 px-4 text-xs text-red-500">{{ errors.confirm_password }}</p>
          </div>

          <!-- 安全问题 -->
          <div class="bg-white rounded-lg mb-3 overflow-hidden">
            <div class="flex items-center text-gray-600 px-4 py-3 pb-0">
              <span class="w-1 h-4 bg-red-600 rounded mr-2"></span>
              {{ t('mine.security-settings.group-account.password.safe-ask-valid') }}
            </div>
            <div class="flex items-center px-4 py-3 border-b">
              <label class="w-2/7 text-gray-700">{{ t('mine.toolcase.form-label.question') }}</label>
              <select
                v-model="formData.safe_ask"
                class="text-gray-600 w-5/7 placeholder-gray-400 focus:outline-none h-10"
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
            <p v-if="errors.safe_ask" class="mt-1 px-4 text-xs text-red-500">{{ errors.safe_ask }}</p>

            <div class="flex items-center px-4 py-3">
              <label class="w-2/7 text-gray-700">{{ t('mine.toolcase.form-label.answer') }}</label>
              <input
                v-model="formData.answer"
                type="text"
                :placeholder="t('common.form.placeholder.enter') + t('mine.toolcase.form-label.answer')"
                class="text-gray-600 w-5/7 placeholder-gray-400 focus:outline-none h-10"
              />
            </div>
            <p v-if="errors.answer" class="mt-1 px-4 text-xs text-red-500">{{ errors.answer }}</p>
          </div>

          <!-- 温馨提示 -->
          <div class="rounded-lg mb-3 overflow-hidden">
            <div class="flex items-center text-gray-600 px-4 py-3 pb-0">
              <span class="w-1 h-4 bg-red-600 rounded mr-2"></span>
              {{ t('mine.security-settings.group-account.password.tip') }}
            </div>

            <template v-if="loading">
              <div class="px-4 py-3 space-y-2">
                <div v-for="i in 3" :key="i" class="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </template>
            <div v-else class="px-4 py-3 text-gray-600" v-html="tipContent"></div>
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

      <div class="h-14"></div>
    </div>
  </div>
</template>
