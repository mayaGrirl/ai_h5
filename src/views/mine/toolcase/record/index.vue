<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ChevronLeft } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { toolcaseRecords } from '@/api/customer'
import { toast } from '@/composables/useToast'
import type { ToolcaseRecordField } from '@/types/customer.type'
import dayjs from 'dayjs'

const router = useRouter()
const list = ref<ToolcaseRecordField[]>([])
const page = ref(1)
const hasMore = ref(true)
const loading = ref(false)
const loadMoreRef = ref<HTMLDivElement | null>(null)
let observer: IntersectionObserver | null = null

const fetchData = async (pageNo: number) => {
  loading.value = true
  try {
    const { code, data, message } = await toolcaseRecords({
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

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="flex min-h-screen justify-center bg-[#eef3f8]">
    <div class="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
      <header class="sticky top-0 z-40 bg-gradient-to-r from-red-600 to-red-500">
        <div class="flex h-12 items-center justify-between px-3">
          <button @click="goBack" class="flex items-center text-white">
            <ChevronLeft class="h-5 w-5" />
          </button>
          <span class="text-white font-bold">道具记录</span>
          <div class="w-5"></div>
        </div>
      </header>

      <!-- 表头 -->
      <div class="grid grid-cols-[1fr_1fr_1fr] px-3 py-2 text-xs text-gray-500 border-b bg-white">
        <div class="text-center">日期</div>
        <div class="text-center">道具</div>
        <div class="text-center">数量</div>
      </div>

      <div
        v-for="(item, index) in list"
        :key="`all-key-${index}`"
        class="grid grid-cols-[1fr_1fr_1fr] px-3 py-3 border-b text-sm items-center bg-white"
      >
        <div class="text-center">{{ dayjs.unix(item?.addtime || 0).format('YYYY-MM-DD') }}</div>
        <div class="text-center">{{ item?.name || '--' }}</div>
        <div class="text-center font-medium text-red-500">{{ item?.num || 0 }}</div>
      </div>

      <!-- 底部哨兵 -->
      <div v-if="hasMore" ref="loadMoreRef" class="py-4 text-center text-xs text-gray-400">
        {{ loading ? '加载中...' : '上拉加载更多' }}
      </div>

      <div v-if="!hasMore" class="py-4 text-center text-xs text-gray-400">
        没有更多数据了
      </div>

      <div class="h-14"></div>
    </div>
  </div>
</template>
