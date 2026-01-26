<script setup lang="ts">
/**
 * 发红包弹窗组件
 */
import { ref, computed } from 'vue'
import { X } from 'lucide-vue-next'
import { toast } from '@/composables/useToast'
import { sendPack } from '@/api/group'
import { PackType } from '@/types/group.type'
import type { SendPackResponse } from '@/types/group.type'

const props = defineProps<{
  groupId: number
  memberCount: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'sent', data: SendPackResponse): void
}>()

const packType = ref<typeof PackType.LUCKY | typeof PackType.NORMAL>(PackType.LUCKY)
const totalAmount = ref<number | string>('')
const totalCount = ref<number | string>('')
const greeting = ref('恭喜发财')
const isSubmitting = ref(false)

// 单个红包金额
const perAmount = computed(() => {
  const amount = Number(totalAmount.value) || 0
  const count = Number(totalCount.value) || 1
  if (packType.value === PackType.NORMAL) {
    return (amount / count).toFixed(2)
  }
  return '随机'
})

// 发送红包
async function handleSend() {
  const amount = Number(totalAmount.value)
  const count = Number(totalCount.value)

  if (!amount || amount <= 0) {
    toast.warning('请输入红包金额')
    return
  }

  if (!count || count < 1) {
    toast.warning('请输入红包个数')
    return
  }

  if (count > props.memberCount) {
    toast.warning(`红包个数不能超过群成员数 ${props.memberCount}`)
    return
  }

  if (count > 100) {
    toast.warning('红包个数不能超过100')
    return
  }

  if (amount < 0.01 * count) {
    toast.warning(`红包金额至少需要 ${(0.01 * count).toFixed(2)} 金豆`)
    return
  }

  isSubmitting.value = true

  try {
    const res = await sendPack(props.groupId, {
      type: packType.value,
      total_amount: amount,
      total_count: count,
      greeting: greeting.value || '恭喜发财',
    })

    if (res.code === 200) {
      toast.success('红包已发出')
      emit('sent', res.data)
      emit('close')
    } else {
      toast.error(res.message || '发送失败')
    }
  } catch (error) {
    toast.error('发送失败')
  } finally {
    isSubmitting.value = false
  }
}

// 关闭
function handleClose() {
  emit('close')
}
</script>

<template>
  <div class="pack-send-overlay" @click.self="handleClose">
    <div class="pack-send-dialog">
      <!-- 头部 -->
      <div class="dialog-header">
        <button class="close-btn" @click="handleClose">
          <X :size="24" color="#fff" />
        </button>
        <div class="header-title">发红包</div>
      </div>

      <!-- 内容 -->
      <div class="dialog-body">
        <!-- 红包类型 -->
        <div class="type-tabs">
          <button
            class="type-tab"
            :class="{ active: packType === PackType.LUCKY }"
            @click="packType = PackType.LUCKY"
          >
            拼手气红包
          </button>
          <button
            class="type-tab"
            :class="{ active: packType === PackType.NORMAL }"
            @click="packType = PackType.NORMAL"
          >
            普通红包
          </button>
        </div>

        <!-- 金额输入 -->
        <div class="form-group">
          <label>总金额</label>
          <div class="input-wrapper">
            <input
              v-model="totalAmount"
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0.01"
            />
            <span class="unit">金豆</span>
          </div>
        </div>

        <!-- 红包个数 -->
        <div class="form-group">
          <label>红包个数</label>
          <div class="input-wrapper">
            <input
              v-model="totalCount"
              type="number"
              placeholder="请输入红包个数"
              min="1"
              :max="Math.min(100, memberCount)"
            />
            <span class="unit">个</span>
          </div>
        </div>

        <!-- 祝福语 -->
        <div class="form-group">
          <label>祝福语</label>
          <input
            v-model="greeting"
            type="text"
            placeholder="恭喜发财，大吉大利"
            maxlength="50"
          />
        </div>

        <!-- 金额预览 -->
        <div class="amount-preview">
          <div class="preview-amount">{{ totalAmount || '0.00' }}</div>
          <div class="preview-label">金豆</div>
          <div v-if="Number(totalCount) > 0" class="per-amount">
            {{ packType === PackType.NORMAL ? `每个 ${perAmount} 金豆` : '随机金额' }}
          </div>
        </div>
      </div>

      <!-- 底部 -->
      <div class="dialog-footer">
        <button
          class="send-btn"
          :disabled="isSubmitting"
          @click="handleSend"
        >
          塞钱进红包
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pack-send-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.pack-send-dialog {
  width: 320px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.dialog-header {
  position: relative;
  background: linear-gradient(135deg, #fa5151, #c9191e);
  padding: 20px 16px;
  text-align: center;
}

.close-btn {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.dialog-body {
  padding: 20px 16px;
}

.type-tabs {
  display: flex;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 20px;
}

.type-tab {
  flex: 1;
  padding: 10px;
  border: none;
  background: none;
  font-size: 14px;
  color: #666;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.type-tab.active {
  background: #fff;
  color: #fa5151;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.input-wrapper input {
  flex: 1;
  border: none;
  padding: 12px 0;
  font-size: 16px;
  outline: none;
}

.input-wrapper .unit {
  font-size: 14px;
  color: #999;
}

.form-group > input {
  width: 100%;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
}

.amount-preview {
  text-align: center;
  padding: 20px;
  background: #fef6f6;
  border-radius: 12px;
  margin-top: 20px;
}

.preview-amount {
  font-size: 40px;
  font-weight: 600;
  color: #fa5151;
}

.preview-label {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}

.per-amount {
  font-size: 12px;
  color: #fa5151;
  margin-top: 8px;
}

.dialog-footer {
  padding: 16px;
}

.send-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #fa5151, #c9191e);
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.send-btn:disabled {
  opacity: 0.6;
}
</style>
