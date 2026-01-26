/**
 * 好友与通讯录 API
 */
import http from '@/utils/request'
import type { HttpRes } from '@/types/http.type'
import type {
  SearchUserResponse,
  FriendRequestListResponse,
  FriendListResponse,
  ContactsResponse,
  SystemMessageListResponse,
} from '@/types/friend.type'

const BASE_URL = '/api/app/v1/friend'

// ==================== 搜索与申请 ====================

/**
 * 搜索用户
 */
export const searchUsers = (keyword: string): Promise<HttpRes<SearchUserResponse>> => {
  return http.get<HttpRes<SearchUserResponse>, object>(`${BASE_URL}/search`, { keyword })
}

/**
 * 发送好友申请
 */
export const sendFriendRequest = (toMemberId: number, message?: string): Promise<HttpRes<string>> => {
  return http.post<HttpRes<string>, object>(`${BASE_URL}/request`, {
    to_member_id: toMemberId,
    message,
  })
}

/**
 * 获取好友申请列表
 */
export const getFriendRequests = (page = 1, size = 20): Promise<HttpRes<FriendRequestListResponse>> => {
  return http.get<HttpRes<FriendRequestListResponse>, object>(`${BASE_URL}/requests`, { page, size })
}

/**
 * 处理好友申请
 */
export const handleFriendRequest = (requestId: number, action: 'accept' | 'reject'): Promise<HttpRes<string>> => {
  return http.post<HttpRes<string>, object>(`${BASE_URL}/request/handle`, {
    request_id: requestId,
    action,
  })
}

// ==================== 好友列表 ====================

/**
 * 获取好友列表
 */
export const getFriendList = (page = 1, size = 50): Promise<HttpRes<FriendListResponse>> => {
  return http.get<HttpRes<FriendListResponse>, object>(`${BASE_URL}/list`, { page, size })
}

/**
 * 获取通讯录（系统联系人 + 好友）
 */
export const getContacts = (): Promise<HttpRes<ContactsResponse>> => {
  return http.get<HttpRes<ContactsResponse>, object>(`${BASE_URL}/contacts`, {})
}

// ==================== 好友管理 ====================

/**
 * 删除好友
 */
export const deleteFriend = (friendId: number): Promise<HttpRes<string>> => {
  return http.post<HttpRes<string>, object>(`${BASE_URL}/delete`, {
    friend_id: friendId,
  })
}

/**
 * 设置好友备注
 */
export const setFriendRemark = (friendId: number, remark: string): Promise<HttpRes<string>> => {
  return http.post<HttpRes<string>, object>(`${BASE_URL}/remark`, {
    friend_id: friendId,
    remark,
  })
}

/**
 * 设置好友置顶
 */
export const setFriendTop = (friendId: number, isTop: boolean): Promise<HttpRes<string>> => {
  return http.post<HttpRes<string>, object>(`${BASE_URL}/top`, {
    friend_id: friendId,
    is_top: isTop,
  })
}

// ==================== 系统消息 ====================

/**
 * 获取系统消息列表
 */
export const getSystemMessages = (page = 1, size = 20, type?: string): Promise<HttpRes<SystemMessageListResponse>> => {
  return http.get<HttpRes<SystemMessageListResponse>, object>(`${BASE_URL}/system-messages`, { page, size, type })
}

/**
 * 标记系统消息已读
 */
export const markSystemMessageRead = (messageId?: number, markAll = false): Promise<HttpRes<{ marked_count: number }>> => {
  return http.post<HttpRes<{ marked_count: number }>, object>(`${BASE_URL}/system-messages/read`, {
    message_id: messageId,
    mark_all: markAll,
  })
}

/**
 * 获取系统消息未读数
 */
export const getSystemMessageUnread = (): Promise<HttpRes<{ unread_count: number }>> => {
  return http.get<HttpRes<{ unread_count: number }>, object>(`${BASE_URL}/system-messages/unread`, {})
}
