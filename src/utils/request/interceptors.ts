import {AxiosError, AxiosResponse, InternalAxiosRequestConfig} from 'axios';
import {CryptoUtils} from '@/utils/crypto';
import {accessToken} from '@/utils/storage/token';
import {getLocale} from "@/i18n/routing";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// 白名单路径，可以根据需要调整
const whitelist = [
  '/api/app/v1/customer/registration',
  '/api/app/v1/customer/login',
  '/api/app/v1/customer/find-password',

  '/api/app/v1/customer/throw-captcha/check',
  '/api/app/v1/customer/throw-captcha',
  '/api/app/v1/customer/check-email-code',
  '/api/app/v1/config/r-key',
];

/**
 * 请求拦截器
 */
export const requestDefaultInterceptors = async (
  config: InternalAxiosRequestConfig,
) => {
  config.baseURL = BASE_URL;

  const body = config.headers['Content-Type'] === 'multipart/form-data' ? {} : config.data;

  const method = config.method?.toLowerCase();
  const url = window.location.pathname;

  config.headers['Accept-Language'] = getLocale(url);

  const isWhitelisted = whitelist.some(whitelistedPath => {
    // 判断 GET 请求：检查路径和查询参数
    if (method === 'get') {
      // 判断 URL 是否以白名单路径开头，且查询参数是否符合
      return url.startsWith(whitelistedPath);
    }

    // 判断 POST/PUT/DELETE 请求：只检查路径
    if (['post', 'put', 'delete'].includes(method!)) {
      return url.startsWith(whitelistedPath);
    }

    return false;
  });

  let timestamp, nonce, signature;

  if (isWhitelisted) {
    // 如果是白名单的请求，直接返回配置，不做签名处理
    console.log('This request is whitelisted and does not require signing');
    config.baseURL = BASE_URL;
    const {
      timestamp: _timestamp,
      nonce: _nonce,
      signature: _signature,
    } = await CryptoUtils.createSignedRequest({
      method: (config.method || '').toUpperCase(),
      path: config.url || '',
      privateKey: process.env?.NOT_LOGIN_API_PRIVATE_KEY || '',
      body: body || {},
    });
    timestamp = _timestamp;
    nonce = _nonce;
    signature = _signature;
  } else {
    const {
      timestamp: _timestamp,
      nonce: _nonce,
      signature: _signature,
    } = await CryptoUtils.createSignedRequest({
      method: (config.method || '').toUpperCase(),
      path: config.url || '',
      privateKey: "", // 私钥
      body: body || {},
    });
    timestamp = _timestamp;
    nonce = _nonce;
    signature = _signature;
  }

  config.headers.Authorization = `${accessToken.getTokenType()} ${accessToken.getToken()}`;
  config.headers.Nonce = nonce;
  config.headers.Sign = signature;
  config.headers.Timestamp = timestamp;
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
