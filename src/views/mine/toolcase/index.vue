<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { checkSecurityPass } from '@/api/customer'
import { cardRecords } from '@/api/shop'
import { toast } from '@/composables/useToast'
import { SAFE_QUESTION_OPTIONS } from '@/constants'
import type { CardRecordField } from '@/types/shop.type'
import PageHeader from '@/components/PageHeader.vue'
import dayjs from 'dayjs'

const { t } = useI18n()

// 验证状态
const verified = ref<boolean | null>(null)
const isSubmitting = ref(false)

// 表单数据
const formData = ref({
  safe_ask: '',
  answer: ''
})
const errors = ref<Record<string, string>>({})

// 安全Token存储
const SECURE_TOKEN_KEY = 'toolcase_secure_token'
const SECURE_TOKEN_EXPIRE_KEY = 'toolcase_secure_token_expire'

const getSecureToken = () => {
  const token = localStorage.getItem(SECURE_TOKEN_KEY)
  const expire = localStorage.getItem(SECURE_TOKEN_EXPIRE_KEY)

  if (!token || !expire) return null

  const expireTime = parseInt(expire, 10)
  if (Date.now() > expireTime) {
    localStorage.removeItem(SECURE_TOKEN_KEY)
    localStorage.removeItem(SECURE_TOKEN_EXPIRE_KEY)
    return null
  }

  return token
}

const setSecureToken = (token: string, ttlSeconds: number) => {
  localStorage.setItem(SECURE_TOKEN_KEY, token)
  localStorage.setItem(SECURE_TOKEN_EXPIRE_KEY, String(Date.now() + ttlSeconds * 1000))
}

const clearSecureToken = () => {
  localStorage.removeItem(SECURE_TOKEN_KEY)
  localStorage.removeItem(SECURE_TOKEN_EXPIRE_KEY)
}

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

// 提交验证
const handleSubmit = async () => {
  if (!validate()) return

  isSubmitting.value = true
  try {
    const res = await checkSecurityPass({
      safe_ask: formData.value.safe_ask,
      answer: formData.value.answer
    })

    if (res.code === 200) {
      toast.success(res.message || '验证成功')
      verified.value = true
      secureToken.value = res.data.key
      setSecureToken(res.data.key, 480)
      // 加载卡密记录
      await fetchCardRecords(1)
    } else {
      toast.error(res.message || '验证失败')
    }
  } catch (error) {
    toast.error('验证失败')
  } finally {
    isSubmitting.value = false
  }
}

// ================ 卡密记录相关 ================
const secureToken = ref('')
const cardList = ref<CardRecordField[]>([])
const cardPage = ref(1)
const cardHasMore = ref(true)
const cardLoading = ref(false)
const loadMoreRef = ref<HTMLDivElement | null>(null)
let observer: IntersectionObserver | null = null

// 掩码字符串
const maskString = (str: string) => {
  if (!str || str.length <= 4) return str
  const start = str.substring(0, 2)
  const end = str.substring(str.length - 2)
  return `${start}****${end}`
}

// 格式化时间
const formatDate = (timestamp: number | undefined) => {
  if (!timestamp) return ''
  return dayjs.unix(timestamp).format('YYYY-MM-DD')
}

const formatTime = (timestamp: number | undefined) => {
  if (!timestamp) return ''
  return dayjs.unix(timestamp).format('HH:mm')
}

// 请求卡密数据
const fetchCardRecords = async (pageNum: number) => {
  if (cardLoading.value) return

  cardLoading.value = true
  try {
    const res = await cardRecords({
      search: { t: secureToken.value },
      pagination: { page: pageNum, size: 20 }
    })

    if (res.code === 200) {
      const data = res.data || []
      if (data.length < 20) {
        cardHasMore.value = false
      }
      if (pageNum === 1) {
        cardList.value = data
      } else {
        cardList.value = [...cardList.value, ...data]
      }
      cardPage.value = pageNum
    } else if (res.code === 2002) {
      // token过期
      cardHasMore.value = false
      toast.error(res.message || '验证已过期，请重新验证')
      handleTokenExpired()
    } else {
      cardHasMore.value = false
      toast.error(res.message || '获取数据失败')
    }
  } catch (error) {
    cardHasMore.value = false
    toast.error('获取数据失败')
  } finally {
    cardLoading.value = false
  }
}

