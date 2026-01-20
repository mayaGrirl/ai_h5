<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, UsersRound, ExternalLink } from 'lucide-vue-next'
import { getPartners } from '@/api/home'
import type { IndexDataItem } from '@/types/index.type'

const router = useRouter()
const partners = ref<IndexDataItem[]>([])
const loading = ref(true)

const goBack = () => {
  router.back()
}

const loadData = async () => {
  try {
    loading.value = true
    const { code, data } = await getPartners()
    if (code === 200 && data) {
      partners.value = data
    }
  } catch (error) {
    console.error('获取合作商家列表失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="min-h-screen flex justify-center bg-[#eef3f8] overflow-auto">
    <div class="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
      <!-- 顶部标题 -->
      <header class="sticky top-0 z-40 bg-gradient-to-r from-red-600 to-red-500">
        <div class="flex h-12 items-center justify-between px-3">
          <button @click="goBack" class="flex items-center text-white">
            <ChevronLeft class="h-5 w-5" />
          </button>
          <span class="text-white font-bold">合作商家</span>
          <div class="w-5"></div>
        </div>
      </header>

      <main class="px-3 pb-24 pt-3">
        <!-- 骨架屏加载 -->
        <section v-if="loading" class="grid grid-cols-2 gap-3">
          <div
            v-for="i in 4"
            :key="`skeleton-${i}`"
            class="bg-gradient-to-b from-[#1e9bff] to-[#0063f8] rounded-xl p-3 shadow-md min-h-[90px]"
          >
            <div class="flex items-center gap-2 mb-2">
              <div class="w-8 h-8 rounded-lg bg-blue-400/50 animate-pulse"></div>
              <div class="h-4 w-20 bg-blue-400/50 rounded animate-pulse"></div>
            </div>
            <div class="h-3 w-full bg-blue-400/50 rounded animate-pulse mb-1"></div>
            <div class="h-3 w-3/4 bg-blue-400/50 rounded animate-pulse"></div>
          </div>
        </section>

        <!-- 空状态 -->
        <div v-else-if="partners.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400">
          <UsersRound class="h-16 w-16 mb-4 text-gray-300" />
          <p class="text-sm">暂无合作商家</p>
        </div>

        <!-- 合作商家列表 -->
        <section v-else class="grid grid-cols-2 gap-3">
          <a
            v-for="(item, index) in partners"
            :key="item.id"
            :href="item.jump_url || '#'"
            class="bg-gradient-to-br from-[#1e9bff] via-[#0080ff] to-[#0063f8] rounded-xl p-3 shadow-lg text-white min-h-[90px] flex hover:shadow-xl transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-1 active:scale-[0.98]"
            :style="{ animationDelay: `${index * 50}ms` }"
          >
            <div class="flex flex-col w-full">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    v-if="item.pic"
                    :src="item.pic"
                    :alt="item.title"
                    class="w-full h-full object-cover"
                  />
                  <UsersRound v-else class="w-5 h-5 text-white/80" />
                </div>
                <div class="font-bold text-sm truncate flex-1">{{ item.title }}</div>
                <ExternalLink class="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
              </div>

              <div
                class="mt-2 text-[11px] leading-[15px] text-white/80 whitespace-pre-line overflow-hidden line-clamp-3"
                v-html="item.content"
              ></div>
            </div>
          </a>
        </section>
      </main>
    </div>
  </div>
</template>
