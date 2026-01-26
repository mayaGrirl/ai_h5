<script setup lang="ts">
/**
 * 红包详情组件
 */
import { ref, onMounted } from 'vue'
import { ArrowLeft, Crown } from 'lucide-vue-next'
import { toast } from '@/composables/useToast'
import { getPackDetail, getPackRecords } from '@/api/group'
import type { GroupPack, PackRecord } from '@/types/group.type'
import { PackStatus } from '@/types/group.type'

const props = defineProps<{
  packId: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const pack = ref<GroupPack | null>(null)
const records = ref<PackRecord[]>([])
const isLoading = ref(true)

// 加载数据
async function loadData() {
  isLoading.value = true

  try {
    const [detailRes, recordsRes] = await Promise.all([
      getPackDetail(props.packId),
      getPackRecords(props.packId),
    ])

    if (detailRes.code === 200) {
      pack.value = detailRes.data
    }

    if (recordsRes.code === 200) {
      records.value = recordsRes.data.list
    }
  } catch (error) {
    toast.error('加载失败')
  } finally {
    isLoading.value = false
  }
}

// 关闭
function handleClose() {
  emit('close')
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="pack-detail-page">
    <!-- 头部 -->
    <div class="header">
      <button class="back-btn" @click="handleClose">
        <ArrowLeft :size="24" color="#fff" />
      </button>
      <h1 class="title">红包详情</h1>
      <div class="placeholder"></div>
    </div>

    <div v-if="isLoading" class="loading">加载中...</div>

    <template v-else-if="pack">
      <!-- 红包信息 -->
      <div class="pack-info">
        <img
          :src="pack.sender_avatar || '/default-avatar.png'"
          class="sender-avatar"
          alt=""
        />
        <div class="sender-name">{{ pack.sender_nickname }}的红包</div>
        <div class="pack-greeting">{{ pack.greeting }}</div>

        <!-- 我领取的金额 -->
        <div v-if="pack.my_record" class="my-amount">
          <span class="amount-value">{{ pack.my_record.amount }}</span>
          <span class="amount-unit">金豆</span>
        </div>
        <div v-else class="not-grabbed">
          {{ pack.status === PackStatus.EXPIRED ? '红包已过期' : '未领取' }}
        </div>
      </div>

      <!-- 领取统计 -->
      <div class="stats-bar">
        <span>已领取 {{ pack.received_count }}/{{ pack.total_count }} 个</span>
        <span>{{ pack.received_amount }}/{{ pack.total_amount }} 金豆</span>
      </div>

      <!-- 领取记录列表 -->
      <div class="record-list">
        <div
          v-for="record in records"
          :key="record.id"
          class="record-item"
        >
          <img
            :src="record.avatar || '/default-avatar.png'"
            class="record-avatar"
            alt=""
          />
          <div class="record-info">
            <div class="record-name">
              {{ record.nickname }}
              <span v-if="record.is_best" class="best-badge">
                <Crown :size="12" />
                手气最佳
              </span>
            </div>
            <div class="record-time">{{ record.created_at }}</div>
          </div>
          <div class="record-amount">{{ record.amount }} 金豆</div>
        </div>

        <div v-if="records.length === 0" class="empty-tip">
          暂无领取记录
        </div>
      </div>

      <!-- 过期退款提示 -->
      <div v-if="pack.status === PackStatus.EXPIRED && pack.remaining_amount > 0" class="refund-tip">
        未领取的 {{ pack.remaining_amount }} 金豆已退还给发送者
      </div>
    </template>
  </div>
</template>

<style scoped>
.pack-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(135deg, #fa5151, #c9191e);
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  cursor: pointer;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.placeholder {
  width: 40px;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #999;
}

.pack-info {
  background: linear-gradient(180deg, #c9191e 0%, #fa5151 100%);
  padding: 30px 20px;
  text-align: center;
}

.sender-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  object-fit: cover;
  margin-bottom: 12px;
}

.sender-name {
  font-size: 16px;
  color: #fff;
  margin-bottom: 4px;
}

.pack-greeting {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 20px;
}

.my-amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.amount-value {
  font-size: 48px;
  font-weight: 600;
  color: #ffd700;
}

.amount-unit {
  font-size: 16px;
  color: #ffd700;
}

.not-grabbed {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  padding: 20px 0;
}

.stats-bar {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
  font-size: 14px;
  color: #666;
}

.record-list {
  background: #fff;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5;
}

.record-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.record-info {
  flex: 1;
  min-width: 0;
}

.record-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: #333;
  margin-bottom: 4px;
}

.best-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: #fff3cd;
  border-radius: 10px;
  font-size: 11px;
  color: #856404;
}

.record-time {
  font-size: 12px;
  color: #999;
}

.record-amount {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  flex-shrink: 0;
}

.empty-tip {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}

.refund-tip {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 13px;
  background: #fff;
  margin-top: 12px;
}
</style>
