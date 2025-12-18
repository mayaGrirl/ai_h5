export interface RegistrationDto {
  email: string;
  verify_code: string;
  inviteCode: string;
  password: string;
  confirm_password: string;
  public_key: string;
  private_key: string;
  point: string;
  key: string;
}

export interface LoginDto {
  mobile: string;
  password: string;
  mfa_code: string;
}

export interface RegistrationReq {
  access_token: string;
  token_type: string;
  expires_at: number;
  mfa_sercret: string;
  qr_url: string;
}

export interface LoginReq {
  access_token?: string;
  token_type?: string;
  expires_at?: number;
  sercret?: string;
  is_set_pay_password?: boolean;
}

export interface ForgetPasswordDto {
  /**
   * 邮件验证码
   */
  verify_code: string;
  /**
   * 确认密码
   */
  confirm_password: string;
  /**
   * 邮件账户
   */
  email: string;
  /**
   * 滑动验证key
   */
  key: string;
  /**
   * 新密码
   */
  password: string;
  /**
   * 滑动验证分数
   */
  point: string;
  [property: string]: unknown;
}

export interface ResetPasswordDto {
  /**
   * 确认密码
   */
  confirm_password: string;
  key: string;
  /**
   * 新密码
   */
  password: string;
  point: string;
  verify_code: string;
  [property: string]: unknown;
}

/**
 * ITradePasswordDto
 */
export interface ITradePasswordDto {
  /**
   * 确认密码
   */
  confirm_password: string;
  /**
   * key
   */
  key: string;
  /**
   * 支付密码
   */
  password: string;
  /**
   * 分数
   */
  point: string;
  /**
   * 验证code
   */
  verify_code: string;
  [property: string]: unknown;
}
