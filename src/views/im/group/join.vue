<script setup lang="ts">
/**
 * 通过邀请链接加群页面
 */
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Users, Loader } from 'lucide-vue-next'
import { toast } from '@/composables/useToast'
import { joinByInviteCode } from '@/api/group'

const router = useRouter()
const route = useRoute()

const inviteCode = ref('')
const isJoining = ref(false)
const error = ref('')

// 加群
async function handleJoin() {
  if (!inviteCode.value || isJoining.value) return

  isJoining.value = true
  error.value = ''

  try {
    const res = await joinByInviteCode(inviteCode.value)

    if (res.code === 200) {
      if (res.data.type === 'joined') {
        toast.success(res.data.message)
        // 跳转到群聊页面
        router.replace(`/im/chat/${res.data.conversation_id}`)
      } else if (res.data.type === 'pending') {
        toast.success(res.data.message)
        // 跳转到消息页面
        router.replace('/im')
      }
    } else {
      error.value = res.message || '加群失败'
    }
  } catch (err: any) {
    error.value = err.message || '加群失败'
  } finally {
    isJoining.value = false
  }
}

// 返回
function goBack() {
  router.replace('/im')
}

onMounted(() => {
  // 从路由参数获取邀请码
  const code = route.params.code as string
  if (code) {
    inviteCode.value = code
    // 自动尝试加群
    handleJoin()
  }
})
</script>

<template>
  <div class="join-page">
    <div class="join-card">
      <div class="icon-wrapper">
        <Users :size="48" color="#07c160" />
      </div>

      <h2 class="title">加入群聊</h2>

      <div v-if="isJoining" class="loading-state">
        <Loader :size="32" class="spinner" />
        <span>正在加入群聊...</span>
      </div>

      <div v-else-if="error" class="error-state">
        <p class="error-text">{{ error }}</p>
        <button class="retry-btn" @click="handleJoin">重试</button>
        <button class="back-btn" @click="goBack">返回消息</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.join-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.join-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px 30px;
  text-align: center;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.icon-wrapper {
  width: 80px;
  height: 80px;
  background: #f0fff4;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 24px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #666;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.error-text {
  color: #ee0a24;
  font-size: 14px;
  margin-bottom: 8px;
}

.retry-btn,
.back-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.retry-btn {
  background: #07c160;
  color: #fff;
}

.back-btn {
  background: #f5f5f5;
  color: #666;
}
</style>
