import {HttpRes} from "@/types/http.type";
import http from "@/utils/request";
import {
  BindEmailDto, CustomerField,
  MemberField,
  SetSecurityPassDto,
  UpdateNicknameDto,
  UpdateProfileDto
} from "@/types/customer.type";

/**
 * 当前登录用户信息
 * @returns
 */
export const currentCustomer = (): Promise<HttpRes<CustomerField>> => {
  return http.get<HttpRes<CustomerField>>(`/api/app/v1/current/customer`, {});
};

/**
 * 更新昵称
 * @param data
 * @returns
 */
export const updateNickname = (data: UpdateNicknameDto): Promise<HttpRes<unknown>> => {
  return http.put<HttpRes<unknown>>(`/api/app/v1/customer/edit/nickname`, data);
};

/**
 * 绑定邮箱
 * @param data
 * @returns
 */
export const bindEmail = (data: BindEmailDto): Promise<HttpRes<unknown>> => {
  return http.put<HttpRes<unknown>>(`/api/app/v1/customer/bind-email`, data);
};

/**
 * 设置密保问题
 * @param data
 * @returns
 */
export const setSecurityPass = (data: SetSecurityPassDto): Promise<HttpRes<unknown>> => {
  return http.put<HttpRes<unknown>>(`/api/app/v1/customer/set/security-pass`, data);
};

/**
 * 更新资料
 * @param data
 * @returns
 */
export const updateProfile = (data: UpdateProfileDto): Promise<HttpRes<unknown>> => {
  return http.put<HttpRes<unknown>>(`/api/app/v1/customer/edit/profile`, data);
};

/**
 * 更新资料
 * @returns
 */
export const getProfile = (): Promise<HttpRes<MemberField>> => {
  return http.get<HttpRes<MemberField>>(`/api/app/v1/customer/profile/detail`, {});
};
