/**
 * IM 即时通讯 API
 */
import http from '@/utils/request'
import type { HttpRes } from '@/types/http.type'
import type {
  ConversationListResponse,
  MessageListResponse,
  CreateConversationResponse,
  SendMessageResponse,
  UnreadStatsResponse,
  WSConnectionConfig,
  Conversation,
  IMNotification,
  CreateConversationParams,
  SendMessageParams,
} from '@/types/im.type'

const BASE_URL = '/api/app/v1/im'

// ==================== 连接管理 ====================

/**
 * 获取 WebSocket 连接配置
 */
export const getConnectionConfig = (): Promise<HttpRes<WSConnectionConfig>> => {
  return http.get<HttpRes<WSConnectionConfig>, object>(`${BASE_URL}/config`, {})
}

/**
 * 私有频道/存在频道认证
 */
export const authChannel = (socketId: string, channelName: string): Promise<HttpRes<{ auth: string; channel_data?: string }>> => {
  return http.post<HttpRes<{ auth: string; channel_data?: string }>, object>(`${BASE_URL}/auth`, {
    socket_id: socketId,
    channel_name: channelName,
  })
}

/**
 * WebSocket 连接建立后注册
 */
export const wsConnect = (socketId: string, channel?: string): Promise<HttpRes<{ connected: boolean; socket_id: string; channel: string }>> => {
  return http.post<HttpRes<{ connected: boolean; socket_id: string; channel: string }>, object>(`${BASE_URL}/ws/connect`, {
    socket_id: socketId,
    channel,
  })
}

/**
 * WebSocket 连接断开时通知
 */
export const wsDisconnect = (socketId: string): Promise<HttpRes<{ disconnected: boolean }>> => {
  return http.post<HttpRes<{ disconnected: boolean }>, object>(`${BASE_URL}/ws/disconnect`, {
    socket_id: socketId,
  })
}

/**
 * WebSocket 心跳
 */
export const wsHeartbeat = (socketId: string): Promise<HttpRes<{ ping: string; timestamp: number }>> => {
  return http.post<HttpRes<{ ping: string; timestamp: number }>, object>(`${BASE_URL}/ws/heartbeat`, {
    socket_id: socketId,
  })
}

/**
 * 获取在线状态
 */
export const getOnlineStatus = (): Promise<HttpRes<{ is_online: boolean; devices: string[] }>> => {
  return http.get<HttpRes<{ is_online: boolean; devices: string[] }>, object>(`${BASE_URL}/status`, {})
}

/**
 * 批量获取用户在线状态
 */
export const batchOnlineStatus = (memberIds: number[]): Promise<HttpRes<{ statuses: Record<number, boolean> }>> => {
  return http.post<HttpRes<{ statuses: Record<number, boolean> }>, object>(`${BASE_URL}/status/batch`, {
    member_ids: memberIds,
  })
}

/**
 * 获取未读统计
 */
export const getUnreadStats = (): Promise<HttpRes<UnreadStatsResponse>> => {
  return http.get<HttpRes<UnreadStatsResponse>, object>(`${BASE_URL}/unread`, {})
}

// ==================== 会话管理 ====================

/**
 * 获取会话列表
 */
export const getConversations = (page = 1, size = 20): Promise<HttpRes<ConversationListResponse>> => {
  return http.get<HttpRes<ConversationListResponse>, object>(`${BASE_URL}/conversations`, {
    params: { page, size },
  })
}

/**
 * 创建会话
 */
export const createConversation = (params: CreateConversationParams): Promise<HttpRes<CreateConversationResponse>> => {
  return http.post<HttpRes<CreateConversationResponse>, CreateConversationParams>(`${BASE_URL}/conversations`, params)
}

/**
 * 创建与系统联系人（客服）的会话
 */
export const createSystemContactConversation = (contactCode = 'customer_service'): Promise<HttpRes<{
  conversation_id: number
  type: number
  system_contact: {
    id: number
    code: string
    name: string
    avatar: string
    description: string
    type: number
    member_id: number
  }
}>> => {
  return http.post<HttpRes<{
    conversation_id: number
    type: number
    system_contact: {
      id: number
      code: string
      name: string
      avatar: string
      description: string
      type: number
      member_id: number
    }
  }>, object>(`${BASE_URL}/conversations/system-contact`, {
    contact_code: contactCode,
  })
}

/**
 * 获取会话详情
 */
export const getConversationDetail = (id: number): Promise<HttpRes<Conversation>> => {
  return http.get<HttpRes<Conversation>, object>(`${BASE_URL}/conversations/${id}`, {})
}

/**
 * 设置会话置顶
 */
export const setConversationPinned = (conversationId: number, isPinned: boolean): Promise<HttpRes<string>> => {
  return http.post<HttpRes<string>, object>(`${BASE_URL}/conversations/pin`, {
    conversation_id: conversationId,
    is_pinned: isPinned,
  })
}

/**
 * 设置消息免打扰
 */
