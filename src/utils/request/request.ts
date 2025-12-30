import axios, {AxiosError, AxiosResponse} from 'axios';
import {
  requestDefaultInterceptors,
  responseDefaultInterceptors,
} from './interceptors';
import {accessToken} from "@/utils/storage/token";
import {getLocaleFromUrl} from "@/i18n/routing";

// 初始化实例
const service = axios.create({
  baseURL: '',
  timeout: 3000,
  headers: {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// 请求拦截器
service.interceptors.request.use(requestDefaultInterceptors);

// 请求拦截器 必须放最后
service.interceptors.request.use(
  config => {
    return config;
  },
  (error: AxiosError) => {
    console.info('axios request error: ', error);
    return Promise.reject(error);
  },
);

// 响应拦截器 必须放第一个
// 统一抛出错误，方便第二个中间件捕获错误后 统一进行提示
service.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.status === 200) {
      return response;
    }
    if (response?.status === 401 || response?.status === 403) {
      accessToken.remove();

      // return Promise.reject({
      //   ...response,
      //   isAuthError: true,
      // });

      if (typeof window !== "undefined") {
        const pathname = window.location.pathname;
        const locale = getLocaleFromUrl(pathname);
        window.location.href = `${locale}/auth/login?redirect=${pathname}`;
      }
    }
    return Promise.reject(response);
  },
);

// 响应拦截器
service.interceptors.response.use(
  responseDefaultInterceptors.success,
  responseDefaultInterceptors.error,
);

export default service;
