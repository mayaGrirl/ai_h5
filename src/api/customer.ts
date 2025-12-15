import {HttpRes} from "@/types/http.type";
import http from "@/utils/request";
import {UpdateNicknameDto} from "@/types/customer.type";

/**
 * 登录
 * @param data
 * @returns
 */
export const updateNickname = (data: UpdateNicknameDto): Promise<HttpRes<unknown>> => {
  return http.put<HttpRes<unknown>>(`/api/app/v1/customer/edit/nickname`, data);
};
