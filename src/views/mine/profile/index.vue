<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ChevronRight, AlertCircle } from 'lucide-vue-next'
import { getMemberField, updateProfile } from '@/api/customer'
import { toast } from '@/composables/useToast'
import type { MemberField } from '@/types/customer.type'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const { t } = useI18n()

const profile = ref<MemberField | null>(null)
const isLoading = ref(true)
const isSubmitting = ref(false)

// 表单数据
const formData = ref({
  qq: '',
  alipay: '',
  wchat: '',
  realname: '',
  address: '',
  signature: ''
})

// 表单错误
const errors = ref<Record<string, string>>({})

// 加载用户资料
const loadProfile = async () => {
  try {
    isLoading.value = true
    const res = await getMemberField()
    if (res.code === 200 && res.data) {
      profile.value = res.data
      // 设置签名
      if (res.data.signature) {
        formData.value.signature = res.data.signature
      }
    }
  } catch (error) {
    console.error('加载资料失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 验证表单
const validateForm = () => {
  errors.value = {}

  if (formData.value.qq && !/^\d{5,12}$/.test(formData.value.qq)) {
    errors.value.qq = t('mine.profile.validation.qq')
  }

  if (formData.value.realname && formData.value.realname.length > 50) {
    errors.value.realname = t('mine.profile.validation.realname')
  }

  if (formData.value.alipay && formData.value.alipay.length > 50) {
    errors.value.alipay = t('mine.profile.validation.alipay')
  }

  if (formData.value.wchat && formData.value.wchat.length > 50) {
    errors.value.wchat = t('mine.profile.validation.wchat')
  }

  if (formData.value.address && formData.value.address.length > 150) {
    errors.value.address = t('mine.profile.validation.address')
  }

  if (formData.value.signature && formData.value.signature.length > 200) {
    errors.value.signature = t('mine.profile.validation.signature')
  }

  return Object.keys(errors.value).length === 0
}

// 提交表单
const handleSubmit = async () => {
  if (!validateForm()) return

  // 检查是否有任何数据
  const hasAnyValue = Object.values(formData.value).some(v => v && v.trim() !== '')
  if (!hasAnyValue) {
    toast.warning('你未填写任何数据，无需提交')
    return
  }

  try {
    isSubmitting.value = true
    const res = await updateProfile({
      qq: formData.value.qq || undefined,
      wchat: formData.value.wchat || undefined,
      alipay: formData.value.alipay || undefined,
      realname: formData.value.realname || undefined,
      address: formData.value.address || undefined,
      signature: formData.value.signature || undefined
    })

    if (res.code === 200) {
      toast.success(res.message || '保存成功')
      router.back()
    } else {
      toast.error(res.message || '保存失败')
    }
  } catch (error) {
    toast.error('保存失败')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <div class="min-h-screen bg-[#f5f7fb] pb-16">
    <PageHeader :title="t('mine.setting.profile')" />

    <main class="px-3 pb-20 pt-3">
      <!-- 昵称 -->
      <div class="bg-white rounded-xl shadow-sm p-3 mt-2">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <span class="text-gray-500 w-16">{{ t('mine.profile.form-label.nickname') }}</span>
            <span class="text-gray-700">{{ profile?.nickname || '-' }}</span>
          </div>
          <router-link to="/mine/edit-nickname" class="flex items-center text-red-600 text-sm">
            {{ t('mine.profile.edit-nickname') }}
            <ChevronRight class="w-4 h-4" />
          </router-link>
        </div>
      </div>

      <!-- 邮箱 -->
      <div class="bg-white rounded-xl shadow-sm p-3 mt-2">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <span class="text-gray-500 w-16">{{ t('mine.profile.form-label.email') }}</span>
            <span v-if="profile?.email" class="text-gray-400">{{ profile.email }}</span>
          </div>
          <router-link v-if="!profile?.email" to="/mine/bind-email" class="flex items-center text-red-600 text-sm">
            {{ t('mine.bind-email.title') }}
            <ChevronRight class="w-4 h-4" />
          </router-link>
        </div>
      </div>

      <!-- 手机 -->
      <div class="bg-white rounded-xl shadow-sm p-3 mt-2">
        <div class="flex items-center gap-2">
          <span class="text-gray-500 w-16">{{ t('mine.profile.form-label.mobile') }}</span>
          <span class="text-gray-400">{{ profile?.mobile || '-' }}</span>
        </div>
      </div>

      <!-- 表单 -->
      <form @submit.prevent="handleSubmit" class="mt-5">
        <!-- QQ -->
        <div class="bg-white rounded-xl shadow-sm p-3 mt-2">
          <div class="flex items-center gap-2">
            <label class="text-gray-500 w-16 flex-shrink-0">{{ t('mine.profile.form-label.qq') }}</label>
            <template v-if="profile?.qq">
              <span class="text-gray-400">{{ profile.qq }}</span>
            </template>
            <template v-else>
              <input
                v-model="formData.qq"
                type="text"
                :placeholder="t('common.form.placeholder.enter') + t('mine.profile.form-label.qq')"
                class="flex-1 text-gray-800 placeholder-gray-400 focus:outline-none h-10"
              />
            </template>
          </div>
          <p v-if="errors.qq" class="mt-1 text-xs text-red-500">{{ errors.qq }}</p>
        </div>

        <!-- 支付宝 -->
        <div class="bg-white rounded-xl shadow-sm p-3 mt-2">
          <div class="flex items-center gap-2">
            <label class="text-gray-500 w-16 flex-shrink-0">{{ t('mine.profile.form-label.alipay') }}</label>
            <template v-if="profile?.alipay">
              <span class="text-gray-400">{{ profile.alipay }}</span>
            </template>
            <template v-else>
              <input
                v-model="formData.alipay"
                type="text"
                :placeholder="t('common.form.placeholder.enter') + t('mine.profile.form-label.alipay')"
                class="flex-1 text-gray-800 placeholder-gray-400 focus:outline-none h-10"
              />
            </template>
          </div>
          <p v-if="errors.alipay" class="mt-1 text-xs text-red-500">{{ errors.alipay }}</p>
        </div>

        <!-- 微信 -->
        <div class="bg-white rounded-xl shadow-sm p-3 mt-2">
          <div class="flex items-center gap-2">
            <label class="text-gray-500 w-16 flex-shrink-0">{{ t('mine.profile.form-label.wchat') }}</label>
            <template v-if="profile?.wchat">
              <span class="text-gray-400">{{ profile.wchat }}</span>
            </template>
            <template v-else>
              <input
                v-model="formData.wchat"
                type="text"
                :placeholder="t('common.form.placeholder.enter') + t('mine.profile.form-label.wchat')"
                class="flex-1 text-gray-800 placeholder-gray-400 focus:outline-none h-10"
              />
            </template>
          </div>
          <p v-if="errors.wchat" class="mt-1 text-xs text-red-500">{{ errors.wchat }}</p>
        </div>

        <!-- 真实姓名 -->
        <div class="bg-white rounded-xl shadow-sm p-3 mt-2">
          <div class="flex items-center gap-2">
            <label class="text-gray-500 w-16 flex-shrink-0">{{ t('mine.profile.form-label.realname') }}</label>
            <template v-if="profile?.realname">
              <span class="text-gray-400">{{ profile.realname }}</span>
            </template>
            <template v-else>
              <input
                v-model="formData.realname"
                type="text"
                :placeholder="t('common.form.placeholder.enter') + t('mine.profile.form-label.realname')"
                class="flex-1 text-gray-800 placeholder-gray-400 focus:outline-none h-10"
              />
            </template>
          </div>
          <p v-if="errors.realname" class="mt-1 text-xs text-red-500">{{ errors.realname }}</p>
        </div>

        <!-- 地址 -->
        <div class="bg-white rounded-xl shadow-sm p-3 mt-2">
          <div class="flex items-center gap-2">
            <label class="text-gray-500 w-16 flex-shrink-0">{{ t('mine.profile.form-label.address') }}</label>
            <template v-if="profile?.address">
              <span class="text-gray-400">{{ profile.address }}</span>
            </template>
            <template v-else>
              <input
                v-model="formData.address"
                type="text"
                :placeholder="t('common.form.placeholder.enter') + t('mine.profile.form-label.address')"
                class="flex-1 text-gray-800 placeholder-gray-400 focus:outline-none h-10"
              />
            </template>
          </div>
          <p v-if="errors.address" class="mt-1 text-xs text-red-500">{{ errors.address }}</p>
        </div>

        <!-- 警告提示 -->
        <div class="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle class="w-5 h-5 text-red-500 flex-shrink-0" />
          <span class="text-red-600 text-sm">{{ t('mine.profile.alert') }}</span>
        </div>

        <!-- 个性签名 -->
        <div class="bg-white rounded-xl shadow-sm p-3 mt-2">
          <div class="flex items-start gap-2">
            <label class="text-gray-500 w-16 flex-shrink-0 pt-2">{{ t('mine.profile.form-label.signature') }}</label>
            <textarea
              v-model="formData.signature"
              :placeholder="t('common.form.placeholder.enter') + t('mine.profile.form-label.signature')"
              class="flex-1 text-gray-800 placeholder-gray-400 focus:outline-none h-20 resize-none"
            />
          </div>
          <p v-if="errors.signature" class="mt-1 text-xs text-red-500">{{ errors.signature }}</p>
        </div>

        <!-- 提交按钮 -->
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
