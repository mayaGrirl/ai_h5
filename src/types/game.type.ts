// 游戏分类和游戏列表响应
export interface GameClassRes {
  typeArr?: GameType[];
  gameArr?: Game[];
  gameTypeMap?: GameTypeMapItem[];  // 修改：实际是数组而不是对象
}

// 游戏分类（系列）
export interface GameType {
  id: number;
  title: string;  // 修改：实际字段名是 title 而不是 name
  logo?: string;
  lang_title?: Record<string, string> | null;
  sort?: number;
  is_show?: number;
  created_at?: string;
  updated_at?: string;
}

// 游戏
export interface Game {
  id: number;
  name: string;
  logo?: string;
  game_logo?: string;
  lang_name?: Record<string, string> | null;
  game_class?: number;  // 所属分类ID
  is_hot?: number;
  is_show?: number;
  info?: string;
  lang_info?: Record<string, string>;
  sort?: number;
  created_at?: string;
  updated_at?: string;
}

// 游戏分类映射项（实际返回的是数组，每项包含分类信息和子游戏列表）
export interface GameTypeMapItem {
  id: number;
  title: string;
  lang_title?: Record<string, string> | null;
  logo?: string;
  children: Game[];  // 包含完整的游戏对象
}

// 旧的映射类型，保留以兼容
export interface GameTypeMap {
  [typeId: string]: number[];
}

// 游戏玩法列表响应
export interface gamePlayAll {
  playedArr?: GamePlay[];
  groupArr?: GamePlayGroup[];
  gamePlayMap?: GamePlayMapItem[];  // 修改：实际是数组而不是对象
}

// 游戏玩法
export interface GamePlay {
  id: number;
  name: string;
  lang_name?: Record<string, string> | null;
  lottery_id?: number;  // 所属游戏ID（实际字段：game_class）
  group_id?: number;    // 所属玩法分组ID（实际字段：played_group）
  multiple?: number;    // 赔率原始值
  odds?: string | number;  // 赔率（已处理）
  min_bet?: number;     // 最小下注（实际字段：min_bet_gold）
  max_bet?: number;     // 最大下注（实际字段：max_bet_gold）
  info?: string;        // 玩法说明
  lang_info?: Record<string, string> | null;
  unique_played_method?: string;  // 唯一玩法标识
  sort?: number;
  is_show?: number;     // 显示状态（实际字段：status）
  status?: number;      // 状态
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// 玩法分组
export interface GamePlayGroup {
  id: number;
  name: string;
  lang_name?: Record<string, string> | string;
  game_class?: number;  // 所属游戏分类
  game_type?: number;   // 游戏类型
  reward_num?: number;  // 奖励数量
  start_num?: number;   // 起始数字
  logo?: string;
  status?: number;      // 状态（实际字段：status）
  sort?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

// 玩法映射项（实际返回的是数组，每项包含分组信息和子玩法列表）
export interface GamePlayMapItem {
  id: number;
  name: string;
  lang_name?: Record<string, string> | string;
  game_class?: number;
  game_type?: number;
  logo?: string;
  children: GamePlay[];  // 包含完整的玩法对象
}

// 旧的映射类型，保留以兼容
export interface GamePlayMap {
  [groupId: string]: number[];
}

// 获取玩法列表请求参数
export interface gamePlayAllDto {
  lottery_id: number;
}

// 投注请求参数
export interface BetGameDto {
  game_group_id: string | number;  // 玩法分组ID
  lottery_id: string | number;     // 游戏ID
  bet_no: string;                  // 投注号码（逗号分隔）
  bet_expect_no: string;           // 投注期号
  bet_gold: string;                // 投注金额（逗号分隔）
  lottery_played_id: string;       // 玩法ID（逗号分隔）
  total_gold: number;              // 总金额
}

// 期号信息
export interface ExpectInfo {
  expect_no: string;
  action_no?: string | number;
  action_time?: string;
  open_time?: string;
  close_time?: string;
  open_timestamp?: number;
  close_timestamp?: number;
  open_countdown?: number;
  close_countdown?: number;
  finalRes?: {
    sum?: string | number;
    shape?: string;
    lungFuPao?: string;
    [key: string]: any;
  };
  action_no_sort?: string | number;
}

// 获取期号信息请求参数
export interface ExpectInfoDto {
  lottery_id: number;
  game_group_id: number;
}

// 获取期号信息响应
export interface ExpectInfoRes {
  currExpectInfo?: ExpectInfo;
  lastExpectInfo?: ExpectInfo;
}

// 投注响应
export interface BetGameRes {
  // 根据实际API返回定义，暂时留空
  [key: string]: any;
}



