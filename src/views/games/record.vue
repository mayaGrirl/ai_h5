<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { betRecords } from '@/api/game'
import { toast } from '@/composables/useToast'
import type { BetRecordItem, BetNoItem } from '@/types/game.type'

const { t } = useI18n()
const route = useRoute()

const recordList = ref<BetRecordItem[]>([])
const isLoadingRecords = ref(false)
const page = ref(1)
const hasMore = ref(true)
const pageSize = 15

// 从路由获取参数
const getLotteryId = () => Number(route.query.lottery_id) || 0
const getGroupId = () => Number(route.query.group_id) || 0

// 获取投注记录
const fetchBetRecords = async (pageNum: number = 1, reset: boolean = false) => {
  const lotteryId = getLotteryId()
  const groupId = getGroupId()

  if (!lotteryId) return

  try {
    isLoadingRecords.value = true
    const res = await betRecords({
      lottery_id: lotteryId,
      game_group_id: groupId,
      page: pageNum,
      pageSize: pageSize
    })

    if (res.code === 200 && res.data) {
      const list = res.data.list || []
      if (reset) {
        recordList.value = list
      } else {
        recordList.value = [...recordList.value, ...list]
      }
      hasMore.value = list.length >= pageSize
      page.value = pageNum
    } else {
      toast.error(res.message || t('games.record.load-failed'))
      if (reset) recordList.value = []
    }
  } catch (error) {
    toast.error(t('games.record.load-failed-retry'))
    if (reset) recordList.value = []
  } finally {
    isLoadingRecords.value = false
  }
}

const handleLoadMore = () => {
  if (isLoadingRecords.value || !hasMore.value) return
  fetchBetRecords(page.value + 1, false)
}

const getDisplayBetNoList = (list: BetNoItem[]) => {
  if (!Array.isArray(list) || list.length === 0) return []
  const winList = list.filter(bet => (bet.win_gold || 0) > 0)
  const loseList = list.filter(bet => (bet.win_gold || 0) <= 0)

  const result: BetNoItem[] = []
  for (const bet of winList) {
    if (result.length < 3) result.push(bet)
  }
  for (const bet of loseList) {
    if (result.length < 3) result.push(bet)
  }
  return result
}

const getBetNoList = (item: BetRecordItem): BetNoItem[] => {
  const betNo = item.bet_no
  if (!betNo) return []
  if (Array.isArray(betNo)) return betNo
  if (typeof betNo === 'object') return Object.values(betNo)
  return []
}

const getStatusInfo = (item: BetRecordItem): { text: string; color: string } => {
  const status = Number(item.status)
  switch (status) {
    case 0:
      return { text: t('games.record.unsettled'), color: 'text-orange-600 bg-orange-50' }
    case 1:
      if (item.is_win === 2) {
        return { text: t('games.record.won'), color: 'text-red-600 bg-red-50' }
      }
      return { text: t('games.record.not-won'), color: 'text-gray-600 bg-gray-100' }
    case 2:
      return { text: t('games.record.rolled-back'), color: 'text-yellow-600 bg-yellow-50' }
    case 3:
      return { text: t('games.record.deleted'), color: 'text-gray-400 bg-gray-100' }
    default:
      return { text: '--', color: 'text-gray-500' }
  }
}

// 监听路由参数变化，重新加载数据
watch(
  () => [route.query.lottery_id, route.query.group_id],
  () => {
    fetchBetRecords(1, true)
  }
)

// 组件挂载时加载数据
onMounted(() => {
  fetchBetRecords(1, true)
})
</script>

