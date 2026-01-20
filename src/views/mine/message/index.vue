<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { systemMessage } from '@/api/home'
import type { IndexDataItem } from '@/types/index.type'
import PageHeader from '@/components/PageHeader.vue'

const { t } = useI18n()

const list = ref<IndexDataItem[]>([])
const page = ref(1)
const hasMore = ref(true)
const loading = ref(false)
const loadMoreRef = ref<HTMLDivElement | null>(null)
let observer: IntersectionObserver | null = null

const fetchData = async (pageNum: number) => {
  if (loading.value) return

  loading.value = true
  try {
    const res = await systemMessage({ pagination: { page: pageNum, size: 20 } })
    if (res.code === 200) {
      const data = res.data || []
      if (data.length < 20) {
        hasMore.value = false
      }
      if (pageNum === 1) {
        list.value = data
      } else {
        list.value = [...list.value, ...data]
      }
      page.value = pageNum
    }
  } catch (error) {
    console.error('加载站内消息失败', error)
  } finally {
    loading.value = false
  }
}

const setupObserver = () => {
  if (!loadMoreRef.value || !hasMore.value) return

  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !loading.value && hasMore.value) {
        fetchData(page.value + 1)
      }
    },
    { threshold: 1 }
  )

  observer.observe(loadMoreRef.value)
}

onMounted(() => {
  fetchData(1)
  // 延迟设置观察器，等待 DOM 渲染
  setTimeout(setupObserver, 100)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<template>
  <div class="flex min-h-screen justify-center bg-[#eef3f8]">
    <div class="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
      <PageHeader :title="t('mine.quick.mail')" />

      <!-- 加载中骨架屏 -->
      <div v-if="loading && list.length === 0" class="flex flex-col gap-2 px-3 mt-2">
        <div v-for="i in 5" :key="i" class="bg-white rounded-xl border py-3 px-3 shadow-sm">
          <div class="flex justify-between mb-2">
            <div class="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div class="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div class="h-4 w-full bg-gray-200 rounded animate-pulse mb-1"></div>
          <div class="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      <!-- 空数据 -->
      <div v-else-if="!loading && list.length === 0" class="text-center py-16 text-gray-500">
        暂无消息
      </div>

      <!-- 消息列表 -->
      <div v-else class="flex flex-col gap-2 px-3 mt-2">
        <div
          v-for="(item, index) in list"
          :key="index"
          class="bg-white rounded-xl border py-3 px-3 shadow-sm"
        >
          <div class="flex justify-between items-start mb-2">
            <div class="font-bold text-base text-gray-900">{{ item?.title }}</div>
            <div class="text-xs text-gray-400 whitespace-nowrap ml-2">{{ item?.created_at }}</div>
          </div>
          <div class="text-sm text-gray-600 leading-relaxed" v-html="item?.content"></div>
        </div>
      </div>

      <!-- 底部加载哨兵 -->
      <div v-if="hasMore" ref="loadMoreRef" class="py-4 text-center text-xs text-gray-400">
        {{ loading ? t('common.loading') : t('common.loading-hit') }}
      </div>

      <div v-if="!hasMore && list.length > 0" class="py-4 text-center text-xs text-gray-400">
        {{ t('common.loading-list-empty') }}
      </div>

      <!-- 底部占位 -->
      <div class="h-14"></div>
    </div>
  </div>
</template>
