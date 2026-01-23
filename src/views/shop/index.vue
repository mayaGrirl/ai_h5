<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronRight } from 'lucide-vue-next'
import { toast } from '@/composables/useToast'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import Decimal from 'decimal.js'
import { cardDetail, cardExchange } from '@/api/shop'
import type { CardDetailResponse } from '@/types/shop.type'
import { SAFE_QUESTION_OPTIONS } from '@/constants'
import ReceiveSms from '@/components/ReceiveSms.vue'

// 手续费
const free = 0.02

const { t } = useI18n()

// 页面初始化查询数据
const loading = ref(true)
// 温馨提示
const tipContent = ref<string | null>(null)
// 兑换卡密需要的明细数据
const detailData = ref<CardDetailResponse>()
// 是否可以提交表单
const isSubmit = ref(true)
// 免除手续费的可领取金豆
const exemptCommissionBankPoints = ref(0)
// 金豆金额
const amountPoints = ref(0)
// 表单key用于重置
const formKey = ref(0)
// 短信验证码
const verifyCode = ref('')

// 验证类型: safeQuestion 或 smsVerify
const verifyType = computed(() => detailData.value?.prize_verify_type || 'safeQuestion')

// 表单验证schema
const schema = computed(() =>
  toTypedSchema(
    z.object({
      amount: z.number({ message: t('mine.transfer.amount-placeholder') })
        .int(t('mine.transfer.amount-verify-int'))
        .positive(t('mine.transfer.amount-verify-gt0'))
        .refine((v) => v % 100 === 0, {
          message: t('shop.form-placeholder-1')
        })
        .refine((v) => {
          const max = detailData.value?.bank_points
          return max === undefined || v <= max
        }, {
          message: t('shop.form-amount-verify-max')
        }),
      commission: z.number().optional(),
      safe_ask: verifyType.value === 'safeQuestion'
        ? z.string().min(1, t('mine.toolcase.question-options.default'))
        : z.string().optional(),
      answer: verifyType.value === 'safeQuestion'
        ? z.string()
            .min(1, t('common.form.placeholder.enter') + t('mine.toolcase.form-label.answer'))
            .max(50, t('mine.security-settings.group-account.password.answer-max'))
        : z.string().optional()
    })
  )
)

const { handleSubmit, errors, setFieldValue, resetForm, values } = useForm({
  validationSchema: schema,
  initialValues: {
    amount: undefined as number | undefined,
    commission: 0,
    safe_ask: '',
    answer: ''
  }
})

// 格式化数字
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('zh-CN').format(num)
}

// 格式化货币
const formatCurrency = (num: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(num)
}

const fetchData = async (isTip: boolean) => {
  loading.value = true
  try {
    const { data, code } = await cardDetail()
    if (code === 200) {
      // 设置温馨提示
      if (isTip) tipContent.value = data?.block_content || ''
      // 设置明细数据
      detailData.value = data
      // 免除手续费的可领取金豆
      exemptCommissionBankPoints.value = data.exempt_commission_bank_points || 0

      // 银行存款
      const bankPoints = data.bank_points || 0

      /**
       * 会员所在的分组是否允许兑换
       * 银行存款必须大于100
       */
      if (data.is_allowed_exchange && bankPoints >= 100) {
        isSubmit.value = false
      }
    }
  } catch (error) {
    console.error('获取兑换明细失败:', error)
  } finally {
    loading.value = false
  }
}

// 金额输入处理
const handleAmountInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  // 只保留数字
  const _v = Number(target.value.replace(/[^\d]/g, ''))
  setFieldValue('amount', _v || undefined)

  // 输入金额转换成金豆
  const _p = _v * 1000
  amountPoints.value = _p

  // 公式：会员输入的金额 - 可抵消手续费的金豆 * 手续费比例 / 1000(转换成金额)
  const commission = new Decimal(_p)
    .sub(exemptCommissionBankPoints.value)
    .mul(free)
    .div(1000)
    .ceil()
    .toNumber()

  setFieldValue('commission', Math.max(0, commission))
}

