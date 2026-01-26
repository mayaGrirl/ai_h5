<script setup lang="ts">
/**
 * 创建群页面
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Camera, Check, Search } from 'lucide-vue-next'
import { toast } from '@/composables/useToast'
import { createGroup } from '@/api/group'
import { uploadFile } from '@/api/common'
import { useFriendStore } from '@/stores/friend'

const router = useRouter()
const friendStore = useFriendStore()
const { t } = useI18n()

const groupName = ref('')
const description = ref('')
const avatar = ref('')
const avatarPreview = ref('')
const searchKeyword = ref('')
const selectedMembers = ref<number[]>([])
const isSubmitting = ref(false)
const isUploadingAvatar = ref(false)
const avatarInputRef = ref<HTMLInputElement | null>(null)

// 触发选择头像
function triggerAvatarSelect() {
  avatarInputRef.value?.click()
}

// 处理头像选择
async function handleAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    toast.error(t('im.group_create.select_image'))
    return
  }

  // 验证文件大小 (最大 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error(t('im.group_create.image_size_limit'))
    return
  }

  // 显示预览
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarPreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  // 上传图片
  isUploadingAvatar.value = true
  try {
    const res = await uploadFile(file)
    if (res.code === 200) {
      avatar.value = res.data.file_url
      toast.success(t('im.group_create.avatar_upload_success'))
    } else {
      toast.error(res.message || t('im.ui.upload_failed'))
      avatarPreview.value = ''
    }
  } catch (error) {
    toast.error(t('im.ui.upload_failed'))
    avatarPreview.value = ''
  } finally {
    isUploadingAvatar.value = false
    // 清空 input，允许重复选择同一文件
    input.value = ''
  }
}

// 初始化好友列表
onMounted(async () => {
  if (friendStore.contacts.friends.length === 0) {
    await friendStore.init()
  }
})

// 获取好友列表
const friends = computed(() => {
  const list = friendStore.contacts.friends || []
  if (!searchKeyword.value) return list
  const keyword = searchKeyword.value.toLowerCase()
  return list.filter(f => (f.name || f.nickname || '').toLowerCase().includes(keyword))
})

// 切换选择成员
function toggleMember(memberId: string | number) {
  const id = Number(memberId)
  const index = selectedMembers.value.indexOf(id)
  if (index > -1) {
    selectedMembers.value.splice(index, 1)
  } else {
    selectedMembers.value.push(id)
  }
}

// 是否已选中
function isSelected(memberId: string | number): boolean {
  return selectedMembers.value.includes(Number(memberId))
}

// 创建群
async function handleCreate() {
  if (!groupName.value.trim()) {
    toast.warning(t('im.group_create.enter_group_name'))
    return
  }

  if (groupName.value.length > 50) {
    toast.warning(t('im.group_create.group_name_limit'))
    return
  }

  isSubmitting.value = true

  try {
    const res = await createGroup({
      name: groupName.value.trim(),
      member_ids: selectedMembers.value,
      avatar: avatar.value || undefined,
      description: description.value.trim() || undefined,
    })

    if (res.code === 200) {
      toast.success(t('im.group_create.create_success'))
      // 跳转到群聊页面
      router.replace(`/im/chat/${res.data.conversation_id}`)
    } else {
      toast.error(res.message || t('im.group_create.create_failed'))
    }
  } catch (error) {
    toast.error(t('im.group_create.create_failed'))
  } finally {
    isSubmitting.value = false
  }
}

// 返回
function goBack() {
  router.back()
}
</script>

<template>
  <div class="create-group-page">
    <!-- 头部 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <ArrowLeft :size="24" />
      </button>
      <h1 class="title">{{ t('im.group_create.title') }}</h1>
      <button
        class="submit-btn"
        :disabled="!groupName.trim() || isSubmitting"
        @click="handleCreate"
      >
        <Check :size="24" />
      </button>
    </div>

    <!-- 群信息 -->
    <div class="group-info">
      <div class="avatar-picker" @click="triggerAvatarSelect">
        <input
          ref="avatarInputRef"
          type="file"
          accept="image/*"
          class="hidden-input"
          @change="handleAvatarChange"
        />
        <div v-if="avatarPreview" class="avatar-preview">
          <img :src="avatarPreview" alt="群头像" />
          <div v-if="isUploadingAvatar" class="upload-loading">
            <div class="spinner"></div>
          </div>
        </div>
        <div v-else class="avatar-placeholder">
          <Camera :size="32" color="#999" />
        </div>
        <span class="avatar-tip">{{ avatarPreview ? t('im.group_create.change_avatar') : t('im.group_create.set_avatar') }}</span>
      </div>

      <div class="form-item">
        <label>{{ t('im.group_create.group_name') }}</label>
        <input
          v-model="groupName"
          type="text"
          :placeholder="t('im.group_create.group_name_placeholder')"
          maxlength="50"
        />
      </div>

      <div class="form-item">
        <label>{{ t('im.group_create.group_description') }}</label>
        <textarea
          v-model="description"
          :placeholder="t('im.group_create.group_description_placeholder')"
          rows="3"
          maxlength="200"
        ></textarea>
      </div>
    </div>

    <!-- 选择成员 -->
    <div class="member-section">
      <div class="section-header">
        <span class="section-title">{{ t('im.group_create.select_members') }}</span>
        <span class="selected-count">{{ t('im.group_create.selected_count', { count: selectedMembers.length }) }}</span>
      </div>

      <div class="search-box">
        <Search :size="16" color="#999" />
        <input
          v-model="searchKeyword"
          type="text"
          :placeholder="t('im.group_create.search_friends')"
        />
      </div>

      <div class="member-list">
        <div
          v-for="friend in friends"
          :key="friend.id"
          class="member-item"
          @click="toggleMember(friend.id)"
        >
          <div class="checkbox" :class="{ checked: isSelected(friend.id) }">
            <Check v-if="isSelected(friend.id)" :size="14" color="#fff" />
          </div>
          <img
            :src="friend.avatar || '/default-avatar.png'"
            class="member-avatar"
            alt=""
          />
          <span class="member-name">{{ friend.remark || friend.name || friend.nickname }}</span>
        </div>

        <div v-if="friends.length === 0" class="empty-tip">
          {{ t('im.group_create.no_friends') }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.create-group-page {
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

.back-btn,
.submit-btn {
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

.submit-btn:disabled {
  color: #ccc;
}

.submit-btn:not(:disabled) {
  color: #07c160;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.group-info {
  background: #fff;
  padding: 16px;
  margin-bottom: 12px;
}

.avatar-picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.hidden-input {
  display: none;
}

.avatar-placeholder {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.avatar-preview {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-loading {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.avatar-tip {
  font-size: 12px;
  color: #999;
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.form-item input,
.form-item textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 16px;
  background: #f9f9f9;
}

.form-item textarea {
  resize: none;
}

.member-section {
  background: #fff;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.selected-count {
  font-size: 14px;
  color: #07c160;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 20px;
  margin-bottom: 16px;
}

.search-box input {
  flex: 1;
  border: none;
  background: none;
  font-size: 14px;
  outline: none;
}

.member-list {
  max-height: 400px;
  overflow-y: auto;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
}

.member-item:active {
  background: #f9f9f9;
}

.checkbox {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.checkbox.checked {
  background: #07c160;
  border-color: #07c160;
}

.member-avatar {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
}

.member-name {
  flex: 1;
  font-size: 16px;
  color: #333;
}

.empty-tip {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}
</style>
