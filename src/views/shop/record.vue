<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ChevronLeft } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { toast } from '@/composables/useToast'
import { depositRecords } from '@/api/customer'
import type { DepositRecordField } from '@/types/customer.type'

const router = useRouter()
const { t } = useI18n()

const list = ref<DepositRecordField[]>([])
const page = ref(1)
const hasMore = ref(true)
const loading = ref(false)
const loadMoreRef = ref<HTMLDivElement | null>(null)
let observer: IntersectionObserver | null = null

// 设置 IntersectionObserver
const setupObserver = () => {
  // 先清理旧的 observer
  if (observer) {
    observer.disconnect()
    observer = null
  }

  // 如果没有更多数据或者 ref 不存在，不需要设置
  if (!hasMore.value || !loadMoreRef.value) return

  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !loading.value && hasMore.value) {
        const nextPage = page.value + 1
        page.value = nextPage
        fetchData(nextPage)
      }
    },
    { threshold: 0.1 }
  )
  observer.observe(loadMoreRef.value)
}

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

const fetchData = async (pageNo: number) => {
  loading.value = true
  try {
    // 请求接口
    const { code, data, message } = await depositRecords({
      search: { type: 14 },
      pagination: {
        page: pageNo,
        size: 20
      }
    })
    await new Promise((r) => setTimeout(r, 554))
    if (code === 200) {
      if (data.length < 20) {
        hasMore.value = false
      }
      if (pageNo === 1) {
        list.value = []
      }
      list.value = [...list.value, ...data]
    } else {
      toast.error(message)
    }
  } catch (error) {
    toast.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 监听列表变化，在 DOM 更新后重新设置 observer
watch(list, () => {
  nextTick(() => {
    setupObserver()
  })
})

onMounted(() => {
  fetchData(1)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="flex min-h-screen justify-center bg-[#eef3f8]">
    <!-- 中间内容区域，控制最大宽度模拟手机界面 -->
    <div class="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
      <header class="sticky top-0 z-40 bg-gradient-to-r from-red-600 to-red-500">
        <div class="flex h-12 items-center justify-between px-3">
          <button @click="goBack" class="flex items-center text-white">
            <ChevronLeft class="h-5 w-5" />
          </button>
          <span class="text-white font-bold">兑换记录</span>
          <div class="w-5"></div>
        </div>
      </header>

      <!-- 子页面渲染区域 -->
      <div class="p-2">
        <!-- 表头 -->
        <div class="grid grid-cols-[1fr_1fr_1fr] px-3 py-2 text-xs text-gray-500 border-b bg-white">
          <div>{{ t('shop.record-grid-1') }}</div>
          <div class="text-center">{{ t('shop.record-grid-2') }}</div>
          <div class="text-right">{{ t('shop.record-grid-3') }}</div>
        </div>

        <div
          v-for="(item, index) in list"
          :key="`all-key-${index}`"
          class="grid grid-cols-[1fr_1fr_1fr] px-3 py-1 border-b items-center bg-white"
        >
          <!-- 记录日期 -->
          <div class="flex justify-start items-center gap-1 font-medium">
            {{ item?.created_at }}
          </div>

          <!-- 兑换金豆 -->
          <div class="text-center font-medium">
            <div class="text-red-500 flex items-center text-center justify-center">
              {{ formatNumber(item.deposit ?? 0) }}
              <img
                src="/ranking/coin.png"
                alt="coin"
                class="inline-block w-[13px] h-[13px]"
              />
            </div>
            <div class="text-xs">{{ formatCurrency((item.deposit ?? 0) / 1000) }}</div>
          </div>

          <!-- 银行余额 -->
          <div class="flex flex-col items-end font-medium">
            <div class="text-red-500 flex items-center text-center justify-center">
              {{ formatNumber(item.a_deposit ?? 0) }}
              <img
                src="/ranking/coin.png"
                alt="coin"
                class="inline-block w-[13px] h-[13px]"
              />
            </div>
            <div class="text-xs">{{ formatCurrency((item.a_deposit ?? 0) / 1000) }}</div>
          </div>
        </div>

        <!-- 底部哨兵 -->
        <div v-if="hasMore" ref="loadMoreRef" class="py-4 text-center text-xs text-gray-400">
          {{ loading ? t('common.loading') : t('common.loading-hit') }}
        </div>

        <div v-if="!hasMore" class="py-4 text-center text-xs text-gray-400">
          {{ t('common.loading-list-empty') }}
        </div>
      </div>

      <!-- 底部占位（给 TabBar 留空间） -->
      <div class="h-14"></div>
    </div>
  </div>
</template>
