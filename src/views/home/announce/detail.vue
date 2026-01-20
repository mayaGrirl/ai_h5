<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getIndexDetail } from '@/api/home'
import { useLocalized } from '@/composables/useLocalized'
import type { IndexDataItem } from '@/types/index.type'
import PageHeader from '@/components/PageHeader.vue'
import PageLoading from '@/components/PageLoading.vue'

const route = useRoute()
const { localize } = useLocalized()

const loading = ref(true)
const detail = ref<IndexDataItem | null>(null)

const loadData = async () => {
  try {
    loading.value = true
    const id = Number(route.params.id)
    const res = await getIndexDetail(id)
    if (res.code === 200) {
      detail.value = res.data
    }
  } catch (error) {
    console.error('加载详情失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <PageHeader :title="detail ? localize(detail.lang_title as Record<string, string> | null, detail.title) : '公告详情'" />

    <PageLoading v-if="loading" />

    <div v-else-if="detail" class="bg-white p-4">
      <h1 class="mb-2 text-lg font-medium">{{ localize(detail.lang_title as Record<string, string> | null, detail.title) }}</h1>
      <p class="mb-4 text-sm text-gray-500">{{ detail.created_at }}</p>
      <div class="prose prose-sm max-w-none" v-html="localize(detail.lang_content as Record<string, string> | null, detail.content)"></div>
    </div>
  </div>
</template>
