/**
 * 群聊 API
 */
import http from '@/utils/request'
import type { HttpRes } from '@/types/http.type'
import type {
  GroupSettings,
  GroupPack,
  CreateGroupParams,
  CreateGroupResponse,
  SendPackParams,
  SendPackResponse,
  GrabPackResponse,
  UpdateGroupSettingsParams,
  GroupMemberListResponse,
  ApplicationListResponse,
  GroupSearchListResponse,
  PackRecordListResponse,
  InviteLinkInfo,
} from '@/types/group.type'

const BASE_URL = '/api/app/v1/im/groups'

// ==================== 群管理 ====================

/**
 * 创建群
 */
export const createGroup = (params: CreateGroupParams): Promise<HttpRes<CreateGroupResponse>> => {
  return http.post<HttpRes<CreateGroupResponse>, CreateGroupParams>(`${BASE_URL}`, params)
}

/**
 * 搜索群
 */
export const searchGroups = (keyword: string, page = 1, size = 20): Promise<HttpRes<GroupSearchListResponse>> => {
  return http.get<HttpRes<GroupSearchListResponse>, object>(`${BASE_URL}/search`, { keyword, page, size })
}

/**
 * 申请入群
 */
export const applyToJoin = (groupId: number, message?: string): Promise<HttpRes<{ type: string; message: string; application_id?: number; conversation_id?: number }>> => {
  return http.post<HttpRes<{ type: string; message: string; application_id?: number; conversation_id?: number }>, object>(`${BASE_URL}/${groupId}/join`, {
    message,
  })
}

/**
 * 获取入群申请列表
 */
export const getApplications = (groupId: number, page = 1, size = 20): Promise<HttpRes<ApplicationListResponse>> => {
  return http.get<HttpRes<ApplicationListResponse>, object>(`${BASE_URL}/${groupId}/applications`, { page, size })
}

/**
 * 处理入群申请
 */
export const handleApplication = (applicationId: number, approve: boolean): Promise<HttpRes<{ message: string }>> => {
  return http.post<HttpRes<{ message: string }>, object>(`${BASE_URL}/applications/${applicationId}/handle`, {
    approve,
  })
}

/**
 * 邀请成员入群
 */
export const inviteMembers = (groupId: number, memberIds: number[]): Promise<HttpRes<{ message: string; added_count: number }>> => {
  return http.post<HttpRes<{ message: string; added_count: number }>, object>(`${BASE_URL}/${groupId}/invite`, {
    member_ids: memberIds,
  })
}

/**
 * 转让群主
 */
export const transferOwnership = (groupId: number, newOwnerId: number): Promise<HttpRes<string>> => {
  return http.post<HttpRes<string>, object>(`${BASE_URL}/${groupId}/transfer`, {
    new_owner_id: newOwnerId,
  })
}

/**
 * 设置/取消管理员
 */
export const setAdmin = (groupId: number, memberId: number, isAdmin: boolean): Promise<HttpRes<string>> => {
  return http.post<HttpRes<string>, object>(`${BASE_URL}/${groupId}/admins`, {
    member_id: memberId,
    is_admin: isAdmin,
  })
}

/**
 * 获取群成员列表
 */
export const getMembers = (groupId: number, page = 1, size = 100): Promise<HttpRes<GroupMemberListResponse>> => {
  return http.get<HttpRes<GroupMemberListResponse>, object>(`${BASE_URL}/${groupId}/members`, { page, size })
}

/**
 * 踢出成员
 */
export const kickMember = (groupId: number, memberId: number): Promise<HttpRes<string>> => {
  return http.post<HttpRes<string>, object>(`${BASE_URL}/${groupId}/kick`, {
    member_id: memberId,
  })
}

// ==================== 群设置 ====================

/**
 * 获取群设置
 */
export const getSettings = (groupId: number): Promise<HttpRes<GroupSettings>> => {
  return http.get<HttpRes<GroupSettings>, object>(`${BASE_URL}/${groupId}/settings`, {})
}

/**
 * 更新群设置
 */
export const updateSettings = (groupId: number, settings: UpdateGroupSettingsParams): Promise<HttpRes<string>> => {
  return http.post<HttpRes<string>, UpdateGroupSettingsParams>(`${BASE_URL}/${groupId}/settings`, settings)
}

/**
 * 全员禁言
 */
export const muteGroup = (groupId: number, muted: boolean): Promise<HttpRes<string>> => {
  return http.post<HttpRes<string>, object>(`${BASE_URL}/${groupId}/mute`, {
    muted,
  })
}

/**
 * 禁言成员
 */
export const muteMember = (groupId: number, memberId: number, muted: boolean, minutes?: number): Promise<HttpRes<string>> => {
  return http.post<HttpRes<string>, object>(`${BASE_URL}/${groupId}/members/${memberId}/mute`, {
    muted,
    minutes,
  })
}

// ==================== 邀请链接 ====================

/**
 * 获取邀请链接
 */
export const getInviteLink = (groupId: number): Promise<HttpRes<InviteLinkInfo>> => {
  return http.get<HttpRes<InviteLinkInfo>, object>(`${BASE_URL}/${groupId}/invite-link`, {})
}

/**
 * 重置邀请码
 */
export const resetInviteCode = (groupId: number): Promise<HttpRes<{ invite_code: string; message: string }>> => {
  return http.post<HttpRes<{ invite_code: string; message: string }>, object>(`${BASE_URL}/${groupId}/reset-invite-code`, {})
}

/**
 * 通过邀请码加群
 */
export const joinByInviteCode = (inviteCode: string): Promise<HttpRes<{ type: string; message: string; application_id?: number; conversation_id?: number }>> => {
  return http.post<HttpRes<{ type: string; message: string; application_id?: number; conversation_id?: number }>, object>(`${BASE_URL}/join-by-invite`, {
    invite_code: inviteCode,
  })
}

// ==================== 群红包 ====================

/**
 * 发送红包
 */
export const sendPack = (groupId: number, params: SendPackParams): Promise<HttpRes<SendPackResponse>> => {
  return http.post<HttpRes<SendPackResponse>, SendPackParams>(`${BASE_URL}/${groupId}/pack/send`, params)
}

/**
 * 抢红包
 */
export const grabPack = (packId: number): Promise<HttpRes<GrabPackResponse>> => {
  return http.post<HttpRes<GrabPackResponse>, object>(`${BASE_URL}/pack/${packId}/grab`, {})
}

/**
 * 获取红包详情
 */
export const getPackDetail = (packId: number): Promise<HttpRes<GroupPack>> => {
  return http.get<HttpRes<GroupPack>, object>(`${BASE_URL}/pack/${packId}`, {})
}

/**
 * 获取红包领取记录
 */
export const getPackRecords = (packId: number): Promise<HttpRes<PackRecordListResponse>> => {
  return http.get<HttpRes<PackRecordListResponse>, object>(`${BASE_URL}/pack/${packId}/records`, {})
}
