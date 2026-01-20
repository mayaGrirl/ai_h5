<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronUp, ChevronDown } from 'lucide-vue-next'
import { useGameStore } from '@/stores/game'
import { useAuthStore } from '@/stores/auth'
import { playAll, betGame, fetchExpectInfo as fetchExpectInfoAPI, modeList, betRecords } from '@/api/game'
import { toast } from '@/composables/useToast'
import type { ExpectInfo, GamePlay, GamePlayMapItem, ModeItem, BetNoItem } from '@/types/game.type'

const route = useRoute()
const gameStore = useGameStore()
const authStore = useAuthStore()

// 扩展 Window 接口以支持 webkitAudioContext（Safari 兼容）
interface WebkitWindow extends Window {
  webkitAudioContext?: typeof AudioContext
}

interface PlayItem {
  id: number
  name: string
  lang_name?: Record<string, string> | null
  odds: number
  minBetGold: number
}

interface PlayGroup {
  id: string | number
  name: string
  lang_name?: Record<string, string> | string | null
  plays: PlayItem[]
  betMultiplier?: string
  startNum?: number
}

// 玩法相关状态
const groups = ref<PlayGroup[]>([])
const isLoadingPlays = ref(true)
const activeGroup = ref<PlayGroup | null>(null)
const selectedPlays = ref<string[]>([])
const playAmounts = ref<Record<string, string>>({})
const activeQuick = ref<string | null>(null)

// 展开/收起、倍数、筹码
const isExpanded = ref(false)
const selectedMultiplier = ref<number | null>(null)
const quickAmount = ref<string>('')

// 自定义模式相关
const showModeSelector = ref(false)
const modes = ref<ModeItem[]>([])
const isLoadingModes = ref(false)
const selectedMode = ref<ModeItem | null>(null)

// 期号和倒计时
const currExpect = ref<ExpectInfo | null>(null)
const lastExpect = ref<ExpectInfo | null>(null)
const remainingOpen = ref(0)
const remainingClose = ref(0)
const statusCode = ref(200)
const previousExpectNo = ref('')

// 当前期已投注金额
const myBetAmounts = ref<Record<string, number>>({})

// Refs for polling
let countdownTimer: ReturnType<typeof setInterval> | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null
let shouldStopFetching = false
let isFetching = false
let remainingOpenRef = 0
let previousExpectNoRef = ''
let activeGroupIdRef: number | null = null
let soundEnabledRef = gameStore.soundEnabled
let isInitialLoad = true

// 支持快捷选择的玩法分组ID
const quickSelectGroupIds = [1, 3, 10, 14, 18, 22, 4, 26, 5, 16, 23, 6, 15, 24]

// 快捷选择按钮配置
const quickButtons1 = ['全包', '单', '大单', '小单', '单边', '双']
const quickButtons2 = ['大双', '小双', '双边', '大', '小', '中']
const quickButtons3 = ['边', '大边', '小边']
const specialButtons = ['上期', '反选', '清空']

// 尾数按钮
const tailButtons = ['0尾', '1尾', '2尾', '3尾', '4尾', '5尾', '6尾', '7尾', '8尾', '9尾', '小尾', '大尾']

// 余数按钮
const mod3Buttons = ['3余0', '3余1', '3余2']
const mod4Buttons = ['4余0', '4余1', '4余2', '4余3']
const mod5Buttons = ['5余0', '5余1', '5余2', '5余3', '5余4']

// 倍数按钮
const multiplierButtons1 = [0.1, 0.5, 0.8, 1.2, 1.5, 2]
const multiplierButtons2 = [5, 10, 20, 30, 50, 100]

// 筹码配置
const chipConfig = [
  { display: '10', value: 10000, img: '/chips/10.png' },
  { display: '100', value: 100000, img: '/chips/100.png' },
  { display: '500', value: 500000, img: '/chips/500.png' },
  { display: '1K', value: 1000000, img: '/chips/1000.png' },
  { display: '5K', value: 5000000, img: '/chips/5000.png' }
]

// 计算本次投注总额
const totalBetAmount = computed(() => {
  return selectedPlays.value.reduce((sum, p) => sum + (parseInt(playAmounts.value[p] || '0', 10) || 0), 0)
})

// 播放开奖提示音
const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as WebkitWindow).webkitAudioContext
    if (!AudioContextClass) return
    const audioContext = new AudioContextClass()

    // 第一个音调（叮）
    const oscillator1 = audioContext.createOscillator()
    const gainNode1 = audioContext.createGain()
    oscillator1.connect(gainNode1)
    gainNode1.connect(audioContext.destination)
    oscillator1.frequency.value = 880
    oscillator1.type = 'sine'
    gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    oscillator1.start(audioContext.currentTime)
    oscillator1.stop(audioContext.currentTime + 0.3)

    // 第二个音调（咚）
    const oscillator2 = audioContext.createOscillator()
    const gainNode2 = audioContext.createGain()
    oscillator2.connect(gainNode2)
    gainNode2.connect(audioContext.destination)
    oscillator2.frequency.value = 1320
    oscillator2.type = 'sine'
    gainNode2.gain.setValueAtTime(0, audioContext.currentTime + 0.15)
    gainNode2.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.16)
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    oscillator2.start(audioContext.currentTime + 0.15)
    oscillator2.stop(audioContext.currentTime + 0.5)
  } catch (error) {
    console.error('播放提示音失败', error)
  }
}

// 解析权重字符串
const getWeightsArray = (betMultiplier: string | undefined): number[] => {
  if (!betMultiplier) return []
  return betMultiplier.split(',').map((s) => parseInt(s.trim(), 10) || 1)
}

// 获取玩法权重
const getPlayWeight = (playName: string, weightsArray: number[], startNum: number, plays: PlayItem[]): number => {
  if (weightsArray.length === 0) return 1
  const playNum = parseInt(playName, 10)
  if (!isNaN(playNum)) {
    const index = playNum - startNum
    if (index >= 0 && index < weightsArray.length) {
      return weightsArray[index]
    }
  }
  const positionIndex = plays.findIndex((p) => p.name === playName)
  if (positionIndex >= 0 && positionIndex < weightsArray.length) {
    return weightsArray[positionIndex]
  }
  return 1
}

