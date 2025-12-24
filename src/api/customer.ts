import {HttpRes} from "@/types/http.type";
import http from "@/utils/request";
import {
  BindEmailDto, CustomerProfile, CustomerTransferDto, MemberCapital,
  MemberField, RedeemGiftVerifyTypeDto, ReliefResponse,
  SetSecurityPassDto, SettingLoginAddressDto, SettingLoginSmsDto,
  UpdateNicknameDto, UpdatePasswordDto,
  UpdateProfileDto, ViewCardVerifyTypeDto
} from "@/types/customer.type";

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
export const getMemberField = (): Promise<HttpRes<MemberField>> => {
  return http.get<HttpRes<MemberField>>(`/api/app/v1/member-field/detail`, {});
};

/**
 * 更新登录密码
 * @param data
 * @returns
 */
export const updateLoginPassword = (data: UpdatePasswordDto): Promise<HttpRes<unknown>> => {
  return http.put<HttpRes<unknown>>(`/api/app/v1/customer/edit/login-password`, data);
};

/**
 * 更新二级密码
 * @param data
 * @returns
 */
export const updatePayPassword = (data: UpdatePasswordDto): Promise<HttpRes<unknown>> => {
  return http.put<HttpRes<unknown>>(`/api/app/v1/customer/edit/pay-password`, data);
};

/**
 * 设置登录地验证
 * @param data
 * @returns
 */
export const settingLoginAddress = (data: SettingLoginAddressDto): Promise<HttpRes<unknown>> => {
  return http.put<HttpRes<unknown>>(`/api/app/v1/customer/edit/login-location`, data);
};

/**
 * 设置登录短信验证
 * @param data
 * @returns
 */
export const settingLoginVerifyType = (data: SettingLoginSmsDto): Promise<HttpRes<unknown>> => {
  return http.put<HttpRes<unknown>>(`/api/app/v1/customer/edit/login-sms`, data);
};

/**
 * 设置兑换礼品验证方式
 * @param data
 * @returns
 */
export const settingRedeemGiftVerifyType = (data: RedeemGiftVerifyTypeDto): Promise<HttpRes<unknown>> => {
  return http.put<HttpRes<unknown>>(`/api/app/v1/customer/edit/redeem-gift`, data);
};

/**
 * 设置查看卡密验证方式
 * @param data
 * @returns
 */
export const settingViewCardVerifyType = (data: ViewCardVerifyTypeDto): Promise<HttpRes<unknown>> => {
  return http.put<HttpRes<unknown>>(`/api/app/v1/customer/edit/view-card`, data);
};

/**
 * 获取救济数据
 */
export const getReliefData = (): Promise<HttpRes<ReliefResponse>> => {
  return http.get('/api/app/v1/customer/relief', {});
};

/**
 * 领取救济
 * @returns
 */
export const receiveRelief = (): Promise<HttpRes<unknown>> => {
  return http.post<HttpRes<unknown>>(`/api/app/v1/customer/receive/relief`, {});
};

/**
 * 会员接受短信
 */
export const customerReceiveSms = (): Promise<HttpRes<unknown>> => {
  return http.get('/api/app/v1/customer/receive-sms', {});
};

/**
 * 会员明细，包含：
 * 1. 会员详情
 * 2. 会员余额
 */
export const customerProfile = (): Promise<HttpRes<CustomerProfile>> => {
  return http.get('/api/app/v1/customer/mine', {});
};

/**
 * 会员明细，包含：
 * 1. 会员详情
 * 2. 会员余额
 */
export const getMemberCapital = (): Promise<HttpRes<MemberCapital>> => {
  return http.get('/api/app/v1/member-capital/detail', {});
};

/**
 * 存款转入转出
 * @param data
 * @returns
 */
export const memberCapitalTransfer = (data: CustomerTransferDto): Promise<HttpRes<unknown>> => {
  return http.post<HttpRes<unknown>>(`/api/app/v1/member-capital/transfer`, data);
};
