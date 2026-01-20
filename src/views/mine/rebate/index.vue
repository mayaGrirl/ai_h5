<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { wagesCzRecords, receiveWagesCz, wagesRecords, receiveWages } from '@/api/customer'
import { toast } from '@/composables/useToast'
import type { WagesCzRecordField, WagesRecordField } from '@/types/customer.type'
import PageHeader from '@/components/PageHeader.vue'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// 当前选中的tab
const currentTab = computed(() => {
  const tab = route.query.tab as string
  return tab || 'recharge'
})

// 是否来自抽屉
const fromDrawer = computed(() => route.query.from === 'drawer')

// tabs定义
const tabs = [
  { key: 'recharge', i18Key: 'rebate.tab-1' },
  { key: 'loss', i18Key: 'rebate.tab-2' }
]

// 切换tab
const switchTab = (tabKey: string) => {
  const query: Record<string, string> = { tab: tabKey }
  if (fromDrawer.value) {
    query.from = 'drawer'
  }
  router.replace({ query })
}

// ============ Recharge页面数据 ============
const rechargeList = ref<WagesCzRecordField[]>([])
const rechargePage = ref(1)
const rechargeHasMore = ref(true)
const rechargeLoading = ref(false)
const rechargeReceivingSet = ref<Set<number>>(new Set())

const loadRechargeData = async (pageNum: number = 1, reset: boolean = false) => {
  rechargeLoading.value = true
  try {
    const res = await wagesCzRecords({ page: pageNum, pageSize: 20 })
    if (res.code === 200 && res.data) {
      const list = res.data || []
      if (reset) {
        rechargeList.value = list
      } else {
        rechargeList.value = [...rechargeList.value, ...list]
      }
      rechargeHasMore.value = list.length >= 20
      rechargePage.value = pageNum
    }
  } catch (error) {
    console.error('加载充值返利记录失败', error)
  } finally {
    rechargeLoading.value = false
  }
}

const handleReceiveRecharge = async (id: number) => {
  if (rechargeReceivingSet.value.has(id)) return

  rechargeReceivingSet.value.add(id)
  try {
    const res = await receiveWagesCz(id)
    if (res.code === 200) {
      toast.success(res.message || '领取成功')
      // 更新列表项状态
      rechargeList.value = rechargeList.value.map(item =>
        item.id === id ? res.data : item
      )
    } else {
      toast.error(res.message || '领取失败')
    }
  } catch (error) {
    toast.error('领取失败')
  } finally {
    rechargeReceivingSet.value.delete(id)
  }
}

// ============ Loss页面数据 ============
const lossList = ref<WagesRecordField[]>([])
const lossPage = ref(1)
const lossHasMore = ref(true)
const lossLoading = ref(false)
const lossReceivingSet = ref<Set<number>>(new Set())

const loadLossData = async (pageNum: number = 1, reset: boolean = false) => {
  lossLoading.value = true
  try {
    const res = await wagesRecords({ page: pageNum, pageSize: 20 })
    if (res.code === 200 && res.data) {
      const list = res.data || []
      if (reset) {
        lossList.value = list
      } else {
        lossList.value = [...lossList.value, ...list]
      }
      lossHasMore.value = list.length >= 20
      lossPage.value = pageNum
    }
  } catch (error) {
    console.error('加载亏损返利记录失败', error)
  } finally {
    lossLoading.value = false
  }
}

const handleReceiveLoss = async (id: number) => {
  if (lossReceivingSet.value.has(id)) return

  lossReceivingSet.value.add(id)
  try {
    const res = await receiveWages(id)
    if (res.code === 200) {
      toast.success(res.message || '领取成功')
      // 更新列表项状态
      lossList.value = lossList.value.map(item =>
        item.id === id ? res.data : item
      )
    } else {
      toast.error(res.message || '领取失败')
    }
  } catch (error) {
    toast.error('领取失败')
  } finally {
    lossReceivingSet.value.delete(id)
  }
}

// 格式化时间
const formatDateTime = (timestamp: number | undefined) => {
  if (!timestamp) return ''
  return dayjs.unix(timestamp).format('YYYY-MM-DD HH:mm')
}

const formatTime = (timestamp: number | undefined) => {
  if (!timestamp) return ''
  return dayjs.unix(timestamp).format('HH:mm')
}

// 自定义返回
const customBack = computed(() => {
  return fromDrawer.value ? '/mine?drawer=setting' : undefined
})

// 监听tab变化
watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab === 'recharge' || !newTab) {
      loadRechargeData(1, true)
    } else if (newTab === 'loss') {
      loadLossData(1, true)
    }
  }
)

