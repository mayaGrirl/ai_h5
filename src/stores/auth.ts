import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CustomerField } from '@/types/customer.type'
import { accessToken } from '@/utils/storage/token'
import { currentCustomer } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string | null>(accessToken.getToken() || null)
  const currentCustomerData = ref<CustomerField | null>(null)
  const hydrated = ref(false)

  // 计算属性
  const isLogin = computed(() => !!token.value)

  // 方法
  function setToken(newToken?: string, tokenType?: string, expiresAt?: number) {
    accessToken.setToken(newToken, tokenType, expiresAt)
    token.value = newToken ?? null
    hydrated.value = true
  }

  function setCurrentCustomer(customer: CustomerField | null) {
    currentCustomerData.value = customer
  }

  async function fetchCurrentCustomer() {
    try {
      const res = await currentCustomer()
      if (res.code === 200 && res.data) {
        currentCustomerData.value = res.data
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  function logout() {
    accessToken.remove()
    token.value = null
    currentCustomerData.value = null
    hydrated.value = false
  }

  return {
    // 状态
    token,
    currentCustomer: currentCustomerData,
    hydrated,
    // 计算属性
    isLogin,
    // 方法
    setToken,
    setCurrentCustomer,
    fetchCurrentCustomer,
    logout
  }
}, {
  persist: {
    key: 'auth-store',
    pick: ['token']
  }
})
