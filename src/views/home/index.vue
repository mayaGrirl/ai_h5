<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Bell, Star, Gift, UsersRound, X } from 'lucide-vue-next'
import { getBanners, getHomePopup, indexGameHotNew, getWebConfig } from '@/api/home'
import { useLocalized } from '@/composables/useLocalized'
import type { IndexDataItem, IndexGameItem, webConfig } from '@/types/index.type'
import PageLoading from '@/components/PageLoading.vue'
import HomeHeader from '@/components/HomeHeader.vue'
import BannerCarousel from '@/components/BannerCarousel.vue'

const { t } = useI18n()
const { localize } = useLocalized()

const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL || ''
const loading = ref(true)
const configLoading = ref(true)
const banners = ref<IndexDataItem[]>([])
const gameHotNew = ref<IndexGameItem | null>(null)
const popupAnnouncement = ref<IndexDataItem | null>(null)
const showPopup = ref(false)
const siteConfig = ref<webConfig | null>(null)

// 快捷入口
const quickLinks = computed(() => [
  { name: t('home.announcement'), icon: Bell, color: 'bg-[#ffb84d]', href: '/index/announce' },
  { name: t('home.events'), icon: Star, color: 'bg-[#b47cff]', href: '/index/activities' },
  { name: t('home.rewards'), icon: Gift, color: 'bg-[#ff6b6b]', href: '/mine/relief' },
  { name: t('home.partners'), icon: UsersRound, color: 'bg-[#4ec5ff]', href: '/index/partners' }
])

