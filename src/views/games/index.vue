<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { gameAll, playAll } from '@/api/game'
import { toast } from '@/composables/useToast'
import { useLocalized } from '@/composables/useLocalized'
import type { Game, GamePlayGroup, GameTypeMapItem } from '@/types/game.type'

const { localize } = useLocalized()

interface GameSeries {
  id: number
  name: string
  lang_title?: Record<string, string> | null
  games: Game[]
}

interface PlayMethodGroup {
  id: number
  name: string
  lang_name?: Record<string, string> | string | null
}

const route = useRoute()
const router = useRouter()

const gameSeries = ref<GameSeries[]>([])
const activeSeries = ref<GameSeries | null>(null)
const activeGame = ref<Game | null>(null)
const playMethodGroups = ref<PlayMethodGroup[]>([])
const isLoadingGames = ref(true)
const isLoadingPlays = ref(false)

const fetchGameAll = async () => {
  try {
    isLoadingGames.value = true
    const urlLotteryId = route.query.lottery_id as string

    const res = await gameAll({})
    if (res.code === 200 && res.data) {
      const { gameTypeMap = [] } = res.data

      const series: GameSeries[] = (Array.isArray(gameTypeMap) ? gameTypeMap : [])
        .filter((item: GameTypeMapItem) => {
          return item.children && Array.isArray(item.children) && item.children.length > 0
        })
        .map((item: GameTypeMapItem) => {
          const games = item.children
            .filter((game: Game) => game.is_show === undefined || game.is_show === 1)
            .map((game: Game): Game => ({
              id: game.id,
              name: game.name,
              logo: game.logo,
              lang_name: game.lang_name,
              game_class: game.game_class,
              is_hot: game.is_hot,
              is_show: game.is_show,
              info: game.info,
              lang_info: game.lang_info
            }))

          return {
            id: item.id,
            name: item.title,
            lang_title: item.lang_title,
            games
          }
        })
        .filter((s) => s.games.length > 0)

      gameSeries.value = series

      // 支持 URL 默认选中 lottery_id
      let defaultSeries: GameSeries | null = null
      let defaultGame: Game | null = null

      if (urlLotteryId) {
        for (const seriesItem of series) {
          const findGame = seriesItem.games.find(
            (g) => String(g.id) === String(urlLotteryId)
          )
          if (findGame) {
            defaultSeries = seriesItem
            defaultGame = findGame
            break
          }
        }
      }

      // 若 URL 没传 lottery_id 或找不到，默认第一个
      if (!defaultSeries) defaultSeries = series[0]
      if (!defaultGame) defaultGame = defaultSeries?.games[0] || null

      activeSeries.value = defaultSeries
      activeGame.value = defaultGame

      if (defaultGame) {
        await fetchPlayAll(defaultGame.id)
      }
    } else {
      toast.error(res.message || '获取游戏列表失败')
    }
  } catch (error) {
    toast.error('获取游戏列表失败，请稍后重试')
  } finally {
    isLoadingGames.value = false
  }
}

const fetchPlayAll = async (lotteryId: number) => {
  try {
    isLoadingPlays.value = true
    const res = await playAll({ lottery_id: lotteryId })

    if (res.code === 200 && res.data) {
      const { groupArr = [] } = res.data

      const groups: PlayMethodGroup[] = groupArr
        .filter((group: GamePlayGroup) => group.status === 1)
        .map((group: GamePlayGroup): PlayMethodGroup => ({
          id: group.id,
          name: group.name,
          lang_name: group.lang_name
        }))

      playMethodGroups.value = groups
    } else {
      toast.error(res.message || '获取玩法分组失败')
      playMethodGroups.value = []
    }
  } catch (error) {
    toast.error('获取玩法分组失败，请稍后重试')
    playMethodGroups.value = []
  } finally {
    isLoadingPlays.value = false
  }
}

const handleSeriesChange = (series: GameSeries) => {
  activeSeries.value = series
  if (series.games.length > 0) {
    const game = series.games[0]
    activeGame.value = game
    fetchPlayAll(game.id)
  }
}

const handleGameChange = (game: Game) => {
  activeGame.value = game
  fetchPlayAll(game.id)
}

const goToPlay = (groupId: number) => {
  if (!activeGame.value) return
  router.push(`/games/play?lottery_id=${activeGame.value.id}&group_id=${groupId}`)
}

onMounted(() => {
  fetchGameAll()
})
</script>

<template>
  <!-- 加载状态 -->
  <div v-if="isLoadingGames" class="flex min-h-screen justify-center items-center bg-zinc-50">
    <div class="text-center">
      <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
      <p class="mt-3 text-gray-600">加载游戏列表中...</p>
    </div>
  </div>

  <!-- 无数据 -->
  <div v-else-if="!activeSeries || !activeGame" class="flex min-h-screen justify-center items-center bg-zinc-50">
    <div class="text-center">
      <p class="text-gray-600">暂无游戏数据</p>
      <button @click="fetchGameAll" class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">
        重新加载
      </button>
    </div>
  </div>

  <!-- 主内容 -->
  <div v-else class="flex min-h-screen justify-center bg-zinc-50">
    <main class="w-full max-w-3xl bg-white">
      <!-- 头部 -->
      <header class="h-16 flex items-center justify-center bg-red-600 text-white">
        <span class="text-white text-2xl font-black tracking-wide">游戏大厅</span>
      </header>

      <!-- 系列横向 -->
      <div class="w-full overflow-x-auto whitespace-nowrap border-b py-3 px-4 bg-red-50">
        <div class="flex gap-4">
          <button
            v-for="series in gameSeries"
            :key="series.id"
            @click="handleSeriesChange(series)"
            :class="[
              'px-4 py-2 rounded-full text-sm',
              activeSeries?.id === series.id
                ? 'bg-red-600 text-white'
                : 'bg-white text-red-600 border border-red-600'
            ]"
          >
            {{ localize(series.lang_title, series.name) }}
          </button>
        </div>
      </div>

      <!-- 左边彩种 + 右边玩法分组 -->
      <div class="flex">
        <!-- 左侧彩种 -->
        <div class="w-28 border-r p-3 flex flex-col gap-3 bg-gray-50 min-h-[70vh]">
          <button
            v-for="game in activeSeries?.games"
            :key="game.id"
            @click="handleGameChange(game)"
            :class="[
              'text-sm p-2 rounded',
              activeGame?.id === game.id
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-600'
            ]"
          >
            {{ localize(game.lang_name, game.name) }}
          </button>
        </div>

        <!-- 玩法分组 -->
        <div class="flex-1 p-4">
          <h2 class="text-lg font-bold mb-3">
            {{ activeGame ? localize(activeGame.lang_name, activeGame.name) : '' }}
          </h2>

          <div v-if="isLoadingPlays" class="flex justify-center items-center py-8">
            <div class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <span class="ml-2 text-gray-600">加载玩法分组中...</span>
          </div>

          <div v-else-if="playMethodGroups.length === 0" class="text-center py-8 text-gray-500">
            暂无玩法分组数据
          </div>

          <div v-else class="grid grid-cols-2 gap-3">
            <button
              v-for="group in playMethodGroups"
              :key="group.id"
              @click="goToPlay(group.id)"
              class="p-4 bg-gray-100 rounded-lg text-center text-gray-900 hover:bg-gray-200 transition cursor-pointer"
            >
              <div class="font-medium">{{ localize(group.lang_name as Record<string, string> | null, group.name) }}</div>
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
