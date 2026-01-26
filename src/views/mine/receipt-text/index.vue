<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PointsPage from './points/index.vue'
import DepositPage from './deposit/index.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const currentTab = computed(() => (route.query.tab as string) || 'points')

const tabs = computed(() => [
  { key: 'points', label: t('mine.receipt-text.tab-points') },
  { key: 'deposit', label: t('mine.receipt-text.tab-deposit') }
])

const switchTab = (key: string) => {
  router.replace({ query: { ...route.query, tab: key } })
}

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="flex min-h-screen justify-center bg-[#eef3f8]">
    <div class="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
      <!-- 头部 -->
      <header class="sticky top-0 z-40 bg-gradient-to-r from-red-600 to-red-500">
        <div class="flex h-12 items-center justify-between px-3">
          <button @click="goBack" class="flex items-center text-white">
            <ChevronLeft class="h-5 w-5" />
          </button>
          <span class="text-white font-bold">{{ t('mine.setting.receipt-text') }}</span>
          <div class="w-5"></div>
        </div>
      </header>

      <main>
        <div class="grid grid-cols-2 text-center text-sm bg-white">
          <button
            v-for="item in tabs"
            :key="item.key"
            @click="switchTab(item.key)"
            :class="[
              'py-3 text-center',
              currentTab === item.key
                ? 'text-red-500 font-bold border-b-2 border-red-500'
                : 'text-gray-500'
            ]"
          >
            {{ item.label }}
          </button>
        </div>

        <!-- 子页面渲染区域 -->
        <div class="p-2">
          <!-- 积分记录表头 -->
          <div v-if="currentTab === 'points'" class="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1fr] px-3 py-2 text-xs text-gray-500 border-b">
            <div class="text-center">{{ t('mine.receipt-text.header-time') }}</div>
            <div class="text-center">{{ t('mine.receipt-text.header-before') }}</div>
            <div class="text-center">{{ t('mine.receipt-text.header-change') }}</div>
            <div class="text-center">{{ t('mine.receipt-text.header-after') }}</div>
            <div class="text-center">{{ t('mine.receipt-text.header-type') }}</div>
          </div>

          <!-- 账户记录表头 -->
          <div v-else-if="currentTab === 'deposit'" class="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1fr] px-3 py-2 text-xs text-gray-500 border-b">
            <div class="text-center">{{ t('mine.receipt-text.header-time') }}</div>
            <div class="text-center">{{ t('mine.receipt-text.header-before') }}</div>
            <div class="text-center">{{ t('mine.receipt-text.header-change') }}</div>
            <div class="text-center">{{ t('mine.receipt-text.header-after') }}</div>
            <div class="text-center">{{ t('mine.receipt-text.header-type') }}</div>
          </div>

          <PointsPage v-if="currentTab === 'points'" />
          <DepositPage v-else-if="currentTab === 'deposit'" />
        </div>
      </main>

      <div class="h-14"></div>
    </div>
  </div>
</template>
