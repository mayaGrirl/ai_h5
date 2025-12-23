export interface RegistrationDto {
  mobile: string;
  verify_code: string;
  password: string;
  confirm_password: string;
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
   * 手机号码
   */
  mobile: string;
  /**
   * 验证码
   */
  verify_code: string;
  /**
   * 新密码
   */
  password: string;
  /**
   * 确认密码
   */
  confirm_password: string;
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
