<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-vue-next'

const { toasts } = useToast()

const getTypeConfig = (type: string) => {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
        icon: CheckCircle,
        iconColor: 'text-white'
      }
    case 'error':
      return {
        bg: 'bg-gradient-to-r from-red-500 to-rose-500',
        icon: XCircle,
        iconColor: 'text-white'
      }
    case 'warning':
      return {
        bg: 'bg-gradient-to-r from-amber-500 to-yellow-500',
        icon: AlertCircle,
        iconColor: 'text-white'
      }
    default:
      return {
        bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
        icon: Info,
        iconColor: 'text-white'
      }
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm shadow-2xl min-w-[220px] max-w-[320px] pointer-events-auto backdrop-blur-sm',
            getTypeConfig(t.type).bg
          ]"
        >
          <component
            :is="getTypeConfig(t.type).icon"
            :class="['w-5 h-5 flex-shrink-0', getTypeConfig(t.type).iconColor]"
          />
          <span class="font-medium leading-snug">{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  animation: toast-in 0.35s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.toast-leave-active {
  animation: toast-out 0.25s ease-in forwards;
}

@keyframes toast-in {
  0% {
    opacity: 0;
    transform: translateY(-30px) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes toast-out {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
  }
}
</style>
