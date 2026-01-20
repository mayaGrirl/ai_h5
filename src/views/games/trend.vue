<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { RefreshCw } from 'lucide-vue-next'
import { lotteryRecord } from '@/api/game'
import { toast } from '@/composables/useToast'
import { cn } from '@/utils'
import type { LotteryResultItem } from '@/types/game.type'

type TrendTab = 'nums' | 'bigSmall' | 'shape' | 'mod'

const route = useRoute()

const trendTab = ref<TrendTab>('nums')
const trendList = ref<LotteryResultItem[]>([])
const isLoadingTrend = ref(false)
const periodCount = ref(30)
const periodOptions = [30, 50, 100]

// 从路由获取参数
const getLotteryId = () => Number(route.query.lottery_id) || 0
const getGroupId = () => Number(route.query.group_id) || 0

// 获取走势数据
const fetchTrendData = async (count: number = 30) => {
  const lotteryId = getLotteryId()
  const groupId = getGroupId()

  if (!lotteryId) return

  try {
    isLoadingTrend.value = true
    const res = await lotteryRecord({
      lottery_id: lotteryId,
      game_group_id: groupId,
      page: 1,
      pageSize: count
    })

    if (res.code === 200 && res.data) {
      trendList.value = res.data.list || []
    } else {
      toast.error(res.message || '获取走势数据失败')
      trendList.value = []
    }
  } catch (error) {
    toast.error('获取走势数据失败，请稍后重试')
    trendList.value = []
  } finally {
    isLoadingTrend.value = false
  }
}

const handlePeriodChange = (count: number) => {
  periodCount.value = count
  fetchTrendData(count)
}

const handleRefresh = () => {
  fetchTrendData(periodCount.value)
}

const getExpectNo = (item: LotteryResultItem): string => {
  const expectNo = item.final_res?.expectNo || item.final_res?.expect_no || item.expect_no
  if (!expectNo) return '--'
  return String(expectNo).slice(-7)
}

const getNums = (item: LotteryResultItem): string[] => {
  const nums = item.final_res?.nums || item.action_no_num
  if (!nums) return []
  if (Array.isArray(nums)) return nums
  if (typeof nums === 'object') return Object.values(nums)
  return String(nums).split(',')
}

const getSum = (item: LotteryResultItem): number | string => {
  return item.final_res?.sum ?? '--'
}

const trendTabs = [
  { key: 'nums' as TrendTab, label: '号码' },
  { key: 'bigSmall' as TrendTab, label: '大小单双' },
  { key: 'mod' as TrendTab, label: '取模' },
  { key: 'shape' as TrendTab, label: '形态' }
]

const filteredTrendList = () => {
  return trendList.value.filter((item) => {
    const nums = getNums(item)
    return nums.length > 0 && nums.some(n => n && n !== '')
  })
}

// 监听路由参数变化，重新加载数据
watch(
  () => [route.query.lottery_id, route.query.group_id],
  () => {
    fetchTrendData(periodCount.value)
  }
)

// 组件挂载时加载数据
onMounted(() => {
  fetchTrendData(periodCount.value)
})
</script>

