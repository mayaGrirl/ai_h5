import {HttpRes} from "@/types/http.type";
import http from "@/utils/request";
import {SetSecurityPassDto, UpdateNicknameDto} from "@/types/customer.type";

/**
 * 更新昵称
 * @param data
 * @returns
 */
export const updateNickname = (data: UpdateNicknameDto): Promise<HttpRes<unknown>> => {
  return http.put<HttpRes<unknown>>(`/api/app/v1/customer/edit/nickname`, data);
};

/**
 * 设置密保问题
 * @param data
 * @returns
 */
export const setSecurityPass = (data: SetSecurityPassDto): Promise<HttpRes<unknown>> => {
  return http.put<HttpRes<unknown>>(`/api/app/v1/customer/set/security-pass`, data);
};
