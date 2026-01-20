<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'
import { autoOne, setAuto, modeList } from '@/api/game'
import { toast } from '@/composables/useToast'
import type { ModeItem, AutoItem } from '@/types/game.type'

const route = useRoute()

// 模式列表
const modes = ref<ModeItem[]>([])
const showModeSelector = ref(false)

// 自动配置表单
const totalExpectNums = ref<string>('1')
const minGold = ref<string>('')
const maxGold = ref<string>('')
const selectedMode = ref<ModeItem | null>(null)
const autoStatus = ref<number>(0)
const existingAuto = ref<AutoItem | null>(null)

const isLoadingAuto = ref(false)
const isSubmitting = ref(false)

// 从路由获取参数
const getLotteryId = () => Number(route.query.lottery_id) || 0
const getGroupId = () => Number(route.query.group_id) || 0

// 获取模式列表
const fetchModes = async (): Promise<ModeItem[]> => {
  const lotteryId = getLotteryId()
  const groupId = getGroupId()

  if (!lotteryId) return []

  try {
    const res = await modeList({
      lottery_id: lotteryId,
      game_group_id: groupId,
      page: 1,
      pageSize: 100
    })
    if (res.code === 200 && res.data) {
      const list = res.data.list || []
      modes.value = list
      return list
    } else {
      modes.value = []
      return []
    }
  } catch (error) {
    console.error('获取模式列表失败', error)
    modes.value = []
    return []
  }
}

// 获取自动配置
const fetchAutoConfig = async (modesList?: ModeItem[]) => {
  const lotteryId = getLotteryId()

  if (!lotteryId) return

  try {
    isLoadingAuto.value = true
    const res = await autoOne({ lottery_id: lotteryId })

    if (res.code === 200 && res.data && res.data.id) {
      const auto = res.data
      existingAuto.value = auto
      totalExpectNums.value = String(auto.total_expect_nums || 1)
      minGold.value = String(auto.min_gold || '')
      maxGold.value = String(auto.max_gold || '')
      autoStatus.value = auto.status || 0

      // 设置选中的模式
      const modeId = auto.mode_id || auto.auto_id
      if (modeId) {
        const availableModes = modesList || modes.value
        const mode = availableModes.find((m) => m.id === modeId)
        if (mode) {
          selectedMode.value = mode
        }
      }
    } else {
      // 没有已配置的自动，使用默认值
      existingAuto.value = null
      totalExpectNums.value = '1'
      minGold.value = ''
      maxGold.value = ''
      selectedMode.value = null
      autoStatus.value = 0
    }
  } catch (error) {
    console.error('获取自动配置失败', error)
  } finally {
    isLoadingAuto.value = false
  }
}

// 选择模式
const handleSelectMode = (mode: ModeItem) => {
  selectedMode.value = mode
  showModeSelector.value = false
}

