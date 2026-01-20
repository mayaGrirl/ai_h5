<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Eye, EyeOff } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { registration, sendSmsToMobile } from '@/api/auth'
import { httpConfigRKey, getPasswordTip } from '@/api/common'
import { toast } from '@/composables/useToast'
import SodiumEncryptor from '@/utils/sodium'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

// 倒计时页面刷新继续保持的存储key
const STORAGE_KEY = 'sms_countdown_end_at_register'

// 表单数据
const mobile = ref('')
const verifyCode = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const loading = ref(false)
const smsLoading = ref(false)
const countdown = ref(0)
const publicKey = ref('')
const isDisable = ref(true)

// 密码提示
const tipContent = ref('')
const tipLoading = ref(true)

// 推荐人key (从URL读取)
const recommend = computed(() => (route.query.t as string) || '')

// 倒计时定时器
let timer: ReturnType<typeof setTimeout> | null = null

// 初始化
onMounted(async () => {
  // 从 localStorage 恢复倒计时
  const endAt = Number(localStorage.getItem(STORAGE_KEY))
  if (endAt) {
    const remain = Math.floor((endAt - Date.now()) / 1000)
    if (remain > 0) {
      countdown.value = remain
      startCountdownTimer()
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  // 获取公钥
  httpConfigRKey().then(({ data, code }) => {
    if (code === 200) publicKey.value = data.key
  })

  // 获取密码提示
  tipLoading.value = true
  try {
    const { data } = await getPasswordTip()
    tipContent.value = data?.content || ''
  } catch {
    // ignore
  } finally {
    tipLoading.value = false
  }
})

// 启动倒计时定时器
const startCountdownTimer = () => {
  if (timer) clearTimeout(timer)

  if (countdown.value <= 0) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }

  timer = setTimeout(() => {
    countdown.value--
    if (countdown.value <= 0) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      startCountdownTimer()
    }
  }, 1000)
}

// 发送验证码
const handleSendSms = async () => {
  if (!mobile.value || smsLoading.value || countdown.value > 0) return

  smsLoading.value = true
  try {
    const res = await sendSmsToMobile(mobile.value)
    if (res.code === 200) {
      const duration = 60
      countdown.value = duration
      const endAt = Date.now() + duration * 1000
      localStorage.setItem(STORAGE_KEY, String(endAt))
      startCountdownTimer()
      toast.success(res.message || '发送成功')
    } else {
      toast.error(res.message || t('common.sms-verify_code-send-failed'))
    }
  } catch {
    toast.error(t('common.sms-verify_code-send-failed'))
  } finally {
    smsLoading.value = false
  }
}

// 注册
const handleRegister = async () => {
  if (!mobile.value || !verifyCode.value || !password.value || !confirmPassword.value || loading.value) return

  if (password.value !== confirmPassword.value) {
    toast.error(t('register.confirm_password-eq'))
    return
  }

  loading.value = true
  try {
    // 加密密码
    const encryptedPassword = await SodiumEncryptor.encrypt(password.value, publicKey.value)
    const encryptedConfirmPassword = await SodiumEncryptor.encrypt(confirmPassword.value, publicKey.value)

    const res = await registration({
      mobile: mobile.value,
      verify_code: verifyCode.value,
      password: encryptedPassword,
      confirm_password: encryptedConfirmPassword,
      recommend: recommend.value || ''
    })

    if (res.code === 200 && res.data?.access_token) {
      toast.success(res.message || '注册成功')
      authStore.setToken(
        res.data.access_token,
        res.data.token_type,
        res.data.expires_at
      )
      await authStore.fetchCurrentCustomer()
      router.replace('/')
    } else {
      toast.error(res.message || t('common.catch-error'))
    }
  } catch {
    toast.error(t('common.catch-error'))
  } finally {
    loading.value = false
  }
}

// 手机号输入变化
const onMobileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  mobile.value = target.value
  isDisable.value = target.value.length === 0
}
</script>