// 提交表单
const isSubmitting = ref(false)
const onSubmit = handleSubmit(async (formValues) => {
  if (!detailData.value?.is_allowed_exchange) {
    toast.info(t('shop.verify-is-allowed-exchange', { text: detailData.value?.gid_name }))
    return
  }

  // 短信验证码验证
  if (verifyType.value === 'smsVerify' && !verifyCode.value) {
    toast.error(t('common.sms-verify_code-placeholder'))
    return
  }

  isSubmitting.value = true
  try {
    const result = await cardExchange({
      amount: amountPoints.value,
      commission: 0,
      safe_ask: formValues.safe_ask,
      answer: formValues.answer,
      verify_code: verifyType.value === 'smsVerify' ? verifyCode.value : ''
    })
    const { code, message } = result
    if (code !== 200) {
      toast.error(message)
    } else {
      toast.success(message)
      await fetchData(false)
      resetForm()
      amountPoints.value = 0
      verifyCode.value = ''
      formKey.value++
    }
  } catch (error) {
    toast.error('兑换失败')
  } finally {
    isSubmitting.value = false
  }
})

onMounted(() => {
  fetchData(true)
})
</script>

<template>
  <div class="flex min-h-screen justify-center bg-[#eef3f8]">
    <!-- 中间内容区域，控制最大宽度模拟手机界面 -->
    <div class="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
      <header class="h-16 flex items-center justify-center bg-red-600 text-white">
        <span class="text-white text-2xl font-black tracking-wide">商城</span>
      </header>

      <!-- tabs -->
      <div class="grid grid-cols-2 gap-2 px-3 pt-3">
        <router-link
          to="/shop/record"
          class="flex justify-center items-center px-3 py-3 bg-white rounded-lg"
        >
          <div class="text-black flex items-center">
            {{ t('shop.tab-1') }}
            <ChevronRight class="h-5 w-5" />
          </div>
        </router-link>

        <router-link
          to="/mine/toolcase"
          class="flex justify-center items-center px-3 py-3 bg-white rounded-lg"
        >
          <div class="text-black flex items-center">
            {{ t('shop.tab-2') }}
            <ChevronRight class="h-5 w-5" />
          </div>
        </router-link>
      </div>

      <!-- 余额 -->
      <div class="w-full bg-gray-100 px-3 py-4">
        <div class="bg-white rounded-lg mb-3 overflow-hidden">
          <!-- 银行余额 -->
          <div class="grid grid-cols-2 gap-2 items-center px-3 pt-3 bg-white border-b rounded-lg">
            <div>
              <div class="flex items-center gap-1 text-red-500 font-semibold">
                <div class="text-gray-500">{{ t('shop.items-1') }}</div>
                {{ formatNumber(detailData?.bank_points || 0) }}
                <img
                  alt="coin"
                  class="inline-block w-[13px] h-[13px]"
                  src="/ranking/coin.png"
                />
              </div>
              <router-link
                to="/mine/customer-transfer"
                class="flex text-xs text-amber-600"
              >
                {{ t('shop.items-2') }}
                <ChevronRight class="h-4 w-4" />
              </router-link>
            </div>
            <!-- 折合 -->
            <div class="flex items-center gap-1 text-red-500 font-semibold">
              <div class="text-gray-500">{{ t('shop.items-3') }}</div>
              {{ formatCurrency((detailData?.bank_points_convert || 0)) }}
            </div>
          </div>
          <!-- 金豆余额 -->
          <div class="grid grid-cols-2 gap-2 items-center px-3 py-3 bg-white rounded-lg">
            <div>
              <div class="flex items-center gap-1 text-red-500 font-semibold">
                <div class="text-gray-500">{{ t('shop.items-4') }}</div>
                {{ formatNumber(detailData?.points || 0) }}
                <img
                  alt="coin"
                  class="inline-block w-[13px] h-[13px]"
                  src="/ranking/coin.png"
                />
              </div>
            </div>
            <!-- 7日流水 -->
            <div class="flex items-center gap-1 text-red-500 font-semibold">
              <div class="text-gray-500">{{ t('shop.items-5') }}</div>
              {{ formatNumber(detailData?.week_water || 0) }}
              <img
                alt="coin"
                class="inline-block w-[13px] h-[13px]"
                src="/ranking/coin.png"
              />
            </div>
          </div>
        </div>
      </div>

      <form :key="formKey" @submit.prevent="onSubmit" class="w-full bg-gray-100 px-3 pb-8">
        <div class="bg-white rounded-lg mb-3 overflow-hidden">
          <!-- 金额 -->
          <div class="flex items-center px-4 pt-3">
            <label class="w-[30%] text-gray-700" for="amount">{{ t('shop.form-label-1') }}</label>
            <input
              type="text"
              id="amount"
              pattern="[0-9]*"
              inputmode="numeric"
              :placeholder="t('shop.form-placeholder-1')"
              class="w-[70%] text-gray-600 placeholder-gray-400 focus:outline-none h-10"
              @input="handleAmountInput"
              autocomplete="off"
              autocorrect="off"
              spellcheck="false"
            />
          </div>
          <p v-if="errors.amount" class="mt-1 px-4 text-xs text-red-500">{{ errors.amount }}</p>

          <!-- 折合金豆 -->
          <div class="flex items-center px-4 pt-3 text-[#cccccc]">
            <div class="w-[30%]">折合金豆</div>
            <div class="w-[70%]">
              <img
                src="/ranking/coin.png"
                alt="gold"
                class="inline-block ml-1 w-[13px] h-[13px] mr-1"
              />
              {{ amountPoints > 0 ? formatNumber(amountPoints) : 0 }}
            </div>
          </div>

          <!-- 手续费 -->
          <div class="flex items-center px-4 py-3">
            <label class="w-[30%] text-gray-700" for="commission">{{ t('shop.form-label-2') }}</label>
            <input
              type="text"
              id="commission"
              pattern="[0-9]*"
              inputmode="numeric"
              disabled
              :value="values.commission || 0"
              class="text-gray-600 w-[70%] placeholder-gray-400 focus:outline-none h-10 bg-transparent"
            />
          </div>

          <!-- 密保问题验证 -->
          <template v-if="verifyType === 'safeQuestion'">
            <!-- 密保问题 -->
            <div class="flex items-center px-4 py-3">
              <label class="w-[30%] text-gray-700">{{ t('mine.toolcase.form-label.question') }}</label>
              <select
                class="w-[70%] h-11 text-gray-600 focus:outline-none border rounded-lg px-2"
                @change="(e) => setFieldValue('safe_ask', (e.target as HTMLSelectElement).value)"
              >
                <option value="">
                  {{ loading ? t('common.loading') : t('mine.toolcase.question-options.default') }}
                </option>
                <option
                  v-for="option in SAFE_QUESTION_OPTIONS"
                  :key="option.value"
                  :value="String(option.value)"
                >
                  {{ t(option.i18nKey) }}
                </option>
              </select>
            </div>
            <p v-if="errors.safe_ask" class="mt-1 px-4 text-xs text-red-500">{{ errors.safe_ask }}</p>

            <!-- 答案 -->
            <div class="flex items-center px-4 py-3">
              <label class="w-[30%] text-gray-700">{{ t('mine.toolcase.form-label.answer') }}</label>
              <input
                type="text"
                :placeholder="t('common.form.placeholder.enter') + t('mine.toolcase.form-label.answer')"
                @input="(e) => setFieldValue('answer', (e.target as HTMLInputElement).value)"
                class="text-gray-600 w-[70%] placeholder-gray-400 focus:outline-none h-10"
                autocomplete="off"
                autocorrect="off"
                spellcheck="false"
              />
            </div>
            <p v-if="errors.answer" class="mt-1 px-4 text-xs text-red-500">{{ errors.answer }}</p>
          </template>

          <!-- 短信验证码验证 -->
          <template v-if="verifyType === 'smsVerify'">
            <div class="flex items-center px-4 py-3">
              <label class="w-[30%] text-gray-700">{{ t('common.sms-verify_code-label') }}</label>
              <div class="w-[70%] flex items-center gap-2 flex-nowrap">
                <ReceiveSms
                  v-model="verifyCode"
                  scene="exchange_card"
                  :disabled="isSubmitting"
                />
              </div>
            </div>
          </template>
        </div>

        <div class="rounded-lg mb-3 overflow-hidden">
          <div class="flex items-center text-gray-600 px-4 py-3 pb-0">
            <span class="w-1 h-4 bg-red-600 rounded mr-2"></span>
            {{ t('mine.security-settings.group-account.password.tip') }}
          </div>

          <!-- 异步加载温馨提示 -->
          <template v-if="loading">
            <div class="px-4 py-1 space-y-2">
              <div v-for="i in 8" :key="i" class="h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </template>
          <div
            v-else
            class="px-4 py-1 text-gray-600"
            v-html="tipContent"
          ></div>
        </div>

        <!-- 确认按钮 -->
        <div class="fixed bottom-14 left-1/2 -translate-x-1/2 w-full max-w-xl px-3 py-2">
          <button
            type="submit"
            :disabled="isSubmitting || isSubmit"
            :class="[
              'h-12 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white font-medium tracking-wide',
              (isSubmitting || isSubmit) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer transition transform active:scale-95'
            ]"
          >
            {{ isSubmitting ? t('common.form.button.submitting') : t('common.form.button.submit') }}
          </button>
        </div>
      </form>

      <!-- 底部占位（给 TabBar 留空间） -->
      <div class="h-18"></div>
    </div>
  </div>
</template>
