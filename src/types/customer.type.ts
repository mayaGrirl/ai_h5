/**
 * 更新昵称
 */
export interface UpdateNicknameDto {
  nickname: string;
}

/**
 * 设置密保问题
 */
export interface SetSecurityPassDto {
  safe_ask: string;
  answer: string;
}
