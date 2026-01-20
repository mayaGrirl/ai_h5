<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { getMemberCapital, memberCapitalTransfer } from '@/api/customer'
import { toast } from '@/composables/useToast'
import type { MemberCapital } from '@/types/customer.type'
import PageHeader from '@/components/PageHeader.vue'

const router = useRouter()
const { t } = useI18n()
const memberCapital = ref<MemberCapital>()

const radioOptions = [
  { value: 'in', label: '转入银行' },
  { value: 'out', label: '转出银行' }
]

onMounted(async () => {
  try {
    const { data } = await getMemberCapital()
    memberCapital.value = data
  } catch (error) {
    console.error('获取资金信息失败', error)
  }
})

const schema = computed(() => toTypedSchema(
  z.object({
    type: z.string(),
    amount: z.number({ message: '请输入金额' })
      .int('金额必须为整数')
      .positive('金额必须大于0'),
    pay_password: z.string().optional()
  }).superRefine((data, ctx) => {
    if (data.type === 'out' && !data.pay_password) {
      ctx.addIssue({
        path: ['pay_password'],
        message: '转出需要输入支付密码',
        code: 'custom'
      })
    }
  }).superRefine((data, ctx) => {
    const max = data.type === 'out' ? memberCapital.value?.bankpoints : memberCapital.value?.points
    if (max !== undefined && data.amount > max) {
      ctx.addIssue({
        path: ['amount'],
        message: '金额超出可用余额',
        code: 'custom'
      })
    }
  })
))

const { handleSubmit, errors, defineField, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: {
    type: 'in',
    amount: undefined as number | undefined,
    pay_password: ''
  }
})

const [type] = defineField('type')
const [amount] = defineField('amount')
const [pay_password] = defineField('pay_password')

const onSubmit = handleSubmit(async (formValues) => {
  try {
    const result = await memberCapitalTransfer({
      type: formValues.type,
      amount: formValues.amount!,
      pay_password: formValues.pay_password
    })
    const { code, message } = result
    if (code !== 200) {
      toast.error(message)
    } else {
      toast.success(message)
      router.back()
    }
  } catch (error) {
    toast.error('操作失败，请稍后重试')
  }
})

</script>

<template>
  <div class="flex min-h-screen justify-center bg-[#eef3f8]">
    <div class="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
      <PageHeader :title="t('mine.setting.landmark')" />

      <div class="grid grid-cols-2 gap-2 px-3 pt-3">
        <div class="flex justify-center items-center px-3 py-3 bg-white rounded-lg">
          <div class="text-gray-500">积分</div>
          <div class="flex items-center gap-1 text-red-500 font-semibold">
            {{ (memberCapital?.points ?? 0).toLocaleString() }}
            <img
              alt="coin"
              class="inline-block w-[13px] h-[13px]"
              src="/ranking/coin.png"
            />
          </div>
        </div>

        <div class="flex justify-center items-center px-3 py-3 bg-white rounded-lg">
          <div class="text-gray-500">转入银行</div>
          <div class="flex items-center gap-1 text-red-500 font-semibold">
            {{ (memberCapital?.bankpoints ?? 0).toLocaleString() }}
            <img
              alt="coin"
              class="inline-block w-[13px] h-[13px]"
              src="/ranking/coin.png"
            />
          </div>
        </div>
      </div>

      <form @submit.prevent="onSubmit" class="w-full bg-gray-100 px-3 py-4">
        <div class="bg-white rounded-lg mb-3 overflow-hidden">
          <div class="flex items-center px-4 py-3 border-b">
            <label class="w-2/7 text-gray-700">类型</label>
            <label
              v-for="option in radioOptions"
              :key="option.value"
              :class="[
                'flex items-center gap-3 px-4 py-3 cursor-pointer',
                type === option.value ? 'text-blue-600' : 'text-gray-700'
              ]"
            >
              <input
                type="radio"
                :value="option.value"
                v-model="type"
                class="hidden"
              />
              <span
                :class="[
                  'flex h-4 w-4 items-center justify-center rounded-full border',
                  type === option.value
                    ? 'border-red-600 bg-red-600'
                    : 'border-gray-300'
                ]"
              >
                <span v-if="type === option.value" class="h-2 w-2 rounded-full bg-white"></span>
              </span>
              <span class="text-sm">{{ option.label }}</span>
            </label>
          </div>

          <!-- 金额 -->
          <div class="flex items-center px-4 py-3">
            <label class="w-2/7 text-gray-700">金额</label>
            <input
              type="text"
              v-model.number="amount"
              placeholder="请输入金额"
              class="text-gray-600 w-5/7 placeholder-gray-400 focus:outline-none h-10"
              @input="(e: Event) => {
                const target = e.target as HTMLInputElement
                target.value = target.value.replace(/[^\d]/g, '')
              }"
            />
          </div>
          <p v-if="errors.amount" class="mt-1 px-4 text-xs text-red-500">{{ errors.amount }}</p>

          <!-- 二级密码 -->
          <template v-if="type === 'out'">
            <div class="flex items-center px-4 py-3 border-t">
              <label class="w-2/7 text-gray-700">支付密码</label>
              <input
                type="password"
                v-model="pay_password"
                placeholder="请输入支付密码"
                class="text-gray-600 w-5/7 placeholder-gray-400 focus:outline-none h-10"
              />
            </div>
            <p v-if="errors.pay_password" class="mt-1 px-4 text-xs text-red-500">{{ errors.pay_password }}</p>
          </template>
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
          {{ isSubmitting ? '提交中...' : '确认提交' }}
        </button>
      </form>

      <div class="h-14"></div>
    </div>
  </div>
</template>
