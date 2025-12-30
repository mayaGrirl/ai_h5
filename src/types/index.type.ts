/**
 * 首页数据类型枚举
 * 1-轮播图, 2-公告, 3-活动, 4-合作商家, 5-首页弹框公告
 * 6-站内消息, 7-滚动公告(游戏页), 8-登录页banner, 9-我的页广告
 */
export enum IndexType {
  BANNER = 1,
  ANNOUNCEMENT = 2,
  ACTIVITY = 3,
  PARTNER = 4,
  HOME_POPUP = 5,
  MESSAGE = 6,
  GAME_NOTICE = 7,
  LOGIN_BANNER = 8,
  MINE_AD = 9,
}

/**
 * 首页数据请求参数
 */
export interface IndexInfoDto {
  type: number;
  roll?: string;
  alert?: string;
  is_expired?: string;
}

/**
 * 首页数据项 - 后端实际返回的数据格式
 */
export interface IndexDataItem {
  id: number;
  title: string;
  lang_title?: object | [];
  roll: number;
  alert: number;
  type: number;
  content: string;
  lang_content?: object | [] ;
  pic: string;
  pc_pic: string;
  jump_url: string;
  start_at?: string | null;
  end_at?: string | null;
  sort: number;
  admin_id?: number;
  admin?: string;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * ITradePasswordDto
 */
export interface ITradePasswordDto {
  confirm_password: string;
  key: string;
  password: string;
  point: string;
  verify_code: string;
  [property: string]: unknown;
}
