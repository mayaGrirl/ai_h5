import request from './request';
import {AxiosRequestConfig} from 'axios';

/**
 * get
 * @param url
 * @param params
 * @param config
 * @returns
 */

const httpGet = <R, T = unknown>(
  url: string,
  params: T,
  config?: AxiosRequestConfig<T>,
) => {
  return request.get<T, R>(url, {params, ...config});
};

/**
 * post
 * @param url
 * @param data
 * @param config
 * @returns
 */
const httpPost = <R, T = unknown>(
  url: string,
  data: T,
  config?: AxiosRequestConfig<T>,
) => {
  return request.post<T, R>(url, data, {...config});
};

/**
 * put
 * @param url
 * @param data
 * @param config
 * @returns
 */
const httpPut = <R, T = unknown>(
  url: string,
  data: T,
  config?: AxiosRequestConfig<T>,
) => {
  return request.put<T, R>(url, data, {...config});
};

/**
 * del
 * @param url
 * @param data
 * @param config
 * @returns
 */
const httpDelete = <R, T = unknown>(
  url: string,
  data: T,
  config?: AxiosRequestConfig<T>,
) => {
  return request.delete<T, R>(url, {data, ...config});
};

const http = {
  post: httpPost,
  get: httpGet,
  delete: httpDelete,
  put: httpPut,
};

export default http;
