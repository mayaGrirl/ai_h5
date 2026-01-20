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
          <span class="text-white font-bold">免费兑换</span>
          <div class="w-5"></div>
        </div>
      </header>

      <div class="bg-gray-100">
        <div class="bg-white rounded-lg mb-3 overflow-hidden px-3 py-4 mx-3 mt-3">
          <div class="flex items-center justify-between py-3 border-b">
            <span class="text-sm text-gray-700">近7日流水</span>
            <span class="flex items-center gap-1 text-sm text-red-500 font-medium">
              2,961,600
              <img
                src="/ranking/coin.png"
                alt="coin"
                class="inline-block w-[13px] h-[13px]"
              />
            </span>
          </div>
          <div class="flex items-center justify-between py-3 border-b">
            <span class="text-sm text-gray-700">近7日免手续费奖励</span>
            <span class="flex items-center gap-1 text-sm text-red-500 font-medium">
              250,000
              <img
                src="/ranking/coin.png"
                alt="coin"
                class="inline-block w-[13px] h-[13px]"
              />
            </span>
          </div>
          <div class="flex items-center justify-between py-3">
            <span class="text-sm text-gray-700">
              当前可免手续费的兑换额度
            </span>
            <span class="flex items-center gap-1 text-sm text-red-500 font-medium">
              490,400
              <img
                src="/ranking/coin.png"
                alt="coin"
                class="inline-block w-[13px] h-[13px]"
              />
            </span>
          </div>
        </div>
      </div>

      <div class="h-14"></div>
    </div>
  </div>
</template>
