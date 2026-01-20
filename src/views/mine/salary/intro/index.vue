<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getBlockByIdentifier } from '@/api/common'

const content = ref<string | null>(null)
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  try {
    const { data } = await getBlockByIdentifier('customer_salary_intro_tips')
    content.value = data?.content || ''
  } catch (error) {
    console.error('获取内容失败', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="px-4 py-4 bg-white rounded-lg">
    <div class="flex items-center mb-2">
      累计获得工资
      <span class="text-red-500 font-semibold ml-1">49</span>
      <img
        class="inline-block w-[13px] h-[13px]"
        src="/ranking/coin.png"
        alt="gold"
      />
    </div>

    <!-- 异步加载工资简介 -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 12" :key="i" class="h-4 bg-gray-200 rounded animate-pulse"></div>
    </div>
    <div
      v-else
      class="prose prose-sm max-w-none text-gray-700"
      v-html="content"
    ></div>
  </div>
</template>
