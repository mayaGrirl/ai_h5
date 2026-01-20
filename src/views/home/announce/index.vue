<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAnnouncements } from '@/api/home'
import { useLocalized } from '@/composables/useLocalized'
import type { IndexDataItem } from '@/types/index.type'
import PageHeader from '@/components/PageHeader.vue'
import PageLoading from '@/components/PageLoading.vue'
import PageEmpty from '@/components/PageEmpty.vue'

const { t } = useI18n()
const { localize } = useLocalized()

const loading = ref(true)
const announcements = ref<IndexDataItem[]>([])

const loadData = async () => {
  try {
    loading.value = true
    const res = await getAnnouncements()
    if (res.code === 200) {
      announcements.value = res.data || []
    }
  } catch (error) {
    console.error('加载公告失败:', error)
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
    <PageHeader :title="t('home.announcement')" />

    <PageLoading v-if="loading" />

    <template v-else>
      <PageEmpty v-if="announcements.length === 0" />

      <div v-else class="space-y-3 p-4">
        <router-link
          v-for="item in announcements"
          :key="item.id"
          :to="`/index/announce/${item.id}`"
          class="block rounded-lg bg-white p-4 shadow-sm"
        >
          <h3 class="font-medium text-gray-800">{{ localize(item.lang_title as Record<string, string> | null, item.title) }}</h3>
          <p class="mt-1 text-sm text-gray-500">{{ item.created_at }}</p>
        </router-link>
      </div>
    </template>
  </div>
</template>
