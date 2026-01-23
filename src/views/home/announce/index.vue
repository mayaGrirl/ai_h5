<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getAnnouncements, getIndexDetail } from '@/api/home'
import { useLocalized } from '@/composables/useLocalized'
import type { IndexDataItem } from '@/types/index.type'
import PageHeader from '@/components/PageHeader.vue'
import PageLoading from '@/components/PageLoading.vue'
import PageEmpty from '@/components/PageEmpty.vue'
import { Bell, ChevronRight, X } from 'lucide-vue-next'

const { t } = useI18n()
const { localize } = useLocalized()

const loading = ref(true)
const announcements = ref<IndexDataItem[]>([])

// Dialog state
const dialogOpen = ref(false)
const selectedItem = ref<IndexDataItem | null>(null)
const detailLoading = ref(false)

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

// 点击公告项，打开弹框
const handleItemClick = async (item: IndexDataItem) => {
  dialogOpen.value = true
  detailLoading.value = true
  selectedItem.value = item

  try {
    const res = await getIndexDetail(item.id)
    if (res?.code === 200 && res?.data) {
      selectedItem.value = res.data
    }
  } catch (error) {
    console.error('获取公告详情失败:', error)
  } finally {
    detailLoading.value = false
  }
}

const closeDialog = () => {
  dialogOpen.value = false
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
        <div
          v-for="(item, index) in announcements"
          :key="item.id"
          @click="handleItemClick(item)"
          class="block bg-white rounded-xl px-4 py-4 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-start gap-3 flex-1 min-w-0">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Bell class="h-4 w-4 text-amber-600" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-gray-900 truncate">
                  {{ localize(item.lang_title as Record<string, string> | null, item.title) }}
                </h3>
                <p class="text-xs text-gray-400 mt-1">{{ item.created_at }}</p>
              </div>
            </div>
            <ChevronRight class="h-5 w-5 text-gray-300 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>
    </template>

    <!-- 公告详情弹框 -->
    <Teleport to="body">
      <Transition name="dialog">
        <div
          v-if="dialogOpen"
          class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          @click.self="closeDialog"
        >
          <div class="bg-white w-[calc(100vw-32px)] max-w-lg max-h-[80vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl">
            <!-- 头部 -->
            <div class="flex items-center justify-between p-4 border-b">
              <div class="flex-1 pr-4">
                <h3 class="text-lg font-bold text-gray-900">
                  {{ selectedItem?.title }}
                </h3>
                <div v-if="selectedItem?.created_at" class="text-xs text-gray-500 mt-1">
                  发布于 {{ selectedItem.created_at }}
                </div>
              </div>
              <button
                @click="closeDialog"
                class="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <X class="h-5 w-5" />
              </button>
            </div>

            <!-- 内容 -->
            <div class="flex-1 overflow-y-auto p-4">
              <div v-if="detailLoading" class="flex items-center justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
              <div
                v-else
                class="text-sm text-gray-700 leading-7 prose prose-sm max-w-none"
                v-html="selectedItem?.content || ''"
              />
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-enter-active > div,
.dialog-leave-active > div {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from > div,
.dialog-leave-to > div {
  transform: scale(0.95);
  opacity: 0;
}
</style>
