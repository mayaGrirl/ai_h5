/**
 * 好友与通讯录状态管理
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as friendApi from '@/api/friend'
import { API_SUCCESS_CODE } from '@/types/http.type'
import { useIMStore } from '@/stores/im'
import type {
  SearchUser,
  FriendRequest,
  Contact,
  SystemMessage,
} from '@/types/friend.type'

export const useFriendStore = defineStore('friend', () => {
  // ==================== 状态 ====================
  const contacts = ref<{ system: Contact[]; friends: Contact[] }>({ system: [], friends: [] })
  const friendRequests = ref<FriendRequest[]>([])
  const systemMessages = ref<SystemMessage[]>([])

  const pendingRequestCount = ref(0)
  const systemMessageUnread = ref(0)

  const isLoading = ref(false)
  const searchResults = ref<SearchUser[]>([])

  // ==================== 计算属性 ====================
  const allContacts = computed(() => {
    return [...contacts.value.system, ...contacts.value.friends]
  })

  const totalUnread = computed(() => {
    return pendingRequestCount.value + systemMessageUnread.value
  })

  // ==================== 搜索与申请 ====================

  /**
   * 搜索用户
   */
  async function searchUsers(keyword: string) {
    if (!keyword || keyword.length < 2) {
      searchResults.value = []
      return
    }

    try {
      isLoading.value = true
      const res = await friendApi.searchUsers(keyword)
      if (res.code === API_SUCCESS_CODE && res.data) {
        searchResults.value = res.data.list
      }
    } catch (error) {
      console.error('Search users failed:', error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 发送好友申请
   */
  async function sendFriendRequest(toMemberId: number, message?: string): Promise<boolean> {
    try {
      const res = await friendApi.sendFriendRequest(toMemberId, message)
      if (res.code === API_SUCCESS_CODE) {
        // 更新搜索结果中的状态
        const user = searchResults.value.find(u => u.id === toMemberId)
        if (user) {
          user.is_friend = true
        }
        return true
      }
    } catch (error) {
      console.error('Send friend request failed:', error)
    }
    return false
  }

  /**
   * 加载好友申请列表
   */
  async function loadFriendRequests(page = 1) {
    try {
      isLoading.value = true
      const res = await friendApi.getFriendRequests(page)
      if (res.code === API_SUCCESS_CODE && res.data) {
        if (page === 1) {
          friendRequests.value = res.data.list
        } else {
          friendRequests.value.push(...res.data.list)
        }
        pendingRequestCount.value = res.data.pending_count
      }
    } catch (error) {
      console.error('Load friend requests failed:', error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 处理好友申请
   */
  async function handleFriendRequest(requestId: number, action: 'accept' | 'reject'): Promise<boolean> {
    try {
      const res = await friendApi.handleFriendRequest(requestId, action)
      if (res.code === API_SUCCESS_CODE) {
        // 从列表中移除
        friendRequests.value = friendRequests.value.filter(r => r.id !== requestId)
        pendingRequestCount.value = Math.max(0, pendingRequestCount.value - 1)

        // 如果是同意，刷新通讯录
        if (action === 'accept') {
          await loadContacts()
        }
        return true
      }
    } catch (error) {
      console.error('Handle friend request failed:', error)
    }
    return false
  }

  // ==================== 通讯录 ====================

  /**
   * 加载通讯录
   */
  async function loadContacts() {
    try {
      isLoading.value = true
      const res = await friendApi.getContacts()
      if (res.code === API_SUCCESS_CODE && res.data) {
        contacts.value = res.data
      }
    } catch (error) {
      console.error('Load contacts failed:', error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 删除好友
   */
  async function deleteFriend(friendId: number): Promise<boolean> {
    try {
      const res = await friendApi.deleteFriend(friendId)
      if (res.code === API_SUCCESS_CODE) {
        contacts.value.friends = contacts.value.friends.filter(f => f.id !== friendId)
        return true
      }
    } catch (error) {
      console.error('Delete friend failed:', error)
    }
    return false
  }

  /**
   * 设置好友备注
   */
  async function setFriendRemark(friendId: number, remark: string): Promise<boolean> {
    console.log('[FriendStore] setFriendRemark called, friendId:', friendId, 'remark:', remark)
    try {
      const res = await friendApi.setFriendRemark(friendId, remark)
      if (res.code === API_SUCCESS_CODE) {
        const friend = contacts.value.friends.find(f => f.id === friendId)
        console.log('[FriendStore] Found friend:', friend)
        if (friend) {
          friend.remark = remark
          // 更新显示名称：备注优先，其次是昵称
          const displayName = remark || friend.nickname || friend.name
          friend.name = displayName
          console.log('[FriendStore] Updated friend name to:', displayName)

          // 同步更新 IM 聊天列表中的会话名称
          try {
            const imStore = useIMStore()
            console.log('[FriendStore] IM conversations count:', imStore.conversations.length)

            // 查找并更新会话
            const convIndex = imStore.conversations.findIndex(c => c.target?.id === friendId)
            console.log('[FriendStore] Found conversation at index:', convIndex)

            if (convIndex !== -1) {
              imStore.conversations[convIndex].name = displayName
              // 同时更新 target 的 nickname（如果存在）
              if (imStore.conversations[convIndex].target) {
                imStore.conversations[convIndex].target!.nickname = displayName
              }
              console.log('[FriendStore] Updated conversation name')
            }

            // 也更新当前会话（如果匹配）
            if (imStore.currentConversation?.target?.id === friendId) {
              imStore.currentConversation.name = displayName
              if (imStore.currentConversation.target) {
                imStore.currentConversation.target.nickname = displayName
              }
              console.log('[FriendStore] Updated currentConversation name')
            }
          } catch (imError) {
            console.error('[FriendStore] Error updating IM store:', imError)
          }
        }
        return true
      }
    } catch (error) {
      console.error('Set friend remark failed:', error)
    }
    return false
  }

  /**
   * 设置好友置顶
   */
  async function setFriendTop(friendId: number, isTop: boolean): Promise<boolean> {
    try {
      const res = await friendApi.setFriendTop(friendId, isTop)
      if (res.code === API_SUCCESS_CODE) {
        const friend = contacts.value.friends.find(f => f.id === friendId)
        if (friend) {
          friend.is_top = isTop ? 1 : 0
        }
        return true
      }
    } catch (error) {
      console.error('Set friend top failed:', error)
    }
    return false
  }

  // ==================== 系统消息 ====================

  /**
   * 加载系统消息
   */
  async function loadSystemMessages(page = 1, type?: string) {
    try {
      isLoading.value = true
      const res = await friendApi.getSystemMessages(page, 20, type)
      if (res.code === API_SUCCESS_CODE && res.data) {
        if (page === 1) {
          systemMessages.value = res.data.list
        } else {
          systemMessages.value.push(...res.data.list)
        }
        systemMessageUnread.value = res.data.unread_count
      }
    } catch (error) {
      console.error('Load system messages failed:', error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 标记系统消息已读
   */
  async function markSystemMessageRead(messageId?: number, markAll = false): Promise<boolean> {
    try {
      const res = await friendApi.markSystemMessageRead(messageId, markAll)
      if (res.code === API_SUCCESS_CODE) {
        if (markAll) {
          systemMessages.value.forEach(m => m.is_read = 1)
          systemMessageUnread.value = 0
        } else if (messageId) {
          const msg = systemMessages.value.find(m => m.id === messageId)
          if (msg && msg.is_read === 0) {
            msg.is_read = 1
            systemMessageUnread.value = Math.max(0, systemMessageUnread.value - 1)
          }
        }
        return true
      }
    } catch (error) {
      console.error('Mark system message read failed:', error)
    }
    return false
  }

  /**
   * 刷新未读数
   */
  async function refreshUnreadCount() {
    try {
      const res = await friendApi.getSystemMessageUnread()
      if (res.code === API_SUCCESS_CODE && res.data) {
        systemMessageUnread.value = res.data.unread_count
      }
    } catch (error) {
      console.error('Refresh unread count failed:', error)
    }
  }

  /**
   * 处理新系统消息（WebSocket 推送）
   */
  function handleNewSystemMessage(message: SystemMessage) {
    // 添加到列表顶部
    systemMessages.value.unshift(message)
    // 增加未读数
    if (message.is_read === 0) {
      systemMessageUnread.value++
    }
  }

  // ==================== 初始化 ====================

  /**
   * 初始化
   */
  async function init() {
    await Promise.all([
      loadContacts(),
      loadFriendRequests(),
      refreshUnreadCount(),
    ])
  }

  /**
   * 清理
   */
  function cleanup() {
    contacts.value = { system: [], friends: [] }
    friendRequests.value = []
    systemMessages.value = []
    pendingRequestCount.value = 0
    systemMessageUnread.value = 0
    searchResults.value = []
  }

  return {
    // 状态
    contacts,
    friendRequests,
    systemMessages,
    pendingRequestCount,
    systemMessageUnread,
    isLoading,
    searchResults,

    // 计算属性
    allContacts,
    totalUnread,

    // 方法
    searchUsers,
    sendFriendRequest,
    loadFriendRequests,
    handleFriendRequest,
    loadContacts,
    deleteFriend,
    setFriendRemark,
    setFriendTop,
    loadSystemMessages,
    markSystemMessageRead,
    refreshUnreadCount,
    handleNewSystemMessage,
    init,
    cleanup,
  }
})