<template>
  <div class="bg-gray-100 pb-16">
    <div class="bg-white mx-3 my-3 rounded-lg shadow">
      <!-- 表头 -->
      <div class="grid grid-cols-[1.2fr_1.5fr_1fr] text-xs text-gray-500 border-b bg-gray-50 px-3 py-2 gap-2 rounded-t-lg">
        <span>{{ t('games.record.period-time') }}</span>
        <span class="text-center">{{ t('games.record.bet-details') }}</span>
        <span class="text-center">{{ t('games.record.amount-status') }}</span>
      </div>

      <div v-if="isLoadingRecords && recordList.length === 0" class="flex justify-center items-center py-8">
        <div class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <span class="ml-2 text-gray-600">{{ t('games.record.loading') }}</span>
      </div>

      <div v-else-if="recordList.length === 0" class="text-center py-8 text-gray-500">
        {{ t('games.record.no-data') }}
      </div>

      <div v-else class="divide-y">
        <div
          v-for="(item, index) in recordList"
          :key="`${item.id}-${index}`"
          :class="['px-3 py-3 text-xs', item.is_win === 2 ? 'bg-yellow-50' : 'bg-white']"
        >
          <div class="grid grid-cols-[1.2fr_1.5fr_1fr] items-start gap-2">
            <!-- 期号/时间 -->
            <div>
              <div class="text-sm text-blue-700 font-medium truncate">
                {{ item.expect_no || '--' }}
              </div>
              <div class="text-[10px] text-gray-400 mt-1">
                {{ item.bet_time || item.created_at || '' }}
              </div>
              <div class="text-[10px] mt-1">
                <span class="text-gray-500">{{ t('games.record.auto') }}</span>
                <span :class="item.is_auto === 1 ? 'text-green-600' : 'text-red-500'">
                  {{ item.is_auto === 1 ? '√' : '×' }}
                </span>
              </div>
            </div>

            <!-- 投注详情 -->
            <div class="text-center">
              <template v-if="getDisplayBetNoList(getBetNoList(item)).length === 0">
                <span class="text-gray-400">--</span>
              </template>
              <template v-else>
                <div class="space-y-1">
                  <div
                    v-for="(bet, i) in getDisplayBetNoList(getBetNoList(item))"
                    :key="i"
                    class="flex items-center justify-center gap-1 text-xs"
                  >
                    <span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                      {{ bet.bet_no || '--' }}
                    </span>
                    <span class="text-gray-500">
                      x {{ bet.win_gold || 0 }}
                    </span>
                  </div>
                </div>
              </template>
              <div v-if="getBetNoList(item).length > 3" class="text-gray-400 text-xs text-center">......</div>
            </div>

            <!-- 金额/状态 -->
            <div class="text-center">
              <div class="text-blue-600 font-medium">
                {{ t('games.record.bet-amount') }}{{ (item.bet_gold || 0).toLocaleString() }}
              </div>
              <div
                v-if="item.is_opened === 1"
                :class="item.win_gold && item.win_gold > 0 ? 'text-red-600 font-medium' : 'text-gray-400'"
              >
                {{ t('games.record.win-amount') }}{{ (item.win_gold || 0).toLocaleString() }}
              </div>
              <div :class="['inline-block px-2 py-0.5 rounded text-[10px] mt-1', getStatusInfo(item).color]">
                {{ getStatusInfo(item).text }}
              </div>
            </div>
          </div>

          <!-- 盈亏信息 -->
          <div v-if="item.is_opened === 1" class="mt-2 pt-2 border-t border-dashed flex justify-between items-center text-xs">
            <span class="text-gray-500">
              {{ t('games.record.total') }}{{ item.bet_num || getBetNoList(item).length }}{{ t('games.record.bets') }}
            </span>
            <span :class="(item.win_loss || 0) >= 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'">
              {{ t('games.record.profit-loss') }} {{ (item.win_loss || 0) >= 0 ? '+' : '' }}{{ (item.win_loss || 0).toLocaleString() }}
            </span>
          </div>
        </div>

        <!-- 加载更多 -->
        <div v-if="hasMore" class="py-4 text-center">
          <button
            @click="handleLoadMore"
            :disabled="isLoadingRecords"
            class="px-6 py-2 bg-red-600 text-white text-sm rounded-lg disabled:opacity-50"
          >
            {{ isLoadingRecords ? t('common.loading') : t('games.record.load-more') }}
          </button>
        </div>

        <div v-if="!hasMore && recordList.length > 0" class="py-4 text-center text-gray-400 text-sm">
          {{ t('games.record.no-more') }}
        </div>
      </div>
    </div>
  </div>
</template>