<template>
  <div class="bg-gray-100">
    <!-- 走势表 -->
    <div class="bg-white m-3 rounded-lg shadow overflow-hidden">
      <!-- 顶部控制栏 -->
      <div class="flex justify-between items-center px-3 py-2 border-b bg-gray-50">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">显示</span>
          <select
            v-model="periodCount"
            @change="handlePeriodChange(periodCount)"
            class="px-2 py-1 text-sm border border-gray-300 rounded bg-white"
          >
            <option v-for="opt in periodOptions" :key="opt" :value="opt">{{ opt }}期</option>
          </select>
        </div>
        <button
          @click="handleRefresh"
          :disabled="isLoadingTrend"
          class="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 disabled:opacity-50"
        >
          <RefreshCw :size="14" :class="isLoadingTrend ? 'animate-spin' : ''" />
          刷新
        </button>
      </div>

      <!-- 走势标签切换 -->
      <div class="flex border-b bg-white">
        <button
          v-for="t in trendTabs"
          :key="t.key"
          @click="trendTab = t.key"
          :class="cn(
            'flex-1 py-2.5 text-xs font-medium transition-colors',
            trendTab === t.key
              ? 'text-red-600 bg-red-50 border-b-2 border-red-600'
              : 'text-gray-600 hover:bg-gray-50'
          )"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- 表头 -->
      <div class="flex text-xs bg-gray-100 border-b font-medium">
        <div class="w-16 py-2 text-center border-r flex-shrink-0">期号</div>

        <!-- 号码表头 -->
        <template v-if="trendTab === 'nums'">
          <div class="flex-1 flex">
            <div class="flex-1 py-2 text-center border-r text-gray-600">开奖号码</div>
            <div class="w-12 py-2 text-center text-gray-600">和值</div>
          </div>
        </template>

        <!-- 大小单双表头 -->
        <template v-if="trendTab === 'bigSmall'">
          <div class="flex-1 flex text-center">
            <div class="flex-1 py-2 border-r text-red-600">大</div>
            <div class="flex-1 py-2 border-r text-green-600">小</div>
            <div class="flex-1 py-2 border-r text-orange-600">单</div>
            <div class="flex-1 py-2 border-r text-blue-600">双</div>
            <div class="flex-1 py-2 border-r text-purple-600">中</div>
            <div class="flex-1 py-2 text-cyan-600">边</div>
          </div>
        </template>

        <!-- 形态表头 -->
        <template v-if="trendTab === 'shape'">
          <div class="flex-1 flex text-center">
            <div class="flex-1 py-2 border-r text-pink-600">豹子</div>
            <div class="flex-1 py-2 border-r text-red-600">顺子</div>
            <div class="flex-1 py-2 border-r text-orange-600">半顺</div>
            <div class="flex-1 py-2 border-r text-blue-600">对子</div>
            <div class="flex-1 py-2 border-r text-gray-600">杂六</div>
            <div class="w-px bg-gray-300"></div>
            <div class="flex-1 py-2 border-r text-red-600">龙</div>
            <div class="flex-1 py-2 border-r text-blue-600">虎</div>
            <div class="flex-1 py-2 text-purple-600">豹</div>
          </div>
        </template>

        <!-- 取模表头 -->
        <template v-if="trendTab === 'mod'">
          <div class="flex-1 flex flex-col">
            <div class="flex border-b">
              <div class="flex-[3] py-1 text-center border-r bg-gray-200 font-bold">模3</div>
              <div class="flex-[4] py-1 text-center border-r bg-amber-100 font-bold">模4</div>
              <div class="flex-[5] py-1 text-center bg-teal-100 font-bold">模5</div>
            </div>
            <div class="flex">
              <div v-for="n in [0, 1, 2]" :key="`m3-${n}`" class="flex-1 py-1 text-center border-r text-gray-600">{{ n }}</div>
              <div v-for="n in [0, 1, 2, 3]" :key="`m4-${n}`" class="flex-1 py-1 text-center border-r text-gray-600">{{ n }}</div>
              <div v-for="(n, i) in [0, 1, 2, 3, 4]" :key="`m5-${n}`" :class="cn('flex-1 py-1 text-center text-gray-600', i < 4 && 'border-r')">{{ n }}</div>
            </div>
          </div>
        </template>
      </div>

      <!-- 数据列表 -->
      <div v-if="isLoadingTrend" class="flex justify-center items-center py-8">
        <div class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
        <span class="ml-2 text-gray-600">加载走势数据中...</span>
      </div>

      <div v-else-if="trendList.length === 0" class="text-center py-8 text-gray-500">
        暂无走势数据
      </div>

      <div v-else class="max-h-[60vh] overflow-y-auto">
        <div
          v-for="(item, index) in filteredTrendList()"
          :key="`${item.id || index}`"
          class="flex text-xs border-b hover:bg-gray-50"
        >
          <!-- 期号列 -->
          <div class="w-16 py-2.5 text-center border-r flex-shrink-0 text-gray-700 font-medium bg-gray-50">
            {{ getExpectNo(item) }}
          </div>

          <!-- 号码 -->
          <template v-if="trendTab === 'nums'">
            <div class="flex-1 flex">
              <div class="flex-1 py-2 flex items-center justify-center gap-3 border-r">
                <span
                  v-for="(num, i) in getNums(item)"
                  :key="i"
                  class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-b from-gray-500 to-gray-700 text-white text-sm font-bold shadow"
                >
                  {{ num }}
                </span>
              </div>
              <div class="w-12 py-2 flex items-center justify-center">
                <span class="inline-flex h-7 min-w-7 px-1.5 items-center justify-center rounded-full bg-gradient-to-b from-red-500 to-red-600 text-white text-sm font-bold shadow">
                  {{ getSum(item) }}
                </span>
              </div>
            </div>
          </template>

          <!-- 大小单双 -->
          <template v-if="trendTab === 'bigSmall'">
            <div class="flex-1 flex text-center">
              <div :class="cn('flex-1 py-2.5 border-r flex items-center justify-center', item.final_res?.bigSmall === '大' && 'bg-red-100')">
                <span v-if="item.final_res?.bigSmall === '大'" class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">大</span>
              </div>
              <div :class="cn('flex-1 py-2.5 border-r flex items-center justify-center', item.final_res?.bigSmall === '小' && 'bg-green-100')">
                <span v-if="item.final_res?.bigSmall === '小'" class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-xs font-bold">小</span>
              </div>
              <div :class="cn('flex-1 py-2.5 border-r flex items-center justify-center', item.final_res?.oddEven === '单' && 'bg-orange-100')">
                <span v-if="item.final_res?.oddEven === '单'" class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">单</span>
              </div>
              <div :class="cn('flex-1 py-2.5 border-r flex items-center justify-center', item.final_res?.oddEven === '双' && 'bg-blue-100')">
                <span v-if="item.final_res?.oddEven === '双'" class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">双</span>
              </div>
              <div :class="cn('flex-1 py-2.5 border-r flex items-center justify-center', item.final_res?.middleSide === '中' && 'bg-purple-100')">
                <span v-if="item.final_res?.middleSide === '中'" class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white text-xs font-bold">中</span>
              </div>
              <div :class="cn('flex-1 py-2.5 flex items-center justify-center', item.final_res?.middleSide === '边' && 'bg-cyan-100')">
                <span v-if="item.final_res?.middleSide === '边'" class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-white text-xs font-bold">边</span>
              </div>
            </div>
          </template>

          <!-- 形态 -->
          <template v-if="trendTab === 'shape'">
            <div class="flex-1 flex text-center">
              <div :class="cn('flex-1 py-2.5 border-r flex items-center justify-center', item.final_res?.shape === 'bao' && 'bg-pink-100')">
                <span v-if="item.final_res?.shape === 'bao'" class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-white text-[10px] font-bold">豹</span>
              </div>
              <div :class="cn('flex-1 py-2.5 border-r flex items-center justify-center', item.final_res?.shape === 'shun' && 'bg-red-100')">
                <span v-if="item.final_res?.shape === 'shun'" class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">顺</span>
              </div>
              <div :class="cn('flex-1 py-2.5 border-r flex items-center justify-center', item.final_res?.shape === 'ban' && 'bg-orange-100')">
                <span v-if="item.final_res?.shape === 'ban'" class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white text-[10px] font-bold">半</span>
              </div>
              <div :class="cn('flex-1 py-2.5 border-r flex items-center justify-center', item.final_res?.shape === 'dui' && 'bg-blue-100')">
                <span v-if="item.final_res?.shape === 'dui'" class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold">对</span>
              </div>
              <div :class="cn('flex-1 py-2.5 border-r flex items-center justify-center', item.final_res?.shape === 'za' && 'bg-gray-200')">
                <span v-if="item.final_res?.shape === 'za'" class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-500 text-white text-[10px] font-bold">杂</span>
              </div>
              <div class="w-px bg-gray-300"></div>
              <div :class="cn('flex-1 py-2.5 border-r flex items-center justify-center', ['Dragon', 'dragon'].includes(item.final_res?.lungFuPao || '') && 'bg-red-100')">
                <span v-if="['Dragon', 'dragon'].includes(item.final_res?.lungFuPao || '')" class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">龙</span>
              </div>
              <div :class="cn('flex-1 py-2.5 border-r flex items-center justify-center', ['Tiger', 'tiger'].includes(item.final_res?.lungFuPao || '') && 'bg-blue-100')">
                <span v-if="['Tiger', 'tiger'].includes(item.final_res?.lungFuPao || '')" class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold">虎</span>
              </div>
              <div :class="cn('flex-1 py-2.5 flex items-center justify-center', ['Leopard', 'leopard'].includes(item.final_res?.lungFuPao || '') && 'bg-purple-100')">
                <span v-if="['Leopard', 'leopard'].includes(item.final_res?.lungFuPao || '')" class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-white text-[10px] font-bold">豹</span>
              </div>
            </div>
          </template>

          <!-- 取模 -->
          <template v-if="trendTab === 'mod'">
            <div class="flex-1 flex text-center">
              <div v-for="n in [0, 1, 2]" :key="`m3-${n}`" :class="cn('flex-1 py-2.5 border-r flex items-center justify-center', item.final_res?.mod3 === n && 'bg-gray-200')">
                <span v-if="item.final_res?.mod3 === n" class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-600 text-white text-xs font-bold">{{ n }}</span>
              </div>
              <div v-for="n in [0, 1, 2, 3]" :key="`m4-${n}`" :class="cn('flex-1 py-2.5 border-r flex items-center justify-center', item.final_res?.mod4 === n && 'bg-amber-100')">
                <span v-if="item.final_res?.mod4 === n" class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">{{ n }}</span>
              </div>
              <div v-for="(n, i) in [0, 1, 2, 3, 4]" :key="`m5-${n}`" :class="cn('flex-1 py-2.5 flex items-center justify-center', i < 4 && 'border-r', item.final_res?.mod5 === n && 'bg-teal-100')">
                <span v-if="item.final_res?.mod5 === n" class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-white text-xs font-bold">{{ n }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
