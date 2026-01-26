<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useIMStore } from '@/stores/im'
import Toast from '@/components/Toast.vue'
import ErrorBoundary from '@/components/ErrorBoundary.vue'
import VoiceCallModal from '@/components/VoiceCallModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const imStore = useIMStore()

// 页面过渡动画名称
const transitionName = ref('page-fade')

// 记录路由历史深度
const routeDepth = ref(0)
const depthMap = new Map<string, number>()

// 监听路由变化，根据导航方向设置动画
watch(
  () => router.currentRoute.value,
  (to, from) => {
    if (!from?.path) {
      transitionName.value = 'page-fade'
      return
    }

    // 获取或设置路由深度
    if (!depthMap.has(to.path)) {
      depthMap.set(to.path, routeDepth.value + 1)
    }

    const toDepth = depthMap.get(to.path) || 0
    const fromDepth = depthMap.get(from.path) || 0

    // 根据深度判断是前进还是后退
    if (toDepth > fromDepth) {
      transitionName.value = 'slide-right'
      routeDepth.value = toDepth
    } else if (toDepth < fromDepth) {
      transitionName.value = 'slide-back'
      routeDepth.value = toDepth
    } else {
      transitionName.value = 'page-fade'
    }
  }
)

// 初始化时获取用户信息并建立 IM 连接
onMounted(async () => {
  if (authStore.isLogin && authStore.token) {
    await authStore.fetchCurrentCustomer()
    // 全局初始化 IM 连接，确保能接收语音通话等实时消息
    await imStore.init()
    console.log('[App] IM store initialized for voice calls')
  }
})

// 监听登录状态变化，登录后初始化 IM 连接
watch(
  () => authStore.isLogin,
  async (isLogin) => {
    if (isLogin && authStore.token && !imStore.isConnected) {
      console.log('[App] User logged in, initializing IM connection...')
      await imStore.init()
      console.log('[App] IM store initialized after login')
    }
  }
)
</script>

<template>
  <ErrorBoundary>
    <RouterView v-slot="{ Component, route }">
      <Transition :name="transitionName" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
    <Toast />
    <!-- 语音通话弹窗（全局） -->
    <VoiceCallModal />
  </ErrorBoundary>
</template>

<style scoped>
/* 确保过渡动画中的页面层叠正确 */
:deep(.slide-right-leave-active),
:deep(.slide-back-leave-active) {
  z-index: 0;
}

:deep(.slide-right-enter-active),
:deep(.slide-back-enter-active) {
  z-index: 1;
}
</style>
