<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { recommendLink, recommendCustomers, receiveRecommendReward } from '@/api/customer'
import { getBlockByIdentifier } from '@/api/common'
import { toast } from '@/composables/useToast'
import type { RecommendCustomer } from '@/types/customer.type'
import PageHeader from '@/components/PageHeader.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// 当前选中的tab
const currentTab = computed(() => {
  const tab = route.query.tab as string
  return tab || 'intro'
})

// tabs定义
const tabs = [
  { key: 'intro', i18Key: 'recommend.tab-1' },
  { key: 'promotion', i18Key: 'recommend.tab-2' },
  { key: 'record', i18Key: 'recommend.tab-3' }
]

// 切换tab
const switchTab = (tabKey: string) => {
  router.replace({ query: { tab: tabKey } })
}

// ============ Intro页面数据 ============
const introContent = ref('')
const introLoading = ref(false)

const friendRewards = [
  { level: 0, eco: 0, reward: 0, rate: '0.2%' },
  { level: 1, eco: 500, reward: 10000, rate: '0.2%' },
  { level: 2, eco: 2000, reward: 30000, rate: '0.2%' },
  { level: 3, eco: 10000, reward: 80000, rate: '0.2%' },
  { level: 4, eco: 60000, reward: 160000, rate: '0.2%' },
  { level: 5, eco: 420000, reward: 300000, rate: '0.2%' },
  { level: 6, eco: 800000, reward: 500000, rate: '0.2%' },
  { level: 7, eco: 2000000, reward: 600000, rate: '0.2%' },
  { level: 8, eco: 8000000, reward: 700000, rate: '0.2%' },
  { level: 9, eco: 15000000, reward: 800000, rate: '0.2%' },
  { level: 10, eco: 30000000, reward: 900000, rate: '0.2%' }
]

const loadIntroContent = async () => {
  introLoading.value = true
  try {
    const res = await getBlockByIdentifier('customer_spread_intro_tips')
    if (res.code === 200 && res.data) {
      introContent.value = res.data.content || ''
    }
  } catch (error) {
    console.error('加载推广说明失败', error)
  } finally {
    introLoading.value = false
  }
}

// ============ Promotion页面数据 ============
const promotionLoading = ref(false)
const copiedText = ref('')
const copied = ref(false)

const loadPromotionLink = async () => {
  promotionLoading.value = true
  try {
    const res = await recommendLink()
    if (res.code === 200 && res.data) {
      const domain = `${window.location.protocol}//${window.location.host}`
      const link = `${domain}/auth/register?t=${res.data.key}`
      copiedText.value = t('recommend.copied-text', { link: link })
    } else {
      toast.error(res.message || '获取推广链接失败')
    }
  } catch (error) {
    console.error('获取推广链接失败', error)
  } finally {
    promotionLoading.value = false
  }
}

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(copiedText.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch {
    // 兼容旧浏览器
    const textarea = document.createElement('textarea')
    textarea.value = copiedText.value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  }
}

// ============ Record页面数据 ============
const recordList = ref<RecommendCustomer[]>([])
const recordPage = ref(1)
const recordHasMore = ref(true)
const recordLoading = ref(false)
const receivingLevel = ref(false)
const receivingBet = ref(false)

const loadRecordData = async (pageNum: number = 1, reset: boolean = false) => {
  recordLoading.value = true
  try {
    const res = await recommendCustomers({ page: pageNum, pageSize: 20 })
    if (res.code === 200 && res.data) {
      const list = res.data || []
      if (reset) {
        recordList.value = list
      } else {
        recordList.value = [...recordList.value, ...list]
      }
      recordHasMore.value = list.length >= 20
      recordPage.value = pageNum
    }
  } catch (error) {
    console.error('加载推广记录失败', error)
  } finally {
    recordLoading.value = false
  }
}

const handleReceive = async (type: number, isLevel: boolean) => {
  const setLoading = isLevel ? receivingLevel : receivingBet
  if (setLoading.value) return

  if (isLevel) {
    receivingLevel.value = true
  } else {
    receivingBet.value = true
  }

  try {
    const res = await receiveRecommendReward({ type })
    if (res.code === 200) {
      toast.success(res.message || '领取成功')
      // 刷新列表
      await loadRecordData(1, true)
    } else {
      toast.error(res.message || '领取失败')
    }
  } catch (error) {
    toast.error('领取失败')
  } finally {
    if (isLevel) {
      receivingLevel.value = false
    } else {
      receivingBet.value = false
    }
  }
}

// 监听tab变化
watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab === 'intro' || !newTab) {
      loadIntroContent()
    } else if (newTab === 'promotion') {
      loadPromotionLink()
    } else if (newTab === 'record') {
      loadRecordData(1, true)
    }
  }
)

