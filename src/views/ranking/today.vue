<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 重定向到主排行页面
onMounted(() => {
  router.replace('/ranking?tab=today')
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-gray-500">跳转中...</div>
  </div>
</template>
