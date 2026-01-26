<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Plus, Edit2, Trash2 } from 'lucide-vue-next'
import { modeList, setMode } from '@/api/game'
import { toast } from '@/composables/useToast'
import type { ModeItem } from '@/types/game.type'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const modes = ref<ModeItem[]>([])
const isLoadingModes = ref(false)
const page = ref(1)
const hasMore = ref(true)
const pageSize = 20

const showDeleteConfirm = ref(false)
const deletingMode = ref<ModeItem | null>(null)

// 从路由获取参数
const getLotteryId = () => Number(route.query.lottery_id) || 0
const getGroupId = () => Number(route.query.group_id) || 0

// 格式化数字
const formatNumber = (num: number | string) => {
  const n = typeof num === 'string' ? parseInt(num, 10) : num
  if (isNaN(n)) return '0'
  return new Intl.NumberFormat('zh-CN').format(n)
}

// 获取模式列表
const fetchModeList = async (pageNum: number = 1, reset: boolean = false) => {
  const lotteryId = getLotteryId()
  const groupId = getGroupId()

  if (!lotteryId) return

  try {
    isLoadingModes.value = true
    const res = await modeList({
      lottery_id: lotteryId,
      game_group_id: groupId,
      page: pageNum,
      pageSize: pageSize
    })

    if (res.code === 200 && res.data) {
      const list = res.data.list || []
      if (reset) {
        modes.value = list
      } else {
        modes.value = [...modes.value, ...list]
      }
      hasMore.value = list.length >= pageSize
      page.value = pageNum
    } else {
      if (reset) modes.value = []
    }
  } catch (error) {
    console.error('获取模式列表失败:', error)
    if (reset) modes.value = []
  } finally {
    isLoadingModes.value = false
  }
}

const handleLoadMore = () => {
  if (isLoadingModes.value || !hasMore.value) return
  fetchModeList(page.value + 1, false)
}

// 删除模式
const handleDelete = async () => {
  if (!deletingMode.value) return

  try {
    const res = await setMode({
      id: deletingMode.value.id,
      status: 0
    })

    if (res.code === 200) {
      toast.success(t('games.mode.delete-success'))
      modes.value = modes.value.filter(m => m.id !== deletingMode.value?.id)
    } else {
      toast.error(res.message || t('games.mode.delete-failed'))
    }
  } catch (error: unknown) {
    const axiosError = error as { response?: { data?: { message?: string } } }
    const errorMessage = axiosError?.response?.data?.message
    toast.error(errorMessage || t('games.mode.delete-failed-retry'))
  } finally {
    showDeleteConfirm.value = false
    deletingMode.value = null
  }
}

const confirmDelete = (mode: ModeItem) => {
  deletingMode.value = mode
  showDeleteConfirm.value = true
}

// 跳转到创建/编辑页面
const goToCreate = () => {
  const lotteryId = getLotteryId()
  const groupId = getGroupId()
  router.push(`/games/mode/edit?lottery_id=${lotteryId}&group_id=${groupId}`)
}

const goToEdit = (mode: ModeItem) => {
  const lotteryId = getLotteryId()
  router.push(`/games/mode/edit?lottery_id=${lotteryId}&group_id=${mode.game_group_id}&mode_id=${mode.id}`)
}

// 监听路由参数变化，重新加载数据
watch(
  () => [route.query.lottery_id, route.query.group_id],
  () => {
    fetchModeList(1, true)
  }
)

// 组件挂载时加载数据
onMounted(() => {
  fetchModeList(1, true)
})
</script>

<template>
  <div class="bg-gray-100 pb-16">
    <!-- 创建按钮 -->
    <div class="bg-white mx-3 my-3 rounded-lg shadow">
      <button
        @click="goToCreate"
        class="w-full flex items-center justify-center gap-2 py-4 text-red-600 hover:bg-red-50"
      >
        <Plus :size="20" />
        <span>{{ t('games.mode.create') }}</span>
      </button>
    </div>

    <!-- 模式列表 -->
    <div class="bg-white mx-3 my-3 rounded-lg shadow">
      <!-- 表头 -->
      <div class="grid grid-cols-[1fr_80px_80px] text-xs text-gray-500 border-b bg-gray-50 px-3 py-2 gap-2 rounded-t-lg">
        <span>{{ t('games.mode.name') }}</span>
        <span class="text-center">{{ t('games.mode.total-coins') }}</span>
        <span class="text-center">{{ t('games.mode.operations') }}</span>
      </div>

      <div v-if="isLoadingModes && modes.length === 0" class="flex justify-center items-center py-8">
        <div class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <span class="ml-2 text-gray-600">{{ t('games.mode.loading') }}</span>
      </div>

      <div v-else-if="modes.length === 0" class="text-center py-8 text-gray-500">
        {{ t('games.mode.no-data') }}
      </div>

      <div v-else class="divide-y">
        <div
          v-for="mode in modes"
          :key="mode.id"
          class="px-3 py-3 text-sm bg-white hover:bg-gray-50"
        >
          <!-- 主要信息行 -->
          <div class="grid grid-cols-[1fr_80px_80px] items-center gap-2">
            <!-- 模式名称 -->
            <div class="font-medium text-gray-800 truncate">
              {{ mode.mode_name }}
            </div>

            <!-- 总金豆 -->
            <div class="text-center text-red-600 font-medium">
              {{ formatNumber(mode.bet_gold) }}
            </div>

            <!-- 操作按钮 -->
            <div class="flex justify-center gap-1">
              <button
                @click="goToEdit(mode)"
                class="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                :title="t('games.mode.edit')"
              >
                <Edit2 :size="16" />
              </button>
              <button
                @click="confirmDelete(mode)"
                class="p-1.5 text-red-600 hover:bg-red-50 rounded"
                :title="t('games.mode.delete')"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </div>

          <!-- 投注详情（折叠显示） -->
          <div class="mt-2 text-xs text-gray-500">
            <div class="flex items-start gap-1">
              <span class="text-gray-400 flex-shrink-0">{{ t('games.mode.play-method') }}</span>
              <span class="line-clamp-2 break-all">{{ mode.bet_no }}</span>
            </div>
            <div class="flex items-start gap-1 mt-1">
              <span class="text-gray-400 flex-shrink-0">{{ t('games.mode.coins') }}</span>
              <span class="line-clamp-1 break-all">{{ mode.bet_no_gold }}</span>
            </div>
          </div>
        </div>

        <!-- 加载更多 -->
        <div v-if="hasMore" class="py-4 text-center">
          <button
            @click="handleLoadMore"
            :disabled="isLoadingModes"
            class="px-6 py-2 bg-red-600 text-white text-sm rounded-lg disabled:opacity-50"
          >
            {{ isLoadingModes ? t('common.loading') : t('games.mode.load-more') }}
          </button>
        </div>

        <div v-if="!hasMore && modes.length > 0" class="py-4 text-center text-gray-400 text-sm">
          {{ t('games.mode.no-more') }}
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showDeleteConfirm = false"
      >
        <div class="mx-4 w-full max-w-sm rounded-lg bg-white p-4">
          <div class="text-lg font-medium mb-2">{{ t('games.mode.delete-confirm') }}</div>
          <div class="text-gray-600 mb-4">
            {{ t('games.mode.delete-confirm-msg') }} "{{ deletingMode?.mode_name }}"?
          </div>
          <div class="flex gap-3">
            <button
              @click="showDeleteConfirm = false"
              class="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              @click="handleDelete"
              class="flex-1 py-2 bg-red-600 text-white rounded-lg"
            >
              {{ t('games.mode.delete-confirm') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
