<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import PointsPage from './points/index.vue'
import DepositPage from './deposit/index.vue'

const route = useRoute()
const router = useRouter()

const currentTab = computed(() => (route.query.tab as string) || 'points')

const tabs = [
  { key: 'points', label: '积分记录' },
  { key: 'deposit', label: '账户记录' }
]

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
          <span class="text-white font-bold">账户记录</span>
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
          <!-- 表头 -->
          <div class="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr] px-3 py-2 text-xs text-gray-500 border-b">
            <div class="text-center">来源</div>
            <div class="text-center">变化前</div>
            <div class="text-center">变化</div>
            <div class="text-center">变化后</div>
          </div>

          <PointsPage v-if="currentTab === 'points'" />
          <DepositPage v-else-if="currentTab === 'deposit'" />
        </div>
      </main>

      <div class="h-14"></div>
    </div>
  </div>
</template>
