<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="flex min-h-screen justify-center bg-[#eef3f8]">
    <div class="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
      <!-- 头部 -->
      <header class="sticky top-0 z-40 bg-gradient-to-r from-red-600 to-red-500">
        <div class="flex h-12 items-center justify-between px-3">
          <button @click="goBack" class="flex items-center text-white">
            <ChevronLeft class="h-5 w-5" />
          </button>
          <span class="text-white font-bold">更多消息</span>
          <div class="w-5"></div>
        </div>
      </header>

      <div class="flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border-dashed p-6 text-center text-balance md:p-12">
        <div class="flex max-w-sm flex-col items-center gap-2 text-center">
          <div class="text-lg font-medium tracking-tight">
            暂无更多消息
          </div>
          <div class="text-gray-500 text-sm">
            您目前没有新的消息通知
          </div>
        </div>
      </div>

      <div class="h-14"></div>
    </div>
  </div>
</template>
