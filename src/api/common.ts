import {HttpRes} from "@/types/http.type";
import {BlockField} from "@/types/customer.type";
import http from "@/utils/request";

/**
 * 获取Block数据
 */
export const getBlockByIdentifier = (identifier:string): Promise<HttpRes<BlockField>> => {
  return http.get(`/api/app/v1/block/identifier/${identifier}`, {});
};
