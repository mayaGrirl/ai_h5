<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Toast from '@/components/Toast.vue'

const router = useRouter()
const authStore = useAuthStore()

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

// 初始化时获取用户信息
onMounted(async () => {
  if (authStore.isLogin && authStore.token) {
    await authStore.fetchCurrentCustomer()
  }
})
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <Transition :name="transitionName" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
  <Toast />
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