// 加载数据
const loadData = async () => {
  try {
    loading.value = true
    configLoading.value = true

    const [bannersRes, gameRes, configRes] = await Promise.all([
      getBanners(),
      indexGameHotNew({ hot_count: 6, new_count: 3 }),
      getWebConfig()
    ])

    if (bannersRes.code === 200) {
      banners.value = bannersRes.data || []
    }

    if (gameRes.code === 200) {
      gameHotNew.value = gameRes.data
    }

    if (configRes.code === 200 && configRes.data) {
      siteConfig.value = configRes.data
    }
    configLoading.value = false

    // 首页弹窗 - 使用 popup.id 作为 key
    const popupRes = await getHomePopup()
    if (popupRes.code === 200 && popupRes.data?.length > 0) {
      const popup = popupRes.data[0]
      popupAnnouncement.value = popup
      const popupKey = `home_popup_${popup.id}`
      if (!sessionStorage.getItem(popupKey)) {
        showPopup.value = true
        sessionStorage.setItem(popupKey, 'true')
      }
    }
  } catch (error) {
    console.error('加载首页数据失败:', error)
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
      <!-- 首页头部 -->
      <HomeHeader />

      <!-- 加载状态 -->
      <PageLoading v-if="loading" />

      <main v-else class="px-3 pb-20 pt-3">
        <!-- 轮播图 -->
        <BannerCarousel
          :banners="banners"
          :image-base-url="imageBaseUrl"
          class="mb-3"
        />

        <!-- 快捷入口 -->
        <section class="grid grid-cols-4 gap-2 mb-3">
          <router-link
            v-for="(link, index) in quickLinks"
            :key="link.href"
            :to="link.href"
            class="flex flex-col items-center justify-center text-[13px] relative transform transition-transform duration-200 hover:scale-105 active:scale-95"
            :style="{ animationDelay: `${index * 50}ms` }"
          >
            <div
              class="flex h-11 w-11 items-center justify-center rounded-lg text-xl text-white shadow-md relative transition-shadow hover:shadow-lg"
              :class="link.color"
            >
              <component :is="link.icon" class="h-5 w-5" />
            </div>
            <span class="mt-1 text-[12px] text-gray-700">{{ link.name }}</span>
          </router-link>
        </section>

        <!-- 热门游戏 -->
        <section class="mb-2 flex items-center justify-between text-[13px]">
          <div class="flex items-center gap-2">
            <span class="w-1 h-4 bg-red-500 rounded-full"></span>
            <span class="text-black font-bold">{{ t('home.hot-games') }}</span>
          </div>
        </section>
        <section class="mb-4 grid grid-cols-3 gap-2">
          <template v-if="gameHotNew?.hot && gameHotNew.hot.length > 0">
            <router-link
              v-for="(game, index) in gameHotNew.hot"
              :key="'hot-games' + index"
              :to="`/games?lottery_id=${game.id}`"
              class="block transform transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 rounded-md overflow-hidden"
            >
              <img
                :src="game.logo || ''"
                :alt="game.name || ''"
                class="w-full rounded-md"
              />
            </router-link>
          </template>
          <div v-else class="col-span-3 text-center py-4 text-gray-400 text-sm">
            暂无热门游戏
          </div>
        </section>

        <!-- 最新游戏 (暂时隐藏)
        <section class="mb-2 flex items-center justify-between text-[13px]">
          <div class="flex items-center gap-2">
            <span class="w-1 h-4 bg-blue-500 rounded-full"></span>
            <span class="text-black font-bold">{{ t('home.new-games') }}</span>
          </div>
        </section>
        <section class="mb-4 grid grid-cols-3 gap-2">
          <template v-if="gameHotNew?.new && gameHotNew.new.length > 0">
            <router-link
              v-for="(game, index) in gameHotNew.new"
              :key="'new-games' + index"
              :to="`/games?lottery_id=${game.id}`"
              class="block transform transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 rounded-md overflow-hidden"
            >
              <img
                :src="game.logo || ''"
                :alt="game.name || ''"
                class="w-full rounded-md"
              />
            </router-link>
          </template>
          <div v-else class="col-span-3 text-center py-4 text-gray-400 text-sm">
            暂无最新游戏
          </div>
        </section>
        -->

        <!-- 底部操作按钮 -->
        <section v-if="!configLoading && siteConfig" class="space-y-3">
          <a :href="siteConfig.pc_url" class="block">
            <button class="flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#ff3a00] to-[#ff6b35] text-[14px] font-medium text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
              电脑版
            </button>
          </a>
          <a :href="siteConfig.customer_link" class="block">
            <button class="flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#ff3a00] to-[#ff6b35] text-[14px] font-medium text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
              联系客服
            </button>
          </a>
        </section>
        <section v-else-if="configLoading" class="space-y-3">
          <div class="h-11 w-full rounded-full bg-gray-200 animate-pulse"></div>
          <div class="h-11 w-full rounded-full bg-gray-200 animate-pulse"></div>
        </section>
      </main>

    <!-- 首页弹框公告 -->
    <Teleport to="body">
      <div
        v-if="showPopup && popupAnnouncement"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <div class="bg-white rounded-2xl max-w-sm w-full max-h-[70vh] overflow-hidden shadow-2xl">
          <div class="flex items-center justify-between p-4 border-b bg-gradient-to-r from-red-500 to-red-600">
            <h3 class="font-bold text-white text-lg">{{ localize(popupAnnouncement.lang_title as Record<string, string> | null, popupAnnouncement.title) }}</h3>
            <button
              @click="showPopup = false"
              class="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/20 transition-colors"
            >
              <X class="h-5 w-5" />
            </button>
          </div>
          <div class="p-4 overflow-y-auto max-h-[50vh]">
            <div class="text-sm text-gray-600 leading-relaxed" v-html="localize(popupAnnouncement.lang_content as Record<string, string> | null, popupAnnouncement.content)"></div>
          </div>
          <div class="p-4 border-t bg-gray-50">
            <button
              @click="showPopup = false"
              class="w-full bg-gradient-to-r from-[#ff3a00] to-[#ff6b35] text-white rounded-full py-3 text-sm font-bold hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              我知道了
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    </div>
  </div>
</template>
