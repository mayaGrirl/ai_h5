import {HttpRes, PageRequest} from "@/types/http.type";
import http from "@/utils/request";
import {
  BindEmailDto,
  CustomerProfile,
  CustomerTransferDto, DepositRecordField,
  MemberCapital,
  MemberField, PackExchangeDto,
  PointsRecordField,
  ReceiveRecommendRewardDto,
  RecommendCustomer,
  RecommendLinkKey,
  RedeemGiftVerifyTypeDto,
  ReliefResponse,
  SetSecurityPassDto,
  SettingLoginAddressDto,
  SettingLoginSmsDto,
  UpdateNicknameDto,
  UpdatePasswordDto,
  UpdateProfileDto,
  ViewCardVerifyTypeDto, WagesCzRecordField, WagesRecordField
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

/**
 * 获取推广邀请链接
 */
export const recommendLink = (): Promise<HttpRes<RecommendLinkKey>> => {
  return http.get('/api/app/v1/recommend/link', {});
};

/**
 * 我推广的会员
 */
export const recommendCustomers = (data: PageRequest): Promise<HttpRes<RecommendCustomer[]>> => {
  return http.post('/api/app/v1/recommend/customers', data);
};

/**
 * 一键领取奖励(升级 + 投注)
 * @param data
 */
export const receiveRecommendReward = (data: ReceiveRecommendRewardDto): Promise<HttpRes<RecommendCustomer[]>> => {
  return http.post('/api/app/v1/recommend/receive-reward', data);
};

/**
 * 金豆账户变动记录
 */
export const pointsRecords = (data: PageRequest): Promise<HttpRes<PointsRecordField[]>> => {
  return http.post('/api/app/v1/points/records', data);
};

/**
 * 存款账户变动记录
 */
export const depositRecords = (data: PageRequest): Promise<HttpRes<DepositRecordField[]>> => {
  return http.post('/api/app/v1/deposit/records', data);
};

/**
 * 兑换红包
 * @param data
 * @returns
 */
export const packExchange = (data: PackExchangeDto): Promise<HttpRes<unknown>> => {
  return http.post<HttpRes<unknown>>(`/api/app/v1/pack/exchange`, data);
};

/**
 * 每日首次充值返利记录
 */
export const wagesCzRecords = (data: PageRequest): Promise<HttpRes<WagesCzRecordField[]>> => {
  return http.post('/api/app/v1/wages-cz/records', data);
};

/**
 * 领取首次充值奖励
 * @param id
 */
export const receiveWagesCz = (id: number): Promise<HttpRes<WagesCzRecordField>> => {
  return http.post(`/api/app/v1/wages-cz/receive/${id}`, {});
};

/**
 * 亏损返利记录
 */
export const wagesRecords = (data: PageRequest): Promise<HttpRes<WagesRecordField[]>> => {
  return http.post('/api/app/v1/wages/records', data);
};

/**
 * 领取亏损奖励
 * @param id
 */
export const receiveWages = (id: number): Promise<HttpRes<WagesRecordField>> => {
  return http.post(`/api/app/v1/wages/receive/${id}`, {});
};
