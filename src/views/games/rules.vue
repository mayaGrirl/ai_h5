<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { useLocalized } from '@/composables/useLocalized'

const gameStore = useGameStore()
const { localize } = useLocalized()

const currentGroup = computed(() => {
  return gameStore.playGroups.find((g) => g.id === gameStore.selectedGroupId)
})

// 获取本地化的规则内容
const ruleContent = computed(() => {
  if (!currentGroup.value) return ''
  return localize(
    currentGroup.value.lang_info as Record<string, string> | null,
    currentGroup.value.info || ''
  )
})

// 是否包含 HTML 标签
const isHtml = computed(() => {
  if (!ruleContent.value) return false
  return /<\/?[a-z][\s\S]*>/i.test(ruleContent.value)
})

// 获取本地化的分组名称
const groupName = computed(() => {
  if (!currentGroup.value) return ''
  return localize(
    currentGroup.value.lang_name as Record<string, string> | null,
    currentGroup.value.name || ''
  )
})
</script>

<template>
  <div class="bg-gray-100 pb-16 min-h-screen">
    <div class="bg-white mx-3 my-3 rounded-lg shadow p-4">
      <template v-if="currentGroup">
        <h2 class="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
          {{ groupName }}
          <span class="text-sm font-normal text-gray-500 ml-2">游戏规则</span>
        </h2>

        <div
          v-if="ruleContent"
          class="text-sm text-gray-700 leading-relaxed break-words overflow-hidden prose prose-sm max-w-none"
        >
          <!-- 有 HTML -->
          <div v-if="isHtml" v-html="ruleContent"></div>

          <!-- 纯文本 -->
          <div v-else class="whitespace-pre-line">
            {{ ruleContent }}
          </div>
        </div>

        <div v-else class="text-center text-gray-400 py-8">暂无游戏规则</div>
      </template>

      <template v-else>
        <div class="text-center py-12 text-gray-500">请选择游戏分组</div>
      </template>
    </div>
  </div>
</template>

<style scoped>
:deep(p) {
  margin: 0.5rem 0;
}
:deep(br) {
  display: block;
}
:deep(table) {
  width: 100%;
  border-collapse: collapse;
}
:deep(td),
:deep(th) {
  border: 1px solid #d1d5db;
  padding: 0.5rem;
  font-size: 0.75rem;
}
:deep(th) {
  background-color: #f3f4f6;
}
:deep(img) {
  max-width: 100%;
  height: auto;
}
</style>
