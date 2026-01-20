<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AlertCircle } from 'lucide-vue-next'
import { settingLoginAddress } from '@/api/customer'
import { toast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

const isSubmitting = ref(false)

const formData = ref({
  enabled: false,
  address1: '',
  address2: ''
})
const errors = ref<Record<string, string>>({})

// 验证表单
const validate = () => {
  errors.value = {}

  if (formData.value.enabled) {
    if (!formData.value.address1 && !formData.value.address2) {
      errors.value.address1 = t('mine.security-settings.group-account.login-location.address1-empty')
      return false
    }
  }

  if (formData.value.address1 && formData.value.address1.length > 20) {
    errors.value.address1 = t('mine.security-settings.group-account.login-location.address1-max')
    return false
  }

  if (formData.value.address2 && formData.value.address2.length > 20) {
    errors.value.address2 = t('mine.security-settings.group-account.login-location.address1-max')
    return false
  }

  return true
}

// 提交表单
const handleSubmit = async () => {
  if (!validate()) return

  isSubmitting.value = true
  try {
    const res = await settingLoginAddress({
      enabled: formData.value.enabled ? 1 : 0,
      address1: formData.value.address1,
      address2: formData.value.address2
    })

    if (res.code === 200) {
      toast.success(res.message || '设置成功')
      // 更新用户状态
      if (authStore.currentCustomer) {
        authStore.setCurrentCustomer({
          ...authStore.currentCustomer,
          isLogin: formData.value.enabled ? 1 : 0,
          address1: formData.value.address1,
          address2: formData.value.address2
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
  if (authStore.currentCustomer) {
    formData.value.enabled = !!authStore.currentCustomer.isLogin
    formData.value.address1 = authStore.currentCustomer.address1 || ''
    formData.value.address2 = authStore.currentCustomer.address2 || ''
  }
})
</script>

<template>
  <div class="flex min-h-screen justify-center bg-[#eef3f8]">
    <div class="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
      <PageHeader :title="t('mine.security-settings.group-account.login-location.title')" />

      <form @submit.prevent="handleSubmit" class="w-full bg-gray-100 px-3 py-4">
        <div class="bg-white rounded-lg mb-3 overflow-hidden">
          <!-- 开关 -->
          <div class="flex items-center px-4 py-3 border-b">
            <label class="w-2/7 text-gray-700">{{ t('mine.security-settings.group-account.login-location.enabled-label') }}</label>
            <button
              type="button"
              @click="formData.enabled = !formData.enabled"
              :class="[
                'relative inline-flex h-6 w-11 items-center cursor-pointer rounded-full transition',
                formData.enabled ? 'bg-red-500' : 'bg-gray-300'
              ]"
            >
              <span
                :class="[
                  'inline-block h-6 w-6 rounded-full bg-white transition',
                  formData.enabled ? 'translate-x-5' : 'translate-x-0'
                ]"
              />
            </button>
          </div>

          <!-- 地址1 -->
          <div class="flex items-center px-4 py-3 border-b">
            <label class="w-2/7 text-gray-700">{{ t('mine.security-settings.group-account.login-location.address1-label') }}</label>
            <input
              v-model="formData.address1"
              type="text"
              :placeholder="t('common.form.placeholder.enter') + t('mine.security-settings.group-account.login-location.address2-label')"
              class="text-gray-600 w-5/7 placeholder-gray-400 focus:outline-none h-10"
            />
          </div>
          <p v-if="errors.address1" class="mt-1 px-4 text-xs text-red-500">{{ errors.address1 }}</p>

          <!-- 地址2 -->
          <div class="flex items-center px-4 py-3">
            <label class="w-2/7 text-gray-700">{{ t('mine.security-settings.group-account.login-location.address2-label') }}</label>
            <input
              v-model="formData.address2"
              type="text"
              :placeholder="t('common.form.placeholder.enter') + t('mine.security-settings.group-account.login-location.address2-label')"
              class="text-gray-600 w-5/7 placeholder-gray-400 focus:outline-none h-10"
            />
          </div>
          <p v-if="errors.address2" class="mt-1 px-4 text-xs text-red-500">{{ errors.address2 }}</p>
        </div>

        <!-- 警告提示 -->
        <div class="flex items-start gap-2 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <AlertCircle class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div class="text-sm text-yellow-800">
            <p>{{ t('mine.security-settings.group-account.login-location.alert-1') }}</p>
            <p>{{ t('mine.security-settings.group-account.login-location.alert-2') }}</p>
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
