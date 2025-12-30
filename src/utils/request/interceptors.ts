import {AxiosError, AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import {CryptoUtils} from '@/utils/crypto';
import {accessToken} from '@/utils/storage/token';
import {getLocale} from "@/i18n/routing";

// 使用相对路径，通过 Next.js rewrites 代理转发请求，解决跨域问题
const BASE_URL = "";

/**
 * 请求拦截器
 */
export const requestDefaultInterceptors = async (
  config: InternalAxiosRequestConfig,
) => {
  config.baseURL = BASE_URL;

  const body = config.headers['Content-Type'] === 'multipart/form-data' ? {} : config.data;

  const url = window.location.pathname;
  config.headers['Accept-Language'] = getLocale(url);

  // 签名
  const {
    timestamp: _timestamp,
    nonce: _nonce,
    signature: _signature,
  } = await CryptoUtils.createSignedRequest({
    method: (config.method || '').toUpperCase(),
    path: config.url || '',
    privateKey: process.env.NEXT_PUBLIC_API_SIGN_IN_PRIVATE_KEY || '',
    body: body || {},
  });

  config.headers.Authorization = `${accessToken.getTokenType()} ${accessToken.getToken()}`;
  config.headers.Nonce = _nonce;
  config.headers.Sign = _signature;
  config.headers.Timestamp = _timestamp;
  return config;
};

/**
 * 响应拦截器
 */
export const responseDefaultInterceptors = {
  success: (response: AxiosResponse) => {
    return response.data;
  },
  error: (error: AxiosError) => {
    // axios设置的timeout超过后接口没有返回就会走这里
    if (!error.response && error?.message.indexOf('timeout') !== -1) {
      // tip('网络请求超时');
      return Promise.reject(error);
    }
    // 这里只会捕获http请求失败的状态码3x、4x、5x等
    switch (error?.response?.status) {
      // 未登录
      case 401:
      // token 过期
      case 403:
        accessToken.remove();
        if (typeof window !== "undefined") {
          const pathname = window.location.pathname;
          window.location.href = `/auth/login?redirect=${pathname}`;
        }
        break;
      // 网络请求不存在
      case 404:
        // tip('网络请求不存在');
        break;
      // 服务端错误
      case 501:
      case 502:
      case 503:
      case 504:
        // tip('服务端错误');
        break;
      default:
        break;
    }
    return Promise.reject(error);
  },
};
