<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { settingLoginVerifyType } from '@/api/customer'
import { toast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

const isSubmitting = ref(false)
const currentValue = ref('none')

const radioOptions = [
  { value: 'none', i18nKey: 'mine.security-settings.group-account.login-sms.option-1' },
  { value: 'everyloginNeedSMS', i18nKey: 'mine.security-settings.group-account.login-sms.option-2' },
  { value: 'otherAddrNeedSMS', i18nKey: 'mine.security-settings.group-account.login-sms.option-3' }
]

// 提交表单
const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const res = await settingLoginVerifyType({
      login_verify_type: currentValue.value
    })

    if (res.code === 200) {
      toast.success(res.message || '设置成功')
      // 更新用户状态
      if (authStore.currentCustomer) {
        authStore.setCurrentCustomer({
          ...authStore.currentCustomer,
          loginVerifyType: currentValue.value
        })
      }
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

// 初始化
onMounted(() => {
  if (authStore.currentCustomer?.loginVerifyType) {
    currentValue.value = authStore.currentCustomer.loginVerifyType
  }
})
</script>

<template>
  <div class="flex min-h-screen justify-center bg-[#eef3f8]">
    <div class="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
      <PageHeader :title="t('mine.security-settings.group-account.login-sms.title')" />

      <form @submit.prevent="handleSubmit" class="w-full bg-gray-100 px-3 py-4">
        <div class="bg-white rounded-lg mb-3 overflow-hidden">
          <div class="flex flex-wrap flex-col items-start content-start px-4 py-3 border-b">
            <label
              v-for="option in radioOptions"
              :key="option.value"
              :class="[
                'flex items-center gap-3 px-4 py-3 cursor-pointer',
                currentValue === option.value ? 'text-blue-600' : 'text-gray-700'
              ]"
            >
              <input
                type="radio"
                :value="option.value"
                v-model="currentValue"
                class="hidden"
              />
              <span
                :class="[
                  'flex h-4 w-4 items-center justify-center rounded-full border',
                  currentValue === option.value
                    ? 'border-red-600 bg-red-600'
                    : 'border-gray-300'
                ]"
              >
                <span v-if="currentValue === option.value" class="h-2 w-2 rounded-full bg-white"></span>
              </span>
              <span class="text-sm">{{ t(option.i18nKey) }}</span>
            </label>
          </div>
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

      <div class="h-14"></div>
    </div>
  </div>
</template>
