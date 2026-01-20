<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronDown, ChevronUp } from 'lucide-vue-next'
import { cn } from '@/utils'
import { playAll, setMode, modeList, gameAll } from '@/api/game'
import { toast } from '@/composables/useToast'
import type { GamePlay, GamePlayMapItem, Game, ModeItem } from '@/types/game.type'

interface PlayItem {
  id: number
  name: string
  odds: number
  minBetGold: number
}

interface PlayGroup {
  id: string | number
  name: string
  plays: PlayItem[]
  betMultiplier?: string
  startNum?: number
}

const route = useRoute()
const router = useRouter()

const lottery_id = computed(() => route.query.lottery_id as string || '')
const group_id = computed(() => route.query.group_id as string || '')
const mode_id = computed(() => route.query.mode_id as string || '')
const isEdit = computed(() => !!mode_id.value && mode_id.value !== '0')

const gameName = ref('加载中...')
const groupName = ref('')
const modeName = ref('')
const groups = ref<PlayGroup[]>([])
const isLoadingPlays = ref(true)
const isLoadingMode = ref(false)
const isSubmitting = ref(false)

// 快捷选择相关
const quickSelectGroupIds = [1, 2, 3, 10, 14, 18, 22, 4, 26, 5, 16, 23, 6, 15, 24]
const quickButtons1 = ['全包', '单', '大单', '小单', '单边', '双']
const quickButtons2 = ['大双', '小双', '双边', '大', '小', '中']
const quickButtons3 = ['边', '大边', '小边']
const specialButtons = ['反选', '清空']
const tailButtons = ['0尾', '1尾', '2尾', '3尾', '4尾', '5尾', '6尾', '7尾', '8尾', '9尾', '小尾', '大尾']
const mod3Buttons = ['3余0', '3余1', '3余2']
const mod4Buttons = ['4余0', '4余1', '4余2', '4余3']
const mod5Buttons = ['5余0', '5余1', '5余2', '5余3', '5余4']
const multiplierButtons1 = [0.1, 0.5, 0.8, 1.2, 1.5, 2]
const multiplierButtons2 = [5, 10, 20, 30, 50, 100]

const activeGroup = ref<PlayGroup | null>(null)
const selectedPlays = ref<string[]>([])
const playAmounts = ref<Record<string, string>>({})
const activeQuick = ref<string | null>(null)
const isExpanded = ref(false)
const selectedMultiplier = ref<number | null>(null)

// 获取游戏名称
const fetchGameName = async () => {
  if (!lottery_id.value) return

  try {
    const res = await gameAll({})
    if (res.code === 200 && res.data) {
      const { gameTypeMap = [] } = res.data
      for (const typeItem of gameTypeMap) {
        const foundGame = typeItem.children?.find((game: Game) => String(game.id) === String(lottery_id.value))
        if (foundGame) {
          gameName.value = foundGame.name
          return
        }
      }
    }
  } catch (error) {
    console.error('获取游戏名称失败', error)
  }
}

// 获取玩法列表
const fetchPlayMethods = async () => {
  if (!lottery_id.value) {
    router.push('/games')
    return
  }

  try {
    isLoadingPlays.value = true
    const res = await playAll({ lottery_id: parseInt(lottery_id.value) })

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

      const playGroups: PlayGroup[] = gamePlayMap
        .map((mapItem: GamePlayMapItem) => {
          const config = groupConfigMap[mapItem.id] || { betMultiplier: '', startNum: 0 }
          return {
            id: mapItem.id,
            name: mapItem.name,
            betMultiplier: config.betMultiplier,
            startNum: config.startNum,
            plays: (mapItem.children || []).map((play: GamePlay): PlayItem => ({
              id: play.id,
              name: play.name,
              odds: play.multiple || 0,
              minBetGold: play.min_bet_gold || 0
            }))
          }
        })
        .filter((g: PlayGroup) => g.plays.length > 0)

      groups.value = playGroups

      if (isEdit.value && mode_id.value) {
        await loadModeData(playGroups)
      } else {
        if (group_id.value && playGroups.length > 0) {
          const targetGroup = playGroups.find(g => String(g.id) === String(group_id.value))
          if (targetGroup) {
            activeGroup.value = targetGroup
            groupName.value = targetGroup.name
          } else {
            activeGroup.value = playGroups[0]
            groupName.value = playGroups[0].name
          }
        } else if (playGroups.length > 0) {
          activeGroup.value = playGroups[0]
          groupName.value = playGroups[0].name
        }
      }
    }
  } catch (error) {
    console.error('获取玩法列表失败', error)
    toast.error('获取玩法列表失败，请稍后重试')
  } finally {
    isLoadingPlays.value = false
  }
}

