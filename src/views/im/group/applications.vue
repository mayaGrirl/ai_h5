<script setup lang="ts">
/**
 * 入群申请列表页面
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Check, X } from 'lucide-vue-next'
import { toast } from '@/composables/useToast'
import { getApplications, handleApplication } from '@/api/group'
import type { GroupApplication } from '@/types/group.type'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const groupId = computed(() => Number(route.params.id))
const applications = ref<GroupApplication[]>([])
const isLoading = ref(true)
const page = ref(1)
const hasMore = ref(true)
const isProcessing = ref(false)

// 加载申请列表
async function loadApplications() {
  if (!groupId.value || isLoading.value) return

  isLoading.value = true

  try {
    const res = await getApplications(groupId.value, page.value)

    if (res.code === 200) {
      if (page.value === 1) {
        applications.value = res.data.list
      } else {
        applications.value.push(...res.data.list)
      }

      hasMore.value = res.data.list.length >= res.data.pagination.size
      page.value++
    } else {
      toast.error(res.message || t('im.ui.load_failed'))
    }
  } catch (error) {
    toast.error(t('im.ui.load_failed'))
  } finally {
    isLoading.value = false
  }
}

// 处理申请
async function handleApply(application: GroupApplication, approve: boolean) {
  if (isProcessing.value) return
  isProcessing.value = true

  try {
    const res = await handleApplication(application.id, approve)

    if (res.code === 200) {
      applications.value = applications.value.filter(a => a.id !== application.id)
      toast.success(approve ? t('im.group.application_approved') : t('im.group.application_rejected'))
    } else {
      toast.error(res.message || t('im.ui.operation_failed'))
    }
  } catch (error) {
    toast.error(t('im.ui.operation_failed'))
  } finally {
    isProcessing.value = false
  }
}

// 返回
function goBack() {
  router.back()
}

onMounted(() => {
  page.value = 1
  loadApplications()
})
</script>

<template>
  <div class="applications-page">
    <!-- 头部 -->
    <div class="header">
      <button class="back-btn" @click="goBack">
        <ArrowLeft :size="24" />
      </button>
      <h1 class="title">{{ t('im.group_applications.title') }}</h1>
      <div class="placeholder"></div>
    </div>

    <!-- 申请列表 -->
    <div class="application-list">
      <div v-if="isLoading && applications.length === 0" class="loading">
        {{ t('im.ui.loading') }}
      </div>

      <div
        v-else
        v-for="app in applications"
        :key="app.id"
        class="application-item"
      >
        <img
          :src="app.avatar || '/default-avatar.png'"
          class="applicant-avatar"
          alt=""
        />
        <div class="application-info">
          <div class="applicant-name">{{ app.nickname }}</div>
          <div v-if="app.message" class="application-message">
            {{ t('im.group_applications.apply_message') }}: {{ app.message }}
          </div>
          <div class="application-time">{{ app.created_at }}</div>
        </div>
        <div class="action-buttons">
          <button class="reject-btn" @click="handleApply(app, false)">
            <X :size="18" />
          </button>
          <button class="approve-btn" @click="handleApply(app, true)">
            <Check :size="18" />
          </button>
        </div>
      </div>

      <div v-if="!isLoading && applications.length === 0" class="empty-tip">
        {{ t('im.group_applications.empty') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.applications-page {
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

.application-list {
  padding: 12px;
}

.application-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 12px;
}

.applicant-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.application-info {
  flex: 1;
  min-width: 0;
}

.applicant-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.application-message {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.application-time {
  font-size: 12px;
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.reject-btn,
.approve-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
}

.reject-btn {
  background: #f5f5f5;
  color: #999;
}

.reject-btn:active {
  background: #eee;
}

.approve-btn {
  background: #07c160;
  color: #fff;
}

.approve-btn:active {
  background: #06ad56;
}

.loading,
.empty-tip {
  text-align: center;
  padding: 60px;
  color: #999;
  font-size: 14px;
}
</style>