export const setNotifyMode = (conversationId: number, mode: number): Promise<HttpRes<string>> => {
  return http.post<HttpRes<string>, object>(`${BASE_URL}/conversations/notify`, {
    conversation_id: conversationId,
    notify_mode: mode,
  })
}

/**
 * 退出会话
 */
export const leaveConversation = (conversationId: number): Promise<HttpRes<string>> => {
  return http.post<HttpRes<string>, object>(`${BASE_URL}/conversations/leave`, {
    conversation_id: conversationId,
  })
}

/**
 * 删除聊天
 */
export const deleteChat = (conversationId: number): Promise<HttpRes<string>> => {
  return http.post<HttpRes<string>, object>(`${BASE_URL}/conversations/delete`, {
    conversation_id: conversationId,
  })
}

// ==================== 消息管理 ====================

/**
 * 获取会话消息列表
 */
export const getMessages = (conversationId: number, limit = 20, beforeId?: number): Promise<HttpRes<MessageListResponse>> => {
  return http.get<HttpRes<MessageListResponse>, object>(`${BASE_URL}/conversations/${conversationId}/messages`, {
    params: { limit, before_id: beforeId },
  })
}

/**
 * 发送消息
 */
export const sendMessage = (params: SendMessageParams): Promise<HttpRes<SendMessageResponse>> => {
  return http.post<HttpRes<SendMessageResponse>, SendMessageParams>(`${BASE_URL}/messages`, params)
}

/**
 * 撤回消息
 */
export const recallMessage = (conversationId: number, messageId: number): Promise<HttpRes<string>> => {
  return http.post<HttpRes<string>, object>(`${BASE_URL}/messages/recall`, {
    conversation_id: conversationId,
    message_id: messageId,
  })
}

/**
 * 标记消息已读
 */
export const markMessagesRead = (conversationId: number, messageId?: number): Promise<HttpRes<{ marked_count: number }>> => {
  return http.post<HttpRes<{ marked_count: number }>, object>(`${BASE_URL}/messages/read`, {
    conversation_id: conversationId,
    message_id: messageId,
  })
}

// ==================== 离线消息 ====================

/**
 * 获取离线消息
 * 返回离线消息列表，前端需要处理并保存到本地存储
 */
interface PendingMessage {
  id: number
  conversation_id: number
  sender_id: number
  sender: { id: number; nickname: string; avatar: string }
  type: number
  content: string
  extra?: { attachment?: unknown }
  created_at: string
}

export const getPendingMessages = (): Promise<HttpRes<{ messages: PendingMessage[]; pushed_count: number }>> => {
  return http.get<HttpRes<{ messages: PendingMessage[]; pushed_count: number }>, object>(`${BASE_URL}/pending`, {})
}

/**
 * 获取离线消息数量
 */
export const getPendingCount = (): Promise<HttpRes<{ pending_count: number }>> => {
  return http.get<HttpRes<{ pending_count: number }>, object>(`${BASE_URL}/pending/count`, {})
}

// ==================== 通知管理 ====================

/**
 * 获取通知列表
 */
export const getNotifications = (page = 1, size = 20, type?: number): Promise<HttpRes<{ list: IMNotification[]; unread_count: number; pagination: { page: number; size: number } }>> => {
  return http.get<HttpRes<{ list: IMNotification[]; unread_count: number; pagination: { page: number; size: number } }>, object>(`${BASE_URL}/notifications`, {
    params: { page, size, type },
  })
}

/**
 * 标记通知已读
 */
export const markNotificationRead = (notificationId?: number, markAll = false): Promise<HttpRes<string | { marked_count: number }>> => {
  return http.post<HttpRes<string | { marked_count: number }>, object>(`${BASE_URL}/notifications/read`, {
    notification_id: notificationId,
    mark_all: markAll,
  })
}

// ==================== 群聊管理 ====================

/**
 * 添加群成员
 */
export const addGroupMembers = (conversationId: number, memberIds: number[]): Promise<HttpRes<string>> => {
  return http.post<HttpRes<string>, object>(`${BASE_URL}/conversations/members/add`, {
    conversation_id: conversationId,
    member_ids: memberIds,
  })
}

/**
 * 移除群成员
 */
export const removeGroupMember = (conversationId: number, memberId: number): Promise<HttpRes<string>> => {
  return http.post<HttpRes<string>, object>(`${BASE_URL}/conversations/members/remove`, {
    conversation_id: conversationId,
    member_id: memberId,
  })
}

/**
 * 解散群聊
 */
export const dissolveGroup = (conversationId: number): Promise<HttpRes<string>> => {
  return http.post<HttpRes<string>, object>(`${BASE_URL}/conversations/dissolve`, {
    conversation_id: conversationId,
  })
}

/**
 * 更新群信息
 */
export const updateGroupInfo = (conversationId: number, data: { name?: string; avatar?: string }): Promise<HttpRes<string>> => {
  return http.post<HttpRes<string>, object>(`${BASE_URL}/conversations/update`, {
    conversation_id: conversationId,
    ...data,
  })
}
