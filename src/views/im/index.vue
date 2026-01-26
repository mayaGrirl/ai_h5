<script setup lang="ts">
/**
 * IM 消息页面 - 包含通讯录和聊天两个 Tab
 */
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useIMStore } from '@/stores/im'
import { useFriendStore } from '@/stores/friend'
import { ArrowLeft, MessageCircle, Search, Users, UserPlus, Bell, Headphones, Home, Gamepad2, Trophy, ShoppingBag, User, UsersRound } from 'lucide-vue-next'
import type { Conversation } from '@/types/im.type'
import type { Contact } from '@/types/friend.type'
import { formatConversationTime } from '@/utils/time'

const router = useRouter()
const imStore = useIMStore()
const friendStore = useFriendStore()

// 当前 Tab: 'contacts' | 'chat'
const activeTab = ref<'contacts' | 'chat'>('contacts')
const searchKeyword = ref('')
const showSearchPanel = ref(false)
const searchInput = ref('')

// 长按删除相关状态
const showDeleteConfirm = ref(false)
const deletingConversation = ref<Conversation | null>(null)
const isDeleting = ref(false)
let longPressTimer: ReturnType<typeof setTimeout> | null = null

// 最近聊天列表（最多30条）
const recentConversations = computed(() => {
  return imStore.sortedConversations.slice(0, 30)
})

// 过滤后的会话列表
const filteredConversations = computed(() => {
  const list = recentConversations.value
  if (!searchKeyword.value) {
    return list
  }
  const keyword = searchKeyword.value.toLowerCase()
  return list.filter(conv =>
    conv.name?.toLowerCase().includes(keyword) ||
    conv.target?.nickname?.toLowerCase().includes(keyword)
  )
})

// 过滤后的联系人列表
const filteredContacts = computed(() => {
  const all = friendStore.allContacts
  if (!searchKeyword.value) {
    return all
  }
  const keyword = searchKeyword.value.toLowerCase()
  return all.filter(contact => contact.name.toLowerCase().includes(keyword))
})

// 格式化时间
function formatTime(dateStr: string): string {
  return formatConversationTime(dateStr)
}

// 获取最后一条消息预览
function getLastMessagePreview(conv: Conversation): string {
  if (!conv.last_message) return ''

  if (conv.last_message.is_recalled) {
    return '[消息已撤回]'
  }

  switch (conv.last_message.type) {
    case 1: // TEXT
      return conv.last_message.content || ''
    case 2: // IMAGE
      return '[图片]'
    case 3: // VOICE
      return '[语音]'
    case 4: // VIDEO
      return '[视频]'
    case 5: // FILE
      return '[文件]'
    case 6: // LOCATION
      return '[位置]'
    case 7: // CONTACT
      return '[名片]'
    case 8: // PACK (红包)
      return '[红包]'
    default:
      return conv.last_message.content || ''
  }
}

// 获取会话显示名称（优先使用好友备注）
function getConversationDisplayName(conv: Conversation): string {
  // 如果有 target（私聊），检查是否是好友并获取备注
  if (conv.target?.id) {
    const friend = friendStore.contacts.friends.find(f => f.id === conv.target?.id)
    if (friend) {
      // 使用好友的显示名称（包含备注）
      return friend.name || friend.nickname || conv.name || conv.target.nickname || '未知'
    }
  }
  // 非好友或群聊，使用会话名称
  return conv.name || conv.target?.nickname || '未知'
}

// 进入会话
function enterConversation(conv: Conversation) {
  router.push(`/im/chat/${conv.id}`)
}

// 长按开始
function handleTouchStart(conv: Conversation) {
  longPressTimer = setTimeout(() => {
    // 长按触发 - 显示删除确认
    deletingConversation.value = conv
    showDeleteConfirm.value = true
  }, 500) // 500ms 触发长按
}

// 触摸结束/取消
function handleTouchEnd() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

// 关闭删除确认弹窗
function closeDeleteConfirm() {
  showDeleteConfirm.value = false
  deletingConversation.value = null
}

// 确认删除聊天
async function confirmDeleteChat() {
  if (!deletingConversation.value) return

  isDeleting.value = true
  try {
    const success = await imStore.deleteChat(deletingConversation.value.id)
    if (success) {
      closeDeleteConfirm()
    }
  } finally {
    isDeleting.value = false
  }
}

// 点击联系人
function handleContactClick(contact: Contact) {
  if (contact.type === 'system') {
    if (contact.code === 'customer_service') {
      // 跳转到客服会话
      router.push('/im/customer-service')
    } else if (contact.code === 'system_notice') {
      // 跳转到系统消息
      router.push('/im/system-messages')
    }
  } else {
    // 好友 - 跳转到聊天（需要获取或创建会话）
    router.push(`/im/friend/${contact.id}`)
  }
}

