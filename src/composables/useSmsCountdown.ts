import { ref, onUnmounted } from 'vue'

/**
 * 短信倒计时组合式函数
 * @param key localStorage 存储的键名
 * @param duration 倒计时时长（秒）
 */
export function useSmsCountdown(key: string = 'sms_countdown', duration: number = 60) {
  const countdown = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

  // 从 localStorage 恢复倒计时状态
  const restore = () => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem(key)
    if (stored) {
      const { timestamp, remaining } = JSON.parse(stored)
      const elapsed = Math.floor((Date.now() - timestamp) / 1000)
      const current = remaining - elapsed

      if (current > 0) {
        countdown.value = current
        startTimer()
      } else {
        localStorage.removeItem(key)
      }
    }
  }

  // 保存倒计时状态到 localStorage
  const save = () => {
    if (typeof window === 'undefined') return

    localStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      remaining: countdown.value
    }))
  }

  // 启动定时器
  const startTimer = () => {
    if (timer) clearInterval(timer)

    timer = setInterval(() => {
      countdown.value--
      save()

      if (countdown.value <= 0) {
        if (timer) clearInterval(timer)
        localStorage.removeItem(key)
      }
    }, 1000)
  }

  // 开始倒计时
  const start = () => {
    countdown.value = duration
    save()
    startTimer()
  }

  // 重置倒计时
  const reset = () => {
    countdown.value = 0
    if (timer) clearInterval(timer)
    localStorage.removeItem(key)
  }

  // 初始化时恢复状态
  restore()

  // 组件卸载时清理定时器
  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  return {
    countdown,
    start,
    reset,
    isActive: () => countdown.value > 0
  }
}
