<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Eye, EyeOff } from 'lucide-vue-next'
import { forgotPasswordSendSms, forgotPasswordVerifyCode, forgetPasswordReset } from '@/api/auth'
import { httpConfigRKey } from '@/api/common'
import { toast } from '@/composables/useToast'
import SodiumEncryptor from '@/utils/sodium'
import { cn } from '@/utils'

const router = useRouter()
const { t } = useI18n()

// 倒计时页面刷新继续保持的存储key
const STORAGE_KEY = 'sms_countdown_end_at_find_password'

// 步骤: 1=短信验证 2=重置密码
const step = ref<1 | 2>(1)

// Step1 表单数据
const mobile = ref('')
const verifyCode = ref('')
const step1Loading = ref(false)

// Step2 表单数据
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const step2Loading = ref(false)

// 公共状态
const smsLoading = ref(false)
const countdown = ref(0)
const publicKey = ref('')
const isDisable = ref(true)

// 倒计时定时器
let timer: ReturnType<typeof setTimeout> | null = null

// 初始化
onMounted(() => {
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
    const res = await forgotPasswordSendSms(mobile.value)
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

// Step1: 验证验证码
const handleVerify = async () => {
  if (!mobile.value || !verifyCode.value || step1Loading.value) return

  step1Loading.value = true
  try {
    const res = await forgotPasswordVerifyCode({
      mobile: mobile.value,
      verify_code: verifyCode.value,
      password: '',
      confirm_password: ''
    })

    if (res.code === 200) {
      toast.success(res.message || '验证成功')
      step.value = 2
    } else {
      toast.error(res.message || t('common.catch-error'))
    }
  } catch {
    toast.error(t('common.catch-error'))
  } finally {
    step1Loading.value = false
  }
}

// Step2: 重置密码
const handleResetPassword = async () => {
  if (!password.value || !confirmPassword.value || step2Loading.value) return

  if (password.value !== confirmPassword.value) {
    toast.error(t('register.confirm_password-eq'))
    return
  }

  step2Loading.value = true
  try {
    // 加密密码
    const encryptedPassword = await SodiumEncryptor.encrypt(password.value, publicKey.value)
    const encryptedConfirmPassword = await SodiumEncryptor.encrypt(confirmPassword.value, publicKey.value)

    const res = await forgetPasswordReset({
      mobile: mobile.value,
      verify_code: verifyCode.value,
      password: encryptedPassword,
      confirm_password: encryptedConfirmPassword
    })

    if (res.code === 200) {
      toast.success(res.message || '重置成功')
      router.replace('/auth/login')
    } else {
      toast.error(res.message || t('common.catch-error'))
    }
  } catch {
    toast.error(t('common.catch-error'))
  } finally {
    step2Loading.value = false
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
      <div class="pt-13 flex items-center justify-center">
        <img src="/login-logo.png" alt="Login" class="w-32 h-auto" />
      </div>

      <!-- Step 指示 -->
      <div class="px-4 pt-4">
        <div class="flex items-center justify-between text-sm p-14 pt-0 pb-0">
          <div class="flex items-center gap-2">
            <span :class="cn(
              'h-2.5 w-2.5 rounded-full',
              step === 1 ? 'bg-red-600' : 'bg-gray-300'
            )"/>
            <span :class="cn(step === 1 ? 'text-gray-900 font-medium' : 'text-gray-500')">
              {{ t('forgot-password.submit-step1') }}
            </span>
          </div>
          <div class="flex-1 mx-2 h-[1px] bg-gray-200"/>
          <div class="flex items-center gap-2">
            <span :class="cn(
              'h-2.5 w-2.5 rounded-full',
              step === 2 ? 'bg-red-600' : 'bg-gray-300'
            )"/>
            <span :class="cn(step === 2 ? 'text-gray-900 font-medium' : 'text-gray-500')">
              {{ t('forgot-password.submit-step2') }}
            </span>
          </div>
        </div>
      </div>

      <!-- 内容 -->
      <main class="px-3 pb-20 pt-4">
        <!-- Step1: 验证手机 -->
        <form v-if="step === 1" @submit.prevent="handleVerify" class="space-y-3">
          <div class="bg-white rounded-xl shadow-sm p-3">
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
            <div class="flex justify-center items-center">
              <label class="w-1/4 text-gray-700">{{ t('common.sms-verify_code-label') }}</label>
              <div class="flex w-3/4 items-center gap-2">
                <input
                  type="text"
                  :placeholder="t('common.sms-verify_code-placeholder')"
                  v-model="verifyCode"
                  class="flex-1 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
                />
                <button
                  type="button"
                  :disabled="countdown > 0 || smsLoading || isDisable"
                  @click="handleSendSms"
                  :class="cn(
                    'h-8 px-3 rounded text-xs whitespace-nowrap transition',
                    countdown > 0 || smsLoading || isDisable
                      ? 'bg-gray-600 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white active:scale-95 cursor-pointer'
                  )"
                >
                  {{ smsLoading ? t('common.sms-verify_code-sending') : countdown > 0 ? `${countdown}s` : t('common.sms-verify_code-send-btn') }}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            :disabled="step1Loading"
            class="w-full h-12 rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white font-medium"
          >
            {{ step1Loading ? t('common.form.button.submitting') : t('forgot-password.submit-btn1') }}
          </button>
        </form>

        <!-- Step2: 重置密码 -->
        <form v-else @submit.prevent="handleResetPassword" class="space-y-3">
          <div class="bg-white rounded-xl shadow-sm p-3">
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

          <button
            type="submit"
            :disabled="step2Loading"
            class="w-full h-12 rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white font-medium"
          >
            {{ step2Loading ? t('common.form.button.submitting') : t('forgot-password.submit-btn2') }}
          </button>

          <button
            type="button"
            class="w-full text-gray-500"
            @click="step = 1"
          >
            {{ t('forgot-password.submit-btn3') }}
          </button>
        </form>

        <router-link
          v-if="step === 1"
          to="/auth/login"
          class="flex justify-center items-center mt-6 text-[rgb(0,0,238)]"
        >
          {{ t('common.header.back') }}
        </router-link>
      </main>

      <div class="h-14"/>
    </div>
  </div>
</template>
