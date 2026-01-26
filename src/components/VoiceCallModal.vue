<script setup lang="ts">
/**
 * 语音通话弹窗组件
 * 处理来电、呼叫、通话中三种状态的 UI
 */
import { computed, watch, onMounted } from 'vue'
import { useVoiceCall, CallState } from '@/composables/useVoiceCall'
import { useIMStore } from '@/stores/im'
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, X } from 'lucide-vue-next'

const voiceCall = useVoiceCall()
const imStore = useIMStore()

// 是否显示弹窗
const isVisible = computed(() => {
  return voiceCall.callState.value !== CallState.IDLE
})

// 状态文字
const statusText = computed(() => {
  switch (voiceCall.callState.value) {
    case CallState.CALLING:
      return '正在呼叫...'
    case CallState.INCOMING:
      return '来电'
    case CallState.CONNECTING:
      return '连接中...'
    case CallState.CONNECTED:
      return voiceCall.formattedDuration.value
    default:
      return ''
  }
})

// 初始化 - 当 IM 连接建立后初始化语音通话监听
// 使用 watch 统一处理，避免重复初始化
watch(
  () => imStore.isConnected,
  (connected, oldConnected) => {
    if (connected && !oldConnected) {
      // 连接状态从 false 变为 true 时初始化
      console.log('[VoiceCallModal] IM connected, initializing voice call...')
      voiceCall.init()
    } else if (!connected && oldConnected) {
      // 断开连接时重置（可选）
      console.log('[VoiceCallModal] IM disconnected')
    }
  },
  { immediate: true }
)

// 组件挂载时，如果已经连接则初始化
onMounted(() => {
  if (imStore.isConnected) {
    console.log('[VoiceCallModal] IM already connected on mount, initializing...')
    voiceCall.init()
  }
})

// 接听
function handleAnswer() {
  voiceCall.answerCall()
}

// 拒绝
function handleReject() {
  voiceCall.rejectCall()
}

// 挂断
function handleHangup() {
  voiceCall.endCall()
}

// 静音切换
function handleToggleMute() {
  voiceCall.toggleMute()
}

// 扬声器切换
function handleToggleSpeaker() {
  voiceCall.toggleSpeaker()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isVisible"
        class="fixed inset-0 z-[200] flex flex-col bg-gradient-to-b from-gray-800 to-gray-900"
      >
        <!-- 顶部状态 -->
        <div class="flex-shrink-0 safe-area-top">
          <div class="flex items-center justify-between px-4 py-3">
            <div class="w-10"></div>
            <span class="text-sm text-white/80">语音通话</span>
            <button
              v-if="voiceCall.callState.value === CallState.CONNECTED"
              @click="handleHangup"
              class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
            >
              <X class="h-5 w-5 text-white" />
            </button>
            <div v-else class="w-10"></div>
          </div>
        </div>

        <!-- 中间内容 -->
        <div class="flex flex-1 flex-col items-center justify-center px-8">
          <!-- 头像 -->
          <div class="relative">
            <img
              :src="voiceCall.callInfo.value?.peerAvatar || '/default-avatar.png'"
              :alt="voiceCall.callInfo.value?.peerName"
              class="h-32 w-32 rounded-full object-cover ring-4 ring-white/20"
              @error="(e: Event) => (e.target as HTMLImageElement).src = '/default-avatar.png'"
            />
            <!-- 通话中动画 -->
            <div
              v-if="voiceCall.callState.value === CallState.CONNECTED"
              class="absolute inset-0 animate-ping rounded-full bg-green-500/30"
            ></div>
          </div>

          <!-- 名称 -->
          <h2 class="mt-6 text-2xl font-semibold text-white">
            {{ voiceCall.callInfo.value?.peerName || '未知用户' }}
          </h2>

          <!-- 状态 -->
          <p class="mt-2 text-lg text-white/70">{{ statusText }}</p>

          <!-- 错误信息 -->
          <p v-if="voiceCall.errorMessage.value" class="mt-4 text-red-400">
            {{ voiceCall.errorMessage.value }}
          </p>
        </div>

        <!-- 底部按钮 -->
        <div class="flex-shrink-0 pb-12 safe-area-bottom">
          <!-- 来电状态：拒绝 / 接听 -->
          <div v-if="voiceCall.callState.value === CallState.INCOMING" class="flex items-center justify-center gap-16">
            <!-- 拒绝 -->
            <div class="flex flex-col items-center">
              <button
                @click="handleReject"
                class="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg active:scale-95"
              >
                <PhoneOff class="h-7 w-7" />
              </button>
              <span class="mt-2 text-sm text-white/70">拒绝</span>
            </div>

            <!-- 接听 -->
            <div class="flex flex-col items-center">
              <button
                @click="handleAnswer"
                class="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white shadow-lg active:scale-95"
              >
                <Phone class="h-7 w-7" />
              </button>
              <span class="mt-2 text-sm text-white/70">接听</span>
            </div>
          </div>

          <!-- 呼叫中状态：挂断 -->
          <div v-else-if="voiceCall.callState.value === CallState.CALLING" class="flex items-center justify-center">
            <div class="flex flex-col items-center">
              <button
                @click="handleHangup"
                class="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg active:scale-95"
              >
                <PhoneOff class="h-7 w-7" />
              </button>
              <span class="mt-2 text-sm text-white/70">取消</span>
            </div>
          </div>

          <!-- 通话中状态：静音 / 挂断 / 扬声器 -->
          <div v-else-if="voiceCall.callState.value === CallState.CONNECTED || voiceCall.callState.value === CallState.CONNECTING" class="flex items-center justify-center gap-10">
            <!-- 静音 -->
            <div class="flex flex-col items-center">
              <button
                @click="handleToggleMute"
                :class="[
                  'flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg active:scale-95',
                  voiceCall.isMuted.value ? 'bg-white/30' : 'bg-white/10'
                ]"
              >
                <MicOff v-if="voiceCall.isMuted.value" class="h-6 w-6" />
                <Mic v-else class="h-6 w-6" />
              </button>
              <span class="mt-2 text-xs text-white/70">{{ voiceCall.isMuted.value ? '取消静音' : '静音' }}</span>
            </div>

            <!-- 挂断 -->
            <div class="flex flex-col items-center">
              <button
                @click="handleHangup"
                class="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg active:scale-95"
              >
                <PhoneOff class="h-7 w-7" />
              </button>
              <span class="mt-2 text-sm text-white/70">挂断</span>
            </div>

            <!-- 扬声器 -->
            <div class="flex flex-col items-center">
              <button
                @click="handleToggleSpeaker"
                :class="[
                  'flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg active:scale-95',
                  voiceCall.isSpeakerOn.value ? 'bg-white/30' : 'bg-white/10'
                ]"
              >
                <Volume2 v-if="voiceCall.isSpeakerOn.value" class="h-6 w-6" />
                <VolumeX v-else class="h-6 w-6" />
              </button>
              <span class="mt-2 text-xs text-white/70">{{ voiceCall.isSpeakerOn.value ? '扬声器' : '听筒' }}</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
