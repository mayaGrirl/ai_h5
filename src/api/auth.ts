import http from "@/utils/request";
import {HttpRes} from '@/types/http.type';
import {
  ForgetPasswordDto,
  LoginDto,
  LoginReq,
  RegistrationDto,
  RegistrationReq,
} from '@/types/login.type';

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
 * 登录
 * @param data
 * @returns
 */
export const login = (data: LoginDto): Promise<HttpRes<LoginReq>> => {
  return http.post<HttpRes<LoginReq>>('/api/app/v1/customer/login', data);
};

/**
 * 忘记密码
 * @param data
 * @returns
 */

export const forgetPassword = (
  data: ForgetPasswordDto,
): Promise<HttpRes<LoginReq>> => {
  return http.post('/api/app/v1/customer/find-password', data);
};

/**
 * 退出登录
 * @param data
 * @returns
 */
export const logout = (): Promise<HttpRes<LoginReq>> => {
  return http.post('/api/app/v1/customer/logout', {});
};
