import http from "@/utils/request";
import { HttpRes } from "@/types/http.type";
import {IndexType, IndexInfoDto, IndexDataItem, IndexGameDto, IndexGameItem, IndexDetailDto} from "@/types/index.type";

export { IndexType } from "@/types/index.type";

/**
 * 获取首页数据 - 通用方法
 * 返回格式: { code: 200, data: IndexDataItem[] }
 */
  export const getIndex = (data: IndexInfoDto): Promise<HttpRes<IndexDataItem[]>> => {
  return http.post<HttpRes<IndexDataItem[]>, IndexInfoDto>("/api/app/v1/index", data);
};

export const getIndexDetail = (id: number): Promise<HttpRes<IndexDataItem>> => {
  return http.post<HttpRes<IndexDataItem>, IndexDetailDto>("/api/app/v1/index/detail", {id});
};

export const indexGameHotNew = (data: IndexGameDto): Promise<HttpRes<IndexGameItem>> => {
  return http.post<HttpRes<IndexGameItem>, IndexGameDto>("/api/app/v1/game/newHot", data);
};



// ==================== 首页使用 ====================

/** 获取首页轮播图 (type=1) */
export const getBanners = () => getIndex({ type: IndexType.BANNER });

/** 获取公告列表 (type=2) */
export const getAnnouncements = () => getIndex({ type: IndexType.ANNOUNCEMENT });

/** 获取活动列表 (type=3) */
export const getActivities = () => getIndex({ type: IndexType.ACTIVITY });

/** 获取合作商家 (type=4) */
export const getPartners = () => getIndex({ type: IndexType.PARTNER });

/** 获取首页弹框公告 (type=5) */
export const getHomePopup = () => getIndex({ type: IndexType.HOME_POPUP });

// ==================== 其他页面使用 ====================

/** 获取站内消息 (type=6) */
export const getMessages = () => getIndex({ type: IndexType.MESSAGE });

/** 获取游戏页滚动公告 (type=7) */
export const getGameNotice = () => getIndex({ type: IndexType.GAME_NOTICE });

/** 获取登录页Banner (type=8) */
export const getLoginBanner = () => getIndex({ type: IndexType.LOGIN_BANNER });

/** 获取我的页广告 (type=9) */
export const getMineAd = () => getIndex({ type: IndexType.MINE_AD });

//获取首页热门游戏
export const indexHotNew = () => getIndex({ type: IndexType.MINE_AD });


// ==================== 系统配置 ====================

export const getConfig = (): Promise<HttpRes<unknown>> => {
  return http.post("/api/app/v1/sysConfig", {});
};