// 初始化
onMounted(() => {
  if (!route.query.tab) {
    router.replace({ query: { tab: 'intro' } })
  }

  if (currentTab.value === 'intro') {
    loadIntroContent()
  } else if (currentTab.value === 'promotion') {
    loadPromotionLink()
  } else if (currentTab.value === 'record') {
    loadRecordData(1, true)
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#f5f7fb] pb-16">
    <PageHeader :title="t('recommend.header-title')" />

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
      <!-- Intro 说明页面 -->
      <div v-if="currentTab === 'intro'" class="px-4 py-4 bg-white rounded-lg">
        <!-- 骨架屏 -->
        <template v-if="introLoading">
          <div v-for="i in 3" :key="i" class="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
        </template>

        <!-- 内容 -->
        <div
          v-else
          class="prose prose-sm max-w-none text-gray-700 mb-4"
          v-html="introContent"
        ></div>

        <!-- 表格 -->
        <div class="overflow-hidden rounded-lg bg-white shadow-sm">
          <!-- 表头 -->
          <div class="grid grid-cols-4 bg-[#fafafa] px-3 py-2 font-medium text-center text-gray-700 text-sm">
            <div>{{ t('recommend.intro-table-header-1') }}</div>
            <div>{{ t('recommend.intro-table-header-2') }}</div>
            <div>{{ t('recommend.intro-table-header-3') }}</div>
            <div>{{ t('recommend.intro-table-header-4') }}</div>
          </div>

          <!-- 表体 -->
          <div
            v-for="item in friendRewards"
            :key="item.level"
            class="grid grid-cols-4 items-center border-t px-3 py-2 text-center text-sm"
          >
            <!-- 等级 -->
            <div class="flex justify-center items-center gap-1">
              <img
                :src="`/mine/level/${item.level}.png`"
                :alt="`level-${item.level}`"
                class="inline-block w-[18px] h-[18px]"
              />
            </div>

            <!-- 生态值 -->
            <div>{{ item.eco.toLocaleString() }}</div>

            <!-- 奖励 -->
            <div class="flex justify-center items-center gap-1 text-orange-500 font-medium">
              {{ item.reward.toLocaleString() }}
              <img src="/ranking/coin.png" alt="coin" class="inline-block w-[13px] h-[13px]" />
            </div>

            <!-- 提成 -->
            <div>{{ item.rate }}</div>
          </div>
        </div>
      </div>

      <!-- Promotion 推广页面 -->
      <div v-else-if="currentTab === 'promotion'" class="px-4 py-4 bg-white rounded-lg">
        <h2 class="mb-2 text-lg font-bold text-gray-800">{{ t('recommend.promotion-title') }}</h2>
        <p class="mb-3 text-sm text-gray-600">{{ t('recommend.promotion-desc') }}</p>

        <textarea
          rows="5"
          readonly
          :value="promotionLoading ? t('common.loading') : copiedText"
          class="w-full resize-none rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-700 leading-relaxed focus:outline-none"
        ></textarea>

        <button
          type="button"
          @click="handleCopy"
          :disabled="promotionLoading"
          :class="[
            'mt-4 h-12 w-full rounded-md text-base font-medium text-white transition active:scale-95',
            promotionLoading ? 'bg-[#cccccc]' : copied ? 'bg-green-500' : 'bg-[#ff5a1f]'
          ]"
        >
          {{ copied ? t('recommend.promotion-btn-1') : t('recommend.promotion-btn-2') }}
        </button>
      </div>

      <!-- Record 记录页面 -->
      <div v-else-if="currentTab === 'record'" class="bg-white rounded-lg">
        <!-- 领取按钮 -->
        <div class="grid grid-cols-2 gap-2 px-3 py-2">
          <button
            @click="handleReceive(9, true)"
            :disabled="receivingLevel"
            :class="[
              'h-9 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white font-medium transition active:scale-95',
              receivingLevel ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            ]"
          >
            {{ receivingLevel ? t('common.form.button.submitting') : t('recommend.record-receive-btn-1') }}
          </button>

          <button
            @click="handleReceive(34, false)"
            :disabled="receivingBet"
            :class="[
              'h-9 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white font-medium transition active:scale-95',
              receivingBet ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            ]"
          >
            {{ receivingBet ? t('common.form.button.submitting') : t('recommend.record-receive-btn-2') }}
          </button>
        </div>

        <!-- 表头 -->
        <div class="grid grid-cols-[0.5fr_1fr_1fr_1fr] px-3 py-2 text-xs text-gray-500 border-b bg-[#cccccc]">
          <div class="text-center">{{ t('recommend.record-table-header-1') }}</div>
          <div class="text-center">{{ t('recommend.record-table-header-2') }}</div>
          <div class="text-center">{{ t('recommend.record-table-header-3') }}</div>
          <div class="text-center">{{ t('recommend.record-table-header-4') }}</div>
        </div>

        <div v-if="recordLoading && recordList.length === 0" class="flex justify-center items-center py-8">
          <div class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <span class="ml-2 text-gray-600">{{ t('common.loading') }}</span>
        </div>

        <div v-else-if="recordList.length === 0" class="text-center py-8 text-gray-500">
          暂无数据
        </div>

        <div v-else>
          <div
            v-for="(item, index) in recordList"
            :key="index"
            class="grid grid-cols-[0.5fr_1fr_1fr_1fr] px-3 py-3 border-b text-sm items-center"
          >
            <div class="leading-tight">{{ item?.nickname || '' }}</div>
            <div class="text-center font-medium">{{ item?.experience || 0 }}</div>
            <div class="text-center font-medium">{{ item?.tzpoints || 0 }}</div>
            <div class="text-center font-medium">{{ item?.tgall || 0 }}</div>
          </div>

          <!-- 加载更多 -->
          <div v-if="recordHasMore" class="py-4 text-center">
            <button
              @click="loadRecordData(recordPage + 1, false)"
              :disabled="recordLoading"
              class="px-6 py-2 bg-red-600 text-white text-sm rounded-lg disabled:opacity-50"
            >
              {{ recordLoading ? t('common.loading') : '加载更多' }}
            </button>
          </div>

          <div v-if="!recordHasMore && recordList.length > 0" class="py-4 text-center text-gray-400 text-sm">
            {{ t('common.loading-list-empty') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
