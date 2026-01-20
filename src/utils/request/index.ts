import request from './request'
import type { AxiosRequestConfig } from 'axios'

/**
 * GET 请求
 */
const httpGet = <R, T = unknown>(
  url: string,
  params: T,
  config?: AxiosRequestConfig<T>
) => {
  return request.get<T, R>(url, { params, ...config })
}

/**
 * POST 请求
 */
const httpPost = <R, T = unknown>(
  url: string,
  data: T,
  config?: AxiosRequestConfig<T>
) => {
  return request.post<T, R>(url, data, { ...config })
}

/**
 * PUT 请求
 */
const httpPut = <R, T = unknown>(
  url: string,
  data: T,
  config?: AxiosRequestConfig<T>
) => {
  return request.put<T, R>(url, data, { ...config })
}

/**
 * DELETE 请求
 */
const httpDelete = <R, T = unknown>(
  url: string,
  data: T,
  config?: AxiosRequestConfig<T>
) => {
  return request.delete<T, R>(url, { data, ...config })
}

const http = {
  post: httpPost,
  get: httpGet,
  delete: httpDelete,
  put: httpPut
}

export default http
