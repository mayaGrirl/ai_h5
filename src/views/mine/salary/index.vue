<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { salaryRecords, salaryZRecords, receiveSalaryZ, receiveSalaryZAll } from '@/api/customer'
import { getBlockByIdentifier } from '@/api/common'
import { toast } from '@/composables/useToast'
import type { SalaryRecordField, SalaryZRecordField } from '@/types/customer.type'
import PageHeader from '@/components/PageHeader.vue'
import dayjs from 'dayjs'

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
  { key: 'intro', i18Key: 'mine.salary.tab-1' },
  { key: 'receive', i18Key: 'mine.salary.tab-2' },
  { key: 'record', i18Key: 'mine.salary.tab-3' }
]

// 切换tab
const switchTab = (tabKey: string) => {
  router.replace({ query: { tab: tabKey } })
}

// ============ Intro页面数据 ============
const introContent = ref('')
const introLoading = ref(false)

const loadIntroContent = async () => {
  introLoading.value = true
  try {
    const res = await getBlockByIdentifier('customer_salary_intro_tips')
    if (res.code === 200 && res.data) {
      introContent.value = res.data.content || ''
    }
  } catch (error) {
    console.error('加载工资说明失败', error)
  } finally {
    introLoading.value = false
  }
}

// ============ Receive页面数据 ============
const receiveList = ref<SalaryZRecordField[]>([])
const receivePage = ref(1)
const receiveHasMore = ref(true)
const receiveLoading = ref(false)
const receivingSet = ref<Set<number>>(new Set())
const receivingAll = ref(false)

const loadReceiveData = async (pageNum: number = 1, reset: boolean = false) => {
  receiveLoading.value = true
  try {
    const res = await salaryZRecords({ page: pageNum, pageSize: 20 })
    if (res.code === 200 && res.data) {
      const list = res.data || []
      if (reset) {
        receiveList.value = list
      } else {
        receiveList.value = [...receiveList.value, ...list]
      }
      receiveHasMore.value = list.length >= 20
      receivePage.value = pageNum
    }
  } catch (error) {
    console.error('加载工资领取列表失败', error)
  } finally {
    receiveLoading.value = false
  }
}

const handleReceive = async (id: number) => {
  if (receivingSet.value.has(id)) return

  receivingSet.value.add(id)
  try {
    const res = await receiveSalaryZ(id)
    if (res.code === 200) {
      toast.success(res.message || '领取成功')
      // 更新列表项状态
      receiveList.value = receiveList.value.map(item =>
        item.id === id ? res.data : item
      )
    } else {
      toast.error(res.message || '领取失败')
    }
  } catch (error) {
    toast.error('领取失败')
  } finally {
    receivingSet.value.delete(id)
  }
}

const handleReceiveAll = async () => {
  if (receivingAll.value) return

  receivingAll.value = true
  try {
    const res = await receiveSalaryZAll()
    if (res.code === 200) {
      toast.success(res.message || '领取成功')
      // 刷新列表
      await loadReceiveData(1, true)
    } else {
      toast.error(res.message || '领取失败')
    }
  } catch (error) {
    toast.error('领取失败')
  } finally {
    receivingAll.value = false
  }
}

// ============ Record页面数据 ============
const recordList = ref<SalaryRecordField[]>([])
const recordPage = ref(1)
const recordHasMore = ref(true)
const recordLoading = ref(false)

const loadRecordData = async (pageNum: number = 1, reset: boolean = false) => {
  recordLoading.value = true
  try {
    const res = await salaryRecords({ page: pageNum, pageSize: 20 })
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
    console.error('加载工资记录失败', error)
  } finally {
    recordLoading.value = false
  }
}

// 监听tab变化
watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab === 'intro' || !newTab) {
      loadIntroContent()
    } else if (newTab === 'receive') {
      loadReceiveData(1, true)
    } else if (newTab === 'record') {
      loadRecordData(1, true)
    }
  }
)

// 格式化时间
const formatDate = (timestamp: number | undefined) => {
  if (!timestamp) return ''
  return dayjs.unix(timestamp).format('YYYY-MM-DD')
}

const formatDateTime = (timestamp: number | undefined) => {
  if (!timestamp) return ''
  return dayjs.unix(timestamp).format('YYYY-MM-DD HH:mm')
}

