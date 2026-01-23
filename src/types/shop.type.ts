/**
 * 兑换卡密
 */
export interface CardExchangeDto {
  amount: number;
  commission: number;
  safe_ask?: string;
  answer?: string;
  verify_code?: string | number;
}

/**
 * 兑换卡密需要的明细数据
 */
export interface CardDetailResponse {
  // 卡密验证方式
  prize_verify_type?: string;
  // 金豆
  points?: number;
  // 银行存款
  bank_points?: number;
  // 折合人民币
  bank_points_convert?: number;
  // 是否允许兑换
  is_allowed_exchange?: number;
  // 分组名称
  gid_name?: string;
  // 指定周期内的总流水
  week_water?: number;
  // 免除手续费的可领取金豆
  exempt_commission_bank_points?: number;
  // 指定周期内已经兑换过的金豆总额
  redeemed_beans_period?: number;
  // 温馨提示
  block_content: string;
}

/**
 * 免费兑换
 */
export interface CardCashFree {
  total_water?: number;
  received?: number;
  remaining?: number;
}

// 兑换的卡密字段
export interface CardRecordField {
  id?: number;
  uid?: number;
  nickname?: string | null;
  type?: number;
  stype?: string | null;
  no?: string | null;
  pwd?: string | null;
  points?: number;
  points2?: number;
  change_points?: number;
  addtime?: number;
  add_ip?: string | null;
  add_address?: string | null;
  agentid?: number;
  useid?: number;
  used_time?: number;
  used_ip?: string | null;
  used_address?: string | null;
  qq?: string | null;
  rname?: string | null;
  remark?: string | null;
  state?: number;
  sxf?: number;
  type_label?: string | null;
  state_label?: string | null;
}
