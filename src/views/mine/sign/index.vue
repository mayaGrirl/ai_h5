<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { signIn, signStat, signRecords } from '@/api/customer'
import { toast } from '@/composables/useToast'
import type { SignInStatisticsField, SignInRecord } from '@/types/customer.type'
import PageHeader from '@/components/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// 当前选中的tab
const currentTab = computed(() => {
  const tab = route.query.tab as string
  return tab || 'in'
})

// tabs定义
const tabs = [
  { key: 'in', i18Key: 'mine.sign-in.tab-1' },
  { key: 'intro', i18Key: 'mine.sign-in.tab-2' },
  { key: 'record', i18Key: 'mine.sign-in.tab-3' }
]

// 切换tab
const switchTab = (tabKey: string) => {
  router.replace({ query: { tab: tabKey } })
}

// ============ 签到页面数据 ============
const isSign = ref(false)
const isLoading = ref(false)
const statData = ref<SignInStatisticsField>()

// 加载签到统计
const loadSignStat = async () => {
  try {
    const { data } = await signStat()
    statData.value = data
    if (data.is_sign) {
      isSign.value = true
    }
  } catch (error) {
    console.error('获取签到数据失败', error)
  }
}

// 签到
const handleSign = async () => {
  if (isSign.value) return

  isLoading.value = true
  try {
    const { code, message, data } = await signIn()
    if (code === 200) {
      toast.success(message || '签到成功')

      if (statData.value) {
        statData.value = {
          total_people: statData.value.total_people + 1,
          total_points: statData.value.total_points + data.total_points,
          total_base_coin: statData.value.total_base_coin + data.total_base_coin,
          continue_days: statData.value.continue_days + 1,
          total_days: statData.value.total_days + 1,
          is_sign: true
        }
      }
      isSign.value = true
    } else {
      toast.error(message || '签到失败')
    }
  } catch (error) {
    toast.error('签到失败')
  } finally {
    isLoading.value = false
  }
}

// ============ 签到记录数据 ============
const records = ref<SignInRecord[]>([])
const isLoadingRecords = ref(false)
const page = ref(1)
const hasMore = ref(true)
const pageSize = 20

// 加载签到记录
const loadRecords = async (pageNum: number = 1, reset: boolean = false) => {
  try {
    isLoadingRecords.value = true
    const res = await signRecords({ page: pageNum, pageSize })
    if (res.code === 200 && res.data) {
      const list = res.data || []
      if (reset) {
        records.value = list
      } else {
        records.value = [...records.value, ...list]
      }
      hasMore.value = list.length >= pageSize
      page.value = pageNum
    }
  } catch (error) {
    console.error('加载签到记录失败', error)
  } finally {
    isLoadingRecords.value = false
  }
}

// 加载更多记录
const handleLoadMore = () => {
  if (isLoadingRecords.value || !hasMore.value) return
  loadRecords(page.value + 1, false)
}

// 监听tab变化
watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab === 'in' || !newTab) {
      loadSignStat()
    } else if (newTab === 'record') {
      loadRecords(1, true)
    }
  }
)

// 初始化
onMounted(() => {
  // 如果没有tab参数，默认跳转到in
  if (!route.query.tab) {
    router.replace({ query: { tab: 'in' } })
  }

  if (currentTab.value === 'in') {
    loadSignStat()
  } else if (currentTab.value === 'record') {
    loadRecords(1, true)
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#f5f7fb] pb-16">
    <PageHeader :title="t('mine.btn-sign_in')" />

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
      <!-- 签到页面 -->
      <div v-if="currentTab === 'in'" class="px-4 py-4 bg-white rounded-lg">
        <!-- 统计 -->
        <div class="mb-3">
          <div class="bg-[#f5f5f5] py-3 px-3 rounded text-sm">
            今日已有 <span class="text-red-600 font-semibold">{{ statData?.total_people || 0 }}</span> 人签到，
            共获得 <span class="text-red-600 font-semibold">{{ statData?.total_points || 0 }}</span> 积分，
            <span class="text-red-600 font-semibold">{{ statData?.total_base_coin || 0 }}</span> 金豆
          </div>
          <div class="bg-[#fffae8] text-[#f79304] py-3 px-3 my-3 rounded text-sm">
            您已连续签到 <strong>{{ statData?.continue_days || 0 }}</strong> 天，
            累计签到 <strong>{{ statData?.total_days || 0 }}</strong> 天
          </div>
        </div>

        <!-- 签到按钮 -->
        <div class="flex justify-center py-20">
          <button
            type="button"
            @click="handleSign"
            :class="[
              'w-40 h-40 rounded-full flex items-center justify-center text-white text-lg font-medium shadow-lg transition-transform active:scale-95',
              isSign || isLoading ? 'bg-[#cccccc]' : 'bg-[#ff5a1f]'
            ]"
          >
            {{ isSign ? '已签到' : isLoading ? '签到中...' : '点击签到' }}
          </button>
        </div>
      </div>

      <!-- 签到规则 -->
      <div v-else-if="currentTab === 'intro'" class="px-4 py-4 bg-white rounded-lg">
        <div class="space-y-4 text-sm text-gray-700">
          <div>
            <h3 class="font-medium text-gray-900 mb-2">签到规则</h3>
            <ul class="list-disc list-inside space-y-1 text-gray-600">
              <li>每日签到可获得积分和金豆奖励</li>
              <li>连续签到天数越多，奖励越丰厚</li>
              <li>每日0点重置签到状态</li>
              <li>中断签到后，连续签到天数重新计算</li>
            </ul>
          </div>

          <div>
            <h3 class="font-medium text-gray-900 mb-2">奖励说明</h3>
            <ul class="list-disc list-inside space-y-1 text-gray-600">
              <li>基础签到奖励：每日固定积分</li>
              <li>连续签到奖励：额外积分加成</li>
              <li>金豆奖励：可用于游戏投注</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 签到记录 -->
      <div v-else-if="currentTab === 'record'" class="bg-white rounded-lg">
        <div v-if="isLoadingRecords && records.length === 0" class="flex justify-center items-center py-8">
          <div class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <span class="ml-2 text-gray-600">加载中...</span>
        </div>

        <div v-else-if="records.length === 0" class="text-center py-8 text-gray-500">
          暂无签到记录
        </div>

        <div v-else class="divide-y">
          <div
            v-for="record in records"
            :key="record.id"
            class="px-4 py-3 flex justify-between items-center"
          >
            <div>
              <div class="text-sm text-gray-800">{{ record.sign_date }}</div>
              <div class="text-xs text-gray-500 mt-1">{{ record.created_at }}</div>
            </div>
            <div class="text-right">
              <div class="text-sm text-red-600">+{{ record.reward_points }} 积分</div>
              <div class="text-xs text-orange-500">+{{ record.reward_base_coin }} 金豆</div>
            </div>
          </div>

          <!-- 加载更多 -->
          <div v-if="hasMore" class="py-4 text-center">
            <button
              @click="handleLoadMore"
              :disabled="isLoadingRecords"
              class="px-6 py-2 bg-red-600 text-white text-sm rounded-lg disabled:opacity-50"
            >
              {{ isLoadingRecords ? '加载中...' : '加载更多' }}
            </button>
          </div>

          <div v-if="!hasMore && records.length > 0" class="py-4 text-center text-gray-400 text-sm">
            没有更多数据了
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
