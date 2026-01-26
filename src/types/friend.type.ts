/**
 * 好友与通讯录类型定义
 */

// 搜索到的用户
export interface SearchUser {
  id: number
  user: string
  mobile: string
  avatar: string
  nickname: string
  is_friend: boolean
}

// 好友申请
export interface FriendRequest {
  id: number
  from_member_id: number
  user: string
  nickname: string
  avatar: string
  message?: string
  created_at: string
}

// 好友信息
export interface Friend {
  id: number
  friend_id: number
  user: string
  nickname: string
  avatar: string
  remark?: string
  is_top: number
  is_mute: number
}

// 联系人（系统联系人或好友）
export interface Contact {
  id: number | string
  type: 'system' | 'friend'
  code?: string
  name: string
  avatar: string
  description?: string
  system_type?: number
  remark?: string
  nickname?: string
  is_top?: number
  is_mute?: number
}

// 系统联系人类型
export const SystemContactType = {
  CUSTOMER_SERVICE: 1,
  SYSTEM_NOTICE: 2,
} as const

// 系统联系人代码
export const SystemContactCode = {
  CUSTOMER_SERVICE: 'customer_service',
  SYSTEM_NOTICE: 'system_notice',
} as const

// 系统消息
export interface SystemMessage {
  id: number
  type: string
  type_label: string
  title: string
  content: string
  extra?: {
    url?: string
    order_id?: number
    bet_id?: number
    announcement_id?: number
    [key: string]: unknown
  }
  is_read: number
  created_at: string
}

// 系统消息类型
export const SystemMessageType = {
  WINNING: 'winning',
  RECHARGE: 'recharge',
  WITHDRAW: 'withdraw',
  WITHDRAW_FAILED: 'withdraw_failed',
  ANNOUNCEMENT: 'announcement',
  ACTIVITY: 'activity',
  VIP_UPGRADE: 'vip_upgrade',
  POINTS: 'points',
  SALARY: 'salary',
  WELFARE: 'welfare',
  SECURITY: 'security',
  GENERAL: 'general',
  FRIEND_REQUEST: 'friend_request',
  FRIEND_ACCEPTED: 'friend_accepted',
} as const

// API 响应类型
export interface SearchUserResponse {
  list: SearchUser[]
}

export interface FriendRequestListResponse {
  list: FriendRequest[]
  pending_count: number
  pagination: {
    page: number
    size: number
  }
}

export interface FriendListResponse {
  list: Friend[]
  pagination: {
    page: number
    size: number
  }
}

export interface ContactsResponse {
  system: Contact[]
  friends: Contact[]
}

export interface SystemMessageListResponse {
  list: SystemMessage[]
  unread_count: number
  pagination: {
    page: number
    size: number
  }
}
