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
  const baseClass = 'inline-flex items-center justify-center rounded-full text-xs font-bold w-6 h-6 shadow-sm'
  switch (rank) {
    case 1:
      return `${baseClass} bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900`
    case 2:
      return `${baseClass} bg-gradient-to-br from-blue-300 to-blue-500 text-blue-950`
    case 3:
      return `${baseClass} bg-gradient-to-br from-green-300 to-green-500 text-green-950`
    default:
      return `${baseClass} bg-gray-200 text-gray-700`
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
    <header class="h-14 bg-red-600 flex items-center justify-center">
      <span class="text-white text-xl font-bold">{{ t('tab.ranking') }}</span>
    </header>

    <!-- Tab导航 -->
    <div class="grid grid-cols-3 text-center text-sm bg-white">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="switchTab(tab.key)"
        :class="[
          'py-3 text-center transition-colors',
          currentTab === tab.key
            ? 'text-red-500 font-bold border-b-2 border-red-500'
            : 'text-gray-500 hover:text-gray-700'
        ]"
      >
        {{ t(tab.i18Key) }}
      </button>
    </div>

    <!-- 内容区域 -->
    <div class="p-2">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="bg-white rounded-lg">
        <div v-for="i in 10" :key="i" class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div class="flex items-center space-x-3">
            <div class="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
            <div class="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
            <div class="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div class="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      <!-- 排行列表 -->
      <div v-else class="bg-white rounded-lg">
        <div v-if="rankList.length === 0" class="py-12 text-center text-gray-500">
          暂无排行数据
        </div>

        <!-- 上周榜（简单字段格式） -->
        <template v-if="isLastWeek">
          <div
            v-for="item in (rankList as LastWeekField[])"
            :key="item.rank"
            class="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0"
          >
            <div class="flex items-center space-x-3">
              <span :class="getMedalClass(item.rank)">
                {{ item.rank }}
              </span>
              <img
                :src="`/ranking/vip/${item.level}.png`"
                :alt="`VIP${item.level}`"
                class="w-5 h-5"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
              <span class="text-gray-800 text-sm">{{ item.name }}</span>
            </div>
            <div class="flex items-center space-x-1">
              <span class="text-red-500 font-semibold text-sm">
                {{ item.score.toLocaleString() }}
              </span>
              <img
                src="/ranking/coin.png"
                alt="gold"
                class="w-[13px] h-[13px]"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
            </div>
          </div>
        </template>

        <!-- 今日/昨日榜（详细字段格式） -->
        <template v-else>
          <div
            v-for="(item, index) in (rankList as TodayField[])"
            :key="item.id"
            class="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0"
          >
            <div class="flex items-center space-x-3">
              <span :class="getMedalClass(index + 1)">
                {{ index + 1 }}
              </span>
              <img
                :src="`/ranking/vip/${item.member?.level || 1}.png`"
                :alt="`VIP${item.member?.level || 1}`"
                class="w-5 h-5"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
              <span class="text-gray-800 text-sm">{{ item.member_field?.nickname }}</span>
            </div>
            <div class="flex items-center space-x-1">
              <span class="text-red-500 font-semibold text-sm">
                {{ item.profit.toLocaleString() }}
              </span>
              <img
                src="/ranking/coin.png"
                alt="gold"
                class="w-[13px] h-[13px]"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