// 初始化
onMounted(() => {
  if (!route.query.tab) {
    router.replace({ query: { tab: 'intro' } })
  }

  if (currentTab.value === 'intro') {
    loadIntroContent()
  } else if (currentTab.value === 'receive') {
    loadReceiveData(1, true)
  } else if (currentTab.value === 'record') {
    loadRecordData(1, true)
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#f5f7fb] pb-16">
    <PageHeader :title="t('mine.quick.salary')" />

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
        <div class="flex items-center mb-2">
          {{ t('mine.salary.intro-accumulated-salary') }}
          <span class="text-red-500 font-semibold ml-1">0</span>
          <img src="/ranking/coin.png" alt="coin" class="inline-block w-[13px] h-[13px]" />
        </div>

        <!-- 骨架屏 -->
        <template v-if="introLoading">
          <div v-for="i in 12" :key="i" class="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
        </template>

        <!-- 内容 -->
        <div
          v-else
          class="prose prose-sm max-w-none text-gray-700"
          v-html="introContent"
        ></div>
      </div>

      <!-- Receive 领取页面 -->
      <div v-else-if="currentTab === 'receive'">
        <!-- 一键领取按钮 -->
        <div v-if="receiveList.length > 0" class="grid px-3 mb-2">
          <button
            @click="handleReceiveAll"
            :disabled="receivingAll"
            :class="[
              'h-9 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white font-medium transition active:scale-95',
              receivingAll ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            ]"
          >
            {{ receivingAll ? t('common.form.button.submitting') : t('mine.salary.receive-all-btn') }}
          </button>
        </div>

        <!-- 列表 -->
        <div class="bg-white rounded-lg">
          <div v-if="receiveLoading && receiveList.length === 0" class="flex justify-center items-center py-8">
            <div class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <span class="ml-2 text-gray-600">加载中...</span>
          </div>

          <div v-else-if="receiveList.length === 0" class="text-center py-8 text-gray-500">
            暂无数据
          </div>

          <div v-else>
            <div
              v-for="(item, index) in receiveList"
              :key="index"
              class="grid grid-cols-[1.2fr_0.8fr] px-3 py-3 border-b text-sm items-center"
            >
              <div class="leading-tight">
                <div class="text-gray-500">
                  {{ formatDate(item.ctdateA) }} - {{ formatDate(item.ctdateB) }}
                </div>
                <div class="mt-0.5">
                  工资金额：<span class="text-red-500 font-semibold ml-1">{{ item.coin }}</span>
                  <img src="/ranking/coin.png" alt="coin" class="inline-block w-[13px] h-[13px]" />
                </div>
              </div>

              <div class="flex justify-end items-center gap-1 font-medium">
                <button
                  v-if="item.status === 0"
                  @click="handleReceive(item.id || 0)"
                  :class="[
                    'px-2 py-1 text-xs rounded',
                    receivingSet.has(item.id || 0)
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-500 text-white cursor-pointer'
                  ]"
                >
                  {{ receivingSet.has(item.id || 0) ? t('common.form.button.submitting') : t('mine.salary.receive-grid-btn') }}
                </button>
                <div v-else class="text-right text-xs text-gray-500">
                  {{ item.status_label }}
                  <div>({{ formatDateTime(item.gettime) }})</div>
                </div>
              </div>
            </div>

            <!-- 加载更多 -->
            <div v-if="receiveHasMore" class="py-4 text-center">
              <button
                @click="loadReceiveData(receivePage + 1, false)"
                :disabled="receiveLoading"
                class="px-6 py-2 bg-red-600 text-white text-sm rounded-lg disabled:opacity-50"
              >
                {{ receiveLoading ? '加载中...' : '加载更多' }}
              </button>
            </div>

            <div v-if="!receiveHasMore && receiveList.length > 0" class="py-4 text-center text-gray-400 text-sm">
              没有更多数据了
            </div>
          </div>
        </div>
      </div>

      <!-- Record 记录页面 -->
      <div v-else-if="currentTab === 'record'" class="bg-white rounded-lg">
        <!-- 表头 -->
        <div class="grid grid-cols-[0.3fr_0.8fr_0.5fr_0.8fr] px-3 py-2 text-xs text-gray-500 border-b">
          <div>{{ t('mine.salary.record-grid-1') }}</div>
          <div class="text-center">{{ t('mine.salary.record-grid-2') }}</div>
          <div class="text-center">{{ t('mine.salary.record-grid-3') }}</div>
          <div class="text-right">{{ t('mine.salary.record-grid-4') }}</div>
        </div>

        <div v-if="recordLoading && recordList.length === 0" class="flex justify-center items-center py-8">
          <div class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <span class="ml-2 text-gray-600">加载中...</span>
        </div>

        <div v-else-if="recordList.length === 0" class="text-center py-8 text-gray-500">
          暂无数据
        </div>

        <div v-else>
          <div
            v-for="(item, index) in recordList"
            :key="index"
            class="grid grid-cols-[0.3fr_0.8fr_0.5fr_0.8fr] px-3 py-3 border-b text-sm items-center"
          >
            <div class="leading-tight">{{ item.typestr }}</div>
            <div class="text-center font-medium">{{ item.basecoin }}</div>
            <div class="text-center font-medium text-red-500">
              {{ item.coin }}
              <img src="/ranking/coin.png" alt="coin" class="inline-block w-[13px] h-[13px]" />
            </div>
            <div class="flex justify-end items-center gap-1 font-medium">
              {{ formatDate(item.addtime) }}
            </div>
          </div>

          <!-- 加载更多 -->
          <div v-if="recordHasMore" class="py-4 text-center">
            <button
              @click="loadRecordData(recordPage + 1, false)"
              :disabled="recordLoading"
              class="px-6 py-2 bg-red-600 text-white text-sm rounded-lg disabled:opacity-50"
            >
              {{ recordLoading ? '加载中...' : '加载更多' }}
            </button>
          </div>

          <div v-if="!recordHasMore && recordList.length > 0" class="py-4 text-center text-gray-400 text-sm">
            没有更多数据了
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
