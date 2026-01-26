<script setup lang="ts">
/**
 * 好友申请列表页面
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useFriendStore } from '@/stores/friend'
import { ArrowLeft, UserCheck, UserX, Clock } from 'lucide-vue-next'
import { formatTime as formatTimeUtil } from '@/utils/time'

const { t } = useI18n()

const router = useRouter()
const friendStore = useFriendStore()

const isProcessing = ref<number | null>(null)

// 处理好友申请
async function handleRequest(requestId: number, action: 'accept' | 'reject') {
  isProcessing.value = requestId
  try {
    await friendStore.handleFriendRequest(requestId, action)
  } finally {
    isProcessing.value = null
  }
}

// 格式化时间（相对时间）
function formatTime(dateStr: string): string {
  return formatTimeUtil(dateStr, 'relative')
}

// 返回
function goBack() {
  router.back()
}

// 初始化
onMounted(async () => {
  await friendStore.loadFriendRequests()
})
</script>

<template>
  <div class="flex h-full flex-col bg-gray-50">
    <!-- 头部 -->
    <header class="sticky top-0 z-10 flex h-12 items-center justify-between bg-white px-4 shadow-sm">
      <button @click="goBack" class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100">
        <ArrowLeft class="h-5 w-5 text-gray-600" />
      </button>
      <h1 class="text-base font-medium text-gray-900">{{ t('im.friend_requests.title') }}</h1>
      <div class="w-8"></div>
    </header>

    <!-- 内容 -->
    <div class="flex-1 overflow-y-auto">
      <!-- 加载中 -->
      <div v-if="friendStore.isLoading && friendStore.friendRequests.length === 0" class="flex items-center justify-center py-8">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="friendStore.friendRequests.length === 0" class="flex flex-col items-center justify-center py-16">
        <Clock class="h-16 w-16 text-gray-300" />
        <p class="mt-4 text-sm text-gray-400">{{ t('im.friend_requests.empty') }}</p>
      </div>

      <!-- 申请列表 -->
      <div v-else class="divide-y divide-gray-100 bg-white">
        <div
          v-for="request in friendStore.friendRequests"
          :key="request.id"
          class="flex items-center px-4 py-3"
        >
          <!-- 头像 -->
          <img
            :src="request.avatar || '/default-avatar.png'"
            :alt="request.nickname"
            class="h-12 w-12 flex-shrink-0 rounded-full object-cover"
            @error="(e: Event) => (e.target as HTMLImageElement).src = '/default-avatar.png'"
          />

          <!-- 信息 -->
          <div class="ml-3 flex-1 overflow-hidden">
            <div class="flex items-center justify-between">
              <span class="truncate text-sm font-medium text-gray-900">{{ request.nickname }}</span>
              <span class="ml-2 flex-shrink-0 text-xs text-gray-400">{{ formatTime(request.created_at) }}</span>
            </div>
            <p v-if="request.message" class="mt-1 truncate text-xs text-gray-500">
              {{ request.message }}
            </p>
            <p v-else class="mt-1 truncate text-xs text-gray-400">
              {{ t('im.friend_requests.default_message') }}
            </p>
          </div>

          <!-- 操作按钮 -->
          <div class="ml-3 flex flex-shrink-0 gap-2">
            <button
              @click="handleRequest(request.id, 'reject')"
              :disabled="isProcessing === request.id"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 disabled:opacity-50"
            >
              <UserX class="h-4 w-4" />
            </button>
            <button
              @click="handleRequest(request.id, 'accept')"
              :disabled="isProcessing === request.id"
              class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
            >
              <UserCheck class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
