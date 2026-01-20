<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getReliefData, receiveRelief } from '@/api/customer'
import { toast } from '@/composables/useToast'
import type { MemberLevel } from '@/types/customer.type'
import PageHeader from '@/components/PageHeader.vue'

const { t } = useI18n()

const loading = ref(true)
const isSubmitting = ref(true)
const levelList = ref<MemberLevel[]>([])
const remainingReceiveCount = ref(0)
const limit = ref(10)

// 加载救济数据
const loadReliefData = async () => {
  loading.value = true
  try {
    const res = await getReliefData()
    if (res.code === 200 && res.data) {
      levelList.value = res.data.options || []
      limit.value = res.data.limit || 10

      let remaining = 0
      if (res.data.limit > res.data.receive_count) {
        remaining = res.data.limit - res.data.receive_count
      }
      remainingReceiveCount.value = remaining

      if (remaining > 0) {
        isSubmitting.value = false
      }
    }
  } catch (error) {
    console.error('加载救济数据失败', error)
  } finally {
    loading.value = false
  }
}

// 领取救济
const handleSubmit = async () => {
  if (remainingReceiveCount.value < 1) {
    toast.error(t('mine.relief.receive-limit-hit'))
    return
  }

  try {
    const res = await receiveRelief()
    if (res.code === 200) {
      toast.success(res.message || '领取成功')
      remainingReceiveCount.value = remainingReceiveCount.value - 1
    } else {
      toast.error(res.message || '领取失败')
    }
  } catch (error) {
    toast.error('领取失败')
  }
}

onMounted(() => {
  loadReliefData()
})
</script>

<template>
  <div class="min-h-screen bg-[#f5f7fb] pb-16">
    <PageHeader :title="t('mine.quick.relief')" />

    <div class="p-2 pt-4">
      <!-- 表头 -->
      <div class="grid grid-cols-[0.5fr_1fr_1.5fr] px-3 py-2 text-xs text-gray-500 border-b bg-white rounded-t-lg">
        <div class="flex items-center justify-center">{{ t('mine.relief.table-header-1') }}</div>
        <div class="flex items-center justify-center">{{ t('mine.relief.table-header-2') }}</div>
        <div class="flex justify-center items-center">{{ t('mine.relief.table-header-3') }}</div>
      </div>

      <!-- 骨架屏 -->
      <template v-if="loading">
        <div
          v-for="i in 11"
          :key="i"
          class="grid grid-cols-[0.5fr_1fr_1.5fr] px-3 py-3 border-b bg-white"
        >
          <div class="flex justify-center">
            <div class="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div class="flex justify-center">
            <div class="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div class="flex justify-center">
            <div class="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </template>

      <!-- 实际数据 -->
      <template v-else>
        <div
          v-for="(item, index) in levelList"
          :key="index"
          class="grid grid-cols-[0.5fr_1fr_1.5fr] px-3 py-3 border-b text-sm items-center bg-white"
        >
          <div class="flex items-center justify-center">
            <img
              :src="`/mine/level/${item.level}.png`"
              :alt="item.name || ''"
              class="w-[15px] h-[15px]"
            />
          </div>
          <div class="flex justify-center items-center gap-1 text-red-500 font-medium">
            {{ item.day_jiuji_point }}
            <img src="/ranking/coin.png" alt="coin" class="inline-block w-[13px] h-[13px]" />
          </div>
          <div class="flex justify-center items-center font-medium text-xs text-gray-600">
            金豆≤{{ item.day_jiuji_point }}时可领取，每日{{ limit }}次
          </div>
        </div>
      </template>
    </div>

    <!-- 领取按钮 -->
    <div class="px-3 mt-6">
      <button
        :disabled="isSubmitting"
        :class="[
          'h-12 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white font-medium tracking-wide transition transform active:scale-95',
          isSubmitting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        ]"
        @click="handleSubmit"
      >
        领取救济金（剩余{{ remainingReceiveCount }}次）
      </button>
    </div>
  </div>
</template>
