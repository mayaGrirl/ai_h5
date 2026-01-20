<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { lotteryRecord } from '@/api/game'
import type { LotteryResultItem, MemberBetItem } from '@/types/game.type'

const { t } = useI18n()
const route = useRoute()

const lotteryList = ref<LotteryResultItem[]>([])
const isLoading = ref(false)
const page = ref(1)
const hasMore = ref(true)
const pageSize = 15

// 从路由获取参数
const getLotteryId = () => Number(route.query.lottery_id) || 0
const getGroupId = () => Number(route.query.group_id) || 0

// 获取开奖记录
const fetchLotteryList = async (pageNum: number = 1, reset: boolean = false) => {
  const lotteryId = getLotteryId()
  const groupId = getGroupId()

  if (!lotteryId) return

  try {
    isLoading.value = true
    const res = await lotteryRecord({
      lottery_id: lotteryId,
      game_group_id: groupId,
      page: pageNum,
      pageSize: pageSize
    })

    if (res.code === 200 && res.data) {
      const list = res.data.list || []
      if (reset) {
        lotteryList.value = list
      } else {
        lotteryList.value = [...lotteryList.value, ...list]
      }
      hasMore.value = list.length >= pageSize
      page.value = pageNum
    } else {
      if (reset) lotteryList.value = []
    }
  } catch (error) {
    console.error('获取开奖记录失败:', error)
    if (reset) lotteryList.value = []
  } finally {
    isLoading.value = false
  }
}

// 加载更多
const handleLoadMore = () => {
  if (isLoading.value || !hasMore.value) return
  fetchLotteryList(page.value + 1, false)
}

// 获取期号
const getExpectNo = (item: LotteryResultItem): string => {
  const expectNo = item.final_res?.expect_no || item.expect_no || item.action_no
  if (expectNo === undefined || expectNo === null) return '--'
  return String(expectNo)
}

// 获取开奖号码
const getNums = (item: LotteryResultItem): string => {
  const nums = item.final_res?.nums || item.action_no_num
  if (!nums) return '--'
  if (Array.isArray(nums)) return nums.join(',')
  if (typeof nums === 'object') return Object.values(nums).join(',')
  return String(nums)
}

// 解析号码为数组
const parseNums = (item: LotteryResultItem): string[] => {
  const numsStr = getNums(item)
  if (numsStr === '--') return []
  return numsStr.includes(',') ? numsStr.split(',') : numsStr.split('')
}

// 获取和值
const getSum = (item: LotteryResultItem): string => {
  const sum = item.final_res?.sum
  return sum !== undefined && sum !== null ? String(sum) : '--'
}

// 获取大小原始值 (用于样式判断)
const getBigSmallRaw = (item: LotteryResultItem): string => {
  return item.final_res?.bigSmall || '--'
}

// 获取大小 (翻译接口返回的中文值)
const getBigSmall = (item: LotteryResultItem): string => {
  const value = getBigSmallRaw(item)
  const map: Record<string, string> = {
    '大': t('games.open.big'),
    '小': t('games.open.small')
  }
  return map[value] || value
}

// 获取单双原始值 (用于样式判断)
const getOddEvenRaw = (item: LotteryResultItem): string => {
  return item.final_res?.oddEven || '--'
}

// 获取单双 (翻译接口返回的中文值)
const getOddEven = (item: LotteryResultItem): string => {
  const value = getOddEvenRaw(item)
  const map: Record<string, string> = {
    '单': t('games.open.odd'),
    '双': t('games.open.even')
  }
  return map[value] || value
}

// 获取形态
const getShape = (item: LotteryResultItem): string => {
  const shape = item.final_res?.shape || '--'
  const shapeMap: Record<string, string> = {
    bao: t('games.open.leopard'),
    shun: t('games.open.straight'),
    ban: t('games.open.half-straight'),
    dui: t('games.open.pair'),
    za: t('games.open.mixed')
  }
  return shapeMap[shape] || '--'
}

// 获取龙虎豹
const getShapeLungFuPao = (item: LotteryResultItem): string => {
  const lungFuPao = item.final_res?.lungFuPao || '--'
  const map: Record<string, string> = {
    Dragon: t('games.open.dragon'),
    dragon: t('games.open.dragon'),
    Tiger: t('games.open.tiger'),
    tiger: t('games.open.tiger'),
    Leopard: t('games.open.leopard'),
    leopard: t('games.open.leopard')
  }
  return map[lungFuPao] || '--'
}

