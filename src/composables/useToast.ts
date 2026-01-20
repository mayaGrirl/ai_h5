import { ref } from 'vue'

interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

const toasts = ref<ToastMessage[]>([])
let toastId = 0

const addToast = (message: string, type: ToastMessage['type'] = 'info', duration = 3000) => {
  const id = ++toastId
  toasts.value.push({ id, message, type })

  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duration)
}

// 兼容 vue-sonner 的 API
export const toast = {
  success: (message: string) => addToast(message, 'success'),
  error: (message: string) => addToast(message, 'error'),
  info: (message: string) => addToast(message, 'info'),
  warning: (message: string) => addToast(message, 'warning'),
  message: (message: string) => addToast(message, 'info')
}

export const useToast = () => {
  return {
    toasts,
    toast
  }
}

export default toast