// 验证并提交
const handleSubmit = async (status: number) => {
  const lotteryId = getLotteryId()
  const groupId = getGroupId()

  if (!lotteryId) {
    toast.error('请选择游戏')
    return
  }

  if (!groupId) {
    toast.error('请选择玩法分组')
    return
  }

  if (!selectedMode.value) {
    toast.error('请选择投注模式')
    return
  }

  const expectNums = parseInt(totalExpectNums.value, 10)
  if (isNaN(expectNums) || expectNums < 1) {
    toast.error('执行期数必须大于等于1')
    return
  }
  if (expectNums > 1440) {
    toast.error('执行期数最大不能超过1440期')
    return
  }

  const minGoldNum = parseInt(minGold.value, 10) || 0
  const maxGoldNum = parseInt(maxGold.value, 10) || 0

  if (minGoldNum < 0 || maxGoldNum < 0) {
    toast.error('金币数值不能为负数')
    return
  }

  try {
    isSubmitting.value = true
    const res = await setAuto({
      lottery_id: lotteryId,
      game_group_id: groupId,
      mode_id: selectedMode.value.id,
      total_expect_nums: expectNums,
      min_gold: minGoldNum,
      max_gold: maxGoldNum,
      status: status
    })

    if (res.code === 200) {
      toast.success(status === 1 ? '自动投注已启动' : '自动投注已关闭')
      autoStatus.value = status
      // 刷新配置
      await fetchAutoConfig()
    } else {
      toast.error(res.message || '操作失败')
    }
  } catch (error) {
    console.error('操作失败', error)
    toast.error('操作失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}

// 初始化数据
const initData = async () => {
  const modesList = await fetchModes()
  await fetchAutoConfig(modesList)
}

// 监听路由参数变化，重新加载数据
watch(
  () => [route.query.lottery_id, route.query.group_id],
  () => {
    initData()
  }
)

// 组件挂载时加载数据
onMounted(() => {
  initData()
})
</script>

<template>
  <div class="bg-gray-100 pb-32">
    <!-- 自动投注配置表单 -->
    <div class="space-y-3 mt-3">
      <!-- 基础设置 -->
      <div class="bg-white mx-3 rounded-lg shadow">
        <div class="px-4 py-3 text-gray-500 text-sm font-medium border-b">基础设置</div>

        <!-- 执行期数 -->
        <div class="flex justify-between items-center px-4 py-3 border-b">
          <span class="text-sm">执行期数</span>
          <div class="flex items-center gap-2">
            <input
              type="number"
              v-model="totalExpectNums"
              placeholder="1-1440"
              min="1"
              max="1440"
              class="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <span class="text-gray-500 text-sm">期</span>
          </div>
        </div>

        <!-- 金币下限 -->
        <div class="flex justify-between items-center px-4 py-3 border-b">
          <span class="text-sm">金币下限</span>
          <input
            type="number"
            v-model="minGold"
            placeholder="金币≤该值时停止"
            class="w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <!-- 金币上限 -->
        <div class="flex justify-between items-center px-4 py-3 border-b">
          <span class="text-sm">金币上限</span>
          <input
            type="number"
            v-model="maxGold"
            placeholder="金币≥该值时停止"
            class="w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <!-- 选择模式 -->
        <div
          class="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-gray-50"
          @click="showModeSelector = true"
        >
          <span class="text-sm">投注模式</span>
          <div class="flex items-center gap-2 text-gray-500">
            <span v-if="selectedMode" class="text-red-600 font-medium">{{ selectedMode.mode_name }}</span>
            <span v-else class="text-gray-400">点击选择投注模式</span>
            <ChevronRight :size="16" />
          </div>
        </div>
      </div>

      <!-- 当前状态 -->
      <div v-if="existingAuto" class="bg-white mx-3 rounded-lg shadow px-4 py-3">
        <div class="flex justify-between items-center">
          <span class="text-sm">当前状态</span>
          <span
            :class="[
              'px-3 py-1 rounded-full text-xs font-medium',
              autoStatus === 1 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
            ]"
          >
            {{ autoStatus === 1 ? '运行中' : '已关闭' }}
          </span>
        </div>
      </div>

      <!-- 使用说明 -->
      <div class="mx-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <div class="text-center text-gray-500 text-sm mb-2">—— 自动投注设置 ——</div>
        <div class="text-xs text-gray-600 leading-relaxed space-y-1">
          <p>1、设置自动投注期数（1-1440期）</p>
          <p>2、设置账户金币上限和下限</p>
          <p>3、选择自动投注使用的模式</p>
          <p>4、系统将在指定期数内自动投注</p>
          <p>5、开启后对号和追号模式将自动关闭</p>
        </div>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="fixed bottom-14 left-0 right-0 bg-white p-4 border-t shadow-lg">
      <div class="flex gap-3">
        <button
          v-if="autoStatus === 1"
          @click="handleSubmit(0)"
          :disabled="isSubmitting"
          class="flex-1 h-12 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
        >
          {{ isSubmitting ? '处理中...' : '关闭托管' }}
        </button>
        <button
          v-else
          @click="handleSubmit(1)"
          :disabled="isSubmitting || !selectedMode"
          class="flex-1 h-12 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {{ isSubmitting ? '处理中...' : '启动托管' }}
        </button>
      </div>
    </div>

    <!-- 模式选择弹窗 -->
    <Teleport to="body">
      <div
        v-if="showModeSelector"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showModeSelector = false"
      >
        <div class="mx-4 w-full max-w-sm rounded-lg bg-white flex flex-col max-h-[70vh]">
          <div class="p-3 border-b font-medium">选择投注模式</div>

          <div class="flex-1 overflow-y-auto">
            <div v-if="modes.length === 0" class="text-center py-8 text-gray-500">
              <p>暂无模式</p>
              <p class="text-sm mt-2">请先在"模式"页面创建投注模式</p>
            </div>

            <div v-else class="divide-y">
              <button
                v-for="mode in modes"
                :key="mode.id"
                @click="handleSelectMode(mode)"
                :class="[
                  'w-full px-4 py-3 text-left hover:bg-gray-50 flex justify-between items-center',
                  selectedMode?.id === mode.id && 'bg-red-50'
                ]"
              >
                <div>
                  <div class="flex items-center gap-5 font-medium">
                    <span>{{ mode.mode_name }}</span>
                    <span>{{ mode.bet_gold }}</span>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">玩法: {{ mode.bet_no }}</div>
                  <div class="text-xs text-gray-500 mt-1">金豆: {{ mode.bet_no_gold }}</div>
                </div>
                <span v-if="selectedMode?.id === mode.id" class="text-red-600 text-sm">已选</span>
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