// 刷新用户金豆
const refreshUserPoints = async () => {
  try {
    await authStore.fetchCurrentCustomer()
  } catch (error) {
    console.error('刷新用户金豆失败', error)
  }
}

// 获取当前期已投注记录
const fetchMyBetRecords = async (expectNo: string) => {
  if (!gameStore.activeGame?.id || !activeGroupIdRef || !expectNo) return

  try {
    const res = await betRecords({
      lottery_id: gameStore.activeGame.id,
      game_group_id: activeGroupIdRef,
      expect_no: expectNo,
      page: 1,
      pageSize: 100
    })

    if (res.code === 200 && res.data) {
      const betAmountsMap: Record<string, number> = {}
      const list = res.data.list || []

      list.forEach((record) => {
        const betNoObj = record.bet_no
        if (betNoObj && typeof betNoObj === 'object') {
          const values = Array.isArray(betNoObj) ? betNoObj : Object.values(betNoObj)
          values.forEach((betInfo: BetNoItem) => {
            const playName = betInfo.bet_no
            const betGold = betInfo.bet_gold || 0
            if (playName) {
              betAmountsMap[playName] = (betAmountsMap[playName] || 0) + betGold
            }
          })
        }
      })
      myBetAmounts.value = betAmountsMap
    } else {
      myBetAmounts.value = {}
    }
  } catch (error) {
    console.error('获取已投注记录失败', error)
    myBetAmounts.value = {}
  }
}

// 获取上期投注并回显
const fetchPreviousPeriodBets = async () => {
  if (!gameStore.activeGame?.id || !activeGroupIdRef || !lastExpect.value?.expect_no) {
    toast.error('无法获取上期投注记录')
    return
  }

  try {
    const res = await betRecords({
      lottery_id: gameStore.activeGame.id,
      game_group_id: activeGroupIdRef,
      expect_no: lastExpect.value.expect_no,
      page: 1,
      pageSize: 100
    })

    if (res.code === 200 && res.data) {
      const list = res.data.list || []
      if (list.length === 0) {
        toast.info('上期没有投注记录')
        return
      }

      const prevBets: Record<string, number> = {}
      list.forEach((record) => {
        const betNoObj = record.bet_no
        if (betNoObj && typeof betNoObj === 'object') {
          const values = Array.isArray(betNoObj) ? betNoObj : Object.values(betNoObj)
          values.forEach((betInfo: BetNoItem) => {
            const playName = betInfo.bet_no
            const betGold = betInfo.bet_gold || 0
            if (playName) {
              prevBets[playName] = (prevBets[playName] || 0) + betGold
            }
          })
        }
      })

      const playNames = Object.keys(prevBets)
      if (playNames.length === 0) {
        toast.info('上期没有投注记录')
        return
      }

      selectedPlays.value = playNames
      const newAmounts: Record<string, string> = {}
      playNames.forEach((name) => {
        newAmounts[name] = String(prevBets[name])
      })
      playAmounts.value = newAmounts
      toast.success(`已加载上期 ${playNames.length} 个投注`)
    } else {
      toast.info('上期没有投注记录')
    }
  } catch (error) {
    console.error('获取上期投注记录失败', error)
    toast.error('获取上期投注记录失败')
  }
}

// 获取上期开奖结果显示
const getLastExpectResult = (): string => {
  if (!lastExpect.value?.finalRes) return '--'
  const fr = lastExpect.value.finalRes
  if (activeGroupIdRef) {
    const resultKey = `finalOpenRes${activeGroupIdRef}` as keyof typeof fr
    const resultValue = fr[resultKey]
    if (resultValue !== undefined && resultValue !== null) {
      return String(resultValue)
    }
  }
  const nums = fr.nums
  if (nums) {
    if (Array.isArray(nums)) return nums.join(',')
    if (typeof nums === 'object') return Object.values(nums).join(',')
    return String(nums)
  }
  return '--'
}

// 获取玩法列表
const fetchPlayMethods = async () => {
  if (!gameStore.activeGame?.id) return

  try {
    isLoadingPlays.value = true
    const res = await playAll({ lottery_id: gameStore.activeGame.id })

    if (res.code === 200 && res.data) {
      const { gamePlayMap = [], groupArr = [] } = res.data

      // 创建分组配置映射
      const groupConfigMap: Record<number, { betMultiplier: string; startNum: number }> = {}
      groupArr.forEach((g: { id: number; bet_multiplier?: string; start_num?: number }) => {
        groupConfigMap[g.id] = {
          betMultiplier: g.bet_multiplier || '',
          startNum: g.start_num || 0
        }
      })

      // 构建玩法分组列表
      const playGroups: PlayGroup[] = gamePlayMap
        .map((mapItem: GamePlayMapItem) => {
          const config = groupConfigMap[mapItem.id] || { betMultiplier: '', startNum: 0 }
          return {
            id: mapItem.id,
            name: mapItem.name,
            lang_name: mapItem.lang_name,
            betMultiplier: config.betMultiplier,
            startNum: config.startNum,
            plays: (mapItem.children || []).map(
              (play: GamePlay): PlayItem => ({
                id: play.id,
                name: play.name,
                lang_name: play.lang_name,
                odds: play.multiple || 0,
                minBetGold: play.min_bet_gold || 0
              })
            )
          }
        })
        .filter((g: PlayGroup) => g.plays.length > 0)

      groups.value = playGroups

      // 设置默认选中的分组
      let defaultGroupId: number | null = null
      const urlGroupId = route.query.group_id as string
      if (urlGroupId && playGroups.length > 0) {
        const targetGroup = playGroups.find((g) => String(g.id) === urlGroupId)
        if (targetGroup) {
          activeGroup.value = targetGroup
          defaultGroupId = Number(targetGroup.id)
        } else {
          activeGroup.value = playGroups[0]
          defaultGroupId = Number(playGroups[0].id)
        }
      } else if (playGroups.length > 0) {
        activeGroup.value = playGroups[0]
        defaultGroupId = Number(playGroups[0].id)
      }

      activeGroupIdRef = defaultGroupId

      // 获取开奖信息
      if (defaultGroupId) {
        fetchExpectInfo(defaultGroupId)
        isInitialLoad = false
      }
    } else if (res.code !== 3001) {
      toast.error(res.message || '获取玩法列表失败')
    }
  } catch (error) {
    console.error('获取玩法列表失败', error)
    toast.error('获取玩法列表失败，请稍后重试')
  } finally {
    isLoadingPlays.value = false
  }
}