// 加载已有模式数据
const loadModeData = async (playGroups: PlayGroup[]) => {
  if (!isEdit.value || !lottery_id.value || !group_id.value || !mode_id.value) return

  try {
    isLoadingMode.value = true

    const res = await modeList({
      lottery_id: parseInt(lottery_id.value),
      game_group_id: parseInt(group_id.value),
      mode_id: parseInt(mode_id.value),
      page: 1,
      pageSize: 100
    })

    if (res.code === 200 && res.data) {
      const list = res.data.list || []
      const mode = list.find((m: ModeItem) => String(m.id) === String(mode_id.value)) || list[0]

      if (mode) {
        const targetGroup = playGroups.find(g => Number(g.id) === mode.game_group_id)

        const betNoStr = mode.bet_no || ''
        const betNos = betNoStr.split(',').filter((n: string) => n.trim() !== '')
        const betGoldStr = mode?.bet_no_gold || ''
        const betGolds = betGoldStr.split(',')
        const playedIdStr = mode.lottery_played_id || ''
        const playedIds = playedIdStr.split(',').filter((n: string) => n.trim() !== '')

        let selectedPlayNames: string[] = []
        const amounts: Record<string, string> = {}

        if (targetGroup && playedIds.length > 0) {
          playedIds.forEach((playId: string, idx: number) => {
            const playItem = targetGroup.plays.find(p => String(p.id) === String(playId))
            if (playItem) {
              selectedPlayNames.push(playItem.name)
              amounts[playItem.name] = betGolds[idx] || '0'
            }
          })
        }

        if (selectedPlayNames.length === 0 && betNos.length > 0) {
          selectedPlayNames = betNos
          betNos.forEach((no: string, idx: number) => {
            amounts[no] = betGolds[idx] || '0'
          })
        }

        modeName.value = mode.mode_name || ''
        selectedPlays.value = [...selectedPlayNames]
        playAmounts.value = { ...amounts }

        if (targetGroup) {
          activeGroup.value = targetGroup
          groupName.value = targetGroup.name
        }
      }
    }
  } catch (error) {
    console.error('加载模式数据失败', error)
    toast.error('加载模式数据失败')
  } finally {
    isLoadingMode.value = false
  }
}

onMounted(() => {
  fetchGameName()
  fetchPlayMethods()
})