// 刷新列表
const refreshList = async () => {
  cardHasMore.value = true
  cardPage.value = 1
  cardList.value = []
  await fetchCardRecords(1)
}

// Token过期处理
const handleTokenExpired = () => {
  clearSecureToken()
  verified.value = false
  secureToken.value = ''
  cardList.value = []
}

// 复制单个卡密
const handleCopy = async (no: string, pwd: string) => {
  const copiedText = `${no} ${pwd}`
  try {
    await navigator.clipboard.writeText(copiedText)
    toast.success(t('mine.toolcase.record-copied'))
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = copiedText
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    toast.success(t('mine.toolcase.record-copied'))
  }
}

// 复制所有未使用的卡密
const handleCopyAll = async () => {
  const text = cardList.value
    .filter(item => item.state === 0)
    .map(item => `${item.no} ${item.pwd}`)
    .join('\n')

  if (!text) {
    toast.warning('没有可复制的卡密')
    return
  }

  try {
    await navigator.clipboard.writeText(text)
    toast.success(t('mine.toolcase.record-copied'))
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    toast.success(t('mine.toolcase.record-copied'))
  }
}

// 设置 IntersectionObserver
const setupObserver = () => {
  if (!loadMoreRef.value || !cardHasMore.value) return

  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !cardLoading.value && cardHasMore.value) {
        fetchCardRecords(cardPage.value + 1)
      }
    },
    { threshold: 1 }
  )

  observer.observe(loadMoreRef.value)
}