<template>
  <div class="flex min-h-screen justify-center bg-[#eef3f8]">
    <div class="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
      <main class="px-3 pb-20 pt-3">
        <div class="pt-13 flex items-center justify-center">
          <img src="/login-logo.png" alt="Login" class="w-32 h-auto" />
        </div>

        <form @submit.prevent="handleRegister" class="mt-5">
          <div class="bg-white rounded-xl shadow-sm p-2">
            <!-- 手机号 -->
            <div class="flex justify-center items-center border-b border-gray-200">
              <label class="w-1/4 text-gray-700">{{ t('register.mobile-label') }}</label>
              <div class="w-3/4">
                <input
                  type="text"
                  :placeholder="t('register.mobile-placeholder')"
                  :value="mobile"
                  @input="onMobileChange"
                  class="w-3/4 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
                />
              </div>
            </div>

            <!-- 验证码 -->
            <div class="flex justify-center items-center border-b border-gray-200">
              <label class="w-1/4 text-gray-700">{{ t('common.sms-verify_code-label') }}</label>
              <div class="flex w-3/4 items-center gap-2 flex-wrap sm:flex-nowrap">
                <input
                  type="text"
                  :placeholder="t('common.sms-verify_code-placeholder')"
                  v-model="verifyCode"
                  class="flex-1 min-w-0 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
                />
                <button
                  type="button"
                  :disabled="countdown > 0 || smsLoading || isDisable"
                  @click="handleSendSms"
                  :class="[
                    'shrink-0 h-8 px-3 rounded text-xs whitespace-nowrap transition',
                    countdown > 0 || smsLoading || isDisable
                      ? 'bg-gray-600 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white active:scale-95 cursor-pointer'
                  ]"
                >
                  {{ smsLoading ? t('common.sms-verify_code-sending') : countdown > 0 ? `${countdown}s` : t('common.sms-verify_code-send-btn') }}
                </button>
              </div>
            </div>

            <!-- 密码 -->
            <div class="flex justify-center items-center border-b border-gray-200">
              <label class="w-1/4 text-gray-700">{{ t('register.password-label') }}</label>
              <div class="w-3/4 relative">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  v-model="password"
                  :placeholder="t('register.password-placeholder')"
                  class="w-3/4 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
                />
                <button
                  type="button"
                  tabindex="-1"
                  @click="showPassword = !showPassword"
                  class="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  <Eye v-if="showPassword" :size="18" />
                  <EyeOff v-else :size="18" />
                </button>
              </div>
            </div>

            <!-- 确认密码 -->
            <div class="flex justify-center items-center">
              <label class="w-1/4 text-gray-700">{{ t('register.confirm_password-label') }}</label>
              <div class="w-3/4 relative">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  v-model="confirmPassword"
                  :placeholder="t('register.confirm_password-placeholder')"
                  class="w-3/4 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
                />
                <button
                  type="button"
                  tabindex="-1"
                  @click="showPassword = !showPassword"
                  class="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  <Eye v-if="showPassword" :size="18" />
                  <EyeOff v-else :size="18" />
                </button>
              </div>
            </div>
          </div>

          <!-- 密码提示 -->
          <div class="rounded-lg mb-3 overflow-hidden">
            <div class="flex items-center text-gray-600 px-4 py-3 pb-0">
              <span class="w-1 h-4 bg-red-600 rounded mr-2"></span>
              {{ t('mine.security-settings.group-account.password.tip') }}
            </div>

            <!-- 骨架屏 -->
            <template v-if="tipLoading">
              <div class="px-4 py-3 space-y-2">
                <div v-for="i in 3" :key="i" class="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </template>

            <!-- 内容 -->
            <div
              v-else
              class="px-4 py-3 text-gray-600"
              v-html="tipContent"
            ></div>
          </div>

          <button
            type="submit"
            :disabled="loading"
            :class="[
              'mt-10 h-12 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white font-medium tracking-wide transition transform active:scale-95',
              loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            ]"
          >
            {{ loading ? t('common.form.button.submitting') : t('register.form-submit-button') }}
          </button>
        </form>

        <router-link
          to="/auth/login"
          class="flex justify-center items-center mt-6 text-[rgb(0,0,238)]"
        >
          {{ t('register.back-login') }}
        </router-link>
      </main>
    </div>
  </div>
</template>
