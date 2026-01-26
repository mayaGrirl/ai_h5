<script setup lang="ts">
/**
 * 搜索群页面
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Search, Users } from 'lucide-vue-next'
import { toast } from '@/composables/useToast'
import { searchGroups, applyToJoin } from '@/api/group'
import type { GroupSearchResult } from '@/types/group.type'

const router = useRouter()
const { t } = useI18n()

const keyword = ref('')
const groups = ref<GroupSearchResult[]>([])
const isLoading = ref(false)
const hasMore = ref(true)
const page = ref(1)

// 搜索群
async function handleSearch() {
  if (!keyword.value.trim()) {
    toast.warning(t('im.group_search.enter_keyword'))
    return
  }

  page.value = 1
  groups.value = []
  hasMore.value = true
  await loadGroups()
}

// 加载群列表
async function loadGroups() {
  if (isLoading.value || !hasMore.value) return

  isLoading.value = true

  try {
    const res = await searchGroups(keyword.value.trim(), page.value)

    if (res.code === 200) {
      if (page.value === 1) {
        groups.value = res.data.list
      } else {
        groups.value.push(...res.data.list)
      }

      hasMore.value = res.data.list.length >= res.data.pagination.size
      page.value++
    } else {
      toast.error(res.message || t('im.group_search.search_failed'))
    }
  } catch (error) {
    toast.error(t('im.group_search.search_failed'))
  } finally {
    isLoading.value = false
  }
}

// 点击群 - 如果已加入直接进入聊天，否则申请入群
const isJoining = ref(false)

function handleGroupClick(group: GroupSearchResult) {
  if (group.is_member && group.conversation_id) {
    // 已是群成员，直接进入群聊
    router.push(`/im/chat/${group.conversation_id}`)
  } else {
    // 未加入，申请入群
    handleJoin(group)
  }
}

async function handleJoin(group: GroupSearchResult) {
  if (isJoining.value) return
  isJoining.value = true

  try {
    const res = await applyToJoin(group.id)

    if (res.code === 200) {
      if (res.data.type === 'joined') {
        toast.success(t('im.group_search.joined_group'))
        // 跳转到群聊页面
        router.push(`/im/chat/${res.data.conversation_id}`)
      } else {
        toast.success(res.data.message)
      }
    } else {
      toast.error(res.message || t('im.group_search.apply_failed'))
    }
  } catch (error) {
    toast.error(t('im.group_search.apply_failed'))
  } finally {
    isJoining.value = false
  }
}

// 返回
function goBack() {
  router.back()
}
</script>

<template>
  <div class="search-group-page">
    <!-- 头部 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <ArrowLeft :size="24" />
      </button>
      <div class="search-box">
        <Search :size="16" color="#999" />
        <input
          v-model="keyword"
          type="text"
          :placeholder="t('im.group_search.placeholder')"
          @keyup.enter="handleSearch"
        />
      </div>
      <button class="search-btn" @click="handleSearch">
        {{ t('im.group_search.search') }}
      </button>
    </div>

    <!-- 群列表 -->
    <div class="group-list">
      <div
        v-for="group in groups"
        :key="group.id"
        class="group-item"
        @click="handleGroupClick(group)"
      >
        <img
          :src="group.avatar || '/default-group.png'"
          class="group-avatar"
          alt=""
        />
        <div class="group-info">
          <div class="group-name">{{ group.name }}</div>
          <div class="group-meta">
            <span class="group-number">{{ t('im.group_search.group_number') }}: {{ group.group_number }}</span>
            <span class="member-count">
              <Users :size="12" />
              {{ group.member_count }}
            </span>
          </div>
          <div v-if="group.description" class="group-desc">
            {{ group.description }}
          </div>
        </div>
        <button
          class="join-btn"
          :class="{ 'is-member': group.is_member }"
          @click.stop="handleGroupClick(group)"
        >
          {{ group.is_member ? t('im.group_search.enter') : (group.join_mode === 2 ? t('im.group_search.join') : t('im.group_search.apply')) }}
        </button>
      </div>

      <div v-if="groups.length === 0 && !isLoading" class="empty-tip">
        {{ keyword ? t('im.group_search.no_result') : t('im.group_search.enter_to_search') }}
      </div>

      <div v-if="isLoading" class="loading-tip">
        {{ t('im.ui.loading') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-group-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
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
  flex-shrink: 0;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
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

.search-btn {
  padding: 8px 16px;
  background: #07c160;
  color: #fff;
  border: none;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
}

.group-list {
  padding: 12px;
}

.group-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 12px;
}

.group-avatar {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  object-fit: cover;
  flex-shrink: 0;
}

.group-info {
  flex: 1;
  min-width: 0;
}

.group-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.group-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #999;
  margin-bottom: 6px;
}

.member-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

.group-desc {
  font-size: 13px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.join-btn {
  padding: 6px 16px;
  background: #07c160;
  color: #fff;
  border: none;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
}

.join-btn.is-member {
  background: #1989fa;
}

.empty-tip,
.loading-tip {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 14px;
}
</style>
