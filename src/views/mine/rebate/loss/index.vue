<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { receiveWages, wagesRecords } from '@/api/customer'
import { toast } from '@/composables/useToast'
import type { WagesRecordField } from '@/types/customer.type'
import dayjs from 'dayjs'
import { cn } from '@/utils'

const list = ref<WagesRecordField[]>([])
const page = ref(1)
const hasMore = ref(true)
const loading = ref(false)
const receivingSet = ref<Set<number>>(new Set())
const loadMoreRef = ref<HTMLDivElement | null>(null)
let observer: IntersectionObserver | null = null

const fetchData = async (pageNo: number) => {
  loading.value = true
  try {
    const { code, data, message } = await wagesRecords({
      pagination: {
        page: pageNo,
        size: 20
      }
    })
    await new Promise((r) => setTimeout(r, 600))
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

const handleReceive = async (t: number) => {
  if (receivingSet.value.has(t)) return

  receivingSet.value = new Set(receivingSet.value).add(t)

  try {
    const { code, data, message } = await receiveWages(t)
    if (code === 200) {
      toast.success(message)
      list.value = list.value.map(item => item.id === t ? data : item)
    } else {
      toast.error(message)
    }
  } catch (error) {
    toast.error('领取失败')
  } finally {
    const next = new Set(receivingSet.value)
    next.delete(t)
    receivingSet.value = next
  }
}

onMounted(async () => {
  await fetchData(1)

  if (loadMoreRef.value && hasMore.value) {
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading.value) {
          const nextPage = page.value + 1
          page.value = nextPage
          fetchData(nextPage)
        }
      },
      { threshold: 1 }
    )
    observer.observe(loadMoreRef.value)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<template>
  <!-- 表头 -->
  <div class="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr_1fr] px-3 py-2 text-xs text-gray-500 border-b">
    <div class="text-center">日期</div>
    <div class="text-center">亏损</div>
    <div class="text-center">充值</div>
    <div class="text-center">返利</div>
    <div class="text-center">状态</div>
  </div>

  <div
    v-for="(item, index) in list"
    :key="`all-key-${index}`"
    class="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr_1fr] px-3 py-3 border-b text-sm items-center"
  >
    <!-- 日期 -->
    <div class="text-center">
      <div class="text-gray-900">{{ dayjs.unix(item?.addtime || 0).format('YYYY-MM-DD HH:mm') }}</div>
    </div>

    <!-- 亏损 -->
    <div class="text-center font-medium">{{ (item?.points || 0).toLocaleString() }}</div>

    <!-- 充值 -->
    <div class="text-center font-medium">{{ ((item?.cz || 0) * 1000).toLocaleString() }}</div>

    <!-- 返利 -->
    <div class="text-center font-medium">{{ (item?.hdpoints || 0).toLocaleString() }}</div>

    <!-- 状态 -->
    <div class="text-center font-medium">
      <div v-if="item.state === 1">{{ item.state_label }}({{ dayjs.unix(item?.gettime || 0).format('HH:mm') }})</div>
      <div v-else-if="item.state === 2 || item.state === 3">{{ item.state_label }}</div>
      <button
        v-else
        :class="cn(
          'px-2 py-1 text-xs rounded',
          receivingSet.has(item.id || 0)
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-red-500 text-white cursor-pointer'
        )"
        @click="handleReceive(item.id || 0)"
      >
        {{ receivingSet.has(item.id || 0) ? '领取中...' : '领取' }}
      </button>
    </div>
  </div>

  <!-- 底部哨兵 -->
  <div v-if="hasMore" ref="loadMoreRef" class="py-4 text-center text-xs text-gray-400">
    {{ loading ? '加载中...' : '上拉加载更多' }}
  </div>

  <div v-if="!hasMore" class="py-4 text-center text-xs text-gray-400">
    没有更多数据了
  </div>
</template>
