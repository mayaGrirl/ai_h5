<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AlertCircle } from 'lucide-vue-next'
import { bindEmail } from '@/api/customer'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/composables/useToast'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

const email = ref('')
const error = ref('')
const isSubmitting = ref(false)
const hasEmail = ref(false)

// 验证邮箱格式
const validateEmail = (value: string) => {
  const emailRegex = /^[\w\-\.]+@[\w\-]+(\.\w+)+$/
  return emailRegex.test(value)
}

// 验证
const validate = () => {
  error.value = ''
  if (!email.value.trim()) {
    error.value = '请输入邮箱'
    return false
  }
  if (!validateEmail(email.value)) {
    error.value = '邮箱格式不正确'
    return false
  }
  if (email.value.length > 50) {
    error.value = '邮箱最多50个字符'
    return false
  }
  return true
}

// 提交
const handleSubmit = async () => {
  if (!validate()) return

  isSubmitting.value = true
  try {
    const res = await bindEmail({ email: email.value })
    if (res.code === 200) {
      toast.success(res.message || '绑定成功')
      router.back()
    } else {
      toast.error(res.message || '绑定失败')
    }
  } catch (e) {
    toast.error('绑定失败')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  // 如果已有邮箱，显示已绑定状态
  if (authStore.currentCustomer?.email) {
    email.value = authStore.currentCustomer.email
    hasEmail.value = true
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#f5f7fb] pb-16">
    <PageHeader :title="t('mine.bind-email.title')" />

    <main class="px-3 pb-20 pt-3">
      <!-- 警告提示 -->
      <div class="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
        <AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0" />
        <span class="text-red-600 text-sm">{{ t('mine.bind-email.alert') }}</span>
      </div>

      <!-- 表单 -->
      <form @submit.prevent="handleSubmit" class="mt-5">
        <div class="bg-white rounded-xl shadow-sm p-3">
          <div class="flex items-center gap-2">
            <label class="text-gray-700 w-12 flex-shrink-0">{{ t('mine.profile.form-label.email') }}</label>
            <input
              v-model="email"
              type="text"
              :placeholder="t('common.form.placeholder.enter') + t('mine.profile.form-label.email')"
              :disabled="hasEmail"
              :class="[
                'flex-1 placeholder-gray-400 focus:outline-none h-12',
                hasEmail ? 'text-gray-400' : 'text-gray-800'
              ]"
            />
          </div>
          <p v-if="error" class="mt-1 text-xs text-red-500">{{ error }}</p>
        </div>

        <button
          v-if="!hasEmail"
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
    </main>
  </div>
</template>
