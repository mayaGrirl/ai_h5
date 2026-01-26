<script setup lang="ts">
/**
 * 群设置页面
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, ChevronRight, Users, Bell, BellOff, UserPlus, Crown, LogOut, Trash2, Link, Copy, RefreshCw, Settings, Check } from 'lucide-vue-next'
import { toast } from '@/composables/useToast'
import { getSettings, updateSettings, muteGroup, getInviteLink, resetInviteCode } from '@/api/group'
import { leaveConversation, dissolveGroup } from '@/api/im'
import type { GroupSettings, JoinConditions } from '@/types/group.type'
import { MemberRole, JoinMode } from '@/types/group.type'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const groupId = computed(() => Number(route.params.id))
const settings = ref<GroupSettings | null>(null)
const isLoading = ref(true)

// 是否群主
const isOwner = computed(() => settings.value?.my_role === MemberRole.OWNER)
// 是否管理员或群主
const isAdmin = computed(() => (settings.value?.my_role ?? 0) >= MemberRole.ADMIN)

// 加群方式选项
const joinModeOptions = computed(() => [
  { value: JoinMode.FREE, label: t('im.group_settings.join_mode_free'), desc: t('im.group_settings.join_mode_free_desc') },
  { value: JoinMode.APPLY, label: t('im.group_settings.join_mode_apply'), desc: t('im.group_settings.join_mode_apply_desc') },
  { value: JoinMode.INVITE_ONLY, label: t('im.group_settings.join_mode_invite'), desc: t('im.group_settings.join_mode_invite_desc') },
])

// 入群条件编辑
const showConditionsEditor = ref(false)
const editingConditions = ref<JoinConditions>({})

// 邀请链接
const showInvitePanel = ref(false)
const inviteCode = ref('')

// 获取群设置
async function loadSettings() {
  if (!groupId.value) return

  isLoading.value = true

  try {
    const res = await getSettings(groupId.value)

    if (res.code === 200) {
      settings.value = res.data
      editingConditions.value = { ...res.data.join_conditions }
      if (res.data.invite_code) {
        inviteCode.value = res.data.invite_code
      }
    } else {
      toast.error(res.message || t('im.group_settings.load_failed'))
    }
  } catch (error) {
    toast.error(t('im.group_settings.load_failed'))
  } finally {
    isLoading.value = false
  }
}

// 切换全员禁言
const isMuting = ref(false)

async function toggleMute() {
  if (!settings.value || !isOwner.value || isMuting.value) return

  const newMuted = !settings.value.is_muted
  isMuting.value = true

  try {
    const res = await muteGroup(groupId.value, newMuted)

    if (res.code === 200) {
      settings.value.is_muted = newMuted
      toast.success(newMuted ? t('im.group_settings.all_mute_on') : t('im.group_settings.all_mute_off'))
    } else {
      toast.error(res.message || t('im.group_settings.update_failed'))
    }
  } catch (error) {
    toast.error(t('im.group_settings.update_failed'))
  } finally {
    isMuting.value = false
  }
}

// 切换允许群内加好友
const isUpdating = ref(false)

async function toggleAllowAddFriend() {
  if (!settings.value || !isAdmin.value || isUpdating.value) return

  const newValue = !settings.value.allow_add_friend
  isUpdating.value = true

  try {
    const res = await updateSettings(groupId.value, {
      allow_add_friend: newValue,
    })

    if (res.code === 200) {
      settings.value.allow_add_friend = newValue
      toast.success(t('im.group_settings.update_success'))
    } else {
      toast.error(res.message || t('im.group_settings.update_failed'))
    }
  } catch (error) {
    toast.error(t('im.group_settings.update_failed'))
  } finally {
    isUpdating.value = false
  }
}

// 更改加群方式
async function changeJoinMode(mode: number) {
  if (!settings.value || !isOwner.value || isUpdating.value) return
  if (settings.value.join_mode === mode) return

  isUpdating.value = true

  try {
    const res = await updateSettings(groupId.value, {
      join_mode: mode,
    })

    if (res.code === 200) {
      settings.value.join_mode = mode
      settings.value.join_mode_text = joinModeOptions.value.find(o => o.value === mode)?.label || ''
      toast.success(t('im.group_settings.update_success'))
    } else {
      toast.error(res.message || t('im.group_settings.update_failed'))
    }
  } catch (error) {
    toast.error(t('im.group_settings.update_failed'))
  } finally {
    isUpdating.value = false
  }
}

// 切换邀请入群需审核
async function toggleInviteApproval() {
  if (!settings.value || !isOwner.value || isUpdating.value) return

  const newValue = !settings.value.invite_require_approval
  isUpdating.value = true

  try {
    const res = await updateSettings(groupId.value, {
      invite_require_approval: newValue,
    })

    if (res.code === 200) {
      settings.value.invite_require_approval = newValue
      toast.success(t('im.group_settings.update_success'))
    } else {
      toast.error(res.message || t('im.group_settings.update_failed'))
    }
  } catch (error) {
    toast.error(t('im.group_settings.update_failed'))
  } finally {
    isUpdating.value = false
  }
}

// 保存入群条件
async function saveConditions() {
  if (!settings.value || !isOwner.value || isUpdating.value) return

  isUpdating.value = true

  try {
    const res = await updateSettings(groupId.value, {
      join_conditions: editingConditions.value,
    })

    if (res.code === 200) {
      settings.value.join_conditions = { ...editingConditions.value }
      // 重新获取以更新 join_conditions_text
      await loadSettings()
      showConditionsEditor.value = false
      toast.success(t('im.group_settings.update_success'))
    } else {
      toast.error(res.message || t('im.group_settings.update_failed'))
    }
  } catch (error) {
    toast.error(t('im.group_settings.update_failed'))
  } finally {
    isUpdating.value = false
  }
}

// 获取邀请链接
async function loadInviteLink() {
  if (!groupId.value) return

  try {
    const res = await getInviteLink(groupId.value)
    if (res.code === 200) {
      inviteCode.value = res.data.invite_code
    }
  } catch (error) {
    toast.error(t('im.ui.operation_failed'))
  }
}

// 复制邀请链接
async function copyInviteLink() {
  if (!inviteCode.value) {
    await loadInviteLink()
  }

  const link = `${window.location.origin}/im/group/join/${inviteCode.value}`

  try {
    await navigator.clipboard.writeText(link)
    toast.success(t('im.ui.operation_success'))
  } catch (error) {
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = link
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    toast.success(t('im.ui.operation_success'))
  }
}

// 重置邀请码
const isResetting = ref(false)

async function handleResetInviteCode() {
  if (!isOwner.value || isResetting.value) return

  if (!confirm(t('im.group_settings.reset_invite_confirm'))) return

  isResetting.value = true

  try {
    const res = await resetInviteCode(groupId.value)
    if (res.code === 200) {
      inviteCode.value = res.data.invite_code
      toast.success(t('im.ui.operation_success'))
    } else {
      toast.error(res.message || t('im.ui.operation_failed'))
    }
  } catch (error) {
    toast.error(t('im.ui.operation_failed'))
  } finally {
    isResetting.value = false
  }
}

// 查看群成员
function goToMembers() {
  router.push(`/im/group/${groupId.value}/members`)
}

// 查看入群申请
function goToApplications() {
  router.push(`/im/group/${groupId.value}/applications`)
}

// 退出群聊
const isLeaving = ref(false)

async function handleLeave() {
  if (isLeaving.value) return

  if (!confirm(t('im.group_settings.leave_confirm'))) return

  isLeaving.value = true

  try {
    const res = await leaveConversation(groupId.value)
    if (res.code === 200) {
      toast.success(t('im.group.leave_success'))
      router.replace('/im')
    } else {
      toast.error(res.message || t('im.ui.operation_failed'))
    }
  } catch (error: any) {
    toast.error(error.message || t('im.ui.operation_failed'))
  } finally {
    isLeaving.value = false
  }
}

// 解散群聊
const isDissolving = ref(false)

async function handleDissolve() {
  if (isDissolving.value) return

  if (!confirm(t('im.group_settings.dissolve_confirm'))) return

  isDissolving.value = true

  try {
    const res = await dissolveGroup(groupId.value)
    if (res.code === 200) {
      toast.success(t('im.group.dissolve_success'))
      router.replace('/im')
    } else {
      toast.error(res.message || t('im.ui.operation_failed'))
    }
  } catch (error: any) {
    toast.error(error.message || t('im.ui.operation_failed'))
  } finally {
    isDissolving.value = false
  }
}

// 返回
function goBack() {
  router.back()
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <div class="group-settings-page">
    <!-- 头部 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <ArrowLeft :size="24" />
      </button>
      <h1 class="title">{{ t('im.group_settings.title') }}</h1>
      <div class="placeholder"></div>
    </div>

    <div v-if="isLoading" class="loading">{{ t('im.ui.loading') }}</div>

    <div v-else-if="settings" class="settings-content">
      <!-- 群信息 -->
      <div class="section">
        <div class="group-header">
          <img
            :src="settings.avatar || '/default-group.png'"
            class="group-avatar"
            alt=""
          />
          <div class="group-info">
            <div class="group-name">{{ settings.name }}</div>
            <div class="group-number">{{ t('im.group_settings.group_number') }}: {{ settings.group_number }}</div>
          </div>
        </div>

        <div v-if="settings.description" class="group-desc">
          {{ settings.description }}
        </div>

        <div class="group-meta">
          <div class="meta-item">
            <Users :size="16" />
            <span>{{ settings.member_count }}/{{ settings.max_members }} 人</span>
          </div>
          <div class="meta-item">
            <Crown :size="16" color="#ffc107" />
            <span>{{ settings.owner_nickname }}</span>
          </div>
        </div>
      </div>

      <!-- 成员管理 -->
      <div class="section">
        <div class="section-title">{{ t('im.group_settings.members') }}</div>

        <div class="menu-item" @click="goToMembers">
          <div class="menu-left">
            <Users :size="20" />
            <span>{{ t('im.group_settings.members') }}</span>
          </div>
          <div class="menu-right">
            <span class="menu-value">{{ settings.member_count }}</span>
            <ChevronRight :size="20" color="#ccc" />
          </div>
        </div>

        <div v-if="isAdmin" class="menu-item" @click="goToApplications">
          <div class="menu-left">
            <UserPlus :size="20" />
            <span>{{ t('im.group_applications.title') }}</span>
          </div>
          <div class="menu-right">
            <ChevronRight :size="20" color="#ccc" />
          </div>
        </div>
      </div>

      <!-- 加群设置 -->
      <div class="section">
        <div class="section-title">{{ t('im.group_settings.join_mode') }}</div>

        <!-- 加群方式 -->
        <div v-if="isOwner" class="join-mode-section">
          <div class="subsection-title">{{ t('im.group_settings.join_mode') }}</div>
          <div class="join-mode-options">
            <div
              v-for="option in joinModeOptions"
              :key="option.value"
              class="join-mode-option"
              :class="{ active: settings.join_mode === option.value }"
              @click="changeJoinMode(option.value)"
            >
              <div class="option-check">
                <Check v-if="settings.join_mode === option.value" :size="16" />
              </div>
              <div class="option-content">
                <div class="option-label">{{ option.label }}</div>
                <div class="option-desc">{{ option.desc }}</div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="menu-item">
          <div class="menu-left">
            <span>{{ t('im.group_settings.join_mode') }}</span>
          </div>
          <div class="menu-right">
            <span class="menu-value">{{ settings.join_mode_text }}</span>
          </div>
        </div>

        <!-- 入群条件 -->
        <div v-if="isOwner" class="menu-item" @click="showConditionsEditor = true">
          <div class="menu-left">
            <Settings :size="20" />
            <div class="menu-label">
              <span>入群条件</span>
              <span v-if="settings.join_conditions_text?.length" class="menu-hint">
                {{ settings.join_conditions_text.join('、') }}
              </span>
              <span v-else class="menu-hint">无限制</span>
            </div>
          </div>
          <div class="menu-right">
            <ChevronRight :size="20" color="#ccc" />
          </div>
        </div>
        <div v-else-if="settings.join_conditions_text?.length" class="conditions-display">
          <div class="subsection-title">入群条件</div>
          <div class="condition-tags">
            <span v-for="(cond, index) in settings.join_conditions_text" :key="index" class="condition-tag">
              {{ cond }}
            </span>
          </div>
        </div>

        <!-- 邀请链接 -->
        <div v-if="isAdmin" class="menu-item" @click="showInvitePanel = !showInvitePanel">
          <div class="menu-left">
            <Link :size="20" />
            <div class="menu-label">
              <span>邀请链接</span>
              <span class="menu-hint">分享链接邀请好友入群</span>
            </div>
          </div>
          <div class="menu-right">
            <ChevronRight :size="20" color="#ccc" :class="{ rotated: showInvitePanel }" />
          </div>
        </div>

        <!-- 邀请链接面板 -->
        <div v-if="showInvitePanel && isAdmin" class="invite-panel">
          <div class="invite-actions">
            <button class="invite-btn primary" @click="copyInviteLink">
              <Copy :size="16" />
              复制邀请链接
            </button>
            <button v-if="isOwner" class="invite-btn" @click="handleResetInviteCode">
              <RefreshCw :size="16" :class="{ spinning: isResetting }" />
              重置
            </button>
          </div>

          <!-- 邀请入群是否需要审核 -->
          <div v-if="isOwner" class="invite-approval" @click="toggleInviteApproval">
            <span>通过链接入群需审核</span>
            <button
              type="button"
              class="toggle-switch"
              :class="{ active: settings.invite_require_approval }"
              @click.stop="toggleInviteApproval"
            >
              <span class="toggle-thumb"></span>
            </button>
          </div>
        </div>
      </div>

      <!-- 群设置 -->
      <div class="section">
        <div class="section-title">{{ t('im.group_settings.group_management') }}</div>

        <div v-if="isOwner" class="menu-item" @click="toggleMute">
          <div class="menu-left">
            <BellOff v-if="settings.is_muted" :size="20" />
            <Bell v-else :size="20" />
            <span>{{ t('im.group_settings.all_mute') }}</span>
          </div>
          <div class="menu-right">
            <button
              type="button"
              class="toggle-switch"
              :class="{ active: settings.is_muted }"
              @click.stop="toggleMute"
            >
              <span class="toggle-thumb"></span>
            </button>
          </div>
        </div>

        <div v-if="isAdmin" class="menu-item" @click="toggleAllowAddFriend">
          <div class="menu-left">
            <UserPlus :size="20" />
            <div class="menu-label">
              <span>{{ t('im.group_settings.allow_add_friend') }}</span>
              <span class="menu-hint">{{ t('im.group_settings.allow_add_friend_hint') }}</span>
            </div>
          </div>
          <div class="menu-right">
            <button
              type="button"
              class="toggle-switch"
              :class="{ active: settings.allow_add_friend }"
              @click.stop="toggleAllowAddFriend"
            >
              <span class="toggle-thumb"></span>
            </button>
          </div>
        </div>
      </div>

      <!-- 我在群里 -->
      <div class="section">
        <div class="section-title">{{ t('im.group_settings.other_settings') }}</div>

        <div class="menu-item">
          <div class="menu-left">
            <span>{{ t('im.group_members.role_member') }}</span>
          </div>
          <div class="menu-right">
            <span class="menu-value role-badge" :class="{ owner: isOwner, admin: isAdmin && !isOwner }">
              {{ settings.my_role_text }}
            </span>
          </div>
        </div>
      </div>

      <!-- 操作区 -->
      <div class="action-section">
        <button
          v-if="!isOwner"
          class="action-btn leave-btn"
          @click="handleLeave"
        >
          <LogOut :size="20" />
          {{ t('im.group_settings.leave_group') }}
        </button>

        <button
          v-if="isOwner"
          class="action-btn dissolve-btn"
          @click="handleDissolve"
        >
          <Trash2 :size="20" />
          {{ t('im.group_settings.dissolve_group') }}
        </button>
      </div>
    </div>

    <!-- 入群条件编辑弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showConditionsEditor" class="modal-overlay" @click.self="showConditionsEditor = false">
          <div class="modal-content">
            <div class="modal-header">
              <span>设置入群条件</span>
              <button class="close-btn" @click="showConditionsEditor = false">&times;</button>
            </div>
            <div class="modal-body">
              <div class="condition-item">
                <label>最低用户等级 (VIP)</label>
                <input
                  v-model.number="editingConditions.min_level"
                  type="number"
                  min="0"
                  max="10"
                  placeholder="0 表示无限制"
                />
              </div>
              <div class="condition-item">
                <label>最低投注流水</label>
                <input
                  v-model.number="editingConditions.min_bet_amount"
                  type="number"
                  min="0"
                  placeholder="0 表示无限制"
                />
              </div>
              <div class="condition-item">
                <label>最低充值金额</label>
                <input
                  v-model.number="editingConditions.min_recharge"
                  type="number"
                  min="0"
                  placeholder="0 表示无限制"
                />
              </div>
              <div class="condition-item">
                <label>最低账户余额</label>
                <input
                  v-model.number="editingConditions.min_balance"
                  type="number"
                  min="0"
                  placeholder="0 表示无限制"
                />
              </div>
              <div class="condition-item">
                <label>最低注册天数</label>
                <input
                  v-model.number="editingConditions.min_days"
                  type="number"
                  min="0"
                  max="365"
                  placeholder="0 表示无限制"
                />
              </div>
            </div>
            <div class="modal-footer">
              <button class="modal-btn cancel" @click="showConditionsEditor = false">{{ t('im.ui.cancel') }}</button>
              <button class="modal-btn confirm" @click="saveConditions" :disabled="isUpdating">
                {{ isUpdating ? t('im.ui.loading') : t('im.ui.save') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.group-settings-page {
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

.loading {
  text-align: center;
  padding: 60px;
  color: #999;
}

.settings-content {
  padding: 12px;
}

.section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  color: #999;
  margin-bottom: 12px;
}

.subsection-title {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.group-avatar {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: cover;
}

.group-info {
  flex: 1;
}

.group-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.group-number {
  font-size: 13px;
  color: #999;
}

.group-desc {
  font-size: 14px;
  color: #666;
  background: #f9f9f9;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.group-meta {
  display: flex;
  gap: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #333;
  font-size: 16px;
}

.menu-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.menu-hint {
  font-size: 12px;
  color: #999;
}

.menu-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-right .rotated {
  transform: rotate(90deg);
  transition: transform 0.2s;
}

.menu-value {
  color: #999;
  font-size: 14px;
}

/* 加群方式选项 */
.join-mode-section {
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f5;
  margin-bottom: 12px;
}

