import axios from 'axios'
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { CryptoUtils } from '@/utils/crypto'
import { accessToken } from '@/utils/storage/token'
import { getLocale } from '@/i18n'

// 创建 axios 实例
const service = axios.create({
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

// 响应拦截器 - 处理认证错误
service.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.status === 200) {
      return response
    }
    if (response?.status === 401 || response?.status === 403) {
      handleAuthError()
    }
    return Promise.reject(response)
  }
)

// 响应拦截器 - 提取数据
service.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error: AxiosError) => {
    // 超时处理
    if (!error.response && error?.message.indexOf('timeout') !== -1) {
      return Promise.reject(error)
    }

    // HTTP 状态码错误处理
    switch (error?.response?.status) {
      case 401:
      case 403:
        handleAuthError()
        break
      case 404:
        console.error('请求地址不存在')
        break
      case 501:
      case 502:
      case 503:
      case 504:
        console.error('服务端错误')
        break
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