// 获取开奖接口
const fetchExpectInfo = async (groupIdOverride?: number) => {
  const effectiveGroupId = groupIdOverride ?? activeGroupIdRef
  if (!gameStore.activeGame?.id || !effectiveGroupId) return

  try {
    const res = await fetchExpectInfoAPI({
      lottery_id: gameStore.activeGame.id,
      game_group_id: effectiveGroupId
    })

    statusCode.value = res.code
    if (res.code === 200 && res.data) {
      const newExpectNo = res.data.currExpectInfo?.expect_no

      if (newExpectNo && newExpectNo !== previousExpectNoRef) {
        if (previousExpectNoRef) {
          refreshUserPoints()
          if (soundEnabledRef) {
            playNotificationSound()
          }
        }
        previousExpectNoRef = newExpectNo
        previousExpectNo.value = newExpectNo
        fetchMyBetRecords(newExpectNo)
      }

      currExpect.value = res.data.currExpectInfo || null
      lastExpect.value = res.data.lastExpectInfo || null

      const newOpenCountdown = res.data.currExpectInfo?.open_countdown || 0
      remainingOpenRef = newOpenCountdown
      remainingOpen.value = newOpenCountdown
      remainingClose.value = res.data.currExpectInfo?.close_countdown || 0

      shouldStopFetching = false
    } else if (res.code === 3001 && res.data) {
      const currInfo = res.data.currExpectInfo
      const lastInfo = res.data.lastExpectInfo

      if (currInfo) {
        currExpect.value = currInfo
        const newOpenCountdown = currInfo.open_countdown || 0
        remainingOpenRef = newOpenCountdown
        remainingOpen.value = newOpenCountdown
        remainingClose.value = currInfo.close_countdown || 0
      }

      if (lastInfo) {
        lastExpect.value = lastInfo
      }
      shouldStopFetching = false
    } else {
      shouldStopFetching = true
      toast.error(res.message || '获取开奖信息失败')
    }
  } catch (error) {
    console.error('获取开奖信息失败', error)
    shouldStopFetching = true
    toast.error('获取开奖信息失败，请稍后重试')
  }
}

// 格式化时间
const formatTime = (sec: number): string => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// 监听 store 分组切换
watch(
  () => gameStore.selectedGroupId,
  (newGroupId) => {
    // 检查分组是否有效（groupId 可以为 0）
    if (newGroupId === null || newGroupId === undefined || groups.value.length === 0) return

    const targetGroup = groups.value.find((g) => Number(g.id) === newGroupId)
    if (targetGroup && (!activeGroup.value || Number(activeGroup.value.id) !== newGroupId)) {
      selectedPlays.value = []
      playAmounts.value = {}
      activeGroup.value = targetGroup
      activeQuick.value = null
      showModeSelector.value = false
      modes.value = []
      selectedMode.value = null
      myBetAmounts.value = {}
      activeGroupIdRef = newGroupId

      if (!isInitialLoad) {
        fetchExpectInfo(newGroupId)
        if (currExpect.value?.expect_no) {
          setTimeout(() => {
            fetchMyBetRecords(currExpect.value!.expect_no)
          }, 100)
        }
      }
    }
  }
)

// 监听铃声设置变化
watch(
  () => gameStore.soundEnabled,
  (newVal) => {
    soundEnabledRef = newVal
  }
)

// 监听游戏切换
watch(
  () => gameStore.activeGame?.id,
  (newGameId) => {
    if (newGameId) {
      shouldStopFetching = false
      isFetching = false
      remainingOpenRef = 0
      previousExpectNoRef = ''
      activeGroupIdRef = null
      isInitialLoad = true
      previousExpectNo.value = ''
      groups.value = []
      activeGroup.value = null
      selectedPlays.value = []
      playAmounts.value = {}
      myBetAmounts.value = {}
      fetchPlayMethods()
    }
  },
  { immediate: true }
)

// 切换玩法
const togglePlay = (playItem: PlayItem) => {
  const playName = playItem.name
  if (selectedPlays.value.includes(playName)) {
    selectedPlays.value = selectedPlays.value.filter((p) => p !== playName)
    const newAmounts = { ...playAmounts.value }
    delete newAmounts[playName]
    playAmounts.value = newAmounts
  } else {
    const defaultAmount = playItem.minBetGold || 0
    if (defaultAmount > 0) {
      playAmounts.value = { ...playAmounts.value, [playName]: String(defaultAmount) }
    }
    selectedPlays.value = [...selectedPlays.value, playName]
  }
}

// 更新玩法金额
const updatePlayAmount = (play: string, value: string) => {
  playAmounts.value = { ...playAmounts.value, [play]: value }
}

