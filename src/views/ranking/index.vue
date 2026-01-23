<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { today, yesterday, lastWeek } from '@/api/rank'
import { toast } from '@/composables/useToast'
import type { TodayField, LastWeekField } from '@/types/rank.type'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// 当前选中的tab
const currentTab = computed(() => {
  const tab = route.query.tab as string
  return tab || 'today'
})

// tabs定义
const tabs = [
  { key: 'today', i18Key: 'rank.tab-1' },
  { key: 'yesterday', i18Key: 'rank.tab-2' },
  { key: 'last-week', i18Key: 'rank.tab-3' }
]

// 排行数据 - 今日/昨日使用详细字段，上周使用简单字段
const rankList = ref<TodayField[] | LastWeekField[]>([])
const isLoading = ref(false)

// 判断是否为上周榜（使用简单字段格式）
const isLastWeek = computed(() => currentTab.value === 'last-week')

// 获取排行数据
const fetchRankData = async (tab: string) => {
  isLoading.value = true
  rankList.value = []

  try {
    let res
    switch (tab) {
      case 'today':
        res = await today()
        break
      case 'yesterday':
        res = await yesterday()
        break
      case 'last-week':
        res = await lastWeek()
        break
      default:
        res = await today()
    }

    if (res.code === 200 && res.data) {
      rankList.value = res.data
    } else {
      toast.error(res.message || '获取排行数据失败')
    }
  } catch (error) {
    console.error('获取排行数据失败:', error)
    toast.error('获取排行数据失败')
  } finally {
    isLoading.value = false
  }
}

// 切换tab
const switchTab = (tabKey: string) => {
  router.replace({ query: { tab: tabKey } })
}

// 获取奖牌样式
const getMedalClass = (rank: number) => {
  const baseClass = 'inline-flex items-center justify-center rounded-full text-xs font-bold w-7 h-7 shadow-md'
  switch (rank) {
    case 1:
      return `${baseClass} bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 text-yellow-900 ring-2 ring-yellow-200`
    case 2:
      return `${baseClass} bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 text-slate-900 ring-2 ring-slate-200`
    case 3:
      return `${baseClass} bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-amber-100 ring-2 ring-amber-300`
    default:
      return `${baseClass} bg-gray-100 text-gray-600`
  }
}

// 获取行高亮样式（前三名特殊背景）
const getRowClass = (rank: number) => {
  const baseClass = 'flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0 transition-all duration-200'
  switch (rank) {
    case 1:
      return `${baseClass} bg-gradient-to-r from-yellow-50 to-transparent`
    case 2:
      return `${baseClass} bg-gradient-to-r from-slate-50 to-transparent`
    case 3:
      return `${baseClass} bg-gradient-to-r from-amber-50 to-transparent`
    default:
      return `${baseClass} hover:bg-gray-50`
  }
}

// 监听tab变化
watch(
  () => route.query.tab,
  (newTab) => {
    fetchRankData((newTab as string) || 'today')
  }
)

// 初始化
onMounted(() => {
  // 如果没有tab参数，默认跳转到today
  if (!route.query.tab) {
    router.replace({ query: { tab: 'today' } })
  } else {
    fetchRankData(currentTab.value)
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#f5f7fb] pb-16">
    <!-- 顶部标题 -->
    <header class="h-14 bg-gradient-to-r from-red-600 to-red-500 flex items-center justify-center shadow-md">
      <span class="text-white text-xl font-bold tracking-wide">{{ t('tab.ranking') }}</span>
    </header>

    <!-- Tab导航 -->
    <div class="grid grid-cols-3 text-center text-sm bg-white shadow-sm sticky top-0 z-10">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="switchTab(tab.key)"
        :class="[
          'py-3.5 text-center transition-all duration-200 relative',
          currentTab === tab.key
            ? 'text-red-500 font-bold'
            : 'text-gray-500 hover:text-gray-700 active:bg-gray-50'
        ]"
      >
        {{ t(tab.i18Key) }}
        <!-- 底部指示器 -->
        <span
          v-if="currentTab === tab.key"
          class="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-red-500 rounded-full"
        ></span>
      </button>
    </div>

    <!-- 内容区域 -->
    <div class="p-2">
      <!-- 加载状态骨架屏 -->
      <div v-if="isLoading" class="bg-white rounded-lg overflow-hidden shadow-sm">
        <div
          v-for="i in 10"
          :key="i"
          class="flex items-center justify-between px-4 py-3.5 border-b border-gray-50"
          :style="{ animationDelay: `${i * 100}ms` }"
        >
          <div class="flex items-center space-x-3">
            <div class="w-7 h-7 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full animate-pulse"></div>
            <div class="w-5 h-5 bg-gradient-to-r from-gray-200 to-gray-100 rounded animate-pulse"></div>
            <div class="w-24 h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded animate-pulse"></div>
          </div>
          <div class="flex items-center space-x-1">
            <div class="w-14 h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded animate-pulse"></div>
            <div class="w-4 h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      <!-- 排行列表 -->
      <div v-else class="bg-white rounded-lg overflow-hidden shadow-sm">
        <!-- 空数据状态 -->
        <div v-if="rankList.length === 0" class="py-16 text-center">
          <div class="text-gray-400 mb-2">
            <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p class="text-gray-500 text-sm">暂无排行数据</p>
        </div>

        <!-- 上周榜 -->
        <template v-if="isLastWeek && rankList.length > 0">
          <div
            v-for="(item, index) in (rankList as LastWeekField[])"
            :key="item.id"
            :class="getRowClass(index + 1)"
            :style="{ animationDelay: `${index * 50}ms` }"
          >
            <div class="flex items-center space-x-3">
              <span :class="getMedalClass(index + 1)">
                {{ index + 1 }}
              </span>
              <img
                :src="`/ranking/vip/${item.level || 1}.png`"
                :alt="`VIP${item.level || 1}`"
                class="w-5 h-5"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
              <span class="text-gray-800 text-sm font-medium">{{ item.nickname }}</span>
            </div>
            <div class="flex items-center space-x-1">
              <span :class="[
                'font-bold text-sm',
                index < 3 ? 'text-red-600' : 'text-red-500'
              ]">
                {{ (item.profit || 0).toLocaleString() }}
              </span>
              <img
                src="/ranking/coin.png"
                alt="gold"
                class="w-[14px] h-[14px]"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
            </div>
          </div>
        </template>

        <!-- 今日/昨日榜 -->
        <template v-else-if="!isLastWeek && rankList.length > 0">
          <div
            v-for="(item, index) in (rankList as TodayField[])"
            :key="item.id"
            :class="getRowClass(index + 1)"
            :style="{ animationDelay: `${index * 50}ms` }"
          >
            <div class="flex items-center space-x-3">
              <span :class="getMedalClass(index + 1)">
                {{ index + 1 }}
              </span>
              <img
                :src="`/ranking/vip/${item.level || 1}.png`"
                :alt="`VIP${item.level || 1}`"
                class="w-5 h-5"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
              <span class="text-gray-800 text-sm font-medium">{{ item.nickname }}</span>
            </div>
            <div class="flex items-center space-x-1">
              <span :class="[
                'font-bold text-sm',
                index < 3 ? 'text-red-600' : 'text-red-500'
              ]">
                {{ (item.profit || 0).toLocaleString() }}
              </span>
              <img
                src="/ranking/coin.png"
                alt="gold"
                class="w-[14px] h-[14px]"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
