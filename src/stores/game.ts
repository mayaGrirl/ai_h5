import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { gameAll, playAll } from '@/api/game'
import type { Game, GamePlayGroup, GameTypeMapItem } from '@/types/game.type'

export const useGameStore = defineStore('game', () => {
  // 游戏相关状态
  const gameName = ref('加载中...')
  const allGames = ref<Game[]>([])
  const activeGame = ref<Game | null>(null)
  const showGameSelector = ref(false)
  const isLoadingGames = ref(true)

  // 玩法分组
  const playGroups = ref<GamePlayGroup[]>([])
  const selectedGroupId = ref<number>(0)

  // 开奖提示音
  const soundEnabled = ref(false)

  // 初始化时从 localStorage 读取铃声设置
  const initSoundSetting = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('game_sound_enabled')
      soundEnabled.value = saved === 'true'
    }
  }

  // 设置铃声开关并保存到 localStorage
  const setSoundEnabled = (enabled: boolean) => {
    soundEnabled.value = enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem('game_sound_enabled', enabled ? 'true' : 'false')
    }
  }

  // 获取当前分组名称
  const currentGroupName = computed(() => {
    if (!selectedGroupId.value || playGroups.value.length === 0) return ''
    const group = playGroups.value.find((g) => g.id === selectedGroupId.value)
    return group?.name || ''
  })

  // 获取所有游戏
  const fetchGameAll = async (urlLotteryId?: string, urlGroupId?: string) => {
    try {
      isLoadingGames.value = true
      const res = await gameAll({})

      if (res.code === 200 && res.data) {
        const { gameTypeMap = [] } = res.data

        // 收集所有游戏到一个扁平数组
        const games: Game[] = []
        ;(Array.isArray(gameTypeMap) ? gameTypeMap : []).forEach(
          (typeItem: GameTypeMapItem) => {
            if (typeItem.children && Array.isArray(typeItem.children)) {
              typeItem.children.forEach((game: Game) => {
                if (game.is_show === undefined || game.is_show === 1) {
                  games.push(game)
                }
              })
            }
          }
        )
        allGames.value = games

        // 找到URL指定的游戏或默认第一个
        let defaultGame: Game | null = null
        if (urlLotteryId) {
          defaultGame = games.find((g) => String(g.id) === String(urlLotteryId)) || null
        }
        if (!defaultGame && games.length > 0) {
          defaultGame = games[0]
        }

        if (defaultGame) {
          activeGame.value = defaultGame
          gameName.value = defaultGame.name
          // 获取玩法分组
          const groups = await fetchPlayGroups(defaultGame.id)
          // 如果 URL 中有 group_id，使用它；否则用第一个分组
          const defaultGroupId = urlGroupId
            ? Number(urlGroupId)
            : groups.length > 0
              ? groups[0].id
              : 0
          selectedGroupId.value = defaultGroupId
        }
      }
    } catch (error) {
      console.error('获取游戏列表失败:', error)
    } finally {
      isLoadingGames.value = false
    }
  }

  // 获取玩法分组
  const fetchPlayGroups = async (lotteryId: number): Promise<GamePlayGroup[]> => {
    try {
      const res = await playAll({ lottery_id: lotteryId })
      if (res.code === 200 && res.data) {
        const groups = (res.data.groupArr || []).filter(
          (g: GamePlayGroup) => g.status === 1
        )
        playGroups.value = groups
        return groups
      } else {
        playGroups.value = []
        return []
      }
    } catch (error) {
      console.error('获取玩法分组失败', error)
      playGroups.value = []
      return []
    }
  }

  // 切换彩种
  const handleGameSwitch = async (game: Game) => {
    showGameSelector.value = false
    activeGame.value = game
    gameName.value = game.name
    // 获取新彩种的玩法分组，并默认选择第一个
    const groups = await fetchPlayGroups(game.id)
    const defaultGroupId = groups.length > 0 ? groups[0].id : 0
    selectedGroupId.value = defaultGroupId
    return defaultGroupId
  }

  // 设置选中的分组
  const setSelectedGroupId = (id: number) => {
    selectedGroupId.value = id
  }

  // 设置游戏选择器显示状态
  const setShowGameSelector = (show: boolean) => {
    showGameSelector.value = show
  }

  return {
    // 状态
    gameName,
    allGames,
    activeGame,
    showGameSelector,
    isLoadingGames,
    playGroups,
    selectedGroupId,
    soundEnabled,
    currentGroupName,
    // 方法
    initSoundSetting,
    setSoundEnabled,
    fetchGameAll,
    fetchPlayGroups,
    handleGameSwitch,
    setSelectedGroupId,
    setShowGameSelector
  }
})
