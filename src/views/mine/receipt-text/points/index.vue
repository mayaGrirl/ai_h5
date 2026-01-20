<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { pointsRecords } from '@/api/customer'
import { toast } from '@/composables/useToast'
import type { PointsRecordField } from '@/types/customer.type'

const list = ref<PointsRecordField[]>([])
const page = ref(1)
const hasMore = ref(true)
const loading = ref(false)
const loadMoreRef = ref<HTMLDivElement | null>(null)
let observer: IntersectionObserver | null = null

const fetchData = async (pageNo: number) => {
  loading.value = true
  try {
    const { code, data, message } = await pointsRecords({
      pagination: {
        page: pageNo,
        size: 20
      }
    })
    await new Promise((r) => setTimeout(r, 500))
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
  <div
    v-for="(item, index) in list"
    :key="`all-key-${index}`"
    class="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr] px-3 py-3 border-b text-sm items-center"
  >
    <!-- 来源 -->
    <div class="text-center">
      <div class="text-gray-900">{{ item?.type_label || '' }}</div>
    </div>

    <!-- 变化前 -->
    <div class="text-center font-medium text-red-500">{{ (item?.b_points || 0).toLocaleString() }}</div>

    <!-- 变化 -->
    <div class="text-center font-medium text-red-500">{{ (item?.points || 0).toLocaleString() }}</div>

    <!-- 余额 -->
    <div class="flex justify-center items-center gap-1 text-red-500 font-medium">
      {{ (item?.a_points || 0).toLocaleString() }}
      <img
        src="/ranking/coin.png"
        alt="coin"
        class="inline-block w-[13px] h-[13px]"
      />
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
