/**
 * IM 即时通讯状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as imApi from '@/api/im'
import { useIMWebSocket, resetIMConnection, setupBeforeUnloadListener } from '@/composables/useIMWebSocket'
import { useAuthStore } from '@/stores/auth'
import { API_SUCCESS_CODE } from '@/types/http.type'
import type {
  Conversation,
  Message,
  IMNotification,
  SendMessageParams,
  CreateConversationParams,
  WSMessageSentEvent,
  WSMessageRecalledEvent,
} from '@/types/im.type'
// GroupPack 和 PackRecord 类型在红包功能中使用

export const useIMStore = defineStore('im', () => {
  // ==================== 状态 ====================
  const conversations = ref<Conversation[]>([])
  const currentConversation = ref<Conversation | null>(null)
  const messages = ref<Map<number, Message[]>>(new Map())
  const notifications = ref<IMNotification[]>([])

  const totalUnread = ref(0)
  const notificationUnread = ref(0)

  const isLoading = ref(false)
  const hasMoreMessages = ref(true)
  const isInitialized = ref(false)

  // WebSocket
  const ws = useIMWebSocket()

  // 本地存储 key
  const STORAGE_KEY_PREFIX = 'im_messages_'

  // ==================== 本地存储管理 ====================

  /**
   * 从本地存储加载消息
   */
  function loadMessagesFromStorage(conversationId: number): Message[] {
    try {
      const key = STORAGE_KEY_PREFIX + conversationId
      const stored = localStorage.getItem(key)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('[IM] Failed to load messages from storage:', error)
    }
    return []
  }

  /**
   * 保存消息到本地存储
   */
  function saveMessagesToStorage(conversationId: number): void {
    try {
      const key = STORAGE_KEY_PREFIX + conversationId
      const msgs = messages.value.get(conversationId) || []
      // 只保留最近 500 条消息
      const toSave = msgs.slice(-500)
      localStorage.setItem(key, JSON.stringify(toSave))
    } catch (error) {
      console.error('[IM] Failed to save messages to storage:', error)
    }
  }

  /**
   * 清除会话的本地消息
   */
  function clearMessagesFromStorage(conversationId: number): void {
    try {
      const key = STORAGE_KEY_PREFIX + conversationId
      localStorage.removeItem(key)
      messages.value.delete(conversationId)
    } catch (error) {
      console.error('[IM] Failed to clear messages from storage:', error)
    }
  }

  // ==================== 计算属性 ====================
  const sortedConversations = computed(() => {
    return [...conversations.value].sort((a, b) => {
      // 置顶优先
      if (a.is_pinned !== b.is_pinned) {
        return a.is_pinned ? -1 : 1
      }
      // 按更新时间排序
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  })

  const currentMessages = computed(() => {
    if (!currentConversation.value) return []
    return messages.value.get(currentConversation.value.id) || []
  })

  // ==================== 初始化 ====================

  // 标记会话是否已加载
  const conversationsLoaded = ref(false)

  /**
   * 初始化 IM 模块
   */
  async function init() {
    console.log('[IM] Initializing IM module...')

    // 防止重复初始化事件监听器
    if (!isInitialized.value) {
      // 设置 WebSocket 事件监听（只设置一次）
      setupWebSocketListeners()
      // 设置页面可见性监听（处理用户切换标签页或返回应用）
      setupVisibilityListener()
      // 设置页面关闭监听（通知服务器断开连接）
      setupBeforeUnloadListener()
      isInitialized.value = true
    }

    // 先加载会话列表（确保在获取离线消息前完成）
    console.log('[IM] Loading conversations...')
    await loadConversations()
    conversationsLoaded.value = true
    console.log('[IM] Conversations loaded, count:', conversations.value.length)

    // 连接 WebSocket（如果已连接会直接返回）
    console.log('[IM] Connecting WebSocket...')
    await ws.connect()

    // 主动获取离线消息（不依赖 WebSocket connected 事件）
    console.log('[IM] Fetching pending messages on init...')
    await fetchPendingMessages()

    // 获取未读统计
    await refreshUnreadStats()
    console.log('[IM] IM module initialized')
  }

  // 防抖：上次刷新时间戳和最小间隔（毫秒）
  let lastVisibilityRefreshTime = 0
  let lastOnlineRefreshTime = 0
  const MIN_REFRESH_INTERVAL = 5000 // 最少间隔5秒
  let visibilityDebounceTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * 设置页面可见性监听
   * 当用户从后台返回时，重新连接并获取离线消息
   */
  function setupVisibilityListener() {
    if (typeof document === 'undefined') return

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // 清除之前的防抖定时器
        if (visibilityDebounceTimer) {
          clearTimeout(visibilityDebounceTimer)
        }

        // 防抖：延迟300ms执行，避免快速切换标签页触发多次
        visibilityDebounceTimer = setTimeout(async () => {
          const now = Date.now()
          // 检查距离上次刷新的时间间隔
          if (now - lastVisibilityRefreshTime < MIN_REFRESH_INTERVAL) {
            console.log('[IM] Page became visible, but skipping refresh (too soon)')
            return
          }
          lastVisibilityRefreshTime = now

          console.log('[IM] Page became visible, checking connection...')

          // 检查 WebSocket 连接状态
          if (!ws.isConnected.value) {
            console.log('[IM] Reconnecting WebSocket...')
            await ws.connect()
          }

          // 获取离线消息（可能在后台期间收到了新消息）
          if (conversationsLoaded.value) {
            console.log('[IM] Fetching pending messages after visibility change...')
            await fetchPendingMessages()
            await refreshUnreadStats()
          }
        }, 300)
      }
    })

    // 监听网络恢复
    window.addEventListener('online', async () => {
      const now = Date.now()
      // 检查距离上次刷新的时间间隔
      if (now - lastOnlineRefreshTime < MIN_REFRESH_INTERVAL) {
        console.log('[IM] Network online, but skipping refresh (too soon)')
        return
      }
      lastOnlineRefreshTime = now

      console.log('[IM] Network online, reconnecting...')
      if (!ws.isConnected.value) {
        await ws.connect()
      }
      if (conversationsLoaded.value) {
        await fetchPendingMessages()
        await refreshUnreadStats()
      }
    })
  }

  // 中奖通知列表（用于在页面显示）
  const lotteryWinNotifications = ref<Array<{
    id: number
    game_name: string
    expect_no: string
    bet_gold: number
    win_gold: number
    timestamp: string
  }>>([])

  // 群红包相关状态
  const currentGrabPack = ref<{ packId: number; conversationId: number } | null>(null)
  const showPackGrabDialog = ref(false)
  const showPackDetailDialog = ref(false)
  const currentPackDetail = ref<{ packId: number; conversationId: number } | null>(null)

  /**
   * 设置 WebSocket 事件监听
   */
  function setupWebSocketListeners() {
    // 新消息
    ws.on('message.sent', (data: unknown) => {
      const msgData = data as WSMessageSentEvent
      handleNewMessage(msgData)
    })

    // 消息撤回
    ws.on('message.recalled', (data: unknown) => {
      const recallData = data as WSMessageRecalledEvent
      handleMessageRecalled(recallData)
    })

    // 中奖通知
    ws.on('lottery.win', (data: unknown) => {
      const winData = data as {
        member_id: number
        game_name: string
        expect_no: string
        bet_gold: number
        win_gold: number
        bet_no: string
        action_no: string
        timestamp: string
      }
      console.log('[IM] Lottery win notification received:', winData)
      handleLotteryWin(winData)
    })

    // 系统通知
    ws.on('system.notification', (data: unknown) => {
      console.log('[IM] System notification received:', data)
      // 刷新通知数量
      refreshUnreadStats()
    })

    // 群红包发送事件 - 需要作为消息显示在会话中
    ws.on('group.pack.sent', (data: unknown) => {
      console.log('[IM] Group pack sent:', data)
      // 红包消息需要像普通消息一样添加到会话
      const packData = data as WSMessageSentEvent
      handleNewMessage(packData)
    })

    // 群红包被抢事件
    ws.on('group.pack.grabbed', (data: unknown) => {
      const grabData = data as {
        pack_id: number
        conversation_id: number
        grabber_id: number
        grabber_nickname: string
        amount: number
        is_best: boolean
        remaining_count: number
        status: number
      }
      console.log('[IM] Group pack grabbed:', grabData)
      handleGroupPackGrabbed(grabData)
    })

    // 连接成功后订阅私有频道并获取离线消息
    ws.on('connected', async () => {
      await ws.subscribePrivate()
      await ws.subscribeSystem()
      // 等待会话列表加载完成后再获取离线消息
      if (conversationsLoaded.value) {
        await fetchPendingMessages()
      }
    })
  }

  // 标记是否正在获取离线消息（防止并发重复请求）
  const isFetchingPending = ref(false)

  /**
   * 获取并处理离线消息
   */
  async function fetchPendingMessages() {
    // 防止并发请求
    if (isFetchingPending.value) {
      console.log('[IM] Already fetching pending messages, skipping...')
      return
    }

    isFetchingPending.value = true
    try {
      console.log('[IM] Fetching pending messages...')
      const res = await imApi.getPendingMessages()

      console.log('[IM] Pending messages API response:', res)

      if (res.code !== API_SUCCESS_CODE) {
        console.error('[IM] Failed to fetch pending messages, code:', res.code, 'message:', res.message)
        return
      }

      if (!res.data || !res.data.messages || res.data.messages.length === 0) {
        console.log('[IM] No pending messages')
        return
      }

      console.log('[IM] Received pending messages:', res.data.messages.length)

      // 处理每条离线消息
      let processedCount = 0
      for (const msgData of res.data.messages) {
        console.log('[IM] Processing pending message:', {
          id: msgData.id,
          conversation_id: msgData.conversation_id,
          sender_id: msgData.sender_id,
          type: msgData.type,
        })
        handleNewMessage(msgData as WSMessageSentEvent)
        processedCount++
      }

      console.log('[IM] Finished processing pending messages, count:', processedCount)

      // 刷新未读统计
      await refreshUnreadStats()
    } catch (error) {
      console.error('[IM] Failed to fetch pending messages:', error)
    } finally {
      isFetchingPending.value = false
    }
  }

  /**
   * 清理并退出
   */
  function cleanup() {
    resetIMConnection()
    conversations.value = []
    currentConversation.value = null
    messages.value.clear()
    notifications.value = []
    totalUnread.value = 0
    notificationUnread.value = 0
    isInitialized.value = false
  }

  // ==================== 会话管理 ====================

  /**
   * 加载会话列表
   * 注意：保留现有的 unread_count 如果比后端返回的更高
   * 因为后端的 unread_count 基于 PENDING 状态，而消息可能已经被获取但未读
   */
  async function loadConversations(page = 1) {
    try {
      isLoading.value = true
      const res = await imApi.getConversations(page)
      if (res.code === API_SUCCESS_CODE && res.data) {
        if (page === 1) {
          // 保存现有的未读数和本地消息状态
          const existingData = new Map(
            conversations.value.map(c => [c.id, {
              unread_count: c.unread_count || 0,
              last_message: c.last_message
            }])
          )

          // 合并数据，保留较高的 unread_count
          conversations.value = res.data.list.map(conv => {
            const existing = existingData.get(conv.id)
            if (existing) {
              return {
                ...conv,
                // 保留较高的未读数（前端可能已处理了离线消息）
                unread_count: Math.max(existing.unread_count, conv.unread_count || 0),
                // 保留本地的 last_message 如果后端没有返回
                last_message: conv.last_message || existing.last_message
              }
            }
            return conv
          })
        } else {
          conversations.value.push(...res.data.list)
        }
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 创建或获取私聊会话
   */
  async function getOrCreatePrivateConversation(targetId: number): Promise<number | null> {
    console.log('[IM Store] getOrCreatePrivateConversation called with targetId:', targetId)
    try {
      const params: CreateConversationParams = {
        type: 1,
        target_id: targetId,
      }
      console.log('[IM Store] Creating conversation with params:', params)
      const res = await imApi.createConversation(params)
      console.log('[IM Store] Create conversation response:', res)

      if (res.code === API_SUCCESS_CODE && res.data) {
        // 刷新会话列表
        await loadConversations()
        console.log('[IM Store] Conversation created, ID:', res.data.conversation_id)
        return res.data.conversation_id
      } else {
        console.error('[IM Store] Create conversation failed:', res.message)
      }
    } catch (error) {
      console.error('[IM Store] Failed to create conversation:', error)
    }
    return null
  }

  /**
   * 创建或获取与系统联系人（客服）的会话
   */
  async function getOrCreateSystemContactConversation(contactCode = 'customer_service'): Promise<{
    conversationId: number | null
    systemContact: {
      id: number
      code: string
      name: string
      avatar: string
      description: string
      type: number
      member_id: number
      member_nickname?: string
      member_avatar?: string
    } | null
  }> {
    console.log('[IM Store] getOrCreateSystemContactConversation called with contactCode:', contactCode)
    try {
      const res = await imApi.createSystemContactConversation(contactCode)
      console.log('[IM Store] Create system contact conversation response:', res)

      if (res.code === API_SUCCESS_CODE && res.data) {
        // 刷新会话列表
        await loadConversations()
        console.log('[IM Store] System contact conversation created, ID:', res.data.conversation_id)
        return {
          conversationId: res.data.conversation_id,
          systemContact: res.data.system_contact,
        }
      } else {
        console.error('[IM Store] Create system contact conversation failed:', res.message)
      }
    } catch (error) {
      console.error('[IM Store] Failed to create system contact conversation:', error)
    }
    return { conversationId: null, systemContact: null }
  }

  /**
   * 设置当前会话
   */
  async function setCurrentConversation(conversationId: number) {
    // 查找会话
    let conv = conversations.value.find(c => c.id === conversationId)

    // 如果不在列表中，获取详情
    if (!conv) {
      try {
        const res = await imApi.getConversationDetail(conversationId)
        if (res.code === API_SUCCESS_CODE && res.data) {
          const newConv: Conversation = res.data
          conversations.value.unshift(newConv)
          conv = newConv
        }
      } catch (error) {
        console.error('Failed to get conversation detail:', error)
        return
      }
    }

    if (conv) {
      currentConversation.value = conv

      // 加载消息
      if (!messages.value.has(conversationId)) {
        await loadMessages(conversationId)
      }

      // 标记已读
      if (conv.unread_count > 0) {
        markConversationRead(conversationId)
      }
    }
  }

  /**
   * 清除当前会话
   */
  function clearCurrentConversation() {
    currentConversation.value = null
  }

  /**
   * 订阅会话频道（用于接收新消息）
   */
  async function subscribeToConversation(conversationId: number) {
    const channel = `presence-im.conversation.${conversationId}`
    console.log('[IM Store] Subscribing to conversation channel:', channel)
    await ws.subscribeChannel(channel)
  }

  /**
   * 取消订阅会话频道
   */
  function unsubscribeFromConversation(conversationId: number) {
    const channel = `presence-im.conversation.${conversationId}`
    console.log('[IM Store] Unsubscribing from conversation channel:', channel)
    ws.unsubscribeChannel(channel)
  }

  // ==================== 消息管理 ====================

  /**
   * 加载消息列表（从本地存储）
   * 消息保存在客户端本地，不从服务器获取
   */
  async function loadMessages(conversationId: number, _beforeId?: number) {
    try {
      isLoading.value = true

      // 从本地存储加载消息
      const localMessages = loadMessagesFromStorage(conversationId)
      messages.value.set(conversationId, localMessages)

      // 本地消息没有分页，设置为 false
      hasMoreMessages.value = false

      console.log(`[IM] Loaded ${localMessages.length} messages from local storage for conversation ${conversationId}`)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 加载更多消息
   * 注意：由于消息存储在本地，此功能目前不可用
   */
  async function loadMoreMessages() {
    // 本地存储不支持分页加载历史消息
    hasMoreMessages.value = false
  }

  /**
   * 发送消息
   * @param content 消息内容
   * @param replyToId 回复的消息ID
   * @param attachment 附件信息
   * @param msgType 消息类型（可选，默认为文本或根据附件判断）
   */
  async function sendMessage(content: string, replyToId?: number, attachment?: SendMessageParams['attachment'], msgType?: number): Promise<boolean> {
    console.log('[IM Store] sendMessage called', {
      content: content.substring(0, 50),
      currentConversation: currentConversation.value?.id,
      replyToId,
      hasAttachment: !!attachment,
      msgType
    })

    if (!currentConversation.value) {
      console.error('[IM Store] Cannot send: no conversation')
      return false
    }

    // 如果没有附件，内容不能为空
    if (!attachment && !content.trim()) {
      console.error('[IM Store] Cannot send: empty content without attachment')
      return false
    }

    const conversationId = currentConversation.value.id
    const localId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // 获取当前用户ID
    const authStore = useAuthStore()
    const currentUserId = authStore.currentCustomer?.id || 0

    // 确定消息类型：优先使用传入的 msgType，其次根据附件推断，默认为文本
    let messageType = msgType || 1 // 默认 TEXT

    // 创建本地消息（乐观更新）
    const localMessage: Message = {
      id: 0,
      local_id: localId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      type: messageType,
      content: content.trim() || (attachment ? attachment.name : ''),
      is_recalled: false,
      status: 0, // SENDING
      reply_to_id: replyToId,
      created_at: new Date().toISOString(),
      extra: attachment ? { attachment: { id: 0, ...attachment, url: attachment.url || attachment.path } } : undefined,
    }

    // 添加到消息列表
    const convMessages = messages.value.get(conversationId) || []
    convMessages.push(localMessage)
    messages.value.set(conversationId, convMessages)

    try {
      const params: SendMessageParams = {
        conversation_id: conversationId,
        content: content.trim() || (attachment ? attachment.name : ''),
        type: messageType,
        reply_to_id: replyToId,
        attachment,
      }
      console.log('[IM Store] Sending message to API:', params)
      const res = await imApi.sendMessage(params)
      console.log('[IM Store] Send message API response:', res)

      if (res.code === API_SUCCESS_CODE && res.data) {
        // 更新本地消息
        const index = convMessages.findIndex(m => m.local_id === localId)
        if (index !== -1) {
          convMessages[index] = {
            ...convMessages[index],
            id: res.data.message_id,
            status: 1, // SENT
            created_at: res.data.created_at,
          }
          messages.value.set(conversationId, [...convMessages])
          // 保存到本地存储
          saveMessagesToStorage(conversationId)
        }
        return true
      } else {
        // 标记发送失败
        const index = convMessages.findIndex(m => m.local_id === localId)
        if (index !== -1) {
          convMessages[index].status = -1 // FAILED
          messages.value.set(conversationId, [...convMessages])
          saveMessagesToStorage(conversationId)
        }
        return false
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // 标记发送失败
      const index = convMessages.findIndex(m => m.local_id === localId)
      if (index !== -1) {
        convMessages[index].status = -1 // FAILED
        messages.value.set(conversationId, [...convMessages])
        saveMessagesToStorage(conversationId)
      }
      return false
    }
  }

  /**
   * 重新发送失败的消息
   */
  async function resendMessage(localId: string): Promise<boolean> {
    if (!currentConversation.value) {
      console.error('[IM Store] Cannot resend: no conversation')
      return false
    }

    const conversationId = currentConversation.value.id
    const convMessages = messages.value.get(conversationId)
    if (!convMessages) {
      console.error('[IM Store] Cannot resend: no messages found')
      return false
    }

    // 查找失败的消息
    const index = convMessages.findIndex(m => m.local_id === localId)
    if (index === -1) {
      console.error('[IM Store] Cannot resend: message not found')
      return false
    }

    const failedMessage = convMessages[index]
    if (failedMessage.status !== -1) {
      console.log('[IM Store] Message is not in failed state, skipping resend')
      return false
    }

    console.log('[IM Store] Resending message:', localId)

    // 标记为发送中
    convMessages[index].status = 0 // SENDING
    messages.value.set(conversationId, [...convMessages])

    try {
      const params: SendMessageParams = {
        conversation_id: conversationId,
        content: failedMessage.content,
        type: failedMessage.type,
        reply_to_id: failedMessage.reply_to_id,
        attachment: failedMessage.extra?.attachment,
      }

      const res = await imApi.sendMessage(params)
      console.log('[IM Store] Resend message API response:', res)

      if (res.code === API_SUCCESS_CODE && res.data) {
        // 更新消息
        convMessages[index] = {
          ...convMessages[index],
          id: res.data.message_id,
          status: 1, // SENT
          created_at: res.data.created_at,
        }
        messages.value.set(conversationId, [...convMessages])
        saveMessagesToStorage(conversationId)
        return true
      } else {
        // 标记为发送失败
        convMessages[index].status = -1 // FAILED
        messages.value.set(conversationId, [...convMessages])
        saveMessagesToStorage(conversationId)
        return false
      }
    } catch (error) {
      console.error('[IM Store] Failed to resend message:', error)
      // 标记发送失败
      convMessages[index].status = -1 // FAILED
      messages.value.set(conversationId, [...convMessages])
      saveMessagesToStorage(conversationId)
      return false
    }
  }

  /**
   * 撤回消息
   * 限制：只能撤回自己发送的消息，且在发送后 2 分钟内
   */
  async function recallMessage(messageId: number): Promise<{ success: boolean; error?: string }> {
    if (!currentConversation.value) {
      console.error('Cannot recall message: no current conversation')
      return { success: false, error: '无法撤回：没有当前会话' }
    }

    const conversationId = currentConversation.value.id
    const authStore = useAuthStore()
    const currentUserId = authStore.currentCustomer?.id || 0

    // 查找消息并验证
    const convMessages = messages.value.get(conversationId)
    if (convMessages) {
      const message = convMessages.find(m => m.id === messageId)
      if (message) {
        // 验证是否是自己发送的消息
        if (message.sender_id !== currentUserId) {
          console.error('Cannot recall message: not the sender')
          return { success: false, error: '只能撤回自己发送的消息' }
        }

        // 验证时间窗口（2分钟）
        const createdAt = new Date(message.created_at).getTime()
        const now = Date.now()
        const twoMinutes = 2 * 60 * 1000
        if (now - createdAt > twoMinutes) {
          console.error('Cannot recall message: time limit exceeded')
          return { success: false, error: '消息发送超过2分钟，无法撤回' }
        }
      }
    }

    try {
      const res = await imApi.recallMessage(conversationId, messageId)
      if (res.code === API_SUCCESS_CODE) {
        // 更新本地消息状态
        if (convMessages) {
          const index = convMessages.findIndex(m => m.id === messageId)
          if (index !== -1) {
            convMessages[index].is_recalled = true
            messages.value.set(conversationId, [...convMessages])
            // 保存到本地存储
            saveMessagesToStorage(conversationId)
          }
        }
        return { success: true }
      } else {
        return { success: false, error: res.message || '撤回失败' }
      }
    } catch (error: unknown) {
      console.error('Failed to recall message:', error)
      const errMsg = error instanceof Error ? error.message : '撤回失败'
      return { success: false, error: errMsg }
    }
  }

  /**
   * 标记会话已读
   */
  async function markConversationRead(conversationId: number) {
    try {
      // 先更新本地状态（乐观更新）
      const conv = conversations.value.find(c => c.id === conversationId)
      if (conv && conv.unread_count > 0) {
        const oldUnread = conv.unread_count
        totalUnread.value = Math.max(0, totalUnread.value - oldUnread)
        conv.unread_count = 0
      }

      // 调用 API 清除离线消息
      await imApi.markMessagesRead(conversationId)
    } catch (error) {
      console.error('Failed to mark as read:', error)
      // 如果失败，重新加载会话列表以恢复正确状态
      await loadConversations()
      await refreshUnreadStats()
    }
  }

  // ==================== WebSocket 消息处理 ====================

  /**
   * 处理新消息
   */
  function handleNewMessage(data: WSMessageSentEvent) {
    const { conversation_id } = data

    // 验证数据完整性
    if (!conversation_id || !data.id) {
      console.error('[IM] Invalid message data:', data)
      return
    }

    // 获取当前用户ID
    const authStore = useAuthStore()
    const currentUserId = authStore.currentCustomer?.id || 0

    // 如果是自己发送的消息，忽略WebSocket推送（前端已经通过API响应处理）
    if (data.sender_id === currentUserId) {
      console.log('[IM] Ignoring own message from WebSocket:', data.id)
      return
    }

    console.log('[IM] Processing new message:', {
      id: data.id,
      conversation_id: conversation_id,
      sender_id: data.sender_id,
      type: data.type,
      content: data.content?.substring(0, 50),
    })

    // 构建消息对象
    const newMessage: Message = {
      id: data.id,
      conversation_id: data.conversation_id,
      sender_id: data.sender_id,
      sender: data.sender,
      type: data.type,
      content: data.content,
      extra: data.extra, // 包含附件信息
      is_recalled: false,
      created_at: data.created_at,
    }

    // 添加到消息列表
    let convMessages = messages.value.get(conversation_id)
    if (!convMessages) {
      // 尝试从本地存储加载
      convMessages = loadMessagesFromStorage(conversation_id)
      messages.value.set(conversation_id, convMessages)
    }

    // 检查是否已存在（避免重复）- 使用字符串比较以避免数字精度问题
    const messageIdStr = String(newMessage.id)
    if (!convMessages.some(m => String(m.id) === messageIdStr)) {
      convMessages.push(newMessage)
      messages.value.set(conversation_id, [...convMessages]) // 触发响应式更新
      // 保存到本地存储
      saveMessagesToStorage(conversation_id)
      console.log('[IM] Message added to local storage, conversation:', conversation_id)
    } else {
      console.log('[IM] Message already exists, skipping:', newMessage.id)
      return // 消息已存在，不需要更新会话列表
    }

    // 更新会话列表
    const convIndex = conversations.value.findIndex(c => c.id === conversation_id)
    if (convIndex !== -1) {
      const conv = conversations.value[convIndex]
      conv.last_message = newMessage
      conv.updated_at = newMessage.created_at

      // 如果是当前会话，自动标记为已读（用户正在查看）
      if (currentConversation.value && currentConversation.value.id === conversation_id) {
        // 异步标记已读，不阻塞消息显示
        markConversationRead(conversation_id)
      } else {
        // 不是当前会话，增加未读数
        conv.unread_count = (conv.unread_count || 0) + 1
        totalUnread.value++
      }

      // 移到列表顶部
      conversations.value.splice(convIndex, 1)
      conversations.value.unshift(conv)
    } else {
      // 会话不在列表中，刷新会话列表
      console.log('[IM] Conversation not in list, refreshing...')
      loadConversations().then(() => {
        // 重新检查并更新未读数
        const newConvIndex = conversations.value.findIndex(c => c.id === conversation_id)
        if (newConvIndex !== -1) {
          conversations.value[newConvIndex].unread_count = (conversations.value[newConvIndex].unread_count || 0) + 1
          totalUnread.value++
        }
      })
    }
  }

  /**
   * 处理消息撤回
   */
  function handleMessageRecalled(data: WSMessageRecalledEvent) {
    const { message_id, conversation_id } = data

    const convMessages = messages.value.get(conversation_id)
    if (convMessages) {
      const index = convMessages.findIndex(m => m.id === message_id)
      if (index !== -1) {
        convMessages[index].is_recalled = true
        messages.value.set(conversation_id, [...convMessages])
        // 保存到本地存储
        saveMessagesToStorage(conversation_id)
      }
    }
  }

  /**
   * 处理中奖通知
   */
  function handleLotteryWin(data: {
    member_id: number
    game_name: string
    expect_no: string
    bet_gold: number
    win_gold: number
    bet_no: string
    action_no: string
    timestamp: string
  }) {
    // 添加到中奖通知列表
    lotteryWinNotifications.value.unshift({
      id: Date.now(),
      game_name: data.game_name,
      expect_no: data.expect_no,
      bet_gold: data.bet_gold,
      win_gold: data.win_gold,
      timestamp: data.timestamp,
    })

    // 只保留最近 10 条
    if (lotteryWinNotifications.value.length > 10) {
      lotteryWinNotifications.value = lotteryWinNotifications.value.slice(0, 10)
    }

    // 刷新通知未读数
    refreshUnreadStats()

    console.log('[IM] Lottery win added to notifications:', data)
  }

  /**
   * 清除中奖通知
   */
  function clearLotteryWinNotification(id: number) {
    const index = lotteryWinNotifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      lotteryWinNotifications.value.splice(index, 1)
    }
  }

  /**
   * 清除所有中奖通知
   */
  function clearAllLotteryWinNotifications() {
    lotteryWinNotifications.value = []
  }

  // ==================== 群红包管理 ====================

  /**
   * 处理群红包被抢事件
   */
  function handleGroupPackGrabbed(data: {
    pack_id: number
    conversation_id: number
    grabber_id: number
    grabber_nickname: string
    amount: number
    is_best: boolean
    remaining_count: number
    status: number
  }) {
    // 可以在这里更新本地红包状态或触发UI更新
    console.log('[IM] Pack grabbed by:', data.grabber_nickname, 'amount:', data.amount)

    // 如果当前正在查看这个红包的详情，可以触发刷新
    if (currentPackDetail.value?.packId === data.pack_id) {
      // 触发详情刷新（通过改变ref触发watch）
      currentPackDetail.value = { ...currentPackDetail.value }
    }
  }

  /**
   * 打开抢红包弹窗
   */
  function openPackGrabDialog(packId: number, conversationId: number) {
    currentGrabPack.value = { packId, conversationId }
    showPackGrabDialog.value = true
  }

  /**
   * 关闭抢红包弹窗
   */
  function closePackGrabDialog() {
    showPackGrabDialog.value = false
    currentGrabPack.value = null
  }

  /**
   * 打开红包详情弹窗
   */
  function openPackDetailDialog(packId: number, conversationId: number) {
    currentPackDetail.value = { packId, conversationId }
    showPackDetailDialog.value = true
  }

  /**
   * 关闭红包详情弹窗
   */
  function closePackDetailDialog() {
    showPackDetailDialog.value = false
    currentPackDetail.value = null
  }

  /**
   * 处理红包抢成功后
   */
  function onPackGrabbed(amount: number) {
    console.log('[IM] Successfully grabbed pack, amount:', amount)
    // 可以在这里触发刷新余额等操作
  }

  // ==================== 未读统计 ====================

  /**
   * 刷新未读统计
   */
  async function refreshUnreadStats() {
    try {
      const res = await imApi.getUnreadStats()
      if (res.code === API_SUCCESS_CODE && res.data) {
        totalUnread.value = res.data.total_unread
        notificationUnread.value = res.data.notification_unread
      }
    } catch (error) {
      console.error('Failed to refresh unread stats:', error)
    }
  }

  // ==================== 通知管理 ====================

  /**
   * 加载通知列表
   */
  async function loadNotifications(page = 1) {
    try {
      const res = await imApi.getNotifications(page)
      if (res.code === API_SUCCESS_CODE && res.data) {
        if (page === 1) {
          notifications.value = res.data.list
        } else {
          notifications.value.push(...res.data.list)
        }
        notificationUnread.value = res.data.unread_count
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  /**
   * 标记所有通知已读
   */
  async function markAllNotificationsRead() {
    try {
      await imApi.markNotificationRead(undefined, true)
      notifications.value.forEach(n => n.is_read = true)
      notificationUnread.value = 0
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
    }
  }

  /**
   * 删除聊天
   * 从聊天列表移除，清除本地消息
   */
  async function deleteChat(conversationId: number): Promise<boolean> {
    try {
      const res = await imApi.deleteChat(conversationId)
      if (res.code === API_SUCCESS_CODE) {
        // 清除本地存储的消息
        clearMessagesFromStorage(conversationId)

        // 从会话列表中移除
        const index = conversations.value.findIndex(c => c.id === conversationId)
        if (index !== -1) {
          const conv = conversations.value[index]
          // 减少未读数
          if (conv.unread_count > 0) {
            totalUnread.value = Math.max(0, totalUnread.value - conv.unread_count)
          }
          conversations.value.splice(index, 1)
        }

        // 如果是当前会话，清除
        if (currentConversation.value?.id === conversationId) {
          currentConversation.value = null
        }

        return true
      }
    } catch (error) {
      console.error('Failed to delete chat:', error)
    }
    return false
  }

  return {
    // 状态
    conversations,
    currentConversation,
    messages,
    notifications,
    totalUnread,
    notificationUnread,
    isLoading,
    hasMoreMessages,
    lotteryWinNotifications,

    // 群红包状态
    currentGrabPack,
    showPackGrabDialog,
    showPackDetailDialog,
    currentPackDetail,

    // 计算属性
    sortedConversations,
    currentMessages,

    // WebSocket 状态
    isConnected: ws.isConnected,
    connectionState: ws.connectionState,

    // 方法
    init,
    cleanup,
    loadConversations,
    getOrCreatePrivateConversation,
    getOrCreateSystemContactConversation,
    setCurrentConversation,
    clearCurrentConversation,
    subscribeToConversation,
    unsubscribeFromConversation,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    resendMessage,
    recallMessage,
    markConversationRead,
    refreshUnreadStats,
    loadNotifications,
    markAllNotificationsRead,
    clearMessagesFromStorage,
    deleteChat,
    clearLotteryWinNotification,
    clearAllLotteryWinNotifications,

    // 群红包方法
    openPackGrabDialog,
    closePackGrabDialog,
    openPackDetailDialog,
    closePackDetailDialog,
    onPackGrabbed,
  }
})