// 快速选择
const handleQuickSelect = (type: string) => {
  if (!activeGroup.value) return

  const groupId = Number(activeGroup.value.id)
  const numericPlays = activeGroup.value.plays
    .filter((p) => !isNaN(parseInt(p.name, 10)))
    .sort((a, b) => parseInt(a.name, 10) - parseInt(b.name, 10))

  const exclusiveButtons = [
    '全包', '单', '双', '大单', '小单', '大双', '小双', '单边', '双边',
    '大', '小', '中', '边', '大边', '小边',
    '0尾', '1尾', '2尾', '3尾', '4尾', '5尾', '6尾', '7尾', '8尾', '9尾', '小尾', '大尾',
    '3余0', '3余1', '3余2', '4余0', '4余1', '4余2', '4余3', '5余0', '5余1', '5余2', '5余3', '5余4'
  ]

  if (exclusiveButtons.includes(type) && activeQuick.value === type) {
    selectedPlays.value = []
    playAmounts.value = {}
    activeQuick.value = null
    return
  }

  const getGroupConfig = (gId: number) => {
    if ([1, 2, 3, 10, 14, 18, 22].includes(gId)) {
      return { min: 0, max: 27, bigStart: 14, smallEnd: 13, midStart: 10, midEnd: 17, bigEdgeStart: 18, smallEdgeEnd: 9 }
    } else if ([6, 15, 24].includes(gId)) {
      return { min: 3, max: 18, bigStart: 11, smallEnd: 10, midStart: 8, midEnd: 13, bigEdgeStart: 14, smallEdgeEnd: 7 }
    } else if ([5, 16, 23].includes(gId)) {
      return { min: 2, max: 12, bigStart: 7, smallEnd: 6, midStart: 5, midEnd: 9, bigEdgeStart: 10, smallEdgeEnd: 4 }
    } else if ([4, 26].includes(gId)) {
      return { min: 1, max: 10, bigStart: 6, smallEnd: 5, midStart: 4, midEnd: 7, bigEdgeStart: 8, smallEdgeEnd: 3 }
    }
    return null
  }

  const config = getGroupConfig(groupId)
  let newSelected: string[] = []
  let newActiveQuick: string | null = type

  switch (type) {
    case '清空':
      selectedPlays.value = []
      playAmounts.value = {}
      activeQuick.value = null
      return

    case '反选':
      newSelected = activeGroup.value.plays.filter((p) => !selectedPlays.value.includes(p.name)).map((p) => p.name)
      newActiveQuick = null
      break

    case '上期':
      fetchPreviousPeriodBets()
      activeQuick.value = null
      return

    case '全包':
      newSelected = activeGroup.value.plays.map((p) => p.name)
      break

    case '单':
      if (config) {
        newSelected = numericPlays
          .filter((p) => {
            const num = parseInt(p.name, 10)
            return num >= config.min && num <= config.max && num % 2 === 1
          })
          .map((p) => p.name)
      }
      break

    case '双':
      if (config) {
        newSelected = numericPlays
          .filter((p) => {
            const num = parseInt(p.name, 10)
            return num >= config.min && num <= config.max && num % 2 === 0
          })
          .map((p) => p.name)
      }
      break

    case '大单':
      if (config) {
        newSelected = numericPlays
          .filter((p) => {
            const num = parseInt(p.name, 10)
            return num >= config.bigStart && num <= config.max && num % 2 === 1
          })
          .map((p) => p.name)
      }
      break

    case '小单':
      if (config) {
        newSelected = numericPlays
          .filter((p) => {
            const num = parseInt(p.name, 10)
            return num >= config.min && num <= config.smallEnd && num % 2 === 1
          })
          .map((p) => p.name)
      }
      break

    case '大双':
      if (config) {
        newSelected = numericPlays
          .filter((p) => {
            const num = parseInt(p.name, 10)
            return num >= config.bigStart && num <= config.max && num % 2 === 0
          })
          .map((p) => p.name)
      }
      break

    case '小双':
      if (config) {
        newSelected = numericPlays
          .filter((p) => {
            const num = parseInt(p.name, 10)
            return num >= config.min && num <= config.smallEnd && num % 2 === 0
          })
          .map((p) => p.name)
      }
      break

    case '单边':
      if (config) {
        newSelected = numericPlays
          .filter((p) => {
            const num = parseInt(p.name, 10)
            return num >= config.min && num <= config.max && (num < config.midStart || num > config.midEnd) && num % 2 === 1
          })
          .map((p) => p.name)
      }
      break

    case '双边':
      if (config) {
        newSelected = numericPlays
          .filter((p) => {
            const num = parseInt(p.name, 10)
            return num >= config.min && num <= config.max && (num < config.midStart || num > config.midEnd) && num % 2 === 0
          })
          .map((p) => p.name)
      }
      break

    case '大':
      if (config) {
        newSelected = numericPlays
          .filter((p) => {
            const num = parseInt(p.name, 10)
            return num >= config.bigStart && num <= config.max
          })
          .map((p) => p.name)
      }
      break

    case '小':
      if (config) {
        newSelected = numericPlays
          .filter((p) => {
            const num = parseInt(p.name, 10)
            return num >= config.min && num <= config.smallEnd
          })
          .map((p) => p.name)
      }
      break

    case '中':
      if (config) {
        newSelected = numericPlays
          .filter((p) => {
            const num = parseInt(p.name, 10)
            return num >= config.midStart && num <= config.midEnd
          })
          .map((p) => p.name)
      }
      break

    case '边':
      if (config) {
        newSelected = numericPlays
          .filter((p) => {
            const num = parseInt(p.name, 10)
            return num >= config.min && num <= config.max && (num < config.midStart || num > config.midEnd)
          })
          .map((p) => p.name)
      }
      break

    case '大边':
      if (config) {
        newSelected = numericPlays
          .filter((p) => {
            const num = parseInt(p.name, 10)
            return num >= config.bigEdgeStart && num <= config.max
          })
          .map((p) => p.name)
      }
      break

    case '小边':
      if (config) {
        newSelected = numericPlays
          .filter((p) => {
            const num = parseInt(p.name, 10)
            return num >= config.min && num <= config.smallEdgeEnd
          })
          .map((p) => p.name)
      }
      break

    // 尾数选择
    case '0尾':
    case '1尾':
    case '2尾':
    case '3尾':
    case '4尾':
    case '5尾':
    case '6尾':
    case '7尾':
    case '8尾':
    case '9尾': {
      const tailNum = parseInt(type.replace('尾', ''), 10)
      newSelected = numericPlays.filter((p) => parseInt(p.name, 10) % 10 === tailNum).map((p) => p.name)
      break
    }

    case '小尾':
      newSelected = numericPlays.filter((p) => parseInt(p.name, 10) % 10 <= 4).map((p) => p.name)
      break

    case '大尾':
      newSelected = numericPlays.filter((p) => parseInt(p.name, 10) % 10 >= 5).map((p) => p.name)
      break

    // 余数选择
    case '3余0':
    case '3余1':
    case '3余2': {
      const mod3Val = parseInt(type.replace('3余', ''), 10)
      newSelected = numericPlays.filter((p) => parseInt(p.name, 10) % 3 === mod3Val).map((p) => p.name)
      break
    }

    case '4余0':
    case '4余1':
    case '4余2':
    case '4余3': {
      const mod4Val = parseInt(type.replace('4余', ''), 10)
      newSelected = numericPlays.filter((p) => parseInt(p.name, 10) % 4 === mod4Val).map((p) => p.name)
      break
    }

    case '5余0':
    case '5余1':
    case '5余2':
    case '5余3':
    case '5余4': {
      const mod5Val = parseInt(type.replace('5余', ''), 10)
      newSelected = numericPlays.filter((p) => parseInt(p.name, 10) % 5 === mod5Val).map((p) => p.name)
      break
    }
  }

  // 为新选中的玩法设置默认金额
  const newAmounts: Record<string, string> = {}
  newSelected.forEach((name) => {
    const playItem = activeGroup.value!.plays.find((p) => p.name === name)
    if (playItem && playItem.minBetGold > 0) {
      newAmounts[name] = String(playItem.minBetGold)
    }
  })

  playAmounts.value = newAmounts
  selectedPlays.value = newSelected
  activeQuick.value = newActiveQuick
}

