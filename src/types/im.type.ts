/**
 * IM 即时通讯类型定义
 */

// 会话类型
export const ConversationType = {
  PRIVATE: 1, // 私聊
  GROUP: 2,   // 群聊
} as const

// 消息类型
export const MessageType = {
  TEXT: 1,      // 文本
  IMAGE: 2,     // 图片
  VOICE: 3,     // 语音
  VIDEO: 4,     // 视频
  FILE: 5,      // 文件
  LOCATION: 6,  // 位置
  CONTACT: 7,   // 联系人名片
  PACK: 8,      // 红包
  SYSTEM: 99,   // 系统消息
} as const

// 消息状态
export const MessageStatus = {
  SENDING: 0,   // 发送中
  SENT: 1,      // 已发送
  DELIVERED: 2, // 已送达
  READ: 3,      // 已读
  FAILED: -1,   // 发送失败
} as const

// WebSocket 连接状态
export const WSConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
} as const

export type WSConnectionStateType = typeof WSConnectionState[keyof typeof WSConnectionState]

// 用户信息
export interface IMUser {
  id: number
  nickname: string
  avatar: string
  is_online?: boolean
  // 系统联系人标识（如在线客服）
  is_system_contact?: boolean
  system_contact_code?: string
}

// 会话信息
export interface Conversation {
  id: number
  type: number
  name: string
  avatar?: string
  last_message?: Message
  unread_count: number
  is_pinned: boolean
  notify_mode: number
  updated_at: string
  // 私聊时的对方信息
  target?: IMUser
  // 群聊成员数
  member_count?: number
}

// 消息信息
export interface Message {
  id: number
  conversation_id: number
  sender_id: number
  sender?: IMUser
  type: number
  content: string
  extra?: {
    attachment?: MessageAttachment
    [key: string]: unknown
  }
  attachment?: MessageAttachment // 兼容旧格式
  reply_to_id?: number
  reply_to?: Message
  is_recalled: boolean
  status?: number // 本地状态
  local_id?: string // 本地临时ID
  created_at: string
}

// 消息附件
export interface MessageAttachment {
  id: number
  type: number
  name: string
  path: string
  url?: string
  mime_type?: string
  size?: number
  duration?: number
  width?: number
  height?: number
  thumbnail?: string
  // 位置信息
  latitude?: number
  longitude?: number
  address?: string
}

// 系统通知
export interface IMNotification {
  id: number
  type: number
  title: string
  content: string
  extra?: Record<string, unknown>
  is_read: boolean
  created_at: string
}

// WebSocket 连接配置
export interface WSConnectionConfig {
  reverb: {
    host: string
    port: number
    scheme: string
    app_key: string
  }
  channels: {
    user: string
    lottery: string
    system: string
  }
  session_id: string
}

// API 响应类型
export interface ConversationListResponse {
  list: Conversation[]
  pagination: {
    page: number
    size: number
  }
}

export interface MessageListResponse {
  messages: Message[]
  has_more: boolean
}

export interface CreateConversationResponse {
  conversation_id: number
  type: number
  name: string
}

export interface SendMessageResponse {
  message_id: number
  created_at: string
}

export interface UnreadStatsResponse {
  total_unread: number
  pending_messages: number
  notification_unread: number
}

// WebSocket 事件类型
export interface WSMessageEvent {
  type: 'message.sent' | 'message.recalled' | 'user.online' | 'user.offline' | 'notification'
  data: unknown
}

export interface WSMessageSentEvent {
  id: number
  conversation_id: number
  sender_id: number
  sender: IMUser
  type: number
  content: string
  extra?: {
    attachment?: MessageAttachment
    [key: string]: unknown
  }
  created_at: string
}

export interface WSMessageRecalledEvent {
  message_id: number
  conversation_id: number
}

export interface WSUserStatusEvent {
  member_id: number
  is_online: boolean
  device?: string
}

// 发送消息参数
export interface SendMessageParams {
  conversation_id: number
  type?: number
  content: string
  reply_to_id?: number
  attachment?: {
    type: number
    name: string
    path: string
    url?: string
    mime_type?: string
    size?: number
    width?: number
    height?: number
  }
}

// 创建会话参数
export interface CreateConversationParams {
  type: number
  target_id?: number  // 私聊对象ID
  name?: string       // 群聊名称
  member_ids?: number[] // 群聊成员
  avatar?: string     // 群聊头像
}
