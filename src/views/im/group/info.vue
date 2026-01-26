<script setup lang="ts">
/**
 * 群详情页面（非成员查看）
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Users } from 'lucide-vue-next'
import { toast } from '@/composables/useToast'
import { searchGroups, applyToJoin } from '@/api/group'
import type { GroupSearchResult } from '@/types/group.type'
import { JoinMode } from '@/types/group.type'

const router = useRouter()
const route = useRoute()

const groupNumber = computed(() => route.query.number as string)
const group = ref<GroupSearchResult | null>(null)
const isLoading = ref(true)
const isJoining = ref(false)

// 加载群信息
async function loadGroupInfo() {
  if (!groupNumber.value) return

  isLoading.value = true

  try {
    const res = await searchGroups(groupNumber.value)

    if (res.code === 200 && res.data.list.length > 0) {
      group.value = res.data.list[0]
    } else {
      toast.error('群不存在')
    }
  } catch (error) {
    toast.error('加载失败')
  } finally {
    isLoading.value = false
  }
}

// 申请加入
async function handleJoin() {
  if (!group.value || isJoining.value) return

  isJoining.value = true

  try {
    const res = await applyToJoin(group.value.id)

    if (res.code === 200) {
      if (res.data.type === 'joined') {
        toast.success('已加入群聊')
        router.replace(`/im/chat/${res.data.conversation_id}`)
      } else {
        toast.success(res.data.message)
        router.back()
      }
    } else {
      toast.error(res.message || '申请失败')
    }
  } catch (error) {
    toast.error('申请失败')
  } finally {
    isJoining.value = false
  }
}

// 返回
function goBack() {
  router.back()
}

onMounted(() => {
  loadGroupInfo()
})
</script>

<template>
  <div class="group-info-page">
    <!-- 头部 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <ArrowLeft :size="24" />
      </button>
      <h1 class="title">群详情</h1>
      <div class="placeholder"></div>
    </div>

    <div v-if="isLoading" class="loading">加载中...</div>

    <div v-else-if="group" class="group-content">
      <!-- 群信息卡片 -->
      <div class="group-card">
        <img
          :src="group.avatar || '/default-group.png'"
          class="group-avatar"
          alt=""
        />
        <div class="group-name">{{ group.name }}</div>
        <div class="group-number">群号: {{ group.group_number }}</div>

        <div class="group-stats">
          <div class="stat-item">
            <Users :size="20" />
            <span>{{ group.member_count }} 人</span>
          </div>
        </div>

        <div v-if="group.description" class="group-desc">
          {{ group.description }}
        </div>

        <div class="join-mode-info">
          <span class="label">加入方式:</span>
          <span class="value">{{ group.join_mode_text }}</span>
        </div>
      </div>

      <!-- 加入按钮 -->
      <button
        v-if="group.join_mode !== JoinMode.INVITE_ONLY"
        class="join-btn"
        @click="handleJoin"
      >
        {{ group.join_mode === JoinMode.FREE ? '加入群聊' : '申请加入' }}
      </button>

      <div v-else class="invite-only-tip">
        该群仅限邀请加入
      </div>
    </div>

    <div v-else class="not-found">
      群不存在
    </div>
  </div>
</template>

<style scoped>
.group-info-page {
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

.loading,
.not-found {
  text-align: center;
  padding: 80px;
  color: #999;
  font-size: 14px;
}

.group-content {
  padding: 20px 16px;
}

.group-card {
  background: #fff;
  border-radius: 16px;
  padding: 30px 20px;
  text-align: center;
}

.group-avatar {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  object-fit: cover;
  margin-bottom: 16px;
}

.group-name {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.group-number {
  font-size: 14px;
  color: #999;
  margin-bottom: 16px;
}

.group-stats {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.group-desc {
  font-size: 14px;
  color: #666;
  background: #f9f9f9;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  text-align: left;
}

.join-mode-info {
  display: flex;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
}

.join-mode-info .label {
  color: #999;
}

.join-mode-info .value {
  color: #07c160;
}

.join-btn {
  display: block;
  width: 100%;
  padding: 14px;
  margin-top: 20px;
  background: #07c160;
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.join-btn:active {
  background: #06ad56;
}

.invite-only-tip {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}
</style>
