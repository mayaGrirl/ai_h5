<script setup lang="ts">
/**
 * 系统消息列表页面
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFriendStore } from '@/stores/friend'
import {
  ArrowLeft,
  Bell,
  Gift,
  Trophy,
  CreditCard,
  Wallet,
  Shield,
  Megaphone,
  Star,
  UserCheck,
  Circle,
} from 'lucide-vue-next'
import type { SystemMessage } from '@/types/friend.type'
import { formatConversationTime } from '@/utils/time'

const router = useRouter()
const friendStore = useFriendStore()

const activeFilter = ref<string | undefined>(undefined)

// 消息类型配置
const messageTypeConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  winning: { icon: Trophy, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  recharge: { icon: CreditCard, color: 'text-green-600', bgColor: 'bg-green-100' },
  withdraw: { icon: Wallet, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  withdraw_failed: { icon: Wallet, color: 'text-red-600', bgColor: 'bg-red-100' },
  announcement: { icon: Megaphone, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  activity: { icon: Gift, color: 'text-pink-600', bgColor: 'bg-pink-100' },
  vip_upgrade: { icon: Star, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  points: { icon: Star, color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  salary: { icon: CreditCard, color: 'text-teal-600', bgColor: 'bg-teal-100' },
  welfare: { icon: Gift, color: 'text-rose-600', bgColor: 'bg-rose-100' },
  security: { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-100' },
  friend_request: { icon: UserCheck, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  friend_accepted: { icon: UserCheck, color: 'text-green-600', bgColor: 'bg-green-100' },
  general: { icon: Bell, color: 'text-gray-600', bgColor: 'bg-gray-100' },
}

// 获取消息图标配置
function getIconConfig(type: string) {
  return messageTypeConfig[type] || messageTypeConfig.general
}

// 过滤选项
const filterOptions = [
  { value: undefined, label: '全部' },
  { value: 'winning', label: '中奖' },
  { value: 'recharge', label: '充值' },
  { value: 'withdraw', label: '提现' },
  { value: 'announcement', label: '公告' },
  { value: 'activity', label: '活动' },
]

// 格式化时间
function formatTime(dateStr: string): string {
  return formatConversationTime(dateStr)
}

// 切换过滤
async function changeFilter(type?: string) {
  activeFilter.value = type
  await friendStore.loadSystemMessages(1, type)
}

// 标记已读
async function markAsRead(message: SystemMessage) {
  if (message.is_read === 0) {
    await friendStore.markSystemMessageRead(message.id)
  }
}

// 全部标记已读
async function markAllAsRead() {
  if (friendStore.systemMessageUnread > 0) {
    await friendStore.markSystemMessageRead(undefined, true)
  }
}

// 处理消息点击
function handleMessageClick(message: SystemMessage) {
  markAsRead(message)

  // 根据消息类型跳转
  if (message.extra?.url) {
    router.push(message.extra.url)
  } else if (message.extra?.order_id) {
    router.push(`/orders/${message.extra.order_id}`)
  } else if (message.extra?.announcement_id) {
    router.push(`/announcements/${message.extra.announcement_id}`)
  }
}

// 返回
function goBack() {
  router.back()
}

// 初始化
onMounted(async () => {
  await friendStore.loadSystemMessages()
})
</script>

<template>
  <div class="flex h-full flex-col bg-gray-50">
    <!-- 头部 -->
    <header class="sticky top-0 z-10 flex h-12 items-center justify-between bg-white px-4 shadow-sm">
      <button @click="goBack" class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100">
        <ArrowLeft class="h-5 w-5 text-gray-600" />
      </button>
      <h1 class="text-base font-medium text-gray-900">系统消息</h1>
      <button
        v-if="friendStore.systemMessageUnread > 0"
        @click="markAllAsRead"
        class="text-sm text-blue-500"
      >
        全部已读
      </button>
      <div v-else class="w-14"></div>
    </header>

    <!-- 过滤标签 -->
    <div class="flex gap-2 overflow-x-auto bg-white px-4 py-2 scrollbar-hide">
      <button
        v-for="option in filterOptions"
        :key="option.value ?? 'all'"
        @click="changeFilter(option.value)"
        :class="[
          'flex-shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors',
          activeFilter === option.value
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        ]"
      >
        {{ option.label }}
      </button>
    </div>

    <!-- 内容 -->
    <div class="flex-1 overflow-y-auto">
      <!-- 加载中 -->
      <div v-if="friendStore.isLoading && friendStore.systemMessages.length === 0" class="flex items-center justify-center py-8">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="friendStore.systemMessages.length === 0" class="flex flex-col items-center justify-center py-16">
        <Bell class="h-16 w-16 text-gray-300" />
        <p class="mt-4 text-sm text-gray-400">暂无系统消息</p>
      </div>

      <!-- 消息列表 -->
      <div v-else class="divide-y divide-gray-100 bg-white">
        <div
          v-for="message in friendStore.systemMessages"
          :key="message.id"
          @click="handleMessageClick(message)"
          :class="[
            'flex cursor-pointer items-start px-4 py-3 transition-colors',
            message.is_read === 0 ? 'bg-blue-50/50' : ''
          ]"
        >
          <!-- 图标 -->
          <div
            :class="[
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
              getIconConfig(message.type).bgColor
            ]"
          >
            <component
              :is="getIconConfig(message.type).icon"
              :class="['h-5 w-5', getIconConfig(message.type).color]"
            />
          </div>

          <!-- 内容 -->
          <div class="ml-3 flex-1 overflow-hidden">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span :class="['text-sm font-medium', message.is_read === 0 ? 'text-gray-900' : 'text-gray-700']">
                  {{ message.title }}
                </span>
                <span class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                  {{ message.type_label }}
                </span>
              </div>
              <span class="ml-2 flex-shrink-0 text-xs text-gray-400">
                {{ formatTime(message.created_at) }}
              </span>
            </div>
            <p :class="['mt-1 line-clamp-2 text-xs', message.is_read === 0 ? 'text-gray-600' : 'text-gray-500']">
              {{ message.content }}
            </p>
          </div>

          <!-- 未读标识 -->
          <div class="ml-2 flex-shrink-0">
            <Circle v-if="message.is_read === 0" class="h-2 w-2 fill-blue-500 text-blue-500" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