// 搜索用户（带防抖）
let searchTimer: ReturnType<typeof setTimeout> | null = null
async function handleSearch() {
  // 清除之前的定时器
  if (searchTimer) {
    clearTimeout(searchTimer)
  }

  const keyword = searchInput.value.trim()

  // 少于2个字符时清空结果
  if (keyword.length < 2) {
    friendStore.searchResults = []
    return
  }

  // 防抖 300ms
  searchTimer = setTimeout(async () => {
    console.log('[Search] 搜索关键词:', keyword)
    await friendStore.searchUsers(keyword)
  }, 300)
}

// 发送好友申请
async function handleAddFriend(userId: number) {
  const success = await friendStore.sendFriendRequest(userId)
  if (success) {
    // 显示成功提示
  }
}

// 打开添加好友面板
function openSearchPanel() {
  showSearchPanel.value = true
  searchInput.value = ''
  friendStore.searchResults = []
}

// 关闭搜索面板
function closeSearchPanel() {
  showSearchPanel.value = false
}

// 返回
function goBack() {
  router.back()
}

// 初始化
onMounted(async () => {
  await Promise.all([
    imStore.init(),
    friendStore.init(),
  ])
})
</script>

<template>
  <div class="flex h-full flex-col bg-gray-50 pb-14">
    <!-- 头部 -->
    <header class="sticky top-0 z-10 flex h-12 items-center justify-between bg-white px-4 shadow-sm">
      <button @click="goBack" class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100">
        <ArrowLeft class="h-5 w-5 text-gray-600" />
      </button>
      <h1 class="text-base font-medium text-gray-900">消息</h1>
      <button @click="openSearchPanel" class="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100">
        <UserPlus class="h-5 w-5 text-gray-600" />
      </button>
    </header>

    <!-- Tab 切换 -->
    <div class="flex border-b border-gray-200 bg-white">
      <button
        @click="activeTab = 'contacts'"
        :class="[
          'flex-1 py-3 text-sm font-medium transition-colors relative',
          activeTab === 'contacts'
            ? 'text-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        ]"
      >
        <div class="flex items-center justify-center gap-1">
          <Users class="h-4 w-4" />
          <span>通讯录</span>
          <span
            v-if="friendStore.pendingRequestCount > 0"
            class="ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white"
          >
            {{ friendStore.pendingRequestCount > 99 ? '99+' : friendStore.pendingRequestCount }}
          </span>
        </div>
        <div
          v-if="activeTab === 'contacts'"
          class="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-blue-600"
        ></div>
      </button>
      <button
        @click="activeTab = 'chat'"
        :class="[
          'flex-1 py-3 text-sm font-medium transition-colors relative',
          activeTab === 'chat'
            ? 'text-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        ]"
      >
        <div class="flex items-center justify-center gap-1">
          <MessageCircle class="h-4 w-4" />
          <span>聊天</span>
          <span
            v-if="imStore.totalUnread > 0"
            class="ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white"
          >
            {{ imStore.totalUnread > 99 ? '99+' : imStore.totalUnread }}
          </span>
        </div>
        <div
          v-if="activeTab === 'chat'"
          class="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-blue-600"
        ></div>
      </button>
    </div>

    <!-- 搜索框 -->
    <div class="bg-white px-4 py-2">
      <div class="flex items-center rounded-full bg-gray-100 px-3 py-2">
        <Search class="h-4 w-4 text-gray-400" />
        <input
          v-model="searchKeyword"
          type="text"
          :placeholder="activeTab === 'contacts' ? '搜索联系人' : '搜索会话'"
          class="ml-2 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
      </div>
    </div>

    <!-- 连接状态 -->
    <div v-if="!imStore.isConnected" class="bg-yellow-50 px-4 py-2 text-center text-xs text-yellow-600">
      <span v-if="imStore.connectionState === 'connecting'">连接中...</span>
      <span v-else-if="imStore.connectionState === 'reconnecting'">重新连接中...</span>
      <span v-else>未连接</span>
    </div>

    <!-- 通讯录 Tab 内容 -->
    <div v-if="activeTab === 'contacts'" class="flex-1 overflow-y-auto">
      <!-- 加载中 -->
      <div v-if="friendStore.isLoading && filteredContacts.length === 0" class="flex items-center justify-center py-8">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>

      <!-- 好友申请入口 -->
      <div
        v-if="friendStore.pendingRequestCount > 0"
        @click="router.push('/im/friend-requests')"
        class="mx-4 mt-3 flex cursor-pointer items-center justify-between rounded-lg bg-blue-50 px-4 py-3"
      >
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500">
            <UserPlus class="h-5 w-5 text-white" />
          </div>
          <span class="text-sm font-medium text-gray-900">新的好友申请</span>
        </div>
        <span class="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs text-white">
          {{ friendStore.pendingRequestCount }}
        </span>
      </div>

      <!-- 群聊入口 -->
      <div class="mx-4 mt-3 flex gap-3">
        <div
          @click="router.push('/im/group/create')"
          class="flex flex-1 cursor-pointer items-center gap-3 rounded-lg bg-green-50 px-4 py-3"
        >
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
            <UsersRound class="h-5 w-5 text-white" />
          </div>
          <span class="text-sm font-medium text-gray-900">创建群聊</span>
        </div>
        <div
          @click="router.push('/im/group/search')"
          class="flex flex-1 cursor-pointer items-center gap-3 rounded-lg bg-purple-50 px-4 py-3"
        >
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500">
            <Search class="h-5 w-5 text-white" />
          </div>
          <span class="text-sm font-medium text-gray-900">搜索群聊</span>
        </div>
      </div>

      <!-- 系统联系人分组 -->
      <div v-if="friendStore.contacts.system.length > 0" class="mt-3">
        <div class="px-4 py-2 text-xs font-medium text-gray-500">系统</div>
        <div class="divide-y divide-gray-100 bg-white">
          <div
            v-for="contact in friendStore.contacts.system"
            :key="contact.id"
            @click="handleContactClick(contact)"
            class="flex cursor-pointer items-center px-4 py-3 transition-colors active:bg-gray-50"
          >
            <div class="relative h-12 w-12 flex-shrink-0">
              <!-- 底层：默认图标 -->
              <div
                :class="[
                  'absolute inset-0 flex items-center justify-center rounded-full',
                  contact.code === 'customer_service' ? 'bg-green-500' : 'bg-orange-500'
                ]"
              >
                <Headphones v-if="contact.code === 'customer_service'" class="h-6 w-6 text-white" />
                <Bell v-else class="h-6 w-6 text-white" />
              </div>
              <!-- 顶层：头像图片（如果有且加载成功则覆盖图标） -->
              <img
                v-if="contact.avatar"
                :src="contact.avatar"
                :alt="contact.name"
                class="absolute inset-0 h-12 w-12 rounded-full object-cover"
                @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'"
              />
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium text-gray-900">{{ contact.name }}</p>
              <p class="mt-0.5 text-xs text-gray-500">{{ contact.description }}</p>
            </div>
            <span
              v-if="contact.code === 'system_notice' && friendStore.systemMessageUnread > 0"
              class="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs text-white"
            >
              {{ friendStore.systemMessageUnread > 99 ? '99+' : friendStore.systemMessageUnread }}
            </span>
          </div>
        </div>
      </div>

      <!-- 好友列表分组 -->
      <div class="mt-3">
        <div class="px-4 py-2 text-xs font-medium text-gray-500">
          好友 ({{ friendStore.contacts.friends.length }})
        </div>
        <div v-if="friendStore.contacts.friends.length === 0" class="flex flex-col items-center justify-center py-12">
          <Users class="h-12 w-12 text-gray-300" />
          <p class="mt-3 text-sm text-gray-400">暂无好友</p>
          <button
            @click="openSearchPanel"
            class="mt-4 rounded-full bg-blue-500 px-6 py-2 text-sm text-white hover:bg-blue-600"
          >
            添加好友
          </button>
        </div>
        <div v-else class="divide-y divide-gray-100 bg-white">
          <div
            v-for="contact in friendStore.contacts.friends"
            :key="contact.id"
            @click="handleContactClick(contact)"
            class="flex cursor-pointer items-center px-4 py-3 transition-colors active:bg-gray-50"
          >
            <div class="relative flex-shrink-0">
              <img
                :src="contact.avatar || '/default-avatar.png'"
                :alt="contact.name"
                class="h-12 w-12 rounded-full object-cover"
                @error="(e: Event) => (e.target as HTMLImageElement).src = '/default-avatar.png'"
              />
              <div v-if="contact.is_top" class="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-orange-400"></div>
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium text-gray-900">{{ contact.name }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 聊天 Tab 内容 -->
    <div v-else class="flex-1 overflow-y-auto">
      <!-- 加载中 -->
      <div v-if="imStore.isLoading && filteredConversations.length === 0" class="flex items-center justify-center py-8">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="filteredConversations.length === 0" class="flex flex-col items-center justify-center py-16">
        <MessageCircle class="h-16 w-16 text-gray-300" />
        <p class="mt-4 text-sm text-gray-400">暂无聊天记录</p>
        <p class="mt-1 text-xs text-gray-400">从通讯录开始聊天吧</p>
        <button
          @click="activeTab = 'contacts'"
          class="mt-4 rounded-full bg-blue-500 px-6 py-2 text-sm text-white"
        >
          去通讯录
        </button>
      </div>

      <!-- 会话列表 -->
      <div v-else class="divide-y divide-gray-100 bg-white">
        <div
          v-for="conv in filteredConversations"
          :key="conv.id"
          @click="enterConversation(conv)"
          @touchstart="handleTouchStart(conv)"
          @touchend="handleTouchEnd"
          @touchcancel="handleTouchEnd"
          @contextmenu.prevent="deletingConversation = conv; showDeleteConfirm = true"
          class="flex cursor-pointer items-center px-4 py-3 transition-colors active:bg-gray-50"
        >
          <!-- 头像 -->
          <div class="relative h-12 w-12 flex-shrink-0">
            <!-- 系统联系人（如在线客服）使用与通讯录一致的显示方式 -->
            <template v-if="conv.target?.is_system_contact">
              <!-- 底层：默认图标 -->
              <div class="absolute inset-0 flex items-center justify-center rounded-full bg-green-500">
                <Headphones class="h-6 w-6 text-white" />
              </div>
              <!-- 顶层：头像图片（如果有且加载成功则覆盖图标） -->
              <img
                v-if="conv.avatar"
                :src="conv.avatar"
                :alt="conv.name"
                class="absolute inset-0 h-12 w-12 rounded-full object-cover"
                @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'"
              />
            </template>
            <!-- 普通会话头像 -->
            <template v-else>
              <img
                :src="conv.avatar || conv.target?.avatar || '/default-avatar.png'"
                :alt="conv.name"
                class="h-12 w-12 rounded-full object-cover"
                @error="(e: Event) => (e.target as HTMLImageElement).src = '/default-avatar.png'"
              />
            </template>
            <!-- 置顶标识 -->
            <div v-if="conv.is_pinned" class="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-orange-400"></div>
          </div>

          <!-- 内容 -->
          <div class="ml-3 flex-1 overflow-hidden">
            <div class="flex items-center justify-between">
              <span class="truncate text-sm font-medium text-gray-900">{{ getConversationDisplayName(conv) }}</span>
              <span class="ml-2 flex-shrink-0 text-xs text-gray-400">
                {{ conv.last_message ? formatTime(conv.last_message.created_at) : '' }}
              </span>
            </div>
            <div class="mt-1 flex items-center justify-between">
              <p class="truncate text-xs text-gray-500">{{ getLastMessagePreview(conv) }}</p>
              <!-- 未读数 -->
              <span
                v-if="conv.unread_count > 0"
                class="ml-2 flex h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white"
              >
                {{ conv.unread_count > 99 ? '99+' : conv.unread_count }}
              </span>
              <!-- 免打扰标识 -->
              <span v-else-if="conv.notify_mode === 0" class="ml-2 text-gray-400">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除聊天确认弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showDeleteConfirm"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-8"
          @click.self="closeDeleteConfirm"
        >
          <div class="w-full max-w-sm overflow-hidden rounded-xl bg-white">
            <!-- 标题 -->
            <div class="border-b border-gray-100 px-4 py-3">
              <h3 class="text-center text-base font-medium text-gray-900">删除聊天</h3>
            </div>

            <!-- 提示内容 -->
            <div class="p-4">
              <p class="text-center text-sm text-gray-600">
                确定要删除与「{{ deletingConversation ? getConversationDisplayName(deletingConversation) : '' }}」的聊天吗？<br/>
                删除后将从聊天列表移除并清除本地聊天记录。
              </p>
            </div>

            <!-- 按钮 -->
            <div class="flex border-t border-gray-100">
              <button
                @click="closeDeleteConfirm"
                class="flex-1 py-3 text-sm text-gray-500 active:bg-gray-50"
              >
                取消
              </button>
              <button
                @click="confirmDeleteChat"
                :disabled="isDeleting"
                class="flex-1 border-l border-gray-100 py-3 text-sm font-medium text-red-500 active:bg-gray-50 disabled:opacity-50"
              >
                {{ isDeleting ? '删除中...' : '删除' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 添加好友搜索面板 -->
    <Teleport to="body">
      <Transition name="slide-up">
        <div v-if="showSearchPanel" class="fixed inset-0 z-50 flex flex-col bg-white">
          <!-- 头部 -->
          <header class="flex h-12 items-center justify-between border-b border-gray-200 px-4">
            <button @click="closeSearchPanel" class="text-sm text-gray-600">取消</button>
            <h1 class="text-base font-medium text-gray-900">添加好友</h1>
            <div class="w-10"></div>
          </header>

          <!-- 搜索框 -->
          <div class="border-b border-gray-200 px-4 py-3">
            <div class="flex items-center rounded-lg bg-gray-100 px-3 py-2">
              <Search class="h-4 w-4 text-gray-400" />
              <input
                v-model="searchInput"
                @input="handleSearch"
                type="text"
                placeholder="输入用户名或手机号搜索"
                class="ml-2 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                autofocus
              />
            </div>
            <p class="mt-2 text-xs text-gray-400">请输入至少2个字符进行搜索</p>
          </div>

          <!-- 搜索结果 -->
          <div class="flex-1 overflow-y-auto">
            <!-- 加载中 -->
            <div v-if="friendStore.isLoading" class="flex items-center justify-center py-8">
              <div class="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            </div>

            <!-- 空状态 -->
            <div v-else-if="searchInput.length >= 2 && friendStore.searchResults.length === 0" class="flex flex-col items-center justify-center py-12">
              <Search class="h-12 w-12 text-gray-300" />
              <p class="mt-3 text-sm text-gray-400">未找到相关用户</p>
            </div>

            <!-- 搜索结果列表 -->
            <div v-else-if="friendStore.searchResults.length > 0" class="divide-y divide-gray-100">
              <div
                v-for="user in friendStore.searchResults"
                :key="user.id"
                class="flex items-center px-4 py-3"
              >
                <img
                  :src="user.avatar || '/default-avatar.png'"
                  :alt="user.nickname"
                  class="h-12 w-12 rounded-full object-cover"
                  @error="(e: Event) => (e.target as HTMLImageElement).src = '/default-avatar.png'"
                />
                <div class="ml-3 flex-1">
                  <p class="text-sm font-medium text-gray-900">{{ user.nickname }}</p>
                  <p class="text-xs text-gray-500">{{ user.mobile || user.user }}</p>
                </div>
                <button
                  v-if="user.is_friend"
                  class="rounded-full bg-gray-100 px-4 py-1.5 text-xs text-gray-500"
                  disabled
                >
                  已添加
                </button>
                <button
                  v-else
                  @click="handleAddFriend(user.id)"
                  class="rounded-full bg-blue-500 px-4 py-1.5 text-xs text-white hover:bg-blue-600"
                >
                  添加
                </button>
              </div>
            </div>

            <!-- 初始提示 -->
            <div v-else class="flex flex-col items-center justify-center py-12">
              <UserPlus class="h-12 w-12 text-gray-300" />
              <p class="mt-3 text-sm text-gray-400">搜索用户添加好友</p>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 底部导航栏 -->
    <nav class="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg shadow-[0_-2px_20px_rgba(0,0,0,0.08)]">
      <ul class="flex h-14 items-center justify-around">
        <li class="flex-1">
          <button
            @click="router.push('/')"
            class="flex w-full flex-col items-center justify-center py-1"
          >
            <Home class="h-5 w-5 text-gray-400" />
            <span class="text-[10px] mt-1 text-gray-400">首页</span>
          </button>
        </li>
        <li class="flex-1">
          <button
            @click="router.push('/shop')"
            class="flex w-full flex-col items-center justify-center py-1"
          >
            <ShoppingBag class="h-5 w-5 text-gray-400" />
            <span class="text-[10px] mt-1 text-gray-400">商城</span>
          </button>
        </li>
        <li class="flex-1">
          <button
            @click="router.push('/games')"
            class="flex w-full flex-col items-center justify-center py-1"
          >
            <Gamepad2 class="h-5 w-5 text-gray-400" />
            <span class="text-[10px] mt-1 text-gray-400">游戏</span>
          </button>
        </li>
        <li class="flex-1">
          <button
            @click="router.push('/ranking')"
            class="flex w-full flex-col items-center justify-center py-1"
          >
            <Trophy class="h-5 w-5 text-gray-400" />
            <span class="text-[10px] mt-1 text-gray-400">排行</span>
          </button>
        </li>
        <li class="flex-1">
          <button
            @click="router.push('/mine')"
            class="flex w-full flex-col items-center justify-center py-1"
          >
            <User class="h-5 w-5 text-gray-400" />
            <span class="text-[10px] mt-1 text-gray-400">我的</span>
          </button>
        </li>
      </ul>
    </nav>

  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