// 切换玩法
const togglePlay = (playItem: PlayItem) => {
  const playName = playItem.name
  if (selectedPlays.value.includes(playName)) {
    selectedPlays.value = selectedPlays.value.filter(p => p !== playName)
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

const updatePlayAmount = (play: string, value: string) => {
  playAmounts.value = { ...playAmounts.value, [play]: value }
}

// 快速选择
const handleQuickSelect = (type: string) => {
  if (!activeGroup.value) return

  const groupId = Number(activeGroup.value.id)
  const numericPlays = activeGroup.value.plays
    .filter(p => !isNaN(parseInt(p.name, 10)))
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
      newSelected = activeGroup.value.plays
        .filter(p => !selectedPlays.value.includes(p.name))
        .map(p => p.name)
      newActiveQuick = null
      break

    case '全包':
      newSelected = activeGroup.value.plays.map(p => p.name)
      break

    case '单':
      if (config) {
        newSelected = numericPlays.filter(p => {
          const num = parseInt(p.name, 10)
          return num >= config.min && num <= config.max && num % 2 === 1
        }).map(p => p.name)
      }
      break

    case '双':
      if (config) {
        newSelected = numericPlays.filter(p => {
          const num = parseInt(p.name, 10)
          return num >= config.min && num <= config.max && num % 2 === 0
        }).map(p => p.name)
      }
      break

    case '大单':
      if (config) {
        newSelected = numericPlays.filter(p => {
          const num = parseInt(p.name, 10)
          return num >= config.bigStart && num <= config.max && num % 2 === 1
        }).map(p => p.name)
      }
      break

    case '小单':
      if (config) {
        newSelected = numericPlays.filter(p => {
          const num = parseInt(p.name, 10)
          return num >= config.min && num <= config.smallEnd && num % 2 === 1
        }).map(p => p.name)
      }
      break

    case '大双':
      if (config) {
        newSelected = numericPlays.filter(p => {
          const num = parseInt(p.name, 10)
          return num >= config.bigStart && num <= config.max && num % 2 === 0
        }).map(p => p.name)
      }
      break

    case '小双':
      if (config) {
        newSelected = numericPlays.filter(p => {
          const num = parseInt(p.name, 10)
          return num >= config.min && num <= config.smallEnd && num % 2 === 0
        }).map(p => p.name)
      }
      break

    case '单边':
      if (config) {
        newSelected = numericPlays.filter(p => {
          const num = parseInt(p.name, 10)
          return num >= config.min && num <= config.max &&
            (num < config.midStart || num > config.midEnd) && num % 2 === 1
        }).map(p => p.name)
      }
      break

    case '双边':
      if (config) {
        newSelected = numericPlays.filter(p => {
          const num = parseInt(p.name, 10)
          return num >= config.min && num <= config.max &&
            (num < config.midStart || num > config.midEnd) && num % 2 === 0
        }).map(p => p.name)
      }
      break

    case '大':
      if (config) {
        newSelected = numericPlays.filter(p => {
          const num = parseInt(p.name, 10)
          return num >= config.bigStart && num <= config.max
        }).map(p => p.name)
      }
      break

    case '小':
      if (config) {
        newSelected = numericPlays.filter(p => {
          const num = parseInt(p.name, 10)
          return num >= config.min && num <= config.smallEnd
        }).map(p => p.name)
      }
      break

    case '中':
      if (config) {
        newSelected = numericPlays.filter(p => {
          const num = parseInt(p.name, 10)
          return num >= config.midStart && num <= config.midEnd
        }).map(p => p.name)
      }
      break

    case '边':
      if (config) {
        newSelected = numericPlays.filter(p => {
          const num = parseInt(p.name, 10)
          return num >= config.min && num <= config.max &&
            (num < config.midStart || num > config.midEnd)
        }).map(p => p.name)
      }
      break

    case '大边':
      if (config) {
        newSelected = numericPlays.filter(p => {
          const num = parseInt(p.name, 10)
          return num >= config.bigEdgeStart && num <= config.max
        }).map(p => p.name)
      }
      break

    case '小边':
      if (config) {
        newSelected = numericPlays.filter(p => {
          const num = parseInt(p.name, 10)
          return num >= config.min && num <= config.smallEdgeEnd
        }).map(p => p.name)
      }
      break

    default:
      // 尾数选择
      if (type.endsWith('尾')) {
        if (type === '小尾') {
          newSelected = numericPlays.filter(p => parseInt(p.name, 10) % 10 <= 4).map(p => p.name)
        } else if (type === '大尾') {
          newSelected = numericPlays.filter(p => parseInt(p.name, 10) % 10 >= 5).map(p => p.name)
        } else {
          const tailNum = parseInt(type.replace('尾', ''), 10)
          newSelected = numericPlays.filter(p => parseInt(p.name, 10) % 10 === tailNum).map(p => p.name)
        }
      }
      // 余数选择
      else if (type.startsWith('3余')) {
        const mod3Val = parseInt(type.replace('3余', ''), 10)
        newSelected = numericPlays.filter(p => parseInt(p.name, 10) % 3 === mod3Val).map(p => p.name)
      } else if (type.startsWith('4余')) {
        const mod4Val = parseInt(type.replace('4余', ''), 10)
        newSelected = numericPlays.filter(p => parseInt(p.name, 10) % 4 === mod4Val).map(p => p.name)
      } else if (type.startsWith('5余')) {
        const mod5Val = parseInt(type.replace('5余', ''), 10)
        newSelected = numericPlays.filter(p => parseInt(p.name, 10) % 5 === mod5Val).map(p => p.name)
      }
  }

  const newAmounts: Record<string, string> = {}
  newSelected.forEach(name => {
    const playItem = activeGroup.value?.plays.find(p => p.name === name)
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
  if (selectedPlays.value.length === 0) {
    toast.info('请先选择玩法')
    return
  }
  const newAmounts = { ...playAmounts.value }
  selectedPlays.value.forEach(playName => {
    const currentAmount = parseInt(newAmounts[playName] || '0', 10) || 0
    if (currentAmount > 0) {
      newAmounts[playName] = String(Math.floor(currentAmount * multiplier))
    }
  })
  playAmounts.value = newAmounts
}

// 金额倍数调整
const handleAmountMultiplier = (playName: string, multiplier: number) => {
  const currentAmount = parseInt(playAmounts.value[playName] || '0', 10) || 0
  if (currentAmount > 0) {
    playAmounts.value = {
      ...playAmounts.value,
      [playName]: String(Math.floor(currentAmount * multiplier))
    }
  }
}

// 取消
const handleCancel = () => {
  router.back()
}

// 提交保存模式
const handleSubmit = async () => {
  if (!activeGroup.value) {
    toast.error('请选择玩法分组')
    return
  }

  if (!modeName.value.trim()) {
    toast.error('请输入模式名称')
    return
  }

  if (selectedPlays.value.length === 0) {
    toast.error('请选择至少一个玩法')
    return
  }

  const bet_no = selectedPlays.value.join(',')
  const bet_gold = selectedPlays.value.map(p => playAmounts.value[p] || '0').join(',')
  const lottery_played_id = selectedPlays.value.map(playName => {
    const playItem = activeGroup.value?.plays.find(item => item.name === playName)
    return playItem ? playItem.id : ''
  }).filter(id => id !== '').join(',')
  const total_gold = selectedPlays.value.reduce((sum, p) => sum + (parseInt(playAmounts.value[p] || '0', 10) || 0), 0)

  if (total_gold <= 0) {
    toast.error('请输入投注金额')
    return
  }

  const payload = {
    lottery_id: lottery_id.value,
    game_group_id: activeGroup.value.id,
    lottery_played_id,
    bet_no,
    bet_gold,
    total_gold,
    mode_name: modeName.value.trim(),
    mode_id: isEdit.value ? parseInt(mode_id.value) : 0,
    status: 1
  }

  try {
    isSubmitting.value = true
    const res = await setMode(payload)
    if (res.code === 200) {
      toast.success(isEdit.value ? '模式更新成功' : '模式保存成功')
      router.back()
    } else {
      toast.error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存模式失败：', error)
    toast.error('保存失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}

const totalBetAmount = computed(() =>
  selectedPlays.value.reduce((sum, p) => sum + (parseInt(playAmounts.value[p] || '0', 10) || 0), 0)
)
</script>

<template>
  <div class="bg-gray-100 pb-32">
    <!-- 快捷选择区域 -->
    <div v-if="activeGroup" class="bg-white mx-3 mt-3 rounded-lg shadow p-3">
      <template v-if="quickSelectGroupIds.includes(Number(activeGroup.id))">
        <div class="grid grid-cols-6 gap-2 mb-2">
          <button
            v-for="btn in quickButtons1"
            :key="btn"
            @click="handleQuickSelect(btn)"
            :class="cn(
              'py-1.5 text-xs rounded border',
              activeQuick === btn
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-gray-700 border-red-300 hover:border-red-500'
            )"
          >
            {{ btn }}
          </button>
        </div>
        <div class="grid grid-cols-6 gap-2 mb-2">
          <button
            v-for="btn in quickButtons2"
            :key="btn"
            @click="handleQuickSelect(btn)"
            :class="cn(
              'py-1.5 text-xs rounded border',
              activeQuick === btn
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-gray-700 border-red-300 hover:border-red-500'
            )"
          >
            {{ btn }}
          </button>
        </div>
        <div class="grid grid-cols-6 gap-2">
          <button
            v-for="btn in quickButtons3"
            :key="btn"
            @click="handleQuickSelect(btn)"
            :class="cn(
              'py-1.5 text-xs rounded border',
              activeQuick === btn
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-gray-700 border-red-300 hover:border-red-500'
            )"
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
      <template v-else>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="btn in ['全包', '反选', '清空']"
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
        <template v-if="quickSelectGroupIds.includes(Number(activeGroup.id))">
          <div class="mt-4 grid grid-cols-2 gap-3">
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
                  :class="cn(
                    'py-1 text-[10px] rounded border',
                    activeQuick === btn
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-700 border-red-300'
                  )"
                >
                  {{ btn }}
                </button>
              </div>
              <div class="grid grid-cols-4 gap-1 mt-1">
                <button
                  v-for="btn in tailButtons.slice(4, 8)"
                  :key="btn"
                  @click="handleQuickSelect(btn)"
                  :class="cn(
                    'py-1 text-[10px] rounded border',
                    activeQuick === btn
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-700 border-red-300'
                  )"
                >
                  {{ btn }}
                </button>
              </div>
              <div class="grid grid-cols-4 gap-1 mt-1">
                <button
                  v-for="btn in tailButtons.slice(8)"
                  :key="btn"
                  @click="handleQuickSelect(btn)"
                  :class="cn(
                    'py-1 text-[10px] rounded border',
                    activeQuick === btn
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-700 border-red-300'
                  )"
                >
                  {{ btn }}
                </button>
              </div>
            </div>

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
                  :class="cn(
                    'py-1 text-[10px] rounded border',
                    activeQuick === btn
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-700 border-red-300'
                  )"
                >
                  {{ btn }}
                </button>
              </div>
              <div class="grid grid-cols-4 gap-1 mt-1">
                <button
                  v-for="btn in mod4Buttons"
                  :key="btn"
                  @click="handleQuickSelect(btn)"
                  :class="cn(
                    'py-1 text-[10px] rounded border',
                    activeQuick === btn
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-700 border-red-300'
                  )"
                >
                  {{ btn }}
                </button>
              </div>
              <div class="grid grid-cols-5 gap-1 mt-1">
                <button
                  v-for="btn in mod5Buttons"
                  :key="btn"
                  @click="handleQuickSelect(btn)"
                  :class="cn(
                    'py-1 text-[10px] rounded border',
                    activeQuick === btn
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-700 border-red-300'
                  )"
                >
                  {{ btn }}
                </button>
              </div>
            </div>
          </div>
        </template>

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
              :class="cn(
                'py-1.5 text-xs rounded border',
                selectedMultiplier === mult
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 border-red-300'
              )"
            >
              {{ mult }}倍
            </button>
          </div>
          <div class="grid grid-cols-6 gap-2 mt-2">
            <button
              v-for="mult in multiplierButtons2"
              :key="mult"
              @click="handleMultiplierSelect(mult)"
              :class="cn(
                'py-1.5 text-xs rounded border',
                selectedMultiplier === mult
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 border-red-300'
              )"
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
    </div>

    <!-- 号码列表区域 -->
    <div class="bg-white mx-3 mt-3 mb-[20px] rounded-lg shadow">
      <!-- 表头 -->
      <div class="grid grid-cols-[80px_1fr_100px_90px] text-xs text-gray-500 border-b px-3 py-2">
        <span>号码</span>
        <span class="text-center">赔率</span>
        <span class="text-center">投注</span>
        <span></span>
      </div>

      <!-- 号码列表 -->
      <div v-if="isLoadingPlays || isLoadingMode" class="flex justify-center items-center py-8">
        <div class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <span class="ml-2 text-gray-600">加载中...</span>
      </div>
      <div v-else-if="activeGroup" class="divide-y">
        <div
          v-for="playItem in activeGroup.plays"
          :key="playItem.id"
          :class="cn(
            'grid grid-cols-[80px_1fr_100px_90px] items-center px-3 py-2',
            selectedPlays.includes(playItem.name) ? 'bg-orange-50' : 'bg-white'
          )"
        >
          <!-- 号码 -->
          <div class="flex flex-col items-start">
            <button
              @click="togglePlay(playItem)"
              :class="cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                selectedPlays.includes(playItem.name)
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700'
              )"
            >
              {{ playItem.name }}
            </button>
          </div>

          <!-- 赔率 -->
          <div class="text-center text-sm text-gray-600">
            {{ (playItem.odds / 1000).toFixed(2) }}
          </div>

          <!-- 投注输入 -->
          <div class="flex justify-center">
            <input
              type="number"
              :value="playAmounts[playItem.name] || ''"
              @input="(e) => updatePlayAmount(playItem.name, (e.target as HTMLInputElement).value)"
              placeholder="0"
              :class="cn(
                'w-20 h-8 px-2 text-center text-sm border rounded',
                selectedPlays.includes(playItem.name)
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-300 bg-gray-50'
              )"
            />
          </div>

          <!-- 倍数按钮 -->
          <div class="flex items-center justify-end gap-1">
            <button
              @click="handleAmountMultiplier(playItem.name, 0.5)"
              class="text-xs text-blue-600"
            >
              ×0.5
            </button>
            <button
              @click="handleAmountMultiplier(playItem.name, 2)"
              class="text-xs text-blue-600"
            >
              ×2
            </button>
            <button
              @click="handleAmountMultiplier(playItem.name, 10)"
              class="text-xs text-blue-600"
            >
              ×10
            </button>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-8 text-gray-500">暂无玩法数据</div>
    </div>

    <!-- 底部固定操作栏 -->
    <div class="fixed bottom-14 left-0 right-0 bg-white border-t shadow-lg">
      <!-- 模式名称输入 + 总投入 -->
      <div class="flex items-center justify-between px-4 py-2 border-b">
        <input
          type="text"
          v-model="modeName"
          placeholder="填写模式名称"
          class="flex-1 h-8 px-3 text-sm border border-gray-300 rounded mr-3"
          maxlength="20"
        />
        <div class="flex items-center text-sm flex-shrink-0">
          <span class="text-gray-600">总投入</span>
          <span class="text-red-600 font-bold ml-1">{{ totalBetAmount.toLocaleString() }}</span>
          <img
            alt="coin"
            class="inline-block w-4 h-4 ml-0.5"
            src="/ranking/coin.png"
          />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="grid grid-cols-2 h-12">
        <button
          @click="handleCancel"
          class="bg-white text-gray-700 font-bold flex items-center justify-center gap-1 border-r"
        >
          <span class="text-lg">&lt;</span> 取消
        </button>
        <button
          @click="handleSubmit"
          :disabled="isSubmitting || selectedPlays.length === 0 || totalBetAmount <= 0"
          :class="cn(
            'font-bold flex items-center justify-center gap-1',
            isSubmitting || selectedPlays.length === 0 || totalBetAmount <= 0
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-blue-600 text-white'
          )"
        >
          <span class="text-lg">✓</span> 保存模式
        </button>
      </div>
    </div>
  </div>
</template>