// 初始化
onMounted(async () => {
  const token = getSecureToken()
  if (token) {
    verified.value = true
    secureToken.value = token
    await fetchCardRecords(1)
    setTimeout(setupObserver, 100)
  } else {
    verified.value = false
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#f5f7fb] pb-16">
    <PageHeader :title="t('mine.setting.toolcase')" />

    <template v-if="verified === null">
      <!-- 加载中 -->
    </template>

    <!-- 未验证：显示验证表单 -->
    <main v-else-if="!verified" class="px-3 pb-20 pt-3">
      <form @submit.prevent="handleSubmit" class="mt-5">
        <div class="bg-white rounded-xl shadow-sm p-3">
          <div class="flex items-center gap-2">
            <label class="text-gray-700 w-16 flex-shrink-0">{{ t('mine.toolcase.form-label.question') }}</label>
            <select
              v-model="formData.safe_ask"
              class="flex-1 text-gray-800 placeholder-gray-400 focus:outline-none h-12 bg-transparent"
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

        <div class="bg-white rounded-xl shadow-sm p-3 mt-2">
          <div class="flex items-center gap-2">
            <label class="text-gray-700 w-16 flex-shrink-0">{{ t('mine.toolcase.form-label.answer') }}</label>
            <input
              v-model="formData.answer"
              type="text"
              :placeholder="t('common.form.placeholder.enter') + t('mine.toolcase.form-label.answer')"
              class="flex-1 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
            />
          </div>
          <p v-if="errors.answer" class="mt-1 text-xs text-red-500">{{ errors.answer }}</p>
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

    <!-- 已验证：显示卡密记录 -->
    <div v-else class="p-1">
      <!-- 操作栏 -->
      <div class="flex justify-between items-center px-3 py-2">
        <span class="text-sm font-medium">{{ t('mine.toolcase.record-title') }}</span>

        <button
          @click="handleCopyAll"
          class="text-xs text-blue-600"
        >
          {{ t('mine.toolcase.record-copy-all') }}
        </button>

        <button
          @click="refreshList"
          :disabled="cardLoading"
          class="text-xs text-blue-600"
        >
          {{ cardLoading ? t('mine.toolcase.record-refresh-pending') : t('mine.toolcase.record-refresh') }}
        </button>
      </div>

      <!-- 表头 -->
      <div class="grid grid-cols-[0.5fr_0.5fr_1fr_0.7fr_0.4fr] py-2 text-xs text-gray-500 border-b bg-white px-1">
        <div>{{ t('mine.toolcase.record-grid-1') }}</div>
        <div class="text-center">{{ t('mine.toolcase.record-grid-2') }}</div>
        <div class="text-center">{{ t('mine.toolcase.record-grid-3') }}</div>
        <div class="text-center">{{ t('mine.toolcase.record-grid-4') }}</div>
        <div class="text-right">{{ t('mine.toolcase.record-grid-5') }}</div>
      </div>

      <!-- 骨架屏 -->
      <template v-if="cardLoading && cardList.length === 0">
        <div v-for="i in 5" :key="i" class="grid grid-cols-[0.5fr_0.5fr_1fr_0.7fr_0.4fr] py-2 border-b px-1 bg-white">
          <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div class="h-4 bg-gray-200 rounded animate-pulse mx-1"></div>
          <div class="h-4 bg-gray-200 rounded animate-pulse mx-1"></div>
          <div class="h-4 bg-gray-200 rounded animate-pulse mx-1"></div>
          <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </template>

      <!-- 空数据 -->
      <div v-else-if="!cardLoading && cardList.length === 0" class="text-center py-8 text-gray-500 bg-white">
        暂无卡密记录
      </div>

      <!-- 卡密列表 -->
      <template v-else>
        <div
          v-for="(item, index) in cardList"
          :key="`card-${index}`"
          class="grid grid-cols-[0.5fr_0.5fr_1fr_0.7fr_0.4fr] py-2 border-b items-center px-1 text-sm bg-white"
        >
          <!-- 卡号 -->
          <div class="font-medium text-xs">
            {{ maskString(item?.no || '') }}
          </div>

          <!-- 密码 -->
          <div class="text-center font-medium text-xs">
            {{ maskString(item?.pwd || '') }}
          </div>

          <!-- 金豆 -->
          <div class="text-center">
            <div class="text-red-500 flex items-center justify-center font-bold text-sm">
              {{ (item?.points || 0).toLocaleString() }}
              <img
                src="/ranking/coin.png"
                alt="coin"
                class="inline-block w-[13px] h-[13px] ml-0.5"
              />
            </div>
            <div class="text-xs text-gray-500">
              ¥{{ ((item?.points || 0) / 1000).toFixed(2) }}
            </div>
          </div>

          <!-- 获得时间 -->
          <div class="flex flex-col items-center justify-center text-xs text-gray-600">
            <div>{{ formatDate(item?.addtime) }}</div>
            <div>{{ formatTime(item?.addtime) }}</div>
          </div>

          <!-- 操作 -->
          <div class="flex flex-col items-end">
            <button
              v-if="item.state === 0"
              @click="handleCopy(item.no || '', item.pwd || '')"
              class="px-1 py-0.5 bg-red-600 text-white text-xs rounded cursor-pointer"
            >
              {{ t('mine.toolcase.record-copy-one') }}
            </button>
            <span v-else class="text-xs text-gray-400">
              {{ item.state_label }}
            </span>
          </div>
        </div>
      </template>

      <!-- 底部加载哨兵 -->
      <div v-if="cardHasMore" ref="loadMoreRef" class="py-4 text-center text-xs text-gray-400">
        {{ cardLoading ? t('common.loading') : t('common.loading-hit') }}
      </div>

      <div v-if="!cardHasMore && cardList.length > 0" class="py-4 text-center text-xs text-gray-400">
        {{ t('common.loading-list-empty') }}
      </div>
    </div>
  </div>
</template>
