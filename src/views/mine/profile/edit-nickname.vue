<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { AlertCircle } from 'lucide-vue-next'
import { updateNickname } from '@/api/customer'
import { toast } from '@/composables/useToast'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const { t } = useI18n()

const nickname = ref('')
const error = ref('')
const isSubmitting = ref(false)

// 验证
const validate = () => {
  error.value = ''
  if (!nickname.value.trim()) {
    error.value = '请输入昵称'
    return false
  }
  if (nickname.value.length > 50) {
    error.value = '昵称最多50个字符'
    return false
  }
  return true
}

// 提交
const handleSubmit = async () => {
  if (!validate()) return

  isSubmitting.value = true
  try {
    const res = await updateNickname({ nickname: nickname.value })
    if (res.code === 200) {
      toast.success(res.message || '修改成功')
      router.back()
    } else {
      toast.error(res.message || '修改失败')
    }
  } catch (e) {
    toast.error('修改失败')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#f5f7fb] pb-16">
    <PageHeader :title="t('mine.setting.edit-nickname')" />

    <main class="px-3 pb-20 pt-3">
      <!-- 警告提示 -->
      <div class="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
        <AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0" />
        <span class="text-red-600 text-sm">
          {{ t('mine.edit-nickname.alert') }}
          <img src="/ranking/coin.png" alt="coin" class="inline-block ml-1 w-[13px] h-[13px]" />
        </span>
      </div>

      <!-- 表单 -->
      <form @submit.prevent="handleSubmit" class="mt-5">
        <div class="bg-white rounded-xl shadow-sm p-3">
          <div class="flex items-center gap-2">
            <label class="text-gray-700 w-16 flex-shrink-0">{{ t('mine.profile.form-label.nickname') }}</label>
            <input
              v-model="nickname"
              type="text"
              :placeholder="t('common.form.placeholder.enter') + t('mine.profile.form-label.nickname')"
              class="flex-1 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
            />
          </div>
          <p v-if="error" class="mt-1 text-xs text-red-500">{{ error }}</p>
        </div>

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
    </main>
  </div>
</template>
