import http from "@/utils/request";
import { HttpRes } from "@/types/http.type";

import {
  GameClassRes, gamePlayAll, gamePlayAllDto, BetGameDto, BetGameRes, ExpectInfoDto, ExpectInfoRes, LotteryDataDto,
  BetDataDto, LotteryListRes, BetRecordRes

} from "@/types/game.type";


export const gameAll = ({}): Promise<HttpRes<GameClassRes>> => {
  return http.get<HttpRes<GameClassRes>>("/api/app/v1/game/all", {});
};

export const playAll = (data:gamePlayAllDto): Promise<HttpRes<gamePlayAll>> => {
  return http.post<HttpRes<gamePlayAll>, gamePlayAllDto>("/api/app/v1/game/playAll", data);
};

//投注接口
export const betGame = (data: BetGameDto): Promise<HttpRes<BetGameRes>> => {
  return http.post<HttpRes<BetGameRes>, BetGameDto>("/api/app/v1/game/bet", data);
};

// 获取当前期号和最近一期开奖信息
export const fetchExpectInfo = (data: ExpectInfoDto): Promise<HttpRes<ExpectInfoRes>> => {
  return http.post<HttpRes<ExpectInfoRes>, ExpectInfoDto>("/api/app/v1/game/expectInfo", data);
};

//获取投注记录
export const betRecords = (data: BetDataDto): Promise<HttpRes<BetRecordRes>> => {
  return http.post<HttpRes<BetRecordRes>, BetDataDto>("/api/app/v1/game/betRecord", data);
};

//获取开奖记录
export const lotteryRecord = (data: LotteryDataDto): Promise<HttpRes<LotteryListRes>> => {
  return http.post<HttpRes<LotteryListRes>, LotteryDataDto>("/api/app/v1/game/lotteryList", data);
};

