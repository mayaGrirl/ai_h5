// 充值 / 转换
export interface AgentRechargeDto {
  uid: number,
  amount: number,
}

// 回收点卡
export interface AgentRecycle {
  type: string,
  cards: string,
}

// 代理
export interface AgentField {
  id: number;
  uid: number;
  name: string;
  buycard_rate: number;
  reccard_rate: number;
  reccard_profit_rate: number;
  distribute_money: number;
  can_reccard: number;
  nw: number;
  state: number;
  state_label: string;
  isshow: number;
  tj: number;
  ad: number;
  qq: number;
  wx: string;
  addtime: number;
  points: number;
  bankpoints: number;
}

// 代理操作记录
export interface AgentLogField {
  id: number;
  agentid: number;
  touserid: number;
  type: number;
  type_label: string;
  addtime: number;
  ip: string;
  address: string;
  points: number;
  totalpoints: number;
  content: string;
  remark: string;
  status: number;
  status_label: string;
}
