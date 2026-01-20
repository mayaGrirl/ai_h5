import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { HttpRes } from '@/types/http.type'
import type { AxiosError } from 'axios'

/**
 * 合并 Tailwind 类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 解析后端返回的错误信息
 */
export function parseErrorMessage<T>(response: HttpRes<T>, fallback: string = '操作失败'): string {
  // 如果有 errors 对象，提取第一个错误信息
  if (response.errors && typeof response.errors === 'object') {
    const errorKeys = Object.keys(response.errors)
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0]
      const messages = response.errors[firstKey]
      if (Array.isArray(messages) && messages.length > 0) {
        return messages[0]
      }
    }
  }

  // 使用 message 字段
  if (response.message) {
    return response.message
  }

  // 使用默认错误信息
  return fallback
}

/**
 * 从 Axios 错误对象中提取错误信息
 */
export function parseAxiosError(error: unknown, fallback: string = '操作失败'): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError
    const responseData = axiosError.response?.data

    if (responseData && typeof responseData === 'object') {
      // 尝试从 errors 对象中提取
      if ('errors' in responseData && responseData.errors && typeof responseData.errors === 'object') {
        const errors = responseData.errors as Record<string, string[]>
        const errorKeys = Object.keys(errors)
        if (errorKeys.length > 0) {
          const firstKey = errorKeys[0]
          const messages = errors[firstKey]
          if (Array.isArray(messages) && messages.length > 0) {
            return messages[0]
          }
        }
      }

      // 使用 message 字段
      if ('message' in responseData && typeof responseData.message === 'string') {
        return responseData.message
      }
    }
  }

  return fallback
}

/**
 * 判断是否为空值
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  if (typeof value === 'object' && Object.keys(value).length === 0) return true
  return false
}

/**
 * 掩码敏感信息
 */
export function maskString(str: string, start: number = 3, end: number = 4): string {
  if (!str || str.length <= start + end) return str
  return str.slice(0, start) + '****' + str.slice(-end)
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: unknown, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let lastTime = 0
  return function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

/**
 * 多语言字段类型
 */
export type LangField = Record<string, string> | null | undefined | object | unknown[]

/**
 * 获取多语言字段的本地化值
 * 后台接口返回的 lang_ 开头的字段包含多语言配置，如 {"zh": "宾果", "en": "Bingo", "fr": "Bingo"}
 * 优先使用当前语言的值，如果没有则使用默认值
 *
 * @param langField - 多语言字段值 (如 lang_title, lang_name, lang_content)
 * @param fallback - 默认值 (如 title, name, content)
 * @param locale - 当前语言 (zh, en, fr)
 * @returns 本地化后的字符串
 */
export function getLocalizedValue(
  langField: LangField,
  fallback: string,
  locale: string
): string {
  // 如果 langField 为空，返回默认值
  if (!langField) return fallback

  // 如果是数组且为空，返回默认值
  if (Array.isArray(langField) && langField.length === 0) return fallback

  // 尝试从 langField 中获取当前语言的值
  if (typeof langField === 'object' && !Array.isArray(langField)) {
    const langObj = langField as Record<string, string>
    // 优先使用当前语言
    if (langObj[locale]) return langObj[locale]
    // 尝试使用中文作为后备
    if (langObj['zh']) return langObj['zh']
    // 尝试使用英文作为后备
    if (langObj['en']) return langObj['en']
  }

  return fallback
}
