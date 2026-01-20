<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { signIn, signStat } from '@/api/customer'
import { toast } from '@/composables/useToast'
import type { SignInStatisticsField } from '@/types/customer.type'

const isSign = ref(false)
const isLoading = ref(false)
const statData = ref<SignInStatisticsField>()

onMounted(async () => {
  try {
    const { data } = await signStat()
    statData.value = data
    if (data.is_sign) {
      isSign.value = true
    }
  } catch (error) {
    console.error('获取签到数据失败', error)
  }
})

const handleSign = async () => {
  if (isSign.value) return

  isLoading.value = true
  try {
    const { code, message, data } = await signIn()
    if (code === 200) {
      toast.success(message)

      if (statData.value) {
        statData.value = {
          total_people: statData.value.total_people + 1,
          total_points: statData.value.total_points + data.total_points,
          total_base_coin: statData.value.total_base_coin + data.total_base_coin,
          continue_days: statData.value.continue_days + 1,
          total_days: statData.value.total_days + 1,
          is_sign: true
        }
      }
      isSign.value = true
    } else {
      toast.error(message)
    }
  } catch (error) {
    toast.error('签到失败')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="px-4 py-4 bg-white rounded-lg">
    <!-- 统计 -->
    <div class="mb-3">
      <div class="bg-[#f5f5f5] py-3 px-3 rounded">
        今日已有 <span class="text-red-600 font-semibold">{{ statData?.total_people || 0 }}</span> 人签到，
        共获得 <span class="text-red-600 font-semibold">{{ statData?.total_points || 0 }}</span> 积分，
        <span class="text-red-600 font-semibold">{{ statData?.total_base_coin || 0 }}</span> 金豆
      </div>
      <div class="bg-[#fffae8] text-[#f79304] py-3 px-3 my-3 rounded">
        您已连续签到 <strong>{{ statData?.continue_days || 0 }}</strong> 天，
        累计签到 <strong>{{ statData?.total_days || 0 }}</strong> 天
      </div>
    </div>

    <!-- 按钮 -->
    <button
      type="button"
      @click="handleSign"
      :class="[
        'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full',
        'flex items-center justify-center text-white text-base font-medium shadow-lg transition-transform',
        'active:scale-95',
        isSign || isLoading ? 'bg-[#cccccc]' : 'bg-[#ff5a1f]'
      ]"
    >
      {{ isSign ? '已签到' : isLoading ? '签到中...' : '点击签到' }}
    </button>
  </div>
</template>