// 倍数投注
const handleMultiplierSelect = (multiplier: number) => {
  selectedMultiplier.value = multiplier
  if (selectedPlays.value.length > 0) {
    const newAmounts = { ...playAmounts.value }
    selectedPlays.value.forEach((play) => {
      const currentAmount = parseInt(newAmounts[play] || '0', 10)
      if (currentAmount > 0) {
        newAmounts[play] = String(Math.floor(currentAmount * multiplier))
      }
    })
    playAmounts.value = newAmounts
  }
}

// 筹码选择
const handleChipSelect = (value: number) => {
  quickAmount.value = String(value)
}

// 定额梭哈
const handleFixedAllIn = () => {
  if (!quickAmount.value || selectedPlays.value.length === 0 || !activeGroup.value) return
  const totalAmount = parseInt(quickAmount.value, 10)
  if (isNaN(totalAmount) || totalAmount <= 0) return

  const weightsArray = getWeightsArray(activeGroup.value.betMultiplier)
  const startNum = activeGroup.value.startNum || 0
  const plays = activeGroup.value.plays || []

  let totalWeight = 0
  const playWeights: Record<string, number> = {}
  selectedPlays.value.forEach((play) => {
    const weight = getPlayWeight(play, weightsArray, startNum, plays)
    playWeights[play] = weight
    totalWeight += weight
  })

  const newAmounts: Record<string, string> = {}
  let allocatedSum = 0
  selectedPlays.value.forEach((play) => {
    const weight = playWeights[play]
    const existingAmount = parseInt(playAmounts.value[play] || '0', 10) || 0
    const allocatedAmount = Math.floor((weight / totalWeight) * totalAmount)
    allocatedSum += allocatedAmount
    newAmounts[play] = String(allocatedAmount + existingAmount)
  })

  const remainder = totalAmount - allocatedSum
  if (remainder > 0 && selectedPlays.value.length > 0) {
    const lastPlay = selectedPlays.value[selectedPlays.value.length - 1]
    const currentAmount = parseInt(newAmounts[lastPlay], 10)
    newAmounts[lastPlay] = String(currentAmount + remainder)
  }

  playAmounts.value = newAmounts
}

// 获取自定义模式列表
const fetchModeList = async () => {
  if (!gameStore.activeGame?.id || !activeGroupIdRef) return

  try {
    isLoadingModes.value = true
    const res = await modeList({
      lottery_id: gameStore.activeGame.id,
      game_group_id: activeGroupIdRef,
      page: 1,
      pageSize: 100
    })

    if (res.code === 200 && res.data) {
      modes.value = res.data.list || []
    } else {
      modes.value = []
    }
  } catch (error) {
    console.error('获取模式列表失败', error)
    modes.value = []
  } finally {
    isLoadingModes.value = false
  }
}

// 点击自定义模式按钮
const handleModeClick = () => {
  showModeSelector.value = true
  fetchModeList()
}

// 应用自定义模式
const handleApplyMode = (mode: ModeItem) => {
  if (!activeGroup.value) return

  const betNos = mode.bet_no
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s)
  const betGolds = mode.bet_no_gold
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s)

  const newSelectedPlays: string[] = []
  const newPlayAmounts: Record<string, string> = {}

  betNos.forEach((betNo, index) => {
    const playExists = activeGroup.value!.plays.some((p) => p.name === betNo)
    if (playExists) {
      newSelectedPlays.push(betNo)
      if (betGolds[index]) {
        newPlayAmounts[betNo] = betGolds[index]
      }
    }
  })

  selectedPlays.value = newSelectedPlays
  playAmounts.value = newPlayAmounts
  selectedMode.value = mode
  showModeSelector.value = false
  toast.success(`已应用模式: ${mode.mode_name}`)
}

// 梭哈（全部投入）
const handleAllIn = () => {
  if (selectedPlays.value.length === 0 || !authStore.currentCustomer || !activeGroup.value) return
  const totalPoints = authStore.currentCustomer.points || 0
  if (totalPoints <= 0) return

  const weightsArray = getWeightsArray(activeGroup.value.betMultiplier)
  const startNum = activeGroup.value.startNum || 0
  const plays = activeGroup.value.plays || []

  let totalWeight = 0
  const playWeights: Record<string, number> = {}
  selectedPlays.value.forEach((play) => {
    const weight = getPlayWeight(play, weightsArray, startNum, plays)
    playWeights[play] = weight
    totalWeight += weight
  })

  const newAmounts: Record<string, string> = {}
  let allocatedSum = 0
  selectedPlays.value.forEach((play) => {
    const weight = playWeights[play]
    const existingAmount = parseInt(playAmounts.value[play] || '0', 10) || 0
    const allocatedAmount = Math.floor((weight / totalWeight) * totalPoints)
    allocatedSum += allocatedAmount
    newAmounts[play] = String(allocatedAmount + existingAmount)
  })

  const remainder = totalPoints - allocatedSum
  if (remainder > 0 && selectedPlays.value.length > 0) {
    const lastPlay = selectedPlays.value[selectedPlays.value.length - 1]
    const currentAmount = parseInt(newAmounts[lastPlay], 10)
    newAmounts[lastPlay] = String(currentAmount + remainder)
  }

  playAmounts.value = newAmounts
}

