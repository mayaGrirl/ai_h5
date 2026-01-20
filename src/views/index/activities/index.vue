<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ChevronLeft, Star } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { getActivities } from '@/api/home'
import type { IndexDataItem } from '@/types/index.type'

const router = useRouter()

const activities = ref<IndexDataItem[]>([])
const loading = ref(true)

const goBack = () => {
  router.back()
}

const loadData = async () => {
  try {
    loading.value = true
    const { code, data } = await getActivities()
    if (code === 200 && data) {
      activities.value = data
    }
  } catch (error) {
    console.error('获取活动列表失败:', error)
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
          <span class="text-white font-bold">近期活动</span>
          <div class="w-5"></div>
        </div>
      </header>

      <main class="px-3 pb-20 pt-3">
        <!-- 活动列表 -->
        <section class="space-y-3">
          <!-- 骨架屏加载 -->
          <template v-if="loading">
            <div v-for="i in 3" :key="`skeleton-${i}`" class="bg-white rounded-xl shadow-sm overflow-hidden">
              <div class="w-full aspect-[2/1] bg-gray-200 animate-pulse"></div>
            </div>
          </template>

          <!-- 空状态 -->
          <div v-else-if="activities.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400">
            <Star class="h-16 w-16 mb-4 text-gray-300" />
            <p class="text-sm">暂无活动</p>
          </div>

          <!-- 活动列表 -->
          <template v-else>
            <router-link
              v-for="(item, index) in activities"
              :key="item.id"
              :to="`/index/activities/${item.id}`"
              class="block w-full bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              :style="{ animationDelay: `${index * 80}ms` }"
            >
              <template v-if="item.pic">
                <div class="relative overflow-hidden">
                  <img
                    :src="item.pic"
                    :alt="item.title"
                    class="w-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                  <!-- 活动标题悬浮层 -->
                  <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <h3 class="text-white font-bold text-sm truncate">{{ item.title }}</h3>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="p-4">
                  <h3 class="font-bold text-gray-900">{{ item.title }}</h3>
                </div>
              </template>
            </router-link>
          </template>
        </section>
      </main>
    </div>
  </div>
</template>
