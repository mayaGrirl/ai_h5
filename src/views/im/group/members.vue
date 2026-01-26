<script setup lang="ts">
/**
 * 群成员列表页面
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Search, Crown, Shield, MoreVertical, VolumeX, X, UserPlus } from 'lucide-vue-next'
import { toast } from '@/composables/useToast'
import { getMembers, getSettings, kickMember, setAdmin, muteMember } from '@/api/group'
import { useFriendStore } from '@/stores/friend'
import { useAuthStore } from '@/stores/auth'
import type { GroupMember, GroupSettings } from '@/types/group.type'
import { MemberRole } from '@/types/group.type'

const router = useRouter()
const route = useRoute()
const friendStore = useFriendStore()
const authStore = useAuthStore()
const { t } = useI18n()

const groupId = computed(() => Number(route.params.id))
const currentUserId = computed(() => authStore.currentCustomer?.id)
const settings = ref<GroupSettings | null>(null)
const members = ref<GroupMember[]>([])
const searchKeyword = ref('')
const isLoading = ref(true)
const showActionMenu = ref(false)
const selectedMember = ref<GroupMember | null>(null)
const isProcessing = ref(false)

// 是否群主
const isOwner = computed(() => settings.value?.my_role === MemberRole.OWNER)
// 是否管理员或群主
const isAdmin = computed(() => (settings.value?.my_role ?? 0) >= MemberRole.ADMIN)

// 过滤后的成员列表
const filteredMembers = computed(() => {
  if (!searchKeyword.value) return members.value
  const keyword = searchKeyword.value.toLowerCase()
  return members.value.filter(m => m.nickname.toLowerCase().includes(keyword))
})

// 加载数据
async function loadData() {
  if (!groupId.value) return

  isLoading.value = true

  try {
    const [settingsRes, membersRes] = await Promise.all([
      getSettings(groupId.value),
      getMembers(groupId.value),
    ])

    if (settingsRes.code === 200) {
      settings.value = settingsRes.data
    }

    if (membersRes.code === 200) {
      members.value = membersRes.data.list
    }
  } catch (error) {
    toast.error(t('im.ui.load_failed'))
  } finally {
    isLoading.value = false
  }
}

// 检查是否是好友
function isFriend(memberId: number): boolean {
  return friendStore.contacts.friends.some(f => f.id === memberId)
}

// 检查是否可以在群内加好友
const canAddFriendInGroup = computed(() => settings.value?.allow_add_friend === true)

// 显示成员操作菜单
function showMemberActions(member: GroupMember) {
  // 不能操作自己
  if (member.id === currentUserId.value) return

  // 管理员可以管理成员，普通成员只能加好友（如果允许）
  const canManage = isAdmin.value && member.role !== MemberRole.OWNER && (isOwner.value || member.role !== MemberRole.ADMIN)
  const canAddFriend = canAddFriendInGroup.value && !isFriend(member.id)

  if (!canManage && !canAddFriend) return

  selectedMember.value = member
  showActionMenu.value = true
}

// 关闭操作菜单
function closeActionMenu() {
  showActionMenu.value = false
  selectedMember.value = null
}

// 处理成员操作
async function handleMemberAction(action: string) {
  const member = selectedMember.value
  if (!member || isProcessing.value) return

  if (action === 'kick') {
    if (!confirm(t('im.group_members.kick_confirm', { name: member.nickname }))) {
      return
    }
  }

  closeActionMenu()
  isProcessing.value = true

  try {
    let res

    switch (action) {
      case 'setAdmin':
        res = await setAdmin(groupId.value, member.id, true)
        if (res.code === 200) {
          member.role = MemberRole.ADMIN
          member.role_text = '管理员'
        }
        break

      case 'removeAdmin':
        res = await setAdmin(groupId.value, member.id, false)
        if (res.code === 200) {
          member.role = MemberRole.MEMBER
          member.role_text = '成员'
        }
        break

      case 'mute':
        res = await muteMember(groupId.value, member.id, true, 60)
        if (res.code === 200) {
          member.is_muted = true
        }
        break

      case 'unmute':
        res = await muteMember(groupId.value, member.id, false)
        if (res.code === 200) {
          member.is_muted = false
        }
        break

      case 'kick':
        res = await kickMember(groupId.value, member.id)
        if (res.code === 200) {
          members.value = members.value.filter(m => m.id !== member.id)
        }
        break

      case 'addFriend':
        const success = await friendStore.sendFriendRequest(member.id)
        if (success) {
          toast.success(t('im.group_members.friend_request_sent'))
        }
        return // 直接返回，不走下面的判断
    }

    if (res && res.code === 200) {
      toast.success(t('im.ui.operation_success'))
    } else if (res) {
      toast.error(res.message || t('im.ui.operation_failed'))
    }
  } catch (error: any) {
    toast.error(error.message || t('im.ui.operation_failed'))
  } finally {
    isProcessing.value = false
  }
}

// 获取角色图标
function getRoleIcon(role: number) {
  if (role === MemberRole.OWNER) return Crown
  if (role === MemberRole.ADMIN) return Shield
  return null
}

// 返回
function goBack() {
  router.back()
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="members-page">
    <!-- 头部 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <ArrowLeft :size="24" />
      </button>
      <h1 class="title">{{ t('im.group_members.title_with_count', { count: members.length }) }}</h1>
      <div class="placeholder"></div>
    </div>

    <!-- 搜索 -->
    <div class="search-wrapper">
      <div class="search-box">
        <Search :size="16" color="#999" />
        <input
          v-model="searchKeyword"
          type="text"
          :placeholder="t('im.group_members.search_placeholder')"
        />
      </div>
    </div>

    <!-- 成员列表 -->
    <div class="member-list">
      <div v-if="isLoading" class="loading">{{ t('im.ui.loading') }}</div>

      <div
        v-else
        v-for="member in filteredMembers"
        :key="member.id"
        class="member-item"
      >
        <img
          :src="member.avatar || '/default-avatar.png'"
          class="member-avatar"
          alt=""
        />
        <div class="member-info">
          <div class="member-name">
            {{ member.nickname }}
            <component
              v-if="getRoleIcon(member.role)"
              :is="getRoleIcon(member.role)"
              :size="14"
              :color="member.role === MemberRole.OWNER ? '#ffc107' : '#28a745'"
              class="role-icon"
            />
            <span v-if="member.is_muted" class="muted-badge">
              <VolumeX :size="12" />
            </span>
          </div>
          <div class="member-meta">
            <span class="role-text">{{ member.role_text }}</span>
            <span v-if="member.muted_until" class="muted-until">
              禁言至 {{ member.muted_until }}
            </span>
          </div>
        </div>

        <button
          v-if="member.id !== currentUserId && (isAdmin || (canAddFriendInGroup && !isFriend(member.id)))"
          class="action-btn"
          @click="showMemberActions(member)"
        >
          <MoreVertical :size="20" color="#999" />
        </button>
      </div>

      <div v-if="!isLoading && filteredMembers.length === 0" class="empty-tip">
        {{ t('im.group_members.empty') }}
      </div>
    </div>

    <!-- 操作菜单 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showActionMenu" class="action-overlay" @click.self="closeActionMenu">
          <div class="action-sheet">
            <div class="action-sheet-header">
              <span>{{ selectedMember?.nickname }}</span>
              <button class="close-btn" @click="closeActionMenu">
                <X :size="20" />
              </button>
            </div>
            <div class="action-sheet-body">
              <!-- 加好友选项 -->
              <button
                v-if="canAddFriendInGroup && selectedMember && !isFriend(selectedMember.id)"
                class="action-item"
                @click="handleMemberAction('addFriend')"
              >
                <UserPlus :size="18" />
                {{ t('im.group_members.add_friend') }}
              </button>

              <!-- 管理员操作 -->
              <template v-if="isAdmin && selectedMember && selectedMember.role !== MemberRole.OWNER">
                <template v-if="isOwner">
                  <button
                    v-if="selectedMember.role === MemberRole.ADMIN"
                    class="action-item"
                    @click="handleMemberAction('removeAdmin')"
                  >
                    {{ t('im.group_members.remove_admin') }}
                  </button>
                  <button
                    v-else
                    class="action-item"
                    @click="handleMemberAction('setAdmin')"
                  >
                    {{ t('im.group_members.set_admin') }}
                  </button>
                </template>
                <template v-if="isOwner || selectedMember.role !== MemberRole.ADMIN">
                  <button
                    v-if="selectedMember.is_muted"
                    class="action-item"
                    @click="handleMemberAction('unmute')"
                  >
                    {{ t('im.group_members.unmute') }}
                  </button>
                  <button
                    v-else
                    class="action-item"
                    @click="handleMemberAction('mute')"
                  >
                    {{ t('im.group_members.mute') }}
                  </button>
                  <button
                    class="action-item danger"
                    @click="handleMemberAction('kick')"
                  >
                    {{ t('im.group_members.kick') }}
                  </button>
                </template>
              </template>
            </div>
            <button class="action-cancel" @click="closeActionMenu">{{ t('im.ui.cancel') }}</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.members-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.placeholder {
  width: 40px;
}

.search-wrapper {
  padding: 12px 16px;
  background: #fff;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f5f5f5;
  border-radius: 20px;
}

.search-box input {
  flex: 1;
  border: none;
  background: none;
  font-size: 14px;
  outline: none;
}

.member-list {
  padding: 12px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 8px;
}

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.role-icon {
  flex-shrink: 0;
}

.muted-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: #ff6b6b;
  border-radius: 50%;
  color: #fff;
}

.member-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #999;
}

.muted-until {
  color: #ff6b6b;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
}

.loading,
.empty-tip {
  text-align: center;
  padding: 60px;
  color: #999;
  font-size: 14px;
}

/* 操作菜单 */
.action-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.action-sheet {
  width: 100%;
  max-width: 500px;
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.action-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #eee;
  font-size: 16px;
  font-weight: 500;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
}

.action-sheet-body {
  padding: 8px 0;
}

.action-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 16px;
  background: none;
  border: none;
  font-size: 16px;
  color: #333;
  text-align: center;
  cursor: pointer;
}

.action-item:active {
  background: #f5f5f5;
}

.action-item.danger {
  color: #ee0a24;
}

.action-cancel {
  display: block;
  width: 100%;
  padding: 16px;
  margin-top: 8px;
  background: #f5f5f5;
  border: none;
  font-size: 16px;
  color: #666;
  text-align: center;
  cursor: pointer;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
