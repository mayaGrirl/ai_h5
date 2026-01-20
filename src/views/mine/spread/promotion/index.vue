<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const spreadUrl = ref('')
const spreadCode = ref('')

onMounted(() => {
  if (authStore.currentCustomer) {
    spreadCode.value = authStore.currentCustomer.spread_code || ''
    spreadUrl.value = `${window.location.origin}/auth/register?code=${spreadCode.value}`
  }
})

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(spreadUrl.value)
    alert('链接已复制到剪贴板')
  } catch (error) {
    console.error('复制失败', error)
  }
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(spreadCode.value)
    alert('邀请码已复制到剪贴板')
  } catch (error) {
    console.error('复制失败', error)
  }
}
</script>

<template>
  <div class="px-4 py-4 bg-white rounded-lg">
    <h3 class="text-lg font-bold mb-4">我的推广</h3>

    <div class="space-y-4">
      <div class="border rounded-lg p-4">
        <div class="text-sm text-gray-500 mb-2">我的邀请码</div>
        <div class="flex items-center justify-between">
          <span class="text-xl font-bold text-red-600">{{ spreadCode || '--' }}</span>
          <button
            @click="copyCode"
            class="px-3 py-1 text-sm bg-red-500 text-white rounded"
          >
            复制
          </button>
        </div>
      </div>

      <div class="border rounded-lg p-4">
        <div class="text-sm text-gray-500 mb-2">推广链接</div>
        <div class="text-sm text-gray-700 break-all mb-2">{{ spreadUrl || '--' }}</div>
        <button
          @click="copyUrl"
          class="w-full py-2 text-sm bg-red-500 text-white rounded"
        >
          复制推广链接
        </button>
      </div>
    </div>
  </div>
</template>
