import axios from 'axios'
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { CryptoUtils } from '@/utils/crypto'
import { accessToken } from '@/utils/storage/token'
import { getLocale } from '@/i18n'

// 获取 API 基础地址
// 开发环境使用 Vite proxy，生产环境直接请求 API 域名
const getBaseURL = (): string => {
  // 生产环境使用环境变量配置的 API 地址
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || ''
  }
  // 开发环境使用相对路径，由 Vite proxy 转发
  return ''
}

// 创建 axios 实例
const service = axios.create({
  baseURL: getBaseURL(),
  timeout: 300000,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

// 请求拦截器
service.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const body = config.headers['Content-Type'] === 'multipart/form-data' ? {} : config.data

    const url = window.location.pathname
    config.headers['Accept-Language'] = getLocale(url)

    // 签名
    const {
      timestamp: _timestamp,
      nonce: _nonce,
      signature: _signature
    } = await CryptoUtils.createSignedRequest({
      method: (config.method || '').toUpperCase(),
      path: config.url || '',
      privateKey: import.meta.env.VITE_API_SIGN_IN_PRIVATE_KEY || '',
      body: body || {}
    })

    config.headers.Authorization = `${accessToken.getTokenType()} ${accessToken.getToken()}`
    config.headers.Nonce = _nonce
    config.headers.Sign = _signature
    config.headers.Timestamp = _timestamp

    return config
  },
  (error: AxiosError) => {
    console.error('axios request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器 - 统一处理响应
service.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.status === 200) {
      return response
    }
    return Promise.reject(response)
  }
)

// 响应拦截器 - 提取数据和错误处理
service.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error: AxiosError) => {
    // 认证错误处理
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      handleAuthError()
    }
    return Promise.reject(error)
  }
)

// 处理认证错误
function handleAuthError() {
  accessToken.remove()
  const url = window.location.pathname
  if (typeof window !== 'undefined') {
    window.location.href = `/auth/login?redirect=${url}`
  }
}

export default service
