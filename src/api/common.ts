import {HttpRes} from "@/types/http.type";
import {BlockField} from "@/types/customer.type";
import http from "@/utils/request";
import {CustomerLevelField, RKey} from "@/types/common.type";

/**
 * 获取Block数据
 */
export const getBlockByIdentifier = (identifier:string): Promise<HttpRes<BlockField>> => {
  return http.get(`/api/app/v1/block/identifier/${identifier}`, {});
};

/**
 * 获取Block数据
 */
export const getPasswordTip = (): Promise<HttpRes<BlockField>> => {
  return http.get(`/api/app/v1/password/tip`, {});
};

/**
 * 获取会员等级选项
 */
export const getCustomerLevelOptions = (): Promise<HttpRes<CustomerLevelField[]>> => {
  return http.get(`/api/app/v1/customer-level/options`, {});
};

/**
 * 获取公钥key
 */
export const httpConfigRKey = (): Promise<HttpRes<RKey>> => {
  return http.get(`/api/app/v1/r-key`, {});
};
