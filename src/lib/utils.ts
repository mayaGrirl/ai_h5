import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { HttpRes } from "@/types/http.type"
import { AxiosError } from "axios"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 解析后端返回的错误信息
 * 优先使用 errors 对象中的第一个错误，其次使用 message
 */
export function parseErrorMessage<T>(response: HttpRes<T>, fallback: string = "操作失败"): string {
  // 如果有 errors 对象，提取第一个错误信息
  if (response.errors && typeof response.errors === 'object') {
    const errorKeys = Object.keys(response.errors);
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0];
      const messages = response.errors[firstKey];
      if (Array.isArray(messages) && messages.length > 0) {
        return messages[0];
      }
    }
  }

  // 使用 message 字段
  if (response.message) {
    return response.message;
  }

  // 使用默认错误信息
  return fallback;
}

/**
 * 从 Axios 错误对象中提取错误信息
 * 用于处理 HTTP 状态码非 2xx 的情况
 */
export function parseAxiosError(error: unknown, fallback: string = "操作失败"): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError;
    const responseData = axiosError.response?.data;

    if (responseData && typeof responseData === 'object') {
      // 尝试从 errors 对象中提取
      if ('errors' in responseData && responseData.errors && typeof responseData.errors === 'object') {
        const errors = responseData.errors as Record<string, string[]>;
        const errorKeys = Object.keys(errors);
        if (errorKeys.length > 0) {
          const firstKey = errorKeys[0];
          const messages = errors[firstKey];
          if (Array.isArray(messages) && messages.length > 0) {
            return messages[0];
          }
        }
      }

      // 使用 message 字段
      if ('message' in responseData && typeof responseData.message === 'string') {
        return responseData.message;
      }
    }
  }

  return fallback;
}
