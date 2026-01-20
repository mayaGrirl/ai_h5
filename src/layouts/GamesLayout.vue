<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Bell, BellOff, ChevronDown } from 'lucide-vue-next'
import { useGameStore } from '@/stores/game'
import { useAuthStore } from '@/stores/auth'
import TabBar from '@/components/TabBar.vue'

const route = useRoute()
const router = useRouter()
const gameStore = useGameStore()
const authStore = useAuthStore()

// 判断是否是游戏大厅页面（精确匹配 /games）
const isGamesRoot = computed(() => {
  const path = route.path
  return path === '/games' || path === '/games/'
})

// Tab配置
const tabs = [
  { name: '投注', path: 'play' },
  { name: '开奖记录', path: 'open' },
  { name: '投注记录', path: 'record' },
  { name: '模式', path: 'mode' },
  { name: '自动', path: 'auto' },
  { name: '走势', path: 'trend' },
  { name: '盈亏', path: 'stat' },
  { name: '规则', path: 'rules' }
]

// 弹窗状态
const showGameSelector = ref(false)
const showGroupSelector = ref(false)

// 判断当前激活的 Tab
const activeTab = computed(() => {
  const path = route.path

  for (const tab of tabs) {
    if (path.startsWith(`/games/${tab.path}`)) {
      return tab.name
    }
  }
  return '投注'
})

// 用户积分格式化
const formattedPoints = computed(() => {
  const points = authStore.currentCustomer?.points ?? 0
  return points.toLocaleString()
})

// 初始化 - 仅在非游戏大厅页面加载游戏数据
onMounted(async () => {
  if (!isGamesRoot.value) {
    gameStore.initSoundSetting()
    const lotteryId = route.query.lottery_id as string
    const groupId = route.query.group_id as string
    await gameStore.fetchGameAll(lotteryId, groupId)
  }
})

// 监听路由变化
watch(
  () => route.fullPath,
  async () => {
    // 从游戏大厅进入子页面时，加载游戏数据
    if (!isGamesRoot.value && !gameStore.activeGame) {
      gameStore.initSoundSetting()
      const lotteryId = route.query.lottery_id as string
      const groupId = route.query.group_id as string
      await gameStore.fetchGameAll(lotteryId, groupId)
    }
  }
)

// 监听路由query变化，更新游戏和分组
watch(
  () => [route.query.lottery_id, route.query.group_id],
  async ([newLotteryId, newGroupId]) => {
    if (isGamesRoot.value) return

    if (newLotteryId && gameStore.activeGame?.id !== Number(newLotteryId)) {
      const game = gameStore.allGames.find(g => String(g.id) === String(newLotteryId))
      if (game) {
        await gameStore.handleGameSwitch(game)
      }
    }
    if (newGroupId && gameStore.selectedGroupId !== Number(newGroupId)) {
      gameStore.setSelectedGroupId(Number(newGroupId))
    }
  }
)

// 处理Tab点击
const handleTabClick = (tab: { name: string; path: string }) => {
  if (tab.name === activeTab.value || !gameStore.activeGame) return

  const url = `/games/${tab.path}?lottery_id=${gameStore.activeGame.id}&group_id=${gameStore.selectedGroupId}`
  router.push(url)
}

// 处理游戏切换
const handleGameSwitch = async (game: any) => {
  showGameSelector.value = false
  const defaultGroupId = await gameStore.handleGameSwitch(game)

  const currentTab = tabs.find(t => route.path.startsWith(`/games/${t.path}`))?.path || 'play'
  const newUrl = `/games/${currentTab}?lottery_id=${game.id}&group_id=${defaultGroupId}`
  router.push(newUrl)
}

