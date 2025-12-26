import {packExchange} from "@/api/customer";

/**
 * 更新昵称
 */
export interface UpdateNicknameDto {
  nickname: string;
}

/**
 * 绑定邮箱
 */
export interface BindEmailDto {
  email: string;
}

/**
 * 修改密码
 */
export interface UpdatePasswordDto {
  safe_ask: string;
  answer: string;
  password: string;
  confirm_password: string;
}

/**
 * 设置登录地限制
 */
export interface SettingLoginAddressDto {
  enabled: number,
  address1?: string,
  address2?: string,
}

/**
 * 设置登录短信验证
 */
export interface SettingLoginSmsDto {
  login_verify_type: string,
}

/**
 * 设置兑换礼品验证方式
 */
export interface RedeemGiftVerifyTypeDto {
  prize_verify_type: string,
}

/**
 * 存款转入转出
 */
export interface CustomerTransferDto {
  type: string,
  amount: number,
  pay_password?: string,
}

/**
 * 设置查看卡密验证方式
 */
export interface ViewCardVerifyTypeDto {
  select_card_verify_type: string,
}

/**
 * 设置密保问题
 */
export interface SetSecurityPassDto {
  safe_ask: string;
  answer: string;
}

/**
 * 更新资料
 */
export interface UpdateProfileDto {
  qq?: string;
  alipay?: string;
  wchat?: string;
  realname?: string;
  address?: string;
  signature?: string;
}

/**
 * 一键领取推荐奖励
 */
export interface ReceiveRecommendRewardDto {
  type: number,
}

/**
 * 兑换红包
 */
export interface PackExchangeDto {
  code: string,
}

export interface RecommendLinkKey {
  key: string;
}

export interface RecommendCustomer {
  "id"?: number,
  "regtime"?: number,
  "tgall"?: number,
  "nickname"?: string | null,
  "experience"?: number,
  "tzpoints"?: number
}

// 管理员 / 用户基础信息
export interface MemberField {
  aid?: number;
  qq?: string | null;
  nickname?: string | null;
  birthday?: number;
  signature?: string | null;
  realname?: string | null;
  gender?: number;
  alipay?: string | null;
  wchat?: string | null;
  address?: string | null;
  sign?: string | null;
  mobile?: string | null;
  email?: string | null;
}

// 会员余额
export interface MemberCapital {
  cid?: number;
  money?: string | null;
  gold?: number;
  points?: number;
  bankpoints?: number;
  blessing?: number;
  bill?: string | null;
  bond?: string | null;
  frozen?: string | null;
  signin?: number;
  signins?: number;
  experience?: number;
  next_level?: number;
  udapoints?: number;
}

// 会员明细
export interface CustomerProfile {
  "customer": CustomerField;
  "member_field": MemberField;
  "member_capital": MemberCapital;
}

// 用户基础信息
export interface CustomerField {
  id?: number;
  sid?: number;
  user?: string | null;
  mobile?: string | null;
  securitypass?: string | null;
  email?: string | null;
  gid?: number;
  gid_label?: string | null;
  level?: number;
  nw?: number;
  vip?: number;
  vip_label?: string | null;
  vipStime?: number;
  vipEtime?: number;
  avatar?: string | null;
  avatar_url?: string | null;
  regtime?: number;
  reg_ip?: string | null;
  reg_address?: string | null;
  last_login_time?: number;
  last_login_ip?: string | null;
  last_login_address?: string | null;
  login_sun?: number;
  status?: number;
  tjr?: number;
  tgall?: number;
  isLogin?: number;
  address1?: string | null;
  address2?: string | null;
  loginVerifyType?: string | null;
  isMobile?: number;
  prizeVerifyType?: string | null;
  selectcardVerifyType?: string | null;
  sc?: number;
  cz?: number;
  czf?: number;
  tz?: number;
  tzf?: number;
  zcf?: number;
  scf?: number;
  ksf?: number;
  xm?: number;
}

// 获取救济数据
export interface ReliefResponse {
  options: MemberLevel[],
  receive_count: number,
  limit: number,
}

// 会员等级配置
export interface MemberLevel {
  id?: number;
  name?: string | null;
  level?: number;
  emin?: number;
  emax?: number;
  tg?: number;
  day_jiuji_point?: number;
  reward_discount?: string | null;
}

export interface BlockField {
  id?: number;
  identifier?: string | null;
  language?: string | null;
  title?: string | null;
  content_type?: number;
  content?: string | null;
  status?: number;
  disable_action?: string | null;
  operator_user_id?: number;
  operator_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// 金豆变动记录
export interface PointsRecordField {
  id?: number;
  member_id?: number;
  mobile?: string | null;
  type?: number;
  type_label?: string | null;
  points?: number;
  b_points?: number;
  a_points?: number;
  remark?: string | null;
  deleted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// 存款变动记录
export interface DepositRecordField {
  id?: number;
  member_id?: number;
  mobile?: string | null;
  type?: number;
  type_label?: string | null;
  deposit?: number;
  b_deposit?: number;
  a_deposit?: number;
  remark?: string | null;
  deleted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}