// 初始化
onMounted(() => {
  if (!route.query.tab) {
    const query: Record<string, string> = { tab: 'recharge' }
    if (fromDrawer.value) {
      query.from = 'drawer'
    }
    router.replace({ query })
  }

  if (currentTab.value === 'recharge') {
    loadRechargeData(1, true)
  } else if (currentTab.value === 'loss') {
    loadLossData(1, true)
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#f5f7fb] pb-16">
    <PageHeader :title="t('rebate.header-title')" :custom-back="customBack" />

    <!-- Tab导航 -->
    <div class="grid grid-cols-2 text-center text-sm bg-white">
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
      <!-- Recharge 充值返利页面 -->
      <div v-if="currentTab === 'recharge'" class="bg-white rounded-lg">
        <!-- 表头 -->
        <div class="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr_1fr] px-3 py-2 text-xs text-gray-500 border-b">
          <div class="text-center">{{ t('rebate.recharge-table-header-1') }}</div>
          <div class="text-center">{{ t('rebate.recharge-table-header-2') }}</div>
          <div class="text-center">{{ t('rebate.recharge-table-header-3') }}</div>
          <div class="text-center">{{ t('rebate.recharge-table-header-4') }}</div>
          <div class="text-center">{{ t('rebate.recharge-table-header-5') }}</div>
        </div>

        <div v-if="rechargeLoading && rechargeList.length === 0" class="flex justify-center items-center py-8">
          <div class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <span class="ml-2 text-gray-600">{{ t('common.loading') }}</span>
        </div>

        <div v-else-if="rechargeList.length === 0" class="text-center py-8 text-gray-500">
          暂无数据
        </div>

        <div v-else>
          <div
            v-for="(item, index) in rechargeList"
            :key="index"
            class="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr_1fr] px-3 py-3 border-b text-sm items-center"
          >
            <!-- 日期 -->
            <div class="text-center text-xs">{{ formatDateTime(item?.addtime) }}</div>

            <!-- 有效流水 -->
            <div class="text-center font-medium">{{ (item?.wpoints || 0).toLocaleString() }}</div>

            <!-- 充值 -->
            <div class="text-center font-medium">{{ ((item?.cz || 0) * 1000).toLocaleString() }}</div>

            <!-- 返利 -->
            <div class="text-center font-medium">{{ (item?.hdpoints || 0).toLocaleString() }}</div>

            <!-- 状态 -->
            <div class="text-center font-medium">
              <div v-if="item.state === 1">{{ item.state_label }}({{ formatTime(item?.gettime) }})</div>
              <div v-else-if="item.state === 2 || item.state === 3">{{ item.state_label }}</div>
              <button
                v-else
                @click="handleReceiveRecharge(item.id || 0)"
                :class="[
                  'px-2 py-1 text-xs rounded',
                  rechargeReceivingSet.has(item.id || 0)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-500 text-white cursor-pointer'
                ]"
              >
                {{ rechargeReceivingSet.has(item.id || 0) ? t('common.form.button.submitting') : t('rebate.recharge-receive-btn') }}
              </button>
            </div>
          </div>

          <!-- 加载更多 -->
          <div v-if="rechargeHasMore" class="py-4 text-center">
            <button
              @click="loadRechargeData(rechargePage + 1, false)"
              :disabled="rechargeLoading"
              class="px-6 py-2 bg-red-600 text-white text-sm rounded-lg disabled:opacity-50"
            >
              {{ rechargeLoading ? t('common.loading') : '加载更多' }}
            </button>
          </div>

          <div v-if="!rechargeHasMore && rechargeList.length > 0" class="py-4 text-center text-gray-400 text-sm">
            {{ t('common.loading-list-empty') }}
          </div>
        </div>
      </div>

      <!-- Loss 亏损返利页面 -->
      <div v-else-if="currentTab === 'loss'" class="bg-white rounded-lg">
        <!-- 表头 -->
        <div class="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr_1fr] px-3 py-2 text-xs text-gray-500 border-b">
          <div class="text-center">{{ t('rebate.loss-table-header-1') }}</div>
          <div class="text-center">{{ t('rebate.loss-table-header-2') }}</div>
          <div class="text-center">{{ t('rebate.loss-table-header-3') }}</div>
          <div class="text-center">{{ t('rebate.loss-table-header-4') }}</div>
          <div class="text-center">{{ t('rebate.loss-table-header-5') }}</div>
        </div>

        <div v-if="lossLoading && lossList.length === 0" class="flex justify-center items-center py-8">
          <div class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <span class="ml-2 text-gray-600">{{ t('common.loading') }}</span>
        </div>

        <div v-else-if="lossList.length === 0" class="text-center py-8 text-gray-500">
          暂无数据
        </div>

        <div v-else>
          <div
            v-for="(item, index) in lossList"
            :key="index"
            class="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr_1fr] px-3 py-3 border-b text-sm items-center"
          >
            <!-- 日期 -->
            <div class="text-center text-xs">{{ formatDateTime(item?.addtime) }}</div>

            <!-- 亏损 -->
            <div class="text-center font-medium">{{ (item?.points || 0).toLocaleString() }}</div>

            <!-- 充值 -->
            <div class="text-center font-medium">{{ ((item?.cz || 0) * 1000).toLocaleString() }}</div>

            <!-- 返利 -->
            <div class="text-center font-medium">{{ (item?.hdpoints || 0).toLocaleString() }}</div>

            <!-- 状态 -->
            <div class="text-center font-medium">
              <div v-if="item.state === 1">{{ item.state_label }}({{ formatTime(item?.gettime) }})</div>
              <div v-else-if="item.state === 2 || item.state === 3">{{ item.state_label }}</div>
              <button
                v-else
                @click="handleReceiveLoss(item.id || 0)"
                :class="[
                  'px-2 py-1 text-xs rounded',
                  lossReceivingSet.has(item.id || 0)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-500 text-white cursor-pointer'
                ]"
              >
                {{ lossReceivingSet.has(item.id || 0) ? t('common.form.button.submitting') : t('rebate.recharge-receive-btn') }}
              </button>
            </div>
          </div>

          <!-- 加载更多 -->
          <div v-if="lossHasMore" class="py-4 text-center">
            <button
              @click="loadLossData(lossPage + 1, false)"
              :disabled="lossLoading"
              class="px-6 py-2 bg-red-600 text-white text-sm rounded-lg disabled:opacity-50"
            >
              {{ lossLoading ? t('common.loading') : '加载更多' }}
            </button>
          </div>

          <div v-if="!lossHasMore && lossList.length > 0" class="py-4 text-center text-gray-400 text-sm">
            {{ t('common.loading-list-empty') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
