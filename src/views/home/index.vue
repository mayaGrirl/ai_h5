<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Bell, Star, Gift, UsersRound, X } from 'lucide-vue-next'
import { getBanners, getHomePopup, indexGameHotNew, getWebConfig, getGameNotice, getIndexDetail } from '@/api/home'
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

// 滚动公告 (type=7)
const gameNotices = ref<IndexDataItem[]>([])
const currentNoticeIndex = ref(0)
const needsScroll = ref(false)
const noticeContainerRef = ref<HTMLDivElement | null>(null)
const noticeTextRef = ref<HTMLSpanElement | null>(null)

// 滚动公告详情弹框
const noticeDialogOpen = ref(false)
const selectedNotice = ref<IndexDataItem | null>(null)
const noticeDetailLoading = ref(false)

// 定时器
let noticeTimer: ReturnType<typeof setTimeout> | null = null

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

    const [bannersRes, gameRes, configRes, noticeRes] = await Promise.all([
      getBanners(),
      indexGameHotNew({ hot_count: 6, new_count: 3 }),
      getWebConfig(),
      getGameNotice()
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

    if (noticeRes.code === 200 && noticeRes.data) {
      gameNotices.value = noticeRes.data
    }

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

// 当公告索引变化时，先重置滚动状态以便重新测量
watch(currentNoticeIndex, () => {
  needsScroll.value = false
})

// 检测文字是否超出容器宽度
watch([currentNoticeIndex, () => gameNotices.value, needsScroll], () => {
  if (needsScroll.value) return

  setTimeout(() => {
    if (noticeContainerRef.value && noticeTextRef.value) {
      const containerWidth = noticeContainerRef.value.offsetWidth
      const textWidth = noticeTextRef.value.scrollWidth
      needsScroll.value = textWidth > containerWidth
    }
  }, 50)
}, { immediate: true })

// 滚动公告上下轮播
watch([() => gameNotices.value, currentNoticeIndex, needsScroll], () => {
  if (noticeTimer) {
    clearTimeout(noticeTimer)
  }

  if (gameNotices.value.length === 0) return

  const currentNotice = gameNotices.value[currentNoticeIndex.value]
  const textLength = currentNotice?.title?.length || 0

  // 需要横向滚动时：根据长度计算滚动时间 + 停顿
  // 不需要滚动时：3秒后切换
  const scrollTime = needsScroll.value
    ? Math.max(textLength * 0.25, 5) * 1000 + 1000
    : 3000

  noticeTimer = setTimeout(() => {
    currentNoticeIndex.value = (currentNoticeIndex.value + 1) % gameNotices.value.length
  }, scrollTime)
}, { immediate: true })

// 点击滚动公告，打开详情弹框
const handleNoticeClick = async (notice: IndexDataItem) => {
  noticeDialogOpen.value = true
  noticeDetailLoading.value = true
  selectedNotice.value = notice

  try {
    const { code, data } = await getIndexDetail(notice.id)
    if (code === 200 && data) {
      selectedNotice.value = data
    }
  } catch (error) {
    console.error('获取公告详情失败:', error)
  } finally {
    noticeDetailLoading.value = false
  }
}

const closeNoticeDialog = () => {
  noticeDialogOpen.value = false
}

// 计算滚动时长
const getScrollDuration = (title: string) => {
  return Math.max(title.length * 0.2, 6)
}

onMounted(() => {
  loadData()
})

onUnmounted(() => {
  if (noticeTimer) {
    clearTimeout(noticeTimer)
  }
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

        <!-- 轮播图 -->
        <BannerCarousel
          :banners="banners"
          :image-base-url="imageBaseUrl"
          class="mb-3"
        />

        <!-- 滚动公告 (type=7) -->
        <section v-if="gameNotices.length > 0" class="mb-3">
          <div
            class="bg-gradient-to-r from-[#fff8e6] to-[#fff2d6] rounded-lg px-3 py-2 flex items-center gap-2 shadow-sm border border-[#ffe4a0] cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
            @click="handleNoticeClick(gameNotices[currentNoticeIndex])"
          >
            <div class="flex-shrink-0 text-lg">
              📢
            </div>
            <div ref="noticeContainerRef" class="flex-1 overflow-hidden relative h-5">
              <div
                v-for="(notice, index) in gameNotices"
                :key="notice.id"
                class="absolute inset-0 transition-all duration-500 ease-in-out"
                :class="index === currentNoticeIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
              >
                <div class="h-full overflow-hidden flex items-center">
                  <div
                    v-if="needsScroll && index === currentNoticeIndex"
                    class="inline-flex whitespace-nowrap text-sm text-[#8b5a00] animate-marquee-text"
                    :style="{ animationDuration: `${getScrollDuration(notice.title)}s` }"
                  >
                    <span>{{ notice.title }}</span>
                    <span class="pl-16">{{ notice.title }}</span>
                  </div>
                  <span
                    v-else
                    :ref="index === currentNoticeIndex ? (el) => noticeTextRef = el as HTMLSpanElement : undefined"
                    class="text-sm text-[#8b5a00] whitespace-nowrap"
                  >
                    {{ notice.title }}
                  </span>
                </div>
              </div>
            </div>
          </div>
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

    <!-- 滚动公告详情弹框 -->
    <Teleport to="body">
      <Transition name="dialog">
        <div
          v-if="noticeDialogOpen"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          @click.self="closeNoticeDialog"
        >
          <div class="bg-white w-[calc(100vw-32px)] max-w-lg max-h-[80vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl">
            <!-- 头部 -->
            <div class="flex items-center justify-between p-4 border-b">
              <div class="flex-1 pr-4">
                <h3 class="text-lg font-bold text-gray-900">
                  {{ selectedNotice?.title }}
                </h3>
                <div v-if="selectedNotice?.created_at" class="text-xs text-gray-500 mt-1">
                  发布于 {{ selectedNotice.created_at }}
                </div>
              </div>
              <button
                @click="closeNoticeDialog"
                class="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <X class="h-5 w-5" />
              </button>
            </div>

            <!-- 内容 -->
            <div class="flex-1 overflow-y-auto p-4">
              <div v-if="noticeDetailLoading" class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
              <div
                v-else
                class="text-sm text-gray-700 leading-7 prose prose-sm max-w-none"
                v-html="selectedNotice?.content || ''"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    </div>
  </div>
</template>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-enter-active > div,
.dialog-leave-active > div {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from > div,
.dialog-leave-to > div {
  transform: scale(0.95);
  opacity: 0;
}
</style>
