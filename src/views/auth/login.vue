<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Eye, EyeOff } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { login, loginSendSmsToMobile } from '@/api/auth'
import { httpConfigRKey } from '@/api/common'
import { toast } from '@/composables/useToast'
import SodiumEncryptor from '@/utils/sodium'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

const redirect = computed(() => (route.query.redirect as string) || '/')

// 倒计时页面刷新继续保持的存储key
const STORAGE_KEY = 'sms_countdown_end_at_login'

// 登录方式: 1=密码登录, 2=短信登录
const loginType = ref<1 | 2>(1)
const mobile = ref('')
const password = ref('')
const code = ref('')
const showPassword = ref(false)
const loading = ref(false)
const smsLoading = ref(false)
const countdown = ref(0)
const publicKey = ref('')
const isDisable = ref(true)

// 倒计时定时器
let timer: ReturnType<typeof setTimeout> | null = null

// 初始化：从 localStorage 恢复倒计时
onMounted(() => {
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
    const res = await loginSendSmsToMobile(mobile.value)
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

// 登录
const handleLogin = async () => {
  if (!mobile.value || loading.value) return
  if (loginType.value === 1 && !password.value) return
  if (loginType.value === 2 && !code.value) return

  loading.value = true
  try {
    let encryptedPassword = ''
    if (loginType.value === 1 && password.value) {
      encryptedPassword = await SodiumEncryptor.encrypt(password.value, publicKey.value)
    }

    const res = await login({
      mobile: mobile.value,
      password: encryptedPassword || undefined,
      code: loginType.value === 2 ? code.value : undefined,
      type: loginType.value
    })

    if (res.code === 200 && res.data?.access_token) {
      toast.success(res.message || '登录成功')
      authStore.setToken(
        res.data.access_token,
        res.data.token_type,
        res.data.expires_at
      )
      await authStore.fetchCurrentCustomer()
      router.replace(redirect.value)
    } else {
      toast.error(res.message || t('common.catch-error'))
    }
  } catch {
    toast.error(t('common.catch-error'))
  } finally {
    loading.value = false
  }
}

// 切换登录方式
const switchLoginType = (type: 1 | 2) => {
  loginType.value = type
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

        <!-- 登录方式切换 -->
        <div class="flex bg-white rounded-full shadow-sm overflow-hidden mt-4">
          <button
            type="button"
            @click="switchLoginType(1)"
            :class="[
              'flex-1 py-2 text-sm font-medium transition cursor-pointer',
              loginType === 1 ? 'bg-[#ff1020] text-white' : 'text-gray-500'
            ]"
          >
            密码登录
          </button>

          <button
            type="button"
            @click="switchLoginType(2)"
            :class="[
              'flex-1 py-2 text-sm font-medium transition cursor-pointer',
              loginType === 2 ? 'bg-[#ff1020] text-white' : 'text-gray-500'
            ]"
          >
            短信登录
          </button>
        </div>

        <form @submit.prevent="handleLogin" class="mt-5">
          <div class="bg-white rounded-xl shadow-sm p-2 border border-gray-100">
            <!-- 手机号 -->
            <div class="flex justify-center items-center border-b border-gray-200">
              <label class="w-1/4 text-gray-700">{{ t('register.mobile-label') }}</label>
              <input
                type="text"
                :placeholder="t('register.mobile-placeholder')"
                :value="mobile"
                @input="onMobileChange"
                class="w-3/4 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
              />
            </div>

            <!-- 密码 -->
            <template v-if="loginType === 1">
              <div class="flex justify-center items-center">
                <label class="w-1/4 text-gray-700">{{ t('register.password-label') }}</label>
                <div class="relative w-3/4">
                  <input
                    :type="showPassword ? 'text' : 'password'"
                    v-model="password"
                    :placeholder="t('register.password-placeholder')"
                    class="text-gray-800 placeholder-gray-400 focus:outline-none h-12 w-full pr-10"
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
            </template>

            <!-- 验证码 -->
            <template v-if="loginType === 2">
              <div class="flex justify-center items-center">
                <label class="w-1/4 text-gray-700">{{ t('common.sms-verify_code-label') }}</label>
                <div class="flex w-3/4 items-center gap-2 flex-wrap sm:flex-nowrap">
                  <input
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    autocomplete="one-time-code"
                    :placeholder="t('common.sms-verify_code-placeholder')"
                    v-model="code"
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
            </template>
          </div>

          <button
            type="submit"
            :disabled="loading"
            :class="[
              'mt-10 h-12 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white font-medium tracking-wide transition transform active:scale-95',
              loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            ]"
          >
            {{ loading ? t('common.form.button.submitting') : t('login.submit-btn') }}
          </button>
        </form>

        <router-link
          to="/auth/register"
          class="mt-3 h-12 w-full flex items-center justify-center rounded-full bg-[#0d6efd] text-white font-medium tracking-wide transition transform active:scale-95"
        >
          {{ t('login.register-btn') }}
        </router-link>

        <router-link
          v-if="loginType === 1"
          to="/auth/forgot-password"
          class="flex justify-center items-center mt-6 text-[rgb(0,0,238)]"
        >
          {{ t('login.forgot-password-btn') }}
        </router-link>
      </main>
    </div>
  </div>
</template>
