<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui'

const router = useRouter()
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
    <h1 class="mb-2 text-6xl font-bold text-gray-300">404</h1>
    <p class="mb-6 text-gray-500">页面不存在</p>
    <Button @click="router.push('/')">
      返回首页
    </Button>
  </div>
</template>