// 单个玩法金额倍数调整
const handleAmountMultiplier = (play: string, multiplier: number) => {
  const currentAmount = parseInt(playAmounts.value[play] || '0', 10)
  const newAmount = Math.max(0, Math.floor(currentAmount * multiplier))
  playAmounts.value = { ...playAmounts.value, [play]: String(newAmount) }
}

// 提交投注
const handleSubmit = async () => {
  if (!activeGroup.value) {
    toast.error('请选择玩法分组')
    return
  }

  const bet_expect_no = currExpect.value?.expect_no || ''
  const game_group_id = activeGroup.value.id
  const bet_no = selectedPlays.value.join(',')
  const bet_gold = selectedPlays.value.map((p) => playAmounts.value[p] || '0').join(',')
  const lottery_played_id = selectedPlays.value
    .map((playName) => {
      const playItem = activeGroup.value!.plays.find((item) => item.name === playName)
      return playItem ? playItem.id : ''
    })
    .filter((id) => id !== '')
    .join(',')
  const total_gold = selectedPlays.value.reduce((sum, p) => sum + (parseInt(playAmounts.value[p] || '0', 10) || 0), 0)

  if (!bet_expect_no) {
    toast.error('期号信息缺失，请稍后重试')
    return
  }
  if (total_gold <= 0) {
    toast.error('请输入投注金额')
    return
  }

  const payload = {
    game_group_id,
    lottery_id: gameStore.activeGame!.id,
    bet_no,
    bet_expect_no,
    bet_gold,
    lottery_played_id,
    total_gold
  }

  try {
    const res = await betGame(payload)
    if (res.code === 200) {
      toast.success('投注成功！')

      // 更新本地已投注显示
      const updated = { ...myBetAmounts.value }
      selectedPlays.value.forEach((playName) => {
        const betAmount = parseInt(playAmounts.value[playName] || '0', 10) || 0
        if (betAmount > 0) {
          updated[playName] = (updated[playName] || 0) + betAmount
        }
      })
      myBetAmounts.value = updated

      // 清空选择
      selectedPlays.value = []
      playAmounts.value = {}
      activeQuick.value = null
      refreshUserPoints()
    } else if (res.code !== 3001) {
      toast.error(res.message || '投注失败，请稍后重试')
    }
  } catch (error) {
    console.error('投注失败：', error)
    toast.error('投注失败，请稍后重试')
  }
}

// 取消投注
const handleCancel = () => {
  selectedPlays.value = []
  playAmounts.value = {}
  activeQuick.value = null
}

