<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { profitLoss } from '@/api/game'
import { toast } from '@/composables/useToast'
import type { ProfitLossItem, ProfitLossSummary } from '@/types/game.type'

const route = useRoute()

const statList = ref<ProfitLossItem[]>([])
const isLoading = ref(false)
const page = ref(1)
const hasMore = ref(true)
const pageSize = 10
const summary = ref<ProfitLossSummary>({})

// 从路由获取参数
const getLotteryId = () => Number(route.query.lottery_id) || 0
const getGroupId = () => Number(route.query.group_id) || 0

// 获取盈亏统计
const fetchProfitLoss = async (pageNum: number = 1, reset: boolean = false) => {
  const lotteryId = getLotteryId()
  const groupId = getGroupId()

  if (!lotteryId) return

  try {
    isLoading.value = true
    const res = await profitLoss({
      lottery_id: lotteryId,
      game_group_id: groupId,
      page: pageNum,
      pageSize: pageSize
    })

    if (res.code === 200 && res.data) {
      const list = res.data.list || []
      if (reset) {
        statList.value = list
        summary.value = res.data.summary || {}
      } else {
        statList.value = [...statList.value, ...list]
      }
      hasMore.value = list.length >= pageSize
      page.value = pageNum
    } else {
      toast.error(res.message || '获取盈亏统计失败')
      if (reset) statList.value = []
    }
  } catch (error) {
    toast.error('获取盈亏统计失败，请稍后重试')
    if (reset) statList.value = []
  } finally {
    isLoading.value = false
  }
}

const handleLoadMore = () => {
  if (isLoading.value || !hasMore.value) return
  fetchProfitLoss(page.value + 1, false)
}

// 监听路由参数变化，重新加载数据
watch(
  () => [route.query.lottery_id, route.query.group_id],
  () => {
    fetchProfitLoss(1, true)
  }
)

// 组件挂载时加载数据
onMounted(() => {
  fetchProfitLoss(1, true)
})
</script>

<template>
  <div class="bg-gray-100 pb-16">
    <!-- 汇总卡片 -->
    <div class="bg-white mx-3 my-3 rounded-lg shadow p-4">
      <div class="text-sm text-gray-600 mb-2">总计（当前游戏/分组）</div>
      <div class="grid grid-cols-3 gap-3 text-center">
        <div class="bg-blue-50 rounded-lg p-3">
          <div class="text-xs text-gray-500">投注金额</div>
          <div class="text-lg font-bold text-blue-600">
            {{ (summary.bet_gold || 0).toLocaleString() }}
          </div>
        </div>
        <div class="bg-green-50 rounded-lg p-3">
          <div class="text-xs text-gray-500">中奖金额</div>
          <div class="text-lg font-bold text-green-600">
            {{ (summary.win_gold || 0).toLocaleString() }}
          </div>
        </div>
        <div :class="[(summary.profit || 0) >= 0 ? 'bg-red-50' : 'bg-gray-100', 'rounded-lg p-3']">
          <div class="text-xs text-gray-500">盈亏</div>
          <div :class="['text-lg font-bold', (summary.profit || 0) >= 0 ? 'text-red-600' : 'text-green-600']">
            {{ (summary.profit || 0) >= 0 ? '+' : '' }}{{ (summary.profit || 0).toLocaleString() }}
          </div>
        </div>
      </div>
    </div>

    <!-- 盈亏记录列表 -->
    <div class="bg-white mx-3 my-3 rounded-lg shadow">
      <!-- 表头 -->
      <div class="grid grid-cols-4 text-xs text-gray-500 border-b bg-gray-50 px-3 py-2 gap-2 rounded-t-lg">
        <span>日期</span>
        <span class="text-right">投注/中奖</span>
        <span class="text-center">自动/次数</span>
        <span class="text-right">盈亏</span>
      </div>

      <div v-if="isLoading && statList.length === 0" class="flex justify-center items-center py-8">
        <div class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <span class="ml-2 text-gray-600">加载盈亏统计中...</span>
      </div>

      <div v-else-if="statList.length === 0" class="text-center py-8 text-gray-500">
        暂无盈亏记录
      </div>

      <div v-else class="divide-y">
        <div
          v-for="(item, index) in statList"
          :key="`${item.id || item.stat_date}-${index}`"
          :class="['px-3 py-3 text-xs', (item.profit || 0) > 0 ? 'bg-red-50' : (item.profit || 0) < 0 ? 'bg-green-50' : 'bg-white']"
        >
          <div class="grid grid-cols-4 items-center gap-2">
            <!-- 日期 -->
            <div>
              <div class="text-sm text-gray-800 font-medium">
                {{ item.stat_date ? String(item.stat_date).substring(0, 10) : '--' }}
              </div>
            </div>

            <!-- 投注/中奖 -->
            <div class="text-right">
              <div class="text-blue-600 font-medium">
                {{ (item.bet_gold || 0).toLocaleString() }}
              </div>
              <div :class="['text-[10px]', item.win_gold && item.win_gold > 0 ? 'text-green-600' : 'text-gray-400']">
                {{ (item.win_gold || 0).toLocaleString() }}
              </div>
            </div>

            <!-- 自动/次数 -->
            <div class="text-center">
              <div>
                <span v-if="(item.auto_bet_gold || 0) > 0" class="text-green-600 font-bold">√</span>
                <span v-else class="text-red-500">×</span>
              </div>
              <div class="text-[10px] text-gray-400">
                {{ item.bet_count || 0 }}次
              </div>
            </div>

            <!-- 盈亏 -->
            <div class="text-right">
              <div :class="['font-bold', (item.profit || 0) >= 0 ? 'text-red-600' : 'text-green-600']">
                {{ (item.profit || 0) >= 0 ? '+' : '' }}{{ (item.profit || 0).toLocaleString() }}
              </div>
            </div>
          </div>
        </div>

        <!-- 加载更多 -->
        <div v-if="hasMore" class="py-4 text-center">
          <button
            @click="handleLoadMore"
            :disabled="isLoading"
            class="px-6 py-2 bg-red-600 text-white text-sm rounded-lg disabled:opacity-50"
          >
            {{ isLoading ? '加载中...' : '加载更多' }}
          </button>
        </div>

        <div v-if="!hasMore && statList.length > 0" class="py-4 text-center text-gray-400 text-sm">
          没有更多数据了
        </div>
      </div>
    </div>
  </div>
</template>
