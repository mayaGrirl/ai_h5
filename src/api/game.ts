import http from "@/utils/request";
import { HttpRes } from "@/types/http.type";

import {
  GameClassRes, gamePlayAll, gamePlayAllDto, BetGameDto, BetGameRes, ExpectInfoDto, ExpectInfoRes, LotteryDataDto,
  BetDataDto, LotteryListRes, BetRecordRes, ModeListDto, ModeListRes, SetModeDto, SetModeRes,
  AutoOneDto, AutoOneRes, SetAutoDto, SetAutoRes

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
  // 确保 expect_no 是字符串类型，后端要求必须是字符串
  const payload = {
    ...data,
    expect_no: data.expect_no !== undefined ? String(data.expect_no) : undefined,
  };
  return http.post<HttpRes<BetRecordRes>, BetDataDto>("/api/app/v1/game/betRecord", payload);
};

//获取开奖记录
export const lotteryRecord = (data: LotteryDataDto): Promise<HttpRes<LotteryListRes>> => {
  return http.post<HttpRes<LotteryListRes>, LotteryDataDto>("/api/app/v1/game/lotteryList", data);
};

//获取模式列表
export const modeList = (data: ModeListDto): Promise<HttpRes<ModeListRes>> => {
  return http.post<HttpRes<ModeListRes>, ModeListDto>("/api/app/v1/game/modeList", data);
};

//配置模型，增加（不传mode_id或者传0），编辑（必传mode_id >0）,删除其实就是编辑：就是status =0删除，1为正常
export const setMode = (data: SetModeDto): Promise<HttpRes<SetModeRes>> => {
  return http.post<HttpRes<SetModeRes>, SetModeDto>("/api/app/v1/game/mode", data);
};

//获取自动配置，有且只有一个，如果有直接回显到表单
export const autoOne = (data: AutoOneDto): Promise<HttpRes<AutoOneRes>> => {
  return http.post<HttpRes<AutoOneRes>, AutoOneDto>("/api/app/v1/game/auto", data);
};

//配置自动投注，有则更改，无则增加
export const setAuto = (data: SetAutoDto): Promise<HttpRes<SetAutoRes>> => {
  return http.post<HttpRes<SetAutoRes>, SetAutoDto>("/api/app/v1/game/autoSet", data);
};




