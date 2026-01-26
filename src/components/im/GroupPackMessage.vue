<script setup lang="ts">
/**
 * 红包消息气泡组件
 */
import { computed } from 'vue'
import { Gift } from 'lucide-vue-next'

const props = defineProps<{
  packId: number
  greeting: string
  totalCount: number
  isSelf: boolean
  status?: number // 1=进行中, 2=已领完, 3=已过期
  hasGrabbed?: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

// 状态文本
const statusText = computed(() => {
  if (props.hasGrabbed) return '已领取'
  switch (props.status) {
    case 2: return '已领完'
    case 3: return '已过期'
    default: return '领取红包'
  }
})

function handleClick() {
  emit('click')
}
</script>

<template>
  <div
    class="pack-message"
    :class="{ 'is-self': isSelf, 'is-inactive': status === 2 || status === 3 }"
    @click="handleClick"
  >
    <div class="pack-icon">
      <Gift :size="32" color="#fff" />
    </div>
    <div class="pack-content">
      <div class="pack-greeting">{{ greeting }}</div>
      <div class="pack-status">{{ statusText }}</div>
    </div>
    <div class="pack-label">红包</div>
  </div>
</template>

<style scoped>
.pack-message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: linear-gradient(135deg, #fa5151, #c9191e);
  border-radius: 12px;
  min-width: 220px;
  max-width: 260px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.pack-message.is-inactive {
  filter: grayscale(0.3);
  opacity: 0.8;
}

.pack-message::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  pointer-events: none;
}

.pack-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pack-content {
  flex: 1;
  min-width: 0;
}

.pack-greeting {
  font-size: 15px;
  color: #fff;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pack-status {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.pack-label {
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 4px 12px 4px 16px;
  background: rgba(0, 0, 0, 0.1);
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  border-top-left-radius: 12px;
}
</style>
