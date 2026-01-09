"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { toast } from "sonner";
import { parseErrorMessage, parseAxiosError, cn } from "@/lib/utils";
import { useAuthStore } from "@/utils/storage/auth";
import { useFormatter } from "use-intl";
import Image from "next/image";

import { gameAll, betRecords, playAll } from "@/api/game";

import {
  Game,
  GameTypeMapItem,
  BetRecordItem,
  BetNoItem,
  GamePlayGroup,
} from "@/types/game.type";

export default function RecordPage() {
  useRequireLogin();
  const format = useFormatter();
  const router = useRouter();

  const searchParams = useSearchParams();
  const urlLotteryId = searchParams.get("lottery_id") || "";
  const urlGroupId = searchParams.get("group_id") || "";

  // Tab navigation
  const tabs = ["投注", "开奖记录", "投注记录", "模式", "自动", "走势", "盈亏"];
  const activeTab = "投注记录";

  const currentCustomer = useAuthStore((s) => s.currentCustomer);

  // Tab切换处理
  const handleTabClick = (tab: string) => {
    const currentLotteryId = activeGame?.id || urlLotteryId;
    if (tab === "投注") {
      // 传递当前选中的分组ID和时间戳，确保倒计时接口被调用
      router.push(`/games/play?lottery_id=${currentLotteryId}&group_id=${selectedGroupId}&t=${Date.now()}`);
      return;
    }
    if (tab === "开奖记录") {
      router.push(`/games/open?lottery_id=${currentLotteryId}`);
      return;
    }

    if (tab === "模式") {
      // 传递当前选中的分组ID和时间戳，确保倒计时接口被调用
      router.push(`/games/mode?lottery_id=${currentLotteryId}&group_id=${selectedGroupId}&t=${Date.now()}`);
      return;
    }

    if (tab === "自动") {
      // 传递当前选中的分组ID和时间戳，确保倒计时接口被调用
      router.push(`/games/auto?lottery_id=${currentLotteryId}&group_id=${selectedGroupId}&t=${Date.now()}`);
      return;
    }
    if (tab === "走势") {
      // 传递当前选中的分组ID和时间戳，确保倒计时接口被调用
      router.push(`/games/trend?lottery_id=${currentLotteryId}&group_id=${selectedGroupId}&t=${Date.now()}`);
      return;
    }
    if (tab === "盈亏") {
      // 传递当前选中的分组ID和时间戳，确保倒计时接口被调用
      router.push(`/games/stat?lottery_id=${currentLotteryId}&group_id=${selectedGroupId}&t=${Date.now()}`);
      return;
    }

  };

  const [gameName, setGameName] = useState("加载中...");
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [showGameSelector, setShowGameSelector] = useState(false);
  const [recordList, setRecordList] = useState<BetRecordItem[]>([]);

  // 玩法分组
  const [playGroups, setPlayGroups] = useState<GamePlayGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);

  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  // 分页
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;

  // 防止重复请求
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    fetchGameAll();
  }, []);

  /**
   * 获取所有游戏 + 选中 URL 指定 lottery_id 对应的彩种
   */
  const fetchGameAll = async () => {
    try {
      setIsLoadingGames(true);
      const res = await gameAll({});

      if (res.code === 200 && res.data) {
        const { gameTypeMap = [] } = res.data;

        // 收集所有游戏到一个扁平数组
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

        // 找到URL指定的游戏或默认第一个
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
          // 先获取玩法分组，再获取投注记录（默认选择第一个分组）
          const groups = await fetchPlayGroups(defaultGame.id);
          const defaultGroupId = groups.length > 0 ? groups[0].id : 0;
          setSelectedGroupId(defaultGroupId);
          fetchBetRecords(defaultGame.id, defaultGroupId, 1, true);
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

  // 获取玩法分组，返回分组列表
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

  const fetchBetRecords = async (lotteryId: number, groupId: number, pageNum: number, reset: boolean = false) => {
    try {
      setIsLoadingRecords(true);
      const res = await betRecords({
        lottery_id: lotteryId,
        game_group_id: groupId,
        page: pageNum,
        pageSize: pageSize,
      });

      if (res.code === 200 && res.data) {
        const list = res.data.list || [];
        if (reset) {
          setRecordList(list);
        } else {
          setRecordList((prev) => [...prev, ...list]);
        }
        setHasMore(list.length >= pageSize);
        setPage(pageNum);
      } else {
        toast.error(parseErrorMessage(res, "获取投注记录失败"));
        if (reset) setRecordList([]);
      }
    } catch (error) {
      toast.error(parseAxiosError(error, "获取投注记录失败，请稍后重试"));
      if (reset) setRecordList([]);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  // 切换彩种时默认选择第一个分组
  const handleGameSwitch = async (game: Game) => {
    setShowGameSelector(false);
    setActiveGame(game);
    setGameName(game.name);
    setRecordList([]);
    setPage(1);
    setHasMore(true);
    // 获取新彩种的玩法分组，并默认选择第一个
    const groups = await fetchPlayGroups(game.id);
    const defaultGroupId = groups.length > 0 ? groups[0].id : 0;
    setSelectedGroupId(defaultGroupId);
    fetchBetRecords(game.id, defaultGroupId, 1, true);
  };

  // 切换玩法分组
  const handleGroupChange = (groupId: number) => {
    setSelectedGroupId(groupId);
    setRecordList([]);
    setPage(1);
    setHasMore(true);
    if (activeGame) {
      fetchBetRecords(activeGame.id, groupId, 1, true);
    }
  };

  const handleLoadMore = () => {
    if (!activeGame || isLoadingRecords || !hasMore) return;
    fetchBetRecords(activeGame.id, selectedGroupId, page + 1, false);
  };

  // 获取投注号码列表
  const getBetNoList = (item: BetRecordItem): BetNoItem[] => {
    const betNo = item.bet_no;
    if (!betNo) return [];

    // 如果是数组，直接返回
    if (Array.isArray(betNo)) {
      return betNo;
    }

    // 如果是对象，转换为数组
    if (typeof betNo === "object") {
      return Object.values(betNo);
    }

    return [];
  };

  // 获取状态文本
  const getStatusInfo = (item: BetRecordItem): { text: string; color: string } => {
    if (item.status === "00" || item.is_opened === 0) {
      return { text: "待开奖", color: "text-orange-600 bg-orange-50" };
    }
    if (item.is_win === 2) {
      return { text: "已中奖", color: "text-red-600 bg-red-50" };
    }
    if (item.is_win === 3) {
      return { text: "未中奖", color: "text-gray-600 bg-gray-100" };
    }
    return { text: "--", color: "text-gray-500" };
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black">
      {/* 头部 - 与play页面一致 */}
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

      {/* Tabs - 与play页面一致 */}
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

      {/* 投注记录列表 */}
      <div className="bg-white mx-3 my-3 rounded-lg shadow">
        {/* 表头 */}
        <div className="grid grid-cols-[1.2fr_1.5fr_1fr] text-xs text-gray-500 border-b bg-gray-50 px-3 py-2 gap-2 rounded-t-lg">
          <span>期号/时间</span>
          <span className="text-center">投注详情</span>
          <span className="text-center">金额/状态</span>
        </div>

        {isLoadingRecords && recordList.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <span className="ml-2 text-gray-600">加载投注记录中...</span>
          </div>
        ) : recordList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无投注记录
          </div>
        ) : (
          <div className="divide-y">
            {recordList.map((item, index) => {
              const statusInfo = getStatusInfo(item);
              const betNoList = getBetNoList(item);
              const winLoss = item.win_loss || 0;

              return (
                <div
                  key={`${item.id}-${index}`}
                  className={`px-3 py-3 text-xs ${item.is_win === 2 ? "bg-yellow-50" : "bg-white"}`}
                >
                  <div className="grid grid-cols-[1.2fr_1.5fr_1fr] items-start gap-2">
                    {/* 期号/时间 */}
                    <div>
                      <div className="text-sm text-blue-700 font-medium truncate">
                        {item.expect_no || "--"}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {item.bet_time || item.created_at || ""}
                      </div>
                      <div className="text-[10px] mt-1">
                        <span className="text-gray-500">自动：</span>
                        <span className={item.is_auto === 1 ? "text-green-600" : "text-red-500"}>
                          {item.is_auto === 1 ? "√" : "×"}
                        </span>
                      </div>
                    </div>

                    {/* 投注详情 */}
                    <div className="text-center">
                      {betNoList.length === 0 ? (
                        <span className="text-gray-400">--</span>
                      ) : (
                        <div className="space-y-1">
                          {betNoList.map((bet, i) => (
                            <div key={i} className="flex items-center justify-center gap-1 text-xs">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                {bet.bet_no || "--"}
                              </span>
                              <span className="text-gray-500">
                                x{bet.win_gold || 0}
                                {/*{((bet.multiple || 0)).toFixed(2)}*/}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 金额/状态 */}
                    <div className="text-center">
                      <div className="text-blue-600 font-medium">
                        投:{(item.bet_gold || 0).toLocaleString()}
                      </div>
                      {item.is_opened === 1 && (
                        <div className={item.win_gold && item.win_gold > 0 ? "text-red-600 font-medium" : "text-gray-400"}>
                          中:{(item.win_gold || 0).toLocaleString()}
                        </div>
                      )}
                      <div className={`inline-block px-2 py-0.5 rounded text-[10px] mt-1 ${statusInfo.color}`}>
                        {statusInfo.text}
                      </div>
                    </div>
                  </div>

                  {/* 盈亏信息 - 仅已开奖显示 */}
                  {item.is_opened === 1 && (
                    <div className="mt-2 pt-2 border-t border-dashed flex justify-between items-center text-xs">
                      <span className="text-gray-500">
                        共{item.bet_num || betNoList.length}注
                      </span>
                      <span className={winLoss >= 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                        盈亏: {winLoss >= 0 ? "+" : ""}{winLoss.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 加载更多 */}
            {hasMore && (
              <div className="py-4 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingRecords}
                  className="px-6 py-2 bg-red-600 text-white text-sm rounded-lg disabled:opacity-50"
                >
                  {isLoadingRecords ? "加载中..." : "加载更多"}
                </button>
              </div>
            )}

            {!hasMore && recordList.length > 0 && (
              <div className="py-4 text-center text-gray-400 text-sm">
                没有更多数据了
              </div>
            )}
          </div>
        )}
      </div>

      {/* 彩种选择 Dialog - 与play页面一致 */}
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