// 处理分组切换
const handleGroupSwitch = (groupId: number) => {
  gameStore.setSelectedGroupId(groupId)
  showGroupSelector.value = false

  if (gameStore.activeGame) {
    const currentTab = tabs.find(t => route.path.startsWith(`/games/${t.path}`))?.path || 'play'
    const newUrl = `/games/${currentTab}?lottery_id=${gameStore.activeGame.id}&group_id=${groupId}`
    router.push(newUrl)
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 跳转到积分页面
const goToPoints = () => {
  router.push('/mine/receipt-text?tab=points')
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <!-- 游戏大厅页面 - 只显示内容和底部导航 -->
    <div v-if="isGamesRoot" class="flex flex-col flex-1">
      <div class="flex-1">
        <router-view />
      </div>
      <TabBar />
    </div>

    <!-- 游戏子页面 - 加载状态 -->
    <div v-else-if="gameStore.isLoadingGames" class="flex min-h-screen justify-center items-center bg-zinc-50">
      <div class="text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
        <p class="mt-3 text-gray-600">加载中...</p>
      </div>
    </div>

    <!-- 游戏子页面 - 显示完整布局 -->
    <div v-else class="flex flex-col flex-1">
      <!-- 固定头部 -->
      <header class="bg-red-600 text-white px-4 py-3 flex items-center h-11 justify-between relative">
        <!-- 左：返回按钮 -->
        <button
          class="absolute left-2 p-1 text-white hover:bg-white/10 rounded-full cursor-pointer"
          @click="goBack"
        >
          <ArrowLeft class="h-5 w-5" />
        </button>

        <!-- 中：游戏名称 | 分组名称 -->
        <div class="flex items-center gap-1 mx-auto">
          <button
            class="flex items-center gap-0.5 text-base font-bold cursor-pointer hover:opacity-80 transition-opacity"
            @click="showGameSelector = true"
          >
            <span>{{ gameStore.gameName }}</span>
            <ChevronDown :size="14" />
          </button>

          <span v-if="gameStore.currentGroupName" class="text-white/60 mx-1">|</span>
          <button
            v-if="gameStore.currentGroupName"
            class="flex items-center gap-0.5 text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity"
            @click="showGroupSelector = true"
          >
            <span>{{ gameStore.currentGroupName }}</span>
            <ChevronDown :size="12" />
          </button>
        </div>

        <!-- 右：铃铛 + 用户积分 -->
        <div class="flex items-center gap-3">
          <button
            @click="gameStore.setSoundEnabled(!gameStore.soundEnabled)"
            class="p-1 rounded-full hover:bg-white/20 transition-colors"
            :title="gameStore.soundEnabled ? '关闭开奖提示音' : '开启开奖提示音'"
          >
            <Bell v-if="gameStore.soundEnabled" :size="18" class="text-yellow-300" />
            <BellOff v-else :size="18" class="text-white/60" />
          </button>

          <div
            class="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
            @click="goToPoints"
          >
            <span class="font-bold text-sm">{{ formattedPoints }}</span>
            <img
              alt="coin"
              class="inline-block w-[13px] h-[13px]"
              src="/ranking/coin.png"
            />
          </div>
        </div>
      </header>

      <!-- Tab导航 -->
      <div class="bg-white border-b">
        <div class="flex overflow-x-auto no-scrollbar">
          <button
            v-for="tab in tabs"
            :key="tab.name"
            @click="handleTabClick(tab)"
            :class="[
              'px-4 py-2 text-xs whitespace-nowrap',
              activeTab === tab.name
                ? 'text-red-600 border-b-2 border-red-600 font-bold'
                : 'text-gray-700'
            ]"
          >
            {{ tab.name }}
          </button>
        </div>
      </div>

      <!-- 页面内容 -->
      <div class="flex-1 pb-14">
        <router-view />
      </div>

      <!-- 底部导航 -->
      <TabBar />
    </div>

    <!-- 彩种选择弹窗 -->
    <Teleport to="body">
      <div
        v-if="showGameSelector"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showGameSelector = false"
      >
        <div class="mx-4 w-full max-w-sm rounded-lg bg-white max-h-[70vh] flex flex-col">
          <div class="p-3 border-b font-medium">选择彩种</div>
          <div class="flex-1 overflow-y-auto p-3">
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="game in gameStore.allGames"
                :key="game.id"
                @click="handleGameSwitch(game)"
                :class="[
                  'p-3 rounded-lg text-center font-bold text-sm border transition-all',
                  gameStore.activeGame && String(game.id) === String(gameStore.activeGame.id)
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-red-600 hover:text-red-600'
                ]"
              >
                {{ game.name }}
                <div v-if="gameStore.activeGame && String(game.id) === String(gameStore.activeGame.id)" class="text-xs mt-1">
                  当前
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 分组选择弹窗 -->
    <Teleport to="body">
      <div
        v-if="showGroupSelector"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showGroupSelector = false"
      >
        <div class="mx-4 w-full max-w-sm rounded-lg bg-white max-h-[70vh] flex flex-col">
          <div class="p-3 border-b font-medium">选择玩法分组</div>
          <div class="flex-1 overflow-y-auto p-3">
            <div v-if="gameStore.playGroups.length === 0" class="text-center py-8 text-gray-500">
              暂无分组数据
            </div>
            <div v-else class="grid grid-cols-2 gap-3">
              <button
                v-for="group in gameStore.playGroups"
                :key="group.id"
                @click="handleGroupSwitch(group.id)"
                :class="[
                  'p-3 rounded-lg text-center font-bold text-sm border transition-all',
                  gameStore.selectedGroupId === group.id
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-red-600 hover:text-red-600'
                ]"
              >
                {{ group.name }}
                <div v-if="gameStore.selectedGroupId === group.id" class="text-xs mt-1">
                  当前
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