// 获取用户投注信息
const getMemberBetInfo = (item: LotteryResultItem): { bet: number; win: number } => {
  const memberBet = item.memberBet

  if (!memberBet || (Array.isArray(memberBet) && memberBet.length === 0)) {
    return { bet: 0, win: 0 }
  }

  if (typeof memberBet === 'object' && !Array.isArray(memberBet)) {
    const betItem = memberBet as MemberBetItem
    return {
      bet: betItem.bet_gold || 0,
      win: betItem.win_gold || 0
    }
  }

  if (Array.isArray(memberBet)) {
    let totalBet = 0
    let totalWin = 0
    memberBet.forEach((bet: MemberBetItem) => {
      totalBet += bet.bet_gold || 0
      totalWin += bet.win_gold || 0
    })
    return { bet: totalBet, win: totalWin }
  }

  return { bet: 0, win: 0 }
}

// 监听路由参数变化，重新加载数据
watch(
  () => [route.query.lottery_id, route.query.group_id],
  () => {
    fetchLotteryList(1, true)
  }
)

// 组件挂载时加载数据
onMounted(() => {
  fetchLotteryList(1, true)
})
</script>

<template>
  <div class="bg-gray-100 pb-16">
    <!-- 开奖记录列表 -->
    <div class="bg-white mx-3 my-3 rounded-lg shadow">
      <!-- 表头 -->
      <div class="grid grid-cols-[1.5fr_1fr_0.8fr_1fr] text-xs text-gray-500 border-b bg-gray-50 px-3 py-2 gap-2 rounded-t-lg">
        <span>{{ t('games.open.period-numbers') }}</span>
        <span class="text-center">{{ t('games.open.sum-size') }}</span>
        <span class="text-center">{{ t('games.open.shape') }}</span>
        <span class="text-center">{{ t('games.open.bet-win') }}</span>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading && lotteryList.length === 0" class="flex justify-center items-center py-8">
        <div class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <span class="ml-2 text-gray-600">{{ t('games.open.loading') }}</span>
      </div>

      <!-- 空状态 -->
      <div v-else-if="lotteryList.length === 0" class="text-center py-8 text-gray-500">
        {{ t('games.open.no-data') }}
      </div>

      <!-- 列表 -->
      <div v-else class="divide-y">
        <div
          v-for="(item, index) in lotteryList"
          :key="`${getExpectNo(item)}-${index}`"
          :class="['px-3 py-3 text-xs', getMemberBetInfo(item).bet > 0 ? 'bg-yellow-50' : 'bg-white']"
        >
          <div class="grid grid-cols-[1.5fr_1fr_0.8fr_1fr] items-center gap-2">
            <!-- 期号/号码 -->
            <div>
              <div class="text-sm text-blue-700 truncate mb-1">
                {{ getExpectNo(item) }}
              </div>
              <div class="flex items-center gap-1 flex-wrap">
                <span v-if="parseNums(item).length === 0" class="text-gray-400">--</span>
                <span
                  v-else
                  v-for="(num, i) in parseNums(item)"
                  :key="i"
                  class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-500 text-white text-[10px]"
                >
                  {{ num }}
                </span>
              </div>
            </div>

            <!-- 和值/大小 -->
            <div class="text-center">
              <div class="mb-1">
                <span class="inline-flex h-6 min-w-6 px-1 items-center justify-center rounded-full bg-red-500 text-white text-xs">
                  {{ getSum(item) }}
                </span>
              </div>
              <div class="flex justify-center gap-1">
                <span :class="[
                  'text-xs font-medium',
                  getBigSmallRaw(item) === '大' ? 'text-red-600' : getBigSmallRaw(item) === '小' ? 'text-green-600' : 'text-gray-500'
                ]">
                  {{ getBigSmall(item) }}
                </span>
                <span :class="[
                  'text-xs font-medium',
                  getOddEvenRaw(item) === '单' ? 'text-orange-600' : getOddEvenRaw(item) === '双' ? 'text-blue-600' : 'text-gray-500'
                ]">
                  {{ getOddEven(item) }}
                </span>
              </div>
            </div>

            <!-- 形态 -->
            <div class="text-center">
              <div class="text-xs text-red-600 font-medium">
                {{ getShape(item) }}
              </div>
              <div class="text-xs text-blue-600 font-medium mt-2">
                {{ getShapeLungFuPao(item) }}
              </div>
            </div>

            <!-- 投注/中奖 -->
            <div class="text-center">
              <div class="text-blue-600 font-medium">
                {{ t('games.open.bet') }}{{ getMemberBetInfo(item).bet.toLocaleString() }}
              </div>
              <div :class="getMemberBetInfo(item).win > 0 ? 'text-red-600 font-medium' : 'text-gray-400 mt-2'">
                {{ t('games.open.win') }}{{ getMemberBetInfo(item).win.toLocaleString() }}
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
            {{ isLoading ? t('common.loading') : t('games.open.load-more') }}
          </button>
        </div>

        <!-- 没有更多 -->
        <div v-if="!hasMore && lotteryList.length > 0" class="py-4 text-center text-gray-400 text-sm">
          {{ t('games.open.no-more') }}
        </div>
      </div>
    </div>
  </div>
</template>
