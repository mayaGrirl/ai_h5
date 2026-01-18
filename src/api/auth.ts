import http from "@/utils/request";
import {HttpRes} from '@/types/http.type';
import {
  ForgetPasswordDto,
  LoginDto,
  LoginReq,
  RegistrationDto,
  RegistrationReq,
} from '@/types/login.type';
import {CustomerField} from "@/types/customer.type";

/**
 * 当前登录用户信息
 * @returns
 */
export const currentCustomer = (): Promise<HttpRes<CustomerField>> => {
  return http.get<HttpRes<CustomerField>>(`/api/app/v1/current/customer`, {});
};

/**
 * 注册
 * @param data
 * @returns
 */
export const registration = (data: RegistrationDto) => {
  return http.post<HttpRes<RegistrationReq>>(
    '/api/app/v1/customer/registration',
    data,
  );
};

/**
 * 注册发送短信
 */
export const sendSmsToMobile = (mobile: string): Promise<HttpRes<unknown>> => {
  return http.post('/api/app/v1/registration/send-sms', {mobile: mobile});
};

/**
 * 登录发送短信
 */
export const loginSendSmsToMobile = (mobile: string): Promise<HttpRes<unknown>> => {
  return http.post('/api/app/v1/login/send-sms', {mobile: mobile});
};

/**
 * 注册发送短信
 */
export const forgotPasswordSendSms = (mobile: string): Promise<HttpRes<unknown>> => {
  return http.post('/api/app/v1/forgot-password/send-sms', {mobile: mobile});
};

/**
 * 注册发送短信验证是否正确
 */
export const forgotPasswordVerifyCode = (data: ForgetPasswordDto): Promise<HttpRes<unknown>> => {
  return http.post('/api/app/v1/forgot-password/verify', data);
};

/**
 * 忘记密码重置密码
 * @param data
 * @returns
 */
export const forgetPasswordReset = (
  data: ForgetPasswordDto,
): Promise<HttpRes<LoginReq>> => {
  return http.post('/api/app/v1/forgot-password/reset', data);
};

/**
 * 登录
 * @param data
 * @returns
 */
export const login = (data: LoginDto): Promise<HttpRes<LoginReq>> => {
  return http.post<HttpRes<LoginReq>>('/api/app/v1/customer/login', data);
};

/**
 * 退出登录
 * @param data
 * @returns
 */
export const logout = (): Promise<HttpRes<LoginReq>> => {
  return http.post('/api/app/v1/customer/logout', {});
};
