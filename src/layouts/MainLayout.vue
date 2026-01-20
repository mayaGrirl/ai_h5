<script setup lang="ts">
import TabBar from '@/components/TabBar.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col bg-gray-50">
    <!-- 页面内容区域 -->
    <main class="flex-1 pb-14">
      <RouterView />
    </main>

    <!-- 底部导航 -->
    <TabBar />
  </div>
</template>
