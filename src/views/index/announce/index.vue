<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, Bell, ChevronRight } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { getAnnouncements } from '@/api/home'
import type { IndexDataItem } from '@/types/index.type'

const router = useRouter()
const { t } = useI18n()

const announcements = ref<IndexDataItem[]>([])
const loading = ref(true)

const goBack = () => {
  router.back()
}

const loadData = async () => {
  try {
    loading.value = true
    const { code, data } = await getAnnouncements()
    if (code === 200 && data) {
      announcements.value = data
    }
  } catch (error) {
    console.error('获取公告列表失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="flex min-h-screen justify-center bg-[#eef3f8]">
    <div class="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
      <!-- 顶部标题 -->
      <header class="sticky top-0 z-40 bg-gradient-to-r from-red-600 to-red-500">
        <div class="flex h-12 items-center justify-between px-3">
          <button @click="goBack" class="flex items-center text-white">
            <ChevronLeft class="h-5 w-5" />
          </button>
          <span class="text-white font-bold">{{ t('home.announcement') }}</span>
          <div class="w-5"></div>
        </div>
      </header>

      <main class="px-3 pb-20 pt-3">
        <!-- 公告列表 -->
        <section class="space-y-3">
          <!-- 骨架屏加载 -->
          <template v-if="loading">
            <div v-for="i in 3" :key="`skeleton-${i}`" class="bg-white rounded-xl px-4 py-4 shadow-sm">
              <div class="h-3 w-24 mb-2 bg-gray-200 rounded animate-pulse"></div>
              <div class="h-5 w-3/4 mb-2 bg-gray-200 rounded animate-pulse"></div>
              <div class="h-32 w-full bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </template>

          <!-- 空状态 -->
          <div v-else-if="announcements.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400">
            <Bell class="h-16 w-16 mb-4 text-gray-300" />
            <p class="text-sm">暂无公告</p>
          </div>

          <!-- 公告列表 -->
          <template v-else>
            <router-link
              v-for="(item, index) in announcements"
              :key="item.id"
              :to="`/index/announce/${item.id}`"
              class="block bg-white rounded-xl px-4 py-4 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
              :style="{ animationDelay: `${index * 50}ms` }"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 text-xs text-gray-400 mb-1">
                    <Bell class="h-3 w-3" />
                    <span>发布于 {{ item.created_at }}</span>
                  </div>
                  <div class="text-base font-semibold text-gray-900 line-clamp-2">
                    {{ item.title }}
                  </div>
                </div>
                <ChevronRight class="h-5 w-5 text-gray-300 flex-shrink-0 ml-2" />
              </div>

              <!-- 有图片时展示 -->
              <div v-if="item.pic" class="mt-3 rounded-lg overflow-hidden">
                <img
                  :src="item.pic"
                  :alt="item.title"
                  class="w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
            </router-link>
          </template>
        </section>
      </main>
    </div>
  </div>
</template>
