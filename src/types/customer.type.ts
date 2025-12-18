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

// 管理员 / 用户基础信息
export interface MemberField {
  aid: number;
  qq: string | null;
  nickname: string | null;
  birthday: number;
  signature: string | null;
  realname: string | null;
  gender: number | null;
  alipay: string | null;
  wchat: string | null;
  address: string | null;
  sign: string | null;
  mobile: string | null;
  email: string | null;
}

// 管理员 / 用户基础信息
export interface CustomerField {
  id: number;
  sid: number;
  user: string;
  mobile: string;
  securitypass: string;
  email: string;
  gid: number;
  level: number;
  nw: number;
  vip: number;
  vipStime: number;
  vipEtime: number;
  avatar: string;
  regtime: number;
  reg_ip: string;
  reg_address: string;
  last_login_time: number;
  last_login_ip: string;
  last_login_address: string;
  login_sun: number;
  status: number;
  tjr: number;
  tgall: number;
  isLogin: number;
  address1: string;
  address2: string;
  loginVerifyType: string;
  isMobile: number;
  prizeVerifyType: string;
  selectcardVerifyType: string;
  sc: number;
  cz: number;
  czf: number;
  tz: number;
  tzf: number;
  zcf: number;
  scf: number;
  ksf: number;
  xm: number;
}
