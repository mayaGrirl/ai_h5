import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * 登录检查组合式函数
 * 未登录时重定向到登录页
 */
export function useRequireLogin() {
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()

  onMounted(() => {
    if (!authStore.isLogin) {
      router.push({
        path: '/auth/login',
        query: { redirect: route.fullPath }
      })
    }
  })

  return {
    isLogin: authStore.isLogin
  }
}
