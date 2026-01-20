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
  min_bet?: number;     // 最小下注
  min_bet_gold?: number; // 最小下注金额
  max_bet?: number;     // 最大下注
  max_bet_gold?: number; // 最大下注金额
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
  info?: string;        // 游戏规则说明
  lang_info?: Record<string, string> | null;  // 多语言游戏规则
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
  info?: string;        // 游戏规则说明
  lang_info?: Record<string, string> | null;  // 多语言游戏规则
  children: GamePlay[];  // 包含完整的玩法对象
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
  finalRes?: ExpectFinalRes;
  action_no_sort?: string | number;
}

// 期号开奖结果
export interface ExpectFinalRes {
  expect_no?: string;
  expectNo?: string;  // API返回的驼峰命名
  nums?: string | string[] | Record<string, string>;
  sum?: string | number;
  bigSmall?: string;
  oddEven?: string;
  shape?: string;
  lungFuPao?: string;
  // 动态开奖结果字段，根据 game_group_id 取值
  // finalOpenRes3, finalOpenRes4, finalOpenRes5, etc.
  [key: `finalOpenRes${number}`]: string | number | undefined;
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
  success?: boolean;
  message?: string;
  order_id?: string | number;
}

export interface LotteryDataDto {
  lottery_id: number;
  game_group_id:number;
  page:number;
  pageSize:number;
}

export interface BetDataDto {
  page:number;
  pageSize:number;
  lottery_id: number;
  game_group_id:number;
  expect_no?: string;  // 期号，用于查询当期投注
}

// 开奖记录响应
export interface LotteryListRes {
  list: LotteryResultItem[];
  total?: number;
  page?: number;
  pageSize?: number;
}

// 开奖记录项
export interface LotteryResultItem {
  id?: number;
  game_type_id?: number;
  is_opened?: number;
  expect_no?: string;
  action_no?: string;
  action_no_sort?: string;
  action_no_num?: string | string[] | Record<string, string>;
  origin_data?: string;
  open_time?: string;
  close_time?: string;
  bet_gold?: number;
  win_person_num?: number;
  user_bet_gold?: number;
  user_bet_win_gold?: number;
  game_type_name?: string;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  final_res?: LotteryFinalRes;
  memberBet?: MemberBetItem[] | MemberBetItem;  // 可能是数组或单个对象
}

// 开奖结果详情
export interface LotteryFinalRes {
  expect_no?: string;
  expectNo?: string;  // API返回的驼峰命名
  nums?: string | string[] | Record<string, string>;  // 可能是字符串、数组或对象
  sum?: number | string;
  bigSmall?: string;  // 大/小
  oddEven?: string;   // 单/双
  middleSide?: string;  // 中/边
  tail?: number | string;  // 尾数
  tailBigSmall?: string;  // 尾大/尾小
  mod6?: number;  // 余6
  mod5?: number;  // 余5
  mod4?: number;  // 余4
  mod3?: number;  // 余3
  shape?: string;     // 形态：bao/ban/dui/za/shun等
  lungFuPao?: string;
  finalResRecord?: string;  // 开奖结果记录文本
  // 动态字段：finalOpenRes1, finalOpenRes2, etc.
  [key: `finalOpenRes${number}`]: string | number | undefined;
}

// 用户在该期的投注记录
export interface MemberBetItem {
  id?: number;
  expect_no?: string;
  game_type_id?: number;   // 游戏类型ID
  game_group_id?: number;  // 玩法分组ID
  bet_gold?: number;       // 投注金豆
  win_gold?: number;       // 赢得金豆
  profit?: number;         // 盈亏
  status?: number;         // 状态
  created_at?: string;
}

// 投注记录响应
export interface BetRecordRes {
  list: BetRecordItem[];
  total?: number;
  page?: number;
  pageSize?: number;
}

// 投注记录项
export interface BetRecordItem {
  id?: number;
  member_id?: number;
  game_type_id?: number;
  game_group_id?: number;
  expect_no?: string;
  bet_no?: BetNoItem[] | Record<string, BetNoItem>;  // 可能是数组或对象
  bet_gold?: number;
  bet_no_gold?: string;
  bet_num?: number;
  win_gold?: number;
  water_gold?: number;
  bet_time?: string;
  is_opened?: number;    // 0: 未开奖, 1: 已开奖
  is_win?: number;       // 0: 待开奖, 2: 中奖, 3: 未中奖
  is_robot?: number;
  is_auto?: number;
  status?: number | string;  // 0: 未结算, 1: 已结算, 2: 已回滚, 3: 已删除
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  win_loss?: number;     // 盈亏
  game_type_name?: string;
  member_name?: string;
}

