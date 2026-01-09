"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { toast } from "sonner";
import { parseErrorMessage, parseAxiosError, cn } from "@/lib/utils";
import { useAuthStore } from "@/utils/storage/auth";
import { useFormatter } from "use-intl";
import Image from "next/image";

import { gameAll, lotteryRecord, playAll } from "@/api/game";
import {
  Game,
  GameTypeMapItem,
  LotteryResultItem,
  GamePlayGroup,
} from "@/types/game.type";

// 走势标签类型
type TrendTab = "nums" | "bigSmall" | "shape" | "mod";

export default function TrendPage() {
  useRequireLogin();
  const format = useFormatter();
  const router = useRouter();

  const searchParams = useSearchParams();
  const urlLotteryId = searchParams.get("lottery_id") || "";
  const urlGroupId = searchParams.get("group_id") || "";

  // Tab navigation
  const tabs = ["投注", "开奖记录", "投注记录", "模式", "自动", "走势", "盈亏"];
  const activeTab = "走势";

  const currentCustomer = useAuthStore((s) => s.currentCustomer);

  // 走势内容标签
  const [trendTab, setTrendTab] = useState<TrendTab>("nums");

  // Tab切换处理
  const handleTabClick = (tab: string) => {
    const currentLotteryId = activeGame?.id || urlLotteryId;
    if (tab === "投注") {
      router.push(`/games/play?lottery_id=${currentLotteryId}&group_id=${selectedGroupId}&t=${Date.now()}`);
      return;
    }
    if (tab === "开奖记录") {
      router.push(`/games/open?lottery_id=${currentLotteryId}&group_id=${selectedGroupId}&t=${Date.now()}`);
      return;
    }
    if (tab === "投注记录") {
      router.push(`/games/record?lottery_id=${currentLotteryId}`);
      return;
    }
    if (tab === "模式") {
      router.push(`/games/mode?lottery_id=${currentLotteryId}&group_id=${selectedGroupId}&t=${Date.now()}`);
      return;
    }
    if (tab === "自动") {
      router.push(`/games/auto?lottery_id=${currentLotteryId}&group_id=${selectedGroupId}&t=${Date.now()}`);
      return;
    }
    if (tab === "盈亏") {
      router.push(`/games/stat?lottery_id=${currentLotteryId}&group_id=${selectedGroupId}&t=${Date.now()}`);
      return;
    }
  };

  const [gameName, setGameName] = useState("加载中...");
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [showGameSelector, setShowGameSelector] = useState(false);
  const [trendList, setTrendList] = useState<LotteryResultItem[]>([]);

  // 玩法分组
  const [playGroups, setPlayGroups] = useState<GamePlayGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);

  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);

  // 期数选择
  const [periodCount, setPeriodCount] = useState(30);
  const periodOptions = [30, 50, 100];

  // 防止重复请求
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchGameAll();
  }, []);

  const fetchGameAll = async () => {
    try {
      setIsLoadingGames(true);
      const res = await gameAll({});

      if (res.code === 200 && res.data) {
        const { gameTypeMap = [] } = res.data;

        const games: Game[] = [];
        (Array.isArray(gameTypeMap) ? gameTypeMap : []).forEach((typeItem: GameTypeMapItem) => {
          if (typeItem.children && Array.isArray(typeItem.children)) {
            typeItem.children.forEach((game: Game) => {
              if (game.is_show === undefined || game.is_show === 1) {
                games.push(game);
              }
            });
          }
        });
        setAllGames(games);

        let defaultGame: Game | null = null;
        if (urlLotteryId) {
          defaultGame = games.find((g) => String(g.id) === String(urlLotteryId)) || null;
        }
        if (!defaultGame && games.length > 0) {
          defaultGame = games[0];
        }

        if (defaultGame) {
          setActiveGame(defaultGame);
          setGameName(defaultGame.name);
          const groups = await fetchPlayGroups(defaultGame.id);
          const defaultGroupId = urlGroupId ? parseInt(urlGroupId) : (groups.length > 0 ? groups[0].id : 0);
          setSelectedGroupId(defaultGroupId);
          fetchTrendData(defaultGame.id, defaultGroupId, periodCount);
        }
      } else {
        toast.error(parseErrorMessage(res, "获取游戏列表失败"));
      }
    } catch (error) {
      toast.error(parseAxiosError(error, "获取游戏列表失败，请稍后重试"));
    } finally {
      setIsLoadingGames(false);
    }
  };

  const fetchPlayGroups = async (lotteryId: number): Promise<GamePlayGroup[]> => {
    try {
      const res = await playAll({ lottery_id: lotteryId });
      if (res.code === 200 && res.data) {
        const groups = (res.data.groupArr || []).filter(
          (g: GamePlayGroup) => g.status === 1
        );
        setPlayGroups(groups);
        return groups;
      } else {
        setPlayGroups([]);
        return [];
      }
    } catch (error) {
      console.error("获取玩法分组失败", error);
      setPlayGroups([]);
      return [];
    }
  };

  const fetchTrendData = async (lotteryId: number, groupId: number, count: number) => {
    try {
      setIsLoadingTrend(true);
      const res = await lotteryRecord({
        lottery_id: lotteryId,
        game_group_id: groupId,
        page: 1,
        pageSize: count,
      });

      if (res.code === 200 && res.data) {
        setTrendList(res.data.list || []);
      } else {
        toast.error(parseErrorMessage(res, "获取走势数据失败"));
        setTrendList([]);
      }
    } catch (error) {
      toast.error(parseAxiosError(error, "获取走势数据失败，请稍后重试"));
      setTrendList([]);
    } finally {
      setIsLoadingTrend(false);
    }
  };

  const handleGameSwitch = async (game: Game) => {
    setShowGameSelector(false);
    setActiveGame(game);
    setGameName(game.name);
    setTrendList([]);

    const groups = await fetchPlayGroups(game.id);
    const defaultGroupId = groups.length > 0 ? groups[0].id : 0;
    setSelectedGroupId(defaultGroupId);
    fetchTrendData(game.id, defaultGroupId, periodCount);
  };

  const handleGroupChange = (groupId: number) => {
    setSelectedGroupId(groupId);
    setTrendList([]);
    if (activeGame) {
      fetchTrendData(activeGame.id, groupId, periodCount);
    }
  };

  const handlePeriodChange = (count: number) => {
    setPeriodCount(count);
    if (activeGame) {
      fetchTrendData(activeGame.id, selectedGroupId, count);
    }
  };

  const handleRefresh = () => {
    if (activeGame) {
      fetchTrendData(activeGame.id, selectedGroupId, periodCount);
    }
  };

  // 获取期号
  const getExpectNo = (item: LotteryResultItem): string => {
    const expectNo = item.final_res?.expectNo || item.final_res?.expect_no || item.expect_no;
    if (!expectNo) return "--";
    return String(expectNo).slice(-6);
  };

  // 获取开奖号码数组
  const getNums = (item: LotteryResultItem): string[] => {
    const nums = item.final_res?.nums || item.action_no_num;
    if (!nums) return [];
    if (Array.isArray(nums)) return nums;
    if (typeof nums === "object") return Object.values(nums);
    return String(nums).split(",");
  };

  // 获取和值
  const getSum = (item: LotteryResultItem): number | string => {
    return item.final_res?.sum ?? "--";
  };

  // 获取形态
  const getShape = (item: LotteryResultItem): string => {
    const shape = item.final_res?.shape || "--";
    if (shape === 'bao') return "豹子";
    if (shape === 'shun') return "顺子";
    if (shape === 'ban') return "半顺";
    if (shape === 'dui') return "对子";
    if (shape === 'za') return "杂六";
    return "--";
  };

  // 获取龙虎豹
  const getLungFuPao = (item: LotteryResultItem): string => {
    const lungFuPao = item.final_res?.lungFuPao || "--";
    if (lungFuPao === 'Dragon' || lungFuPao === 'dragon') return "龙";
    if (lungFuPao === 'Tiger' || lungFuPao === 'tiger') return "虎";
    if (lungFuPao === 'Leopard' || lungFuPao === 'leopard') return "豹";
    return "--";
  };

  if (isLoadingGames) {
    return (
      <div className="flex min-h-screen justify-center items-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
          <p className="mt-3 text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  // 走势标签配置
  const trendTabs = [
    { key: "nums" as TrendTab, label: "号码" },
    { key: "bigSmall" as TrendTab, label: "大小单双" },
    { key: "shape" as TrendTab, label: "形态" },
    { key: "mod" as TrendTab, label: "取模" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      {/* 头部 */}
      <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between">
        <button className="text-white" onClick={() => router.back()}>
          <ChevronLeft size={24} />
        </button>
        <h1
          className="text-lg font-bold cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setShowGameSelector(true)}
        >
          {gameName} ▼
        </h1>
        <div
          className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push("/mine/receipt-text?tab=points")}
        >
          <span className="font-bold text-sm">
            {format.number(currentCustomer?.points ?? 0)}
          </span>
          <Image
            alt="coin"
            className="inline-block w-[13px] h-[13px]"
            src="/ranking/coin.png"
            width={13}
            height={13}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="flex overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={cn(
                "px-4 py-2 text-xs whitespace-nowrap",
                activeTab === tab ? "text-red-600 border-b-2 border-red-600 font-bold" : "text-gray-700"
              )}
            >{tab}</button>
          ))}
        </div>
      </div>

      {/* 玩法分组筛选 */}
      {playGroups.length > 0 && (
        <div className="bg-white px-3 py-2 border-b">
          <select
            value={selectedGroupId}
            onChange={(e) => handleGroupChange(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            {playGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 走势表 */}
      <div className="bg-white m-3 rounded-lg shadow overflow-hidden">
        {/* 顶部控制栏 */}
        <div className="flex justify-between items-center px-3 py-2 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">显示</span>
            <select
              value={periodCount}
              onChange={(e) => handlePeriodChange(Number(e.target.value))}
              className="px-2 py-1 text-sm border border-gray-300 rounded bg-white"
            >
              {periodOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}期</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoadingTrend}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoadingTrend ? "animate-spin" : ""} />
            刷新
          </button>
        </div>

        {/* 走势标签切换 */}
        <div className="flex border-b bg-white">
          {trendTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTrendTab(t.key)}
              className={cn(
                "flex-1 py-2.5 text-xs font-medium transition-colors",
                trendTab === t.key
                  ? "text-red-600 bg-red-50 border-b-2 border-red-600"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 表头 */}
        <div className="flex text-xs bg-gray-100 border-b font-medium">
          <div className="w-16 py-2 text-center border-r flex-shrink-0">期号</div>

          {/* 号码表头 */}
          {trendTab === "nums" && (
            <div className="flex-1 flex">
              <div className="flex-1 py-2 text-center border-r text-gray-600">开奖号码</div>
              <div className="w-12 py-2 text-center text-gray-600">和值</div>
            </div>
          )}

          {/* 大小单双表头 - 6列 */}
          {trendTab === "bigSmall" && (
            <div className="flex-1 flex text-center">
              <div className="flex-1 py-2 border-r text-red-600">大</div>
              <div className="flex-1 py-2 border-r text-green-600">小</div>
              <div className="flex-1 py-2 border-r text-orange-600">单</div>
              <div className="flex-1 py-2 border-r text-blue-600">双</div>
              <div className="flex-1 py-2 border-r text-purple-600">中</div>
              <div className="flex-1 py-2 text-cyan-600">边</div>
            </div>
          )}

          {/* 形态表头 */}
          {trendTab === "shape" && (
            <div className="flex-1 flex text-center">
              <div className="flex-1 py-2 border-r text-pink-600">豹子</div>
              <div className="flex-1 py-2 border-r text-red-600">顺子</div>
              <div className="flex-1 py-2 border-r text-orange-600">半顺</div>
              <div className="flex-1 py-2 border-r text-blue-600">对子</div>
              <div className="flex-1 py-2 border-r text-gray-600">杂六</div>
              <div className="w-px bg-gray-300"></div>
              <div className="flex-1 py-2 border-r text-red-600">龙</div>
              <div className="flex-1 py-2 border-r text-blue-600">虎</div>
              <div className="flex-1 py-2 text-purple-600">豹</div>
            </div>
          )}

          {/* 取模表头 - 双层 */}
          {trendTab === "mod" && (
            <div className="flex-1 flex flex-col">
              {/* 第一层：模3/模4/模5 */}
              <div className="flex border-b">
                <div className="flex-[3] py-1 text-center border-r bg-gray-200 font-bold">模3</div>
                <div className="flex-[4] py-1 text-center border-r bg-amber-100 font-bold">模4</div>
                <div className="flex-[5] py-1 text-center bg-teal-100 font-bold">模5</div>
              </div>
              {/* 第二层：具体数值 */}
              <div className="flex">
                {/* 模3: 0,1,2 */}
                {[0, 1, 2].map((n) => (
                  <div key={`m3-${n}`} className="flex-1 py-1 text-center border-r text-gray-600">{n}</div>
                ))}
                {/* 模4: 0,1,2,3 */}
                {[0, 1, 2, 3].map((n) => (
                  <div key={`m4-${n}`} className="flex-1 py-1 text-center border-r text-gray-600">{n}</div>
                ))}
                {/* 模5: 0,1,2,3,4 */}
                {[0, 1, 2, 3, 4].map((n, i) => (
                  <div key={`m5-${n}`} className={cn("flex-1 py-1 text-center text-gray-600", i < 4 && "border-r")}>{n}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 数据列表 */}
        {isLoadingTrend ? (
          <div className="flex justify-center items-center py-8">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
            <span className="ml-2 text-gray-600">加载走势数据中...</span>
          </div>
        ) : trendList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无走势数据
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto">
            {trendList
              .filter((item) => {
                // 过滤掉没有开奖号码的记录
                const nums = getNums(item);
                return nums.length > 0 && nums.some(n => n && n !== "");
              })
              .map((item, index) => {
              const fr = item.final_res;
              const nums = getNums(item);
              const shape = fr?.shape;
              const lungFuPao = fr?.lungFuPao;
              const mod3 = fr?.mod3;
              const mod4 = fr?.mod4;
              const mod5 = fr?.mod5;

              return (
                <div
                  key={`${item.id || index}`}
                  className="flex text-xs border-b hover:bg-gray-50"
                >
                  {/* 期号列 - 固定 */}
                  <div className="w-16 py-2.5 text-center border-r flex-shrink-0 text-gray-700 font-medium bg-gray-50">
                    {getExpectNo(item)}
                  </div>

                  {/* 号码 - 开奖号码 + 和值 */}
                  {trendTab === "nums" && (
                    <div className="flex-1 flex">
                      <div className="flex-1 py-2 flex items-center justify-center gap-3 border-r">
                        {nums.map((num, i) => (
                          <span
                            key={i}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-b from-gray-500 to-gray-700 text-white text-sm font-bold shadow"
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                      <div className="w-12 py-2 flex items-center justify-center">
                        <span className="inline-flex h-7 min-w-7 px-1.5 items-center justify-center rounded-full bg-gradient-to-b from-red-500 to-red-600 text-white text-sm font-bold shadow">
                          {getSum(item)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 大小单双 - 6列，命中高亮 */}
                  {trendTab === "bigSmall" && (
                    <div className="flex-1 flex text-center">
                      {/* 大 */}
                      <div className={cn(
                        "flex-1 py-2.5 border-r flex items-center justify-center",
                        fr?.bigSmall === "大" && "bg-red-100"
                      )}>
                        {fr?.bigSmall === "大" && (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">大</span>
                        )}
                      </div>
                      {/* 小 */}
                      <div className={cn(
                        "flex-1 py-2.5 border-r flex items-center justify-center",
                        fr?.bigSmall === "小" && "bg-green-100"
                      )}>
                        {fr?.bigSmall === "小" && (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white text-xs font-bold">小</span>
                        )}
                      </div>
                      {/* 单 */}
                      <div className={cn(
                        "flex-1 py-2.5 border-r flex items-center justify-center",
                        fr?.oddEven === "单" && "bg-orange-100"
                      )}>
                        {fr?.oddEven === "单" && (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">单</span>
                        )}
                      </div>
                      {/* 双 */}
                      <div className={cn(
                        "flex-1 py-2.5 border-r flex items-center justify-center",
                        fr?.oddEven === "双" && "bg-blue-100"
                      )}>
                        {fr?.oddEven === "双" && (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold">双</span>
                        )}
                      </div>
                      {/* 中 */}
                      <div className={cn(
                        "flex-1 py-2.5 border-r flex items-center justify-center",
                        fr?.middleSide === "中" && "bg-purple-100"
                      )}>
                        {fr?.middleSide === "中" && (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-white text-xs font-bold">中</span>
                        )}
                      </div>
                      {/* 边 */}
                      <div className={cn(
                        "flex-1 py-2.5 flex items-center justify-center",
                        fr?.middleSide === "边" && "bg-cyan-100"
                      )}>
                        {fr?.middleSide === "边" && (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-white text-xs font-bold">边</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 形态 - 8列，命中高亮 */}
                  {trendTab === "shape" && (
                    <div className="flex-1 flex text-center">
                      {/* 豹子 */}
                      <div className={cn(
                        "flex-1 py-2.5 border-r flex items-center justify-center",
                        shape === "bao" && "bg-pink-100"
                      )}>
                        {shape === "bao" && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-white text-[10px] font-bold">豹</span>
                        )}
                      </div>
                      {/* 顺子 */}
                      <div className={cn(
                        "flex-1 py-2.5 border-r flex items-center justify-center",
                        shape === "shun" && "bg-red-100"
                      )}>
                        {shape === "shun" && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">顺</span>
                        )}
                      </div>
                      {/* 半顺 */}
                      <div className={cn(
                        "flex-1 py-2.5 border-r flex items-center justify-center",
                        shape === "ban" && "bg-orange-100"
                      )}>
                        {shape === "ban" && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white text-[10px] font-bold">半</span>
                        )}
                      </div>
                      {/* 对子 */}
                      <div className={cn(
                        "flex-1 py-2.5 border-r flex items-center justify-center",
                        shape === "dui" && "bg-blue-100"
                      )}>
                        {shape === "dui" && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold">对</span>
                        )}
                      </div>
                      {/* 杂六 */}
                      <div className={cn(
                        "flex-1 py-2.5 border-r flex items-center justify-center",
                        shape === "za" && "bg-gray-200"
                      )}>
                        {shape === "za" && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-500 text-white text-[10px] font-bold">杂</span>
                        )}
                      </div>
                      {/* 分隔线 */}
                      <div className="w-px bg-gray-300"></div>
                      {/* 龙 */}
                      <div className={cn(
                        "flex-1 py-2.5 border-r flex items-center justify-center",
                        (lungFuPao === "Dragon" || lungFuPao === "dragon") && "bg-red-100"
                      )}>
                        {(lungFuPao === "Dragon" || lungFuPao === "dragon") && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">龙</span>
                        )}
                      </div>
                      {/* 虎 */}
                      <div className={cn(
                        "flex-1 py-2.5 border-r flex items-center justify-center",
                        (lungFuPao === "Tiger" || lungFuPao === "tiger") && "bg-blue-100"
                      )}>
                        {(lungFuPao === "Tiger" || lungFuPao === "tiger") && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold">虎</span>
                        )}
                      </div>
                      {/* 豹 */}
                      <div className={cn(
                        "flex-1 py-2.5 flex items-center justify-center",
                        (lungFuPao === "Leopard" || lungFuPao === "leopard") && "bg-purple-100"
                      )}>
                        {(lungFuPao === "Leopard" || lungFuPao === "leopard") && (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-white text-[10px] font-bold">豹</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 取模 - 12列 (3+4+5)，命中高亮 */}
                  {trendTab === "mod" && (
                    <div className="flex-1 flex text-center">
                      {/* 模3: 0,1,2 */}
                      {[0, 1, 2].map((n) => (
                        <div
                          key={`m3-${n}`}
                          className={cn(
                            "flex-1 py-2.5 border-r flex items-center justify-center",
                            mod3 === n && "bg-gray-200"
                          )}
                        >
                          {mod3 === n && (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-600 text-white text-xs font-bold">{n}</span>
                          )}
                        </div>
                      ))}
                      {/* 模4: 0,1,2,3 */}
                      {[0, 1, 2, 3].map((n) => (
                        <div
                          key={`m4-${n}`}
                          className={cn(
                            "flex-1 py-2.5 border-r flex items-center justify-center",
                            mod4 === n && "bg-amber-100"
                          )}
                        >
                          {mod4 === n && (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">{n}</span>
                          )}
                        </div>
                      ))}
                      {/* 模5: 0,1,2,3,4 */}
                      {[0, 1, 2, 3, 4].map((n, i) => (
                        <div
                          key={`m5-${n}`}
                          className={cn(
                            "flex-1 py-2.5 flex items-center justify-center",
                            i < 4 && "border-r",
                            mod5 === n && "bg-teal-100"
                          )}
                        >
                          {mod5 === n && (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-white text-xs font-bold">{n}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 彩种选择 Dialog */}
      <Dialog open={showGameSelector} onOpenChange={setShowGameSelector}>
        <DialogContent className="max-w-sm p-0 flex flex-col max-h-[70vh] transition-all duration-300 ease-in-out">
          <DialogHeader className="p-3 border-b">
            <DialogTitle>选择彩种</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            <div className="grid grid-cols-2 gap-3">
              {allGames.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleGameSwitch(game)}
                  className={cn(
                    "p-3 rounded-lg text-center font-bold text-sm border transition-all",
                    activeGame && String(game.id) === String(activeGame.id)
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-red-600 hover:text-red-600"
                  )}
                >
                  {game.name}
                  {activeGame && String(game.id) === String(activeGame.id) && (
                    <div className="text-xs mt-1">当前</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