// 初始化定时器
onMounted(() => {
  gameStore.initSoundSetting()
  soundEnabledRef = gameStore.soundEnabled

  // 倒计时定时器
  countdownTimer = setInterval(() => {
    if (remainingOpen.value > 0) {
      remainingOpen.value--
      remainingOpenRef = remainingOpen.value
    }
    if (remainingClose.value > 0) {
      remainingClose.value--
    }
  }, 1000)

  // 轮询定时器
  pollTimer = setInterval(() => {
    if (remainingOpenRef <= 0 && !shouldStopFetching && !isFetching) {
      isFetching = true
      fetchExpectInfo().finally(() => {
        isFetching = false
      })
    }
  }, 2000)
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div class="bg-gray-100 min-h-screen pb-32">
    <!-- 快捷选择区域 -->
    <div v-if="activeGroup" class="bg-white mx-3 mt-3 rounded-lg shadow p-3">
      <!-- 分组特定快捷按钮 -->
      <template v-if="quickSelectGroupIds.includes(Number(activeGroup.id))">
        <!-- 第一行快捷按钮 -->
        <div class="grid grid-cols-6 gap-2 mb-2">
          <button
            v-for="btn in quickButtons1"
            :key="btn"
            @click="handleQuickSelect(btn)"
            :class="[
              'py-1.5 text-xs rounded border',
              activeQuick === btn
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-gray-700 border-red-300 hover:border-red-500'
            ]"
          >
            {{ btn }}
          </button>
        </div>

        <!-- 第二行快捷按钮 -->
        <div class="grid grid-cols-6 gap-2 mb-2">
          <button
            v-for="btn in quickButtons2"
            :key="btn"
            @click="handleQuickSelect(btn)"
            :class="[
              'py-1.5 text-xs rounded border',
              activeQuick === btn
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-gray-700 border-red-300 hover:border-red-500'
            ]"
          >
            {{ btn }}
          </button>
        </div>

        <!-- 第三行：边+特殊按钮 -->
        <div class="grid grid-cols-6 gap-2">
          <button
            v-for="btn in quickButtons3"
            :key="btn"
            @click="handleQuickSelect(btn)"
            :class="[
              'py-1.5 text-xs rounded border',
              activeQuick === btn
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-gray-700 border-red-300 hover:border-red-500'
            ]"
          >
            {{ btn }}
          </button>
          <button
            v-for="btn in specialButtons"
            :key="btn"
            @click="handleQuickSelect(btn)"
            class="py-1.5 text-xs rounded bg-red-600 text-white"
          >
            {{ btn }}
          </button>
        </div>
      </template>

      <!-- 通用按钮（非特定分组显示） -->
      <template v-else>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="btn in ['全包', '上期', '反选', '清空']"
            :key="btn"
            @click="handleQuickSelect(btn)"
            class="py-1.5 text-xs rounded bg-red-600 text-white"
          >
            {{ btn }}
          </button>
        </div>
      </template>

      <!-- 可收起区域 -->
      <template v-if="isExpanded">
        <!-- 追加尾数 & 追加余数 -->
        <div v-if="quickSelectGroupIds.includes(Number(activeGroup.id))" class="mt-4 grid grid-cols-2 gap-3">
          <!-- 左侧：追加尾数 -->
          <div>
            <div class="flex items-center mb-2">
              <span class="text-xs text-gray-500">—</span>
              <span class="text-xs text-gray-600 mx-1">追加尾数</span>
              <span class="text-xs text-gray-500 flex-1">———</span>
            </div>
            <div class="grid grid-cols-4 gap-1">
              <button
                v-for="btn in tailButtons.slice(0, 4)"
                :key="btn"
                @click="handleQuickSelect(btn)"
                :class="[
                  'py-1 text-[10px] rounded border',
                  activeQuick === btn
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-red-300'
                ]"
              >
                {{ btn }}
              </button>
            </div>
            <div class="grid grid-cols-4 gap-1 mt-1">
              <button
                v-for="btn in tailButtons.slice(4, 8)"
                :key="btn"
                @click="handleQuickSelect(btn)"
                :class="[
                  'py-1 text-[10px] rounded border',
                  activeQuick === btn
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-red-300'
                ]"
              >
                {{ btn }}
              </button>
            </div>
            <div class="grid grid-cols-4 gap-1 mt-1">
              <button
                v-for="btn in tailButtons.slice(8)"
                :key="btn"
                @click="handleQuickSelect(btn)"
                :class="[
                  'py-1 text-[10px] rounded border',
                  activeQuick === btn
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-red-300'
                ]"
              >
                {{ btn }}
              </button>
            </div>
          </div>

          <!-- 右侧：追加余数 -->
          <div>
            <div class="flex items-center mb-2">
              <span class="text-xs text-gray-500">—</span>
              <span class="text-xs text-gray-600 mx-1">追加余数</span>
              <span class="text-xs text-gray-500 flex-1">———</span>
            </div>
            <div class="grid grid-cols-3 gap-1">
              <button
                v-for="btn in mod3Buttons"
                :key="btn"
                @click="handleQuickSelect(btn)"
                :class="[
                  'py-1 text-[10px] rounded border',
                  activeQuick === btn
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-red-300'
                ]"
              >
                {{ btn }}
              </button>
            </div>
            <div class="grid grid-cols-4 gap-1 mt-1">
              <button
                v-for="btn in mod4Buttons"
                :key="btn"
                @click="handleQuickSelect(btn)"
                :class="[
                  'py-1 text-[10px] rounded border',
                  activeQuick === btn
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-red-300'
                ]"
              >
                {{ btn }}
              </button>
            </div>
            <div class="grid grid-cols-5 gap-1 mt-1">
              <button
                v-for="btn in mod5Buttons"
                :key="btn"
                @click="handleQuickSelect(btn)"
                :class="[
                  'py-1 text-[10px] rounded border',
                  activeQuick === btn
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-red-300'
                ]"
              >
                {{ btn }}
              </button>
            </div>
          </div>
        </div>

        <!-- 倍数投注 -->
        <div class="mt-4">
          <div class="flex items-center mb-2">
            <span class="text-xs text-gray-500">——</span>
            <span class="text-xs text-gray-600 mx-2">倍数投注</span>
            <span class="text-xs text-gray-500 flex-1">——————————</span>
          </div>
          <div class="grid grid-cols-6 gap-2">
            <button
              v-for="mult in multiplierButtons1"
              :key="mult"
              @click="handleMultiplierSelect(mult)"
              :class="[
                'py-1.5 text-xs rounded border',
                selectedMultiplier === mult
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 border-red-300'
              ]"
            >
              {{ mult }}倍
            </button>
          </div>
          <div class="grid grid-cols-6 gap-2 mt-2">
            <button
              v-for="mult in multiplierButtons2"
              :key="mult"
              @click="handleMultiplierSelect(mult)"
              :class="[
                'py-1.5 text-xs rounded border',
                selectedMultiplier === mult
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 border-red-300'
              ]"
            >
              {{ mult }}倍
            </button>
          </div>
        </div>
      </template>

      <!-- 收起/展开按钮 -->
      <button
        @click="isExpanded = !isExpanded"
        class="w-full mt-3 py-2 bg-orange-500 text-white rounded-lg flex items-center justify-center gap-1"
      >
        {{ isExpanded ? '收起' : '展开' }}
        <ChevronUp v-if="isExpanded" :size="16" />
        <ChevronDown v-else :size="16" />
      </button>

      <!-- 自定义模式和梭哈 -->
      <div class="grid grid-cols-2 gap-3 mt-3">
        <button
          @click="handleModeClick"
          class="py-2 border border-gray-300 rounded-lg text-sm text-gray-600 flex items-center justify-center gap-1"
        >
          自定义模式 <ChevronDown :size="14" />
        </button>
        <button
          @click="handleAllIn"
          class="py-2 border border-gray-300 rounded-lg text-sm text-gray-600"
        >
          梭哈
        </button>
      </div>

      <!-- 筹码和定额梭哈 -->
      <div class="flex items-center gap-1.5 mt-3">
        <div class="flex gap-0.5 flex-shrink-0">
          <button
            v-for="chip in chipConfig"
            :key="chip.display"
            @click="handleChipSelect(chip.value)"
            class="w-9 h-9 flex-shrink-0 hover:scale-110 transition-transform"
          >
            <img :src="chip.img" :alt="chip.display" class="w-full h-full object-contain" />
          </button>
        </div>
        <input
          type="number"
          v-model="quickAmount"
          class="w-20 h-8 px-2 border border-gray-300 rounded text-sm flex-shrink-0"
          placeholder="金额"
        />
        <button
          @click="handleFixedAllIn"
          class="h-8 px-2 bg-red-600 text-white text-xs rounded flex-shrink-0 whitespace-nowrap"
        >
          定额梭哈
        </button>
      </div>
    </div>

    <!-- 号码列表区域 -->
    <div class="bg-white mx-3 mt-3 mb-[50px] rounded-lg shadow">
      <!-- 表头 -->
      <div class="grid grid-cols-[80px_1fr_100px_90px] text-xs text-gray-500 border-b px-3 py-2">
        <span>号码</span>
        <span class="text-center">我的已投注</span>
        <span class="text-center">投注</span>
        <span></span>
      </div>

      <!-- 号码列表 -->
      <div v-if="isLoadingPlays" class="flex justify-center items-center py-8">
        <div
          class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"
        ></div>
        <span class="ml-2 text-gray-600">加载中...</span>
      </div>

      <div v-else-if="activeGroup" class="divide-y">
        <div
          v-for="playItem in activeGroup.plays"
          :key="playItem.id"
          :class="[
            'grid grid-cols-[80px_1fr_100px_90px] items-center px-3 py-2',
            selectedPlays.includes(playItem.name) ? 'bg-orange-50' : 'bg-white'
          ]"
        >
          <!-- 号码球 -->
          <div class="flex flex-col items-start">
            <button
              @click="togglePlay(playItem)"
              :class="[
                'w-8 h-8 rounded-full text-white font-bold text-sm flex items-center justify-center',
                selectedPlays.includes(playItem.name) ? 'bg-orange-500' : 'bg-blue-400'
              ]"
            >
              {{ playItem.name }}
            </button>
            <span class="text-xs text-gray-500 mt-1">{{ (playItem.odds / 1000).toFixed(2) }}</span>
          </div>

          <!-- 我的已投注 -->
          <div
            :class="[
              'text-center text-sm',
              myBetAmounts[playItem.name] > 0 ? 'text-red-600 font-medium' : 'text-gray-400'
            ]"
          >
            {{ myBetAmounts[playItem.name] > 0 ? myBetAmounts[playItem.name].toLocaleString() : '-' }}
          </div>

          <!-- 投注输入框 -->
          <div>
            <input
              type="number"
              :value="playAmounts[playItem.name] || ''"
              @input="(e) => updatePlayAmount(playItem.name, (e.target as HTMLInputElement).value)"
              @focus="() => { if (!selectedPlays.includes(playItem.name)) togglePlay(playItem) }"
              class="w-full h-8 px-2 border border-gray-300 rounded text-sm text-center"
              placeholder=""
            />
          </div>

          <!-- 倍数按钮 -->
          <div class="flex gap-1 justify-end">
            <button @click="handleAmountMultiplier(playItem.name, 0.5)" class="text-xs text-blue-600">×0.5</button>
            <button @click="handleAmountMultiplier(playItem.name, 2)" class="text-xs text-blue-600">×2</button>
            <button @click="handleAmountMultiplier(playItem.name, 10)" class="text-xs text-blue-600">×10</button>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8 text-gray-500">暂无玩法数据</div>
    </div>

    <!-- 底部固定操作栏 -->
    <div class="fixed bottom-14 left-0 right-0 bg-white border-t shadow-lg">
      <!-- 上期开奖结果 -->
      <div v-if="lastExpect" class="flex items-center justify-between px-4 py-1.5 bg-gray-50 border-b text-xs">
        <div class="flex items-center gap-2">
          <span class="text-gray-500">上期:</span>
          <span class="text-blue-700 font-medium">{{ lastExpect.expect_no || '--' }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-red-600 font-bold">{{ getLastExpectResult() }}</span>
        </div>
        <div class="text-gray-400 text-[10px]">
          {{ lastExpect.open_time || '' }}
        </div>
      </div>

      <!-- 投注统计 -->
      <div class="flex justify-between px-4 py-2 border-b">
        <div class="flex items-center text-sm">
          <span class="text-gray-600">已投注</span>
          <span class="text-red-600 font-bold ml-1">
            {{ Object.values(myBetAmounts).reduce((sum, amt) => sum + amt, 0).toLocaleString() }}
          </span>
          <img alt="coin" class="inline-block w-4 h-4 ml-0.5" src="/ranking/coin.png" />
        </div>
        <div class="flex items-center text-sm">
          <span class="text-gray-600">本次投注</span>
          <span class="text-red-600 font-bold ml-1">{{ totalBetAmount.toLocaleString() }}</span>
          <img alt="coin" class="inline-block w-4 h-4 ml-0.5" src="/ranking/coin.png" />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="grid grid-cols-3 h-12">
        <button
          @click="handleCancel"
          class="bg-blue-600 text-white font-bold flex items-center justify-center gap-1"
        >
          <span class="text-lg">&lt;</span> 取消
        </button>
        <button class="bg-white text-gray-700 font-bold flex flex-col items-center justify-center border-x">
          <template v-if="remainingClose > 0">
            <span class="text-xs text-gray-500">截止投注</span>
            <span class="text-red-600 font-bold">{{ formatTime(remainingClose) }}</span>
          </template>
          <template v-else>
            <span class="text-xs text-gray-500">开奖倒计时</span>
            <span class="text-orange-600 font-bold">{{ formatTime(remainingOpen) }}</span>
          </template>
        </button>
        <button
          @click="handleSubmit"
          :disabled="statusCode === 3001 || totalBetAmount <= 0"
          :class="[
            'font-bold flex items-center justify-center gap-1',
            statusCode === 3001 || totalBetAmount <= 0
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-red-600 text-white'
          ]"
        >
          <span class="text-lg">&#10003;</span> 投注
        </button>
      </div>
    </div>

    <!-- 自定义模式选择弹窗 -->
    <Teleport to="body">
      <div
        v-if="showModeSelector"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showModeSelector = false"
      >
        <div class="mx-4 w-full max-w-sm rounded-lg bg-white flex flex-col max-h-[70vh]">
          <div class="p-3 border-b font-medium">选择投注模式</div>

          <div class="flex-1 overflow-y-auto">
            <div v-if="isLoadingModes" class="flex justify-center items-center py-8">
              <div
                class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"
              ></div>
              <span class="ml-2 text-gray-600">加载中...</span>
            </div>

            <div v-else-if="modes.length === 0" class="text-center py-8 text-gray-500">
              <p>暂无模式</p>
              <p class="text-sm mt-2">请先在"模式"页面创建投注模式</p>
            </div>

            <div v-else class="divide-y">
              <button
                v-for="mode in modes"
                :key="mode.id"
                @click="handleApplyMode(mode)"
                :class="[
                  'w-full px-4 py-3 text-left hover:bg-gray-50 flex justify-between items-center',
                  selectedMode?.id === mode.id && 'bg-orange-50'
                ]"
              >
                <span class="font-medium text-gray-800">{{ mode.mode_name }}</span>
                <span class="font-bold text-red-600">{{ mode.bet_gold }}</span>
              </button>
            </div>
          </div>

          <div class="p-3 border-t">
            <button
              @click="showModeSelector = false"
              class="w-full py-2 bg-gray-200 text-gray-700 rounded-lg"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
