/**
 * 群聊类型定义
 */

// 入群方式
export const JoinMode = {
  APPLY: 1,       // 需要申请
  FREE: 2,        // 自由加入
  INVITE_ONLY: 3, // 仅限邀请
} as const

// 红包类型
export const PackType = {
  LUCKY: 1,   // 拼手气红包
  NORMAL: 2,  // 普通红包
} as const

// 红包状态
export const PackStatus = {
  ONGOING: 1,   // 进行中
  FINISHED: 2,  // 已领完
  EXPIRED: 3,   // 已过期
} as const

// 成员角色
export const MemberRole = {
  MEMBER: 0,  // 普通成员
  ADMIN: 1,   // 管理员
  OWNER: 2,   // 群主
} as const

// 入群申请状态
export const ApplicationStatus = {
  PENDING: 0,   // 待处理
  APPROVED: 1,  // 已通过
  REJECTED: 2,  // 已拒绝
} as const

// 群成员信息
export interface GroupMember {
  id: number
  nickname: string
  avatar: string | null
  role: number
  role_text: string
  is_muted: boolean
  muted_until: string | null
  joined_at: string
}

// 入群条件
export interface JoinConditions {
  min_bet_amount?: number    // 最低投注流水
  min_level?: number         // 最低用户等级
  min_recharge?: number      // 最低充值金额
  min_balance?: number       // 最低账户余额
  min_days?: number          // 最低注册天数
}

// 群设置信息
export interface GroupSettings {
  id: number
  name: string
  avatar: string | null
  group_number: string
  description: string | null
  owner_id: number
  owner_nickname: string
  member_count: number
  max_members: number
  is_muted: boolean
  allow_add_friend: boolean
  join_mode: number
  join_mode_text: string
  join_conditions: JoinConditions
  join_conditions_text: string[]
  invite_require_approval: boolean
  invite_code?: string       // 仅管理员可见
  my_role: number
  my_role_text: string
  is_pinned: boolean
  notify_mode: number
  created_at: string
}

// 邀请链接信息
export interface InviteLinkInfo {
  invite_code: string
  require_approval: boolean
  group_name: string
  group_avatar: string | null
  member_count: number
}

// 入群申请
export interface GroupApplication {
  id: number
  member_id: number
  nickname: string
  avatar: string | null
  message: string | null
  status: number
  created_at: string
}

// 群红包
export interface GroupPack {
  id: number
  conversation_id: number
  sender_id: number
  sender_nickname: string
  sender_avatar: string | null
  message_id: string
  type: number
  type_text: string
  total_amount: number
  total_count: number
  received_amount: number
  received_count: number
  remaining_amount: number
  remaining_count: number
  greeting: string
  status: number
  status_text: string
  expired_at: string
  created_at: string
  my_record?: PackRecord | null
  has_grabbed?: boolean
}

// 红包领取记录
export interface PackRecord {
  id: number
  member_id: number
  nickname: string
  avatar: string | null
  amount: number
  is_best: boolean
  created_at: string
}

// 群搜索结果
export interface GroupSearchResult {
  id: number
  name: string
  avatar: string | null
  group_number: string
  description: string | null
  member_count: number
  join_mode: number
  join_mode_text: string
  is_member: boolean
  conversation_id: number | null
}

// 创建群参数
export interface CreateGroupParams {
  name: string
  member_ids?: number[]
  avatar?: string
  description?: string
}

// 创建群响应
export interface CreateGroupResponse {
  conversation_id: number
  group_number: string
  name: string
}

// 发送红包参数
export interface SendPackParams {
  type: number
  total_amount: number
  total_count: number
  greeting?: string
}

// 发送红包响应
export interface SendPackResponse {
  pack_id: number
  message_id: string
  message: {
    id: string
    conversation_id: number
    sender_id: number
    sender: {
      id: number
      nickname: string
      avatar: string | null
    }
    type: number
    content: string
    extra: {
      pack_type: string
      pack_id: number
      pack_type_value: number
      pack_type_text: string
      greeting: string
      total_count: number
      total_amount: number
    }
    created_at: string
  }
}

// 抢红包响应
export interface GrabPackResponse {
  amount: number
  is_best: boolean
  pack: GroupPack
}

// 更新群设置参数
export interface UpdateGroupSettingsParams {
  name?: string
  avatar?: string
  description?: string
  allow_add_friend?: boolean
  join_mode?: number
  is_muted?: boolean
  join_conditions?: JoinConditions
  invite_require_approval?: boolean
}

// 分页响应
export interface PaginatedResponse<T> {
  list: T[]
  pagination: {
    page: number
    size: number
  }
}

// API 响应类型
export type GroupMemberListResponse = PaginatedResponse<GroupMember>
export type ApplicationListResponse = PaginatedResponse<GroupApplication>
export type GroupSearchListResponse = PaginatedResponse<GroupSearchResult>
export type PackRecordListResponse = { list: PackRecord[] }
