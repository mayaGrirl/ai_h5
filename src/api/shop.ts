import {HttpRes, PageRequest} from "@/types/http.type";
import http from "@/utils/request";
import {CardDetailResponse, CardExchangeDto, CardRecordField} from "@/types/shop.type";


/**
 * 工资日记录
 */
export const cardRecords = (data: PageRequest): Promise<HttpRes<CardRecordField[]>> => {
  return http.post('/api/app/v1/card/records', data);
};

/**
 * 兑换卡密需要的明细
 */
export const cardDetail = (): Promise<HttpRes<CardDetailResponse>> => {
  return http.get('/api/app/v1/card/detail', {});
};

/**
 * 兑换卡密
 */
export const cardExchange = (data: CardExchangeDto): Promise<HttpRes<unknown>> => {
  return http.post('/api/app/v1/card/exchange', data);
};
