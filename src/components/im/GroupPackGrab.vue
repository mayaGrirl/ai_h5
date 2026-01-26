<script setup lang="ts">
/**
 * 抢红包弹窗组件
 */
import { ref, onMounted } from 'vue'
import { X, Gift } from 'lucide-vue-next'
import { toast } from '@/composables/useToast'
import { getPackDetail, grabPack } from '@/api/group'
import type { GroupPack } from '@/types/group.type'
import { PackStatus } from '@/types/group.type'

const props = defineProps<{
  packId: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'grabbed', amount: number): void
  (e: 'view-detail'): void
}>()

const pack = ref<GroupPack | null>(null)
const isLoading = ref(true)
const isGrabbing = ref(false)
const grabResult = ref<{ amount: number; is_best: boolean } | null>(null)

// 加载红包详情
async function loadPackDetail() {
  isLoading.value = true

  try {
    const res = await getPackDetail(props.packId)

    if (res.code === 200) {
      pack.value = res.data

      // 如果已经领取过，显示结果
      if (res.data.my_record) {
        grabResult.value = {
          amount: res.data.my_record.amount,
          is_best: res.data.my_record.is_best,
        }
      }
    } else {
      toast.error(res.message || '加载失败')
    }
  } catch (error) {
    toast.error('加载失败')
  } finally {
    isLoading.value = false
  }
}

// 抢红包
async function handleGrab() {
  if (!pack.value || pack.value.has_grabbed) return

  isGrabbing.value = true

  try {
    const res = await grabPack(props.packId)

    if (res.code === 200) {
      grabResult.value = {
        amount: res.data.amount,
        is_best: res.data.is_best,
      }
      pack.value = res.data.pack
      emit('grabbed', res.data.amount)
    } else {
      toast.error(res.message || '抢红包失败')
    }
  } catch (error) {
    toast.error('抢红包失败')
  } finally {
    isGrabbing.value = false
  }
}

// 查看详情
function viewDetail() {
  emit('view-detail')
}

// 关闭
function handleClose() {
  emit('close')
}

onMounted(() => {
  loadPackDetail()
})
</script>

<template>
  <div class="pack-grab-overlay" @click.self="handleClose">
    <div class="pack-grab-dialog">
      <!-- 关闭按钮 -->
      <button class="close-btn" @click="handleClose">
        <X :size="24" color="rgba(255,255,255,0.8)" />
      </button>

      <!-- 红包封面 -->
      <div class="pack-cover">
        <div class="pack-top">
          <div v-if="isLoading" class="loading-text">加载中...</div>

          <template v-else-if="pack">
            <img
              :src="pack.sender_avatar || '/default-avatar.png'"
              class="sender-avatar"
              alt=""
            />
            <div class="sender-name">{{ pack.sender_nickname }}的红包</div>
            <div class="pack-greeting">{{ pack.greeting }}</div>

            <!-- 已领取结果 -->
            <div v-if="grabResult" class="grab-result">
              <div class="result-amount">{{ grabResult.amount }}</div>
              <div class="result-unit">金豆</div>
              <div v-if="grabResult.is_best" class="best-luck">
                手气最佳
              </div>
            </div>

            <!-- 抢按钮 -->
            <button
              v-else-if="pack.status === PackStatus.ONGOING && !pack.has_grabbed"
              class="grab-btn"
              :disabled="isGrabbing"
              @click="handleGrab"
            >
              <Gift :size="40" v-if="!isGrabbing" />
              <span v-else>抢...</span>
            </button>

            <!-- 红包已抢完或过期 -->
            <div v-else class="pack-status">
              {{ pack.status_text }}
            </div>
          </template>
        </div>

        <!-- 底部 -->
        <div class="pack-bottom">
          <div v-if="pack" class="pack-progress">
            已领取 {{ pack.received_count }}/{{ pack.total_count }} 个，
            共 {{ pack.received_amount }}/{{ pack.total_amount }} 金豆
          </div>
          <button class="detail-btn" @click="viewDetail">
            查看领取详情
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pack-grab-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.pack-grab-dialog {
  position: relative;
  width: 300px;
}

.close-btn {
  position: absolute;
  top: -50px;
  right: 0;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.pack-cover {
  background: linear-gradient(180deg, #fa5151 0%, #c9191e 100%);
  border-radius: 16px;
  overflow: hidden;
}

.pack-top {
  min-height: 320px;
  padding: 40px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background:
    radial-gradient(circle at 50% 100%, rgba(255,255,255,0.1) 0%, transparent 70%);
}

.loading-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  padding: 100px 0;
}

.sender-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.3);
  object-fit: cover;
  margin-bottom: 12px;
}

.sender-name {
  font-size: 18px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 8px;
}

.pack-greeting {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 30px;
}

.grab-result {
  text-align: center;
}

.result-amount {
  font-size: 56px;
  font-weight: 600;
  color: #ffd700;
  line-height: 1;
}

.result-unit {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8px;
}

.best-luck {
  display: inline-block;
  margin-top: 12px;
  padding: 4px 12px;
  background: rgba(255, 215, 0, 0.2);
  border-radius: 12px;
  font-size: 12px;
  color: #ffd700;
}

.grab-btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #ffd700;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c9191e;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: pulse 1.5s infinite;
}

.grab-btn:disabled {
  animation: none;
  opacity: 0.8;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.pack-status {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  padding: 30px 0;
}

.pack-bottom {
  background: rgba(0, 0, 0, 0.1);
  padding: 16px;
  text-align: center;
}

.pack-progress {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.detail-btn {
  background: none;
  border: none;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  text-decoration: underline;
}
</style>
