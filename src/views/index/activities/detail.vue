<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import { getIndexDetail } from '@/api/home'
import type { IndexDataItem } from '@/types/index.type'

const route = useRoute()
const router = useRouter()

const detail = ref<IndexDataItem | null>(null)
const loading = ref(true)

const goBack = () => {
  router.back()
}

const loadData = async () => {
  try {
    loading.value = true
    const id = Number(route.params.id)
    if (!id) return

    const { code, data } = await getIndexDetail(id)
    if (code === 200 && data) {
      detail.value = data
    }
  } catch (error) {
    console.error('获取活动详情失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="min-h-screen bg-[#eef3f8] overflow-auto">
    <div class="w-full max-w-xl mx-auto bg-[#f5f7fb] shadow-sm">
      <!-- 顶部导航 -->
      <header class="sticky top-0 z-40 bg-gradient-to-r from-red-600 to-red-500">
        <div class="flex h-12 items-center justify-between px-3">
          <button @click="goBack" class="flex items-center text-white">
            <ChevronLeft class="h-5 w-5" />
          </button>
          <span class="text-white font-bold">活动详情</span>
          <div class="w-5"></div>
        </div>
      </header>

      <!-- 加载中 -->
      <div v-if="loading" class="flex items-center justify-center min-h-[50vh] text-gray-500">
        加载中...
      </div>

      <!-- 详情内容 -->
      <main v-else-if="detail" class="px-4 py-5 pb-20">
        <div class="text-xs text-gray-500">发布于 {{ detail.created_at }}</div>
        <div class="mt-2 text-2xl font-bold text-gray-900">{{ detail.title }}</div>
        <img
          v-if="detail.pic"
          :src="detail.pic"
          :alt="detail.title"
          class="mt-4 w-full rounded-lg shadow"
        />
        <div
          class="mt-4 text-gray-700 leading-7"
          v-html="detail.content"
        ></div>
      </main>

      <!-- 无数据 -->
      <div v-else class="flex items-center justify-center min-h-[50vh] text-gray-500">
        未找到活动
      </div>
    </div>
  </div>
</template>
