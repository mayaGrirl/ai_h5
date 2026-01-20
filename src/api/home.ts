import http from '@/utils/request'
import type { HttpRes, PageRequest } from '@/types/http.type'
import type {
  IndexType,
  IndexInfoDto,
  IndexDataItem,
  IndexGameDto,
  IndexGameItem,
  IndexDetailDto,
  webConfig,
  testDataRes,
  testDataDto
} from '@/types/index.type'

export { IndexType } from '@/types/index.type'

/**
 * 获取首页数据 - 通用方法
 */
export const getIndex = (data: IndexInfoDto): Promise<HttpRes<IndexDataItem[]>> => {
  return http.post<HttpRes<IndexDataItem[]>, IndexInfoDto>('/api/app/v1/index', data)
}

export const getIndexDetail = (id: number): Promise<HttpRes<IndexDataItem>> => {
  return http.post<HttpRes<IndexDataItem>, IndexDetailDto>('/api/app/v1/index/detail', { id })
}

export const indexGameHotNew = (data: IndexGameDto): Promise<HttpRes<IndexGameItem>> => {
  return http.post<HttpRes<IndexGameItem>, IndexGameDto>('/api/app/v1/game/newHot', data)
}

// 站内消息
export const systemMessage = (data: PageRequest): Promise<HttpRes<IndexDataItem[]>> => {
  return http.post('/api/app/v1/system/message', data)
}

// ==================== 首页使用 ====================

/** 获取首页轮播图 (type=1) */
export const getBanners = () => getIndex({ type: 1 as IndexType })

/** 获取公告列表 (type=2) */
export const getAnnouncements = () => getIndex({ type: 2 as IndexType })

/** 获取活动列表 (type=3) */
export const getActivities = () => getIndex({ type: 3 as IndexType })

/** 获取合作商家 (type=4) */
export const getPartners = () => getIndex({ type: 4 as IndexType })

/** 获取首页弹框公告 (type=5) */
export const getHomePopup = () => getIndex({ type: 5 as IndexType })

// ==================== 其他页面使用 ====================

/** 获取游戏页滚动公告 (type=7) */
export const getGameNotice = () => getIndex({ type: 7 as IndexType })

/** 获取登录页Banner (type=8) */
export const getLoginBanner = () => getIndex({ type: 8 as IndexType })

/** 获取我的页广告 (type=9) */
export const getMineAd = () => getIndex({ type: 9 as IndexType })

// ==================== 系统配置 ====================

export const getWebConfig = (): Promise<HttpRes<webConfig>> => {
  return http.get<HttpRes<webConfig>, object>('/api/app/v1/sysConfig', {})
}

// ==================== 测试 ====================

export const testData = (data: testDataDto): Promise<HttpRes<testDataRes>> => {
  return http.post<HttpRes<testDataRes>, testDataDto>('/api/app/v1/game/lotteryList', data)
}