// 投注号码详情
export interface BetNoItem {
  bet_no?: string;
  bet_gold?: number;
  bet_play?: string;
  multiple?: number;
  win_gold?: number;
  unique_played_method?: string;
}

// ====================== 模式相关类型 ======================

// 获取模式列表请求参数
export interface ModeListDto {
  lottery_id: number;
  game_group_id: number;
  page: number;
  pageSize: number;
  mode_id?: number;  // 编辑时传递，获取指定模式详情
}

// 设置模式请求参数
export interface SetModeDto {
  id?: number;                // 模式ID（用于删除操作）
  lottery_id?: number | string;
  game_group_id?: number | string;
  lottery_played_id?: string;  // 玩法ID（逗号分隔）
  bet_no?: string;             // 投注号码（逗号分隔）
  bet_gold?: string;           // 投注金额（逗号分隔）
  total_gold?: number;         // 总金额
  mode_name?: string;          // 模式名称
  mode_id?: number;           // 模式ID（0或不传=新增，>0=编辑）
  status?: number;            // 状态（0=删除，1=正常）
}

// 模式项
export interface ModeItem {
  id: number;
  mode_name: string;
  lottery_id: number;
  game_group_id: number;
  lottery_played_id: string;
  bet_no: string;
  bet_no_gold: string;
  bet_gold: string;
  total_gold: number;
  status: number;
  created_at?: string;
  updated_at?: string;
  game_group_name?: string;
}

// 模式列表响应
export interface ModeListRes {
  list: ModeItem[];
  total?: number;
  page?: number;
  pageSize?: number;
}

// 设置模式响应
export interface SetModeRes {
  success?: boolean;
  message?: string;
  mode_id?: number;
}

// ====================== 自动投注相关类型 ======================

// 获取自动配置请求参数
export interface AutoOneDto {
  lottery_id: number;
}

// 自动配置项
export interface AutoItem {
  id?: number;
  member_id?: number;
  auto_id?: number;           // 关联的自动配置ID
  game_type_id?: number;      // 游戏类型ID (lottery_id)
  game_group_id?: number;     // 玩法分组ID
  mode_id?: number;           // 模式ID
  total_expect_nums?: number; // 要执行的期数
  min_gold?: number;          // 金币下限
  max_gold?: number;          // 金币上限
  min_bet_num?: string;       // 最小期号
  max_bet_num?: string;       // 最大期号
  user_type?: number;
  status?: number;            // 0关闭，1启动
  mode_name?: string;         // 模式名称
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// 获取自动配置响应 - 数据直接返回，不包装在auto字段中
export type AutoOneRes = AutoItem | null;

// 设置自动配置请求参数
export interface SetAutoDto {
  lottery_id: number | string;
  game_group_id: number | string;  // 玩法分组ID
  mode_id: number | string;
  total_expect_nums: number;  // 要执行的期数（1-1440）
  min_gold: number;           // 金币下限
  max_gold: number;           // 金币上限
  status: number;             // 0关闭，1启动
}

// 设置自动配置响应
export interface SetAutoRes {
  success?: boolean;
  message?: string;
}

// ====================== 盈亏统计相关类型 ======================

// 获取盈亏统计请求参数
export interface ProfitLossDto {
  page: number;
  pageSize: number;
  lottery_id?: number;
  game_group_id?: number;
}

// 盈亏统计项
export interface ProfitLossItem {
  id?: number;
  member_id?: number;
  game_type_id?: number;
  game_group_id?: number;
  stat_date?: string;
  bet_count?: number;        // 投注次数
  bet_gold?: number;         // 投注金额
  win_gold?: number;         // 中奖金额
  profit?: number;           // 盈亏
  auto_bet_gold?: number;    // 自动投注金额
  hand_bet_gold?: number;    // 手动投注金额
  tax_gold?: number;         // 税金
  is_robot?: number;
  game_type_name?: string;   // 游戏名称
  game_group_name?: string;  // 分组名称
  created_at?: string;
  updated_at?: string;
}

// 盈亏汇总
export interface ProfitLossSummary {
  member_count?: number;
  bet_count?: number;
  bet_gold?: number;
  win_gold?: number;
  profit?: number;
  auto_bet_gold?: number;
  hand_bet_gold?: number;
  tax_gold?: number;
}

// 盈亏统计响应
export interface ProfitLossRes {
  list: ProfitLossItem[];
  total?: number;
  page?: number;
  pageSize?: number;
  summary?: ProfitLossSummary;
}