.join-mode-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.join-mode-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.join-mode-option.active {
  border-color: #07c160;
  background: #f0fff4;
}

.option-check {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.join-mode-option.active .option-check {
  border-color: #07c160;
  background: #07c160;
  color: #fff;
}

.option-content {
  flex: 1;
}

.option-label {
  font-size: 15px;
  color: #333;
  margin-bottom: 2px;
}

.option-desc {
  font-size: 12px;
  color: #999;
}

/* 入群条件显示 */
.conditions-display {
  padding: 12px 0;
}

.condition-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.condition-tag {
  padding: 4px 10px;
  background: #f0f0f0;
  border-radius: 12px;
  font-size: 12px;
  color: #666;
}

/* 邀请面板 */
.invite-panel {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-top: 8px;
}

.invite-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.invite-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  background: #f0f0f0;
  color: #333;
}

.invite-btn.primary {
  flex: 1;
  justify-content: center;
  background: #07c160;
  color: #fff;
}

.invite-btn .spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.invite-approval {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #eee;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.role-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.role-badge.owner {
  background: #fff3cd;
  color: #856404;
}

.role-badge.admin {
  background: #d4edda;
  color: #155724;
}

.action-section {
  padding: 20px 0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  cursor: pointer;
}

.leave-btn {
  background: #fff;
  color: #ff6b6b;
}

.dissolve-btn {
  background: #ff6b6b;
  color: #fff;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  background: #ddd;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.3s;
}

.toggle-switch.active {
  background: #07c160;
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-switch.active .toggle-thumb {
  transform: translateX(20px);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
}

.modal-body {
  padding: 16px;
}

.condition-item {
  margin-bottom: 16px;
}

.condition-item:last-child {
  margin-bottom: 0;
}

.condition-item label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.condition-item input {
  width: 100%;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 16px;
  background: #f9f9f9;
}

.condition-item input:focus {
  outline: none;
  border-color: #07c160;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #eee;
}

.modal-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.modal-btn.cancel {
  background: #f5f5f5;
  color: #666;
}

.modal-btn.confirm {
  background: #07c160;
  color: #fff;
}

.modal-btn.confirm:disabled {
  background: #ccc;
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
