<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, Bell, ChevronRight, X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { getAnnouncements, getIndexDetail } from '@/api/home'
import type { IndexDataItem } from '@/types/index.type'

const router = useRouter()
const { t } = useI18n()

const announcements = ref<IndexDataItem[]>([])
const loading = ref(true)

// 弹框状态
const dialogOpen = ref(false)
const selectedItem = ref<IndexDataItem | null>(null)
const detailLoading = ref(false)

const goBack = () => {
  router.back()
}

const loadData = async () => {
  try {
    loading.value = true
    const { code, data } = await getAnnouncements()
    if (code === 200 && data) {
      announcements.value = data
    }
  } catch (error) {
    console.error('获取公告列表失败:', error)
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
    const { code, data } = await getIndexDetail(item.id)
    if (code === 200 && data) {
      selectedItem.value = data
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
  <div class="flex min-h-screen justify-center bg-[#eef3f8]">
    <div class="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
      <!-- 顶部标题 -->
      <header class="sticky top-0 z-40 bg-gradient-to-r from-red-600 to-red-500">
        <div class="flex h-12 items-center justify-between px-3">
          <button @click="goBack" class="flex items-center text-white">
            <ChevronLeft class="h-5 w-5" />
          </button>
          <span class="text-white font-bold">{{ t('home.announcement') }}</span>
          <div class="w-5"></div>
        </div>
      </header>

      <main class="px-3 pb-20 pt-3">
        <!-- 公告列表 -->
        <section class="space-y-3">
          <!-- 骨架屏加载 -->
          <template v-if="loading">
            <div v-for="i in 3" :key="`skeleton-${i}`" class="bg-white rounded-xl px-4 py-4 shadow-sm">
              <div class="h-3 w-24 mb-2 bg-gray-200 rounded animate-pulse"></div>
              <div class="h-5 w-3/4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </template>

          <!-- 空状态 -->
          <div v-else-if="announcements.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400">
            <Bell class="h-16 w-16 mb-4 text-gray-300" />
            <p class="text-sm">暂无公告</p>
          </div>

          <!-- 公告列表 -->
          <template v-else>
            <div
              v-for="(item, index) in announcements"
              :key="item.id"
              @click="handleItemClick(item)"
              class="block bg-white rounded-xl px-4 py-4 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              :style="{ animationDelay: `${index * 50}ms` }"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 text-xs text-gray-400 mb-1">
                    <Bell class="h-3 w-3" />
                    <span>发布于 {{ item.created_at }}</span>
                  </div>
                  <div class="text-base font-semibold text-gray-900 line-clamp-2">
                    {{ item.title }}
                  </div>
                </div>
                <ChevronRight class="h-5 w-5 text-gray-300 flex-shrink-0 ml-2" />
              </div>
            </div>
          </template>
        </section>
      </main>
    </div>

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
