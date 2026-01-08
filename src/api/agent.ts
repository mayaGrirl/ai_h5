import {HttpRes, PageRequest} from "@/types/http.type";
import http from "@/utils/request";
import {AgentField, AgentLogField, AgentRechargeDto, AgentRecycle} from "@/types/agent.type";
import {MemberCapital, MemberField} from "@/types/customer.type";
import {CardRecordField} from "@/types/shop.type";

/**
 * 代理人选项
 */
export const agentOptions = (): Promise<HttpRes<AgentField[]>> => {
  return http.get('/api/app/v1/agent/options', {});
};

/**
 * 代理明细
 */
export const agentProfile = (): Promise<HttpRes<AgentField>> => {
  return http.get('/api/app/v1/agent/profile', {});
};

/**
 * 检测账号是否存在
 */
export const checkUid = (id: number): Promise<HttpRes<MemberField>> => {
  return http.get(`/api/app/v1/agent/check-uid/${id}`, {});
};

/**
 * 充值
 */
export const agentRecharge = (data: AgentRechargeDto): Promise<HttpRes<MemberCapital>> => {
  return http.post('/api/app/v1/agent/recharge', data);
};

/**
 * 转换额度
 */
export const agentTransfer = (data: AgentRechargeDto): Promise<HttpRes<MemberCapital>> => {
  return http.post('/api/app/v1/agent/transfer', data);
};

/**
 回收点卡
 */
export const agentRecycle = (data: AgentRecycle): Promise<HttpRes<CardRecordField[]>> => {
  return http.post('/api/app/v1/agent/recycle', data);
};

/**
 * 充值记录
 */
export const agentLogRecord = (data: PageRequest): Promise<HttpRes<AgentLogField[]>> => {
  return http.post('/api/app/v1/agent/recharge/records', data);
};
