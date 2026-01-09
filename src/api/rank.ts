import {HttpRes} from "@/types/http.type";
import http from "@/utils/request";
import {LastWeekField, TodayField, YesterdayField} from "@/types/rank.type";

/**
 * 今日排行榜
 */
export const today = (): Promise<HttpRes<TodayField[]>> => {
  return http.get(`/api/app/v1/rank/today`, {});
};
/**
 * 昨日排行榜
 */
export const yesterday = (): Promise<HttpRes<YesterdayField[]>> => {
  return http.get(`/api/app/v1/rank/yesterday`, {});
};
/**
 * 今日排行榜
 */
export const lastWeek = (): Promise<HttpRes<LastWeekField[]>> => {
  return http.get(`/api/app/v1/rank/week`, {});
};


