<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getPartners } from '@/api/home'
import { useLocalized } from '@/composables/useLocalized'
import type { IndexDataItem } from '@/types/index.type'
import PageHeader from '@/components/PageHeader.vue'
import PageLoading from '@/components/PageLoading.vue'
import PageEmpty from '@/components/PageEmpty.vue'

const { t } = useI18n()
const { localize } = useLocalized()

const loading = ref(true)
const partners = ref<IndexDataItem[]>([])

const loadData = async () => {
  try {
    loading.value = true
    const res = await getPartners()
    if (res.code === 200) {
      partners.value = res.data || []
    }
  } catch (error) {
    console.error('加载合作商家失败:', error)
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
    <PageHeader :title="t('home.partners')" />

    <PageLoading v-if="loading" />

    <template v-else>
      <PageEmpty v-if="partners.length === 0" />

      <div v-else class="grid grid-cols-2 gap-3 p-4">
        <div
          v-for="item in partners"
          :key="item.id"
          class="rounded-lg bg-white p-4 text-center shadow-sm"
        >
          <img
            v-if="item.pic"
            :src="item.pic"
            :alt="localize(item.lang_title as Record<string, string> | null, item.title)"
            class="mx-auto mb-2 h-16 w-16 rounded-lg object-cover"
          />
          <h3 class="text-sm font-medium text-gray-800">{{ localize(item.lang_title as Record<string, string> | null, item.title) }}</h3>
        </div>
      </div>
    </template>
  </div>
</template>
