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

import { gameAll, lotteryRecord, playAll } from "@/api/game";

import {
  Game,
  GameTypeMapItem,
  LotteryResultItem,
  MemberBetItem,
  GamePlayGroup,
} from "@/types/game.type";

export default function OpenPage() {
  useRequireLogin();
  const format = useFormatter();
  const router = useRouter();

  const searchParams = useSearchParams();
  const urlLotteryId = searchParams.get("lottery_id") || "";
  const urlGroupId = searchParams.get("group_id") || "";

  // Tab navigation
  const tabs = ["投注", "开奖记录", "投注记录", "模式", "自动", "走势", "盈亏"];
  const activeTab = "开奖记录";

  const currentCustomer = useAuthStore((s) => s.currentCustomer);

  // Tab切换处理
  const handleTabClick = (tab: string) => {
    const currentLotteryId = activeGame?.id || urlLotteryId;
    if (tab === "投注") {
      // 传递当前选中的分组ID和时间戳，确保倒计时接口被调用
      router.push(`/games/play?lottery_id=${currentLotteryId}&group_id=${selectedGroupId}&t=${Date.now()}`);
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

    if (tab === "投注记录") {
      router.push(`/games/record?lottery_id=${currentLotteryId}`);
      return;
    }
  };

  const [gameName, setGameName] = useState("加载中...");
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [showGameSelector, setShowGameSelector] = useState(false);
  const [lotteryList, setLotteryList] = useState<LotteryResultItem[]>([]);

  // 玩法分组
  const [playGroups, setPlayGroups] = useState<GamePlayGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);

  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isLoadingLottery, setIsLoadingLottery] = useState(false);

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
          // 先获取玩法分组，再获取开奖记录（默认选择第一个分组）
          const groups = await fetchPlayGroups(defaultGame.id);
          const defaultGroupId = groups.length > 0 ? groups[0].id : 0;
          setSelectedGroupId(defaultGroupId);
          fetchLotteryList(defaultGame.id, defaultGroupId, 1, true);
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

  const fetchLotteryList = async (lotteryId: number, groupId: number, pageNum: number, reset: boolean = false) => {
    try {
      setIsLoadingLottery(true);
      const res = await lotteryRecord({
        lottery_id: lotteryId,
        game_group_id: groupId,
        page: pageNum,
        pageSize: pageSize,
      });

      if (res.code === 200 && res.data) {
        const list = res.data.list || [];
        if (reset) {
          setLotteryList(list);
        } else {
          setLotteryList((prev) => [...prev, ...list]);
        }
        setHasMore(list.length >= pageSize);
        setPage(pageNum);
      } else {
        toast.error(parseErrorMessage(res, "获取开奖记录失败"));
        if (reset) setLotteryList([]);
      }
    } catch (error) {
      toast.error(parseAxiosError(error, "获取开奖记录失败，请稍后重试"));
      if (reset) setLotteryList([]);
    } finally {
      setIsLoadingLottery(false);
    }
  };

  // 切换彩种时默认选择第一个分组
  const handleGameSwitch = async (game: Game) => {
    setShowGameSelector(false);
    setActiveGame(game);
    setGameName(game.name);
    setLotteryList([]);
    setPage(1);
    setHasMore(true);
    // 获取新彩种的玩法分组，并默认选择第一个
    const groups = await fetchPlayGroups(game.id);
    const defaultGroupId = groups.length > 0 ? groups[0].id : 0;
    setSelectedGroupId(defaultGroupId);
    fetchLotteryList(game.id, defaultGroupId, 1, true);
  };

  // 切换玩法分组
  const handleGroupChange = (groupId: number) => {
    setSelectedGroupId(groupId);
    setLotteryList([]);
    setPage(1);
    setHasMore(true);
    if (activeGame) {
      fetchLotteryList(activeGame.id, groupId, 1, true);
    }
  };

  const handleLoadMore = () => {
    if (!activeGame || isLoadingLottery || !hasMore) return;
    fetchLotteryList(activeGame.id, selectedGroupId, page + 1, false);
  };

  // 获取期号（优先 final_res.expect_no，其次 expect_no）
  const getExpectNo = (item: LotteryResultItem): string => {
    const expectNo = item.final_res?.expect_no || item.expect_no || item.action_no;
    if (expectNo === undefined || expectNo === null) return "--";
    return String(expectNo);
  };

  // 获取开奖号码（优先 final_res.nums，其次 action_no_num）
  const getNums = (item: LotteryResultItem): string => {
    const nums = item.final_res?.nums || item.action_no_num;

    // nums 为空（undefined/null）直接返回
    if (!nums) return "--";

    // nums 是数组
    if (Array.isArray(nums)) {
      return nums.join(",");
    }

    // nums 是对象（但不是数组） => 转成数组
    if (typeof nums === "object") {
      return Object.values(nums).join(",");
    }

    // nums 是字符串，例如 "9,0,5"
    return String(nums);
  };

  // 获取和值
  const getSum = (item: LotteryResultItem): string => {
    const sum = item.final_res?.sum;
    return sum !== undefined && sum !== null ? String(sum) : "--";
  };

  // 获取大小
  const getBigSmall = (item: LotteryResultItem): string => {
    return item.final_res?.bigSmall || "--";
  };

  // 获取单双
  const getOddEven = (item: LotteryResultItem): string => {
    return item.final_res?.oddEven || "--";
  };

  // 获取形态
  const getShape = (item: LotteryResultItem): string => {
    const shape =  item.final_res?.shape || "--";
    if (shape === 'bao') {
      return "豹子";
    } else if (shape === 'shun') {
      return "顺子";
    } else if (shape === 'tuo') {
      return "半顺";
    } else if (shape === 'dui') {
      return "对子";
    } else if (shape === 'za') {
      return "杂六";
    }else{
      return "--";
    }
  };

  const getShapeLungFuPao = (item: LotteryResultItem): string => {
    const lungFuPao =  item.final_res?.lungFuPao || "--";
    if (lungFuPao == 'Dragon' || lungFuPao == 'dragon') {
      return "龙";
    } else if (lungFuPao == 'Tiger' || lungFuPao == 'tiger') {
      return "虎";
    } else if (lungFuPao == 'Leopard' || lungFuPao == 'leopard') {
      return "豹子";
    }else{
      return "--";
    }
  };


  // 获取用户投注和赢得金豆
  const getMemberBetInfo = (item: LotteryResultItem): { bet: number; win: number } => {
    const memberBet = item.memberBet;

    // 空值或空数组
    if (!memberBet || (Array.isArray(memberBet) && memberBet.length === 0)) {
      return { bet: 0, win: 0 };
    }

    // 如果是对象（非数组），直接读取
    if (typeof memberBet === "object" && !Array.isArray(memberBet)) {
      const betItem = memberBet as MemberBetItem;
      return {
        bet: betItem.bet_gold || 0,
        win: betItem.win_gold || 0,
      };
    }

    // 如果是数组，遍历累加
    if (Array.isArray(memberBet)) {
      let totalBet = 0;
      let totalWin = 0;
      memberBet.forEach((bet: MemberBetItem) => {
        totalBet += bet.bet_gold || 0;
        totalWin += bet.win_gold || 0;
      });
      return { bet: totalBet, win: totalWin };
    }

    return { bet: 0, win: 0 };
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

      {/* 开奖记录列表 */}
      <div className="bg-white mx-3 my-3 rounded-lg shadow">
        {/* 表头 */}
        <div className="grid grid-cols-[1.5fr_1fr_0.8fr_1fr] text-xs text-gray-500 border-b bg-gray-50 px-3 py-2 gap-2 rounded-t-lg">
          <span>期号/号码</span>
          <span className="text-center">和值/大小</span>
          <span className="text-center">形态</span>
          <span className="text-center">投注/中奖</span>
        </div>

        {isLoadingLottery && lotteryList.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <span className="ml-2 text-gray-600">加载开奖记录中...</span>
          </div>
        ) : lotteryList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无开奖记录
          </div>
        ) : (
          <div className="divide-y">
            {lotteryList.map((item, index) => {
              const memberInfo = getMemberBetInfo(item);
              const hasBet = memberInfo.bet > 0;
              const numsStr = getNums(item);
              // 解析号码：支持逗号分隔或连续数字
              const numsArray = numsStr === "--" ? [] : (numsStr.includes(",") ? numsStr.split(",") : numsStr.split(""));

              return (
                <div
                  key={`${getExpectNo(item)}-${index}`}
                  className={`px-3 py-3 text-xs ${hasBet ? "bg-yellow-50" : "bg-white"}`}
                >
                  <div className="grid grid-cols-[1.5fr_1fr_0.8fr_1fr] items-center gap-2">
                    {/* 期号/号码 */}
                    <div>
                      <div className="text-sm text-blue-700 truncate mb-1">
                        {getExpectNo(item)}
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {numsArray.length === 0 ? (
                          <span className="text-gray-400">--</span>
                        ) : (
                          numsArray.map((num, i) => (
                            <span
                              key={i}
                              className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-500 text-white text-[10px]"
                            >
                              {num}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 和值/大小 */}
                    <div className="text-center">
                      <div className="mb-1">
                        <span className="inline-flex h-6 min-w-6 px-1 items-center justify-center rounded-full bg-red-500 text-white text-xs">
                          {getSum(item)}
                        </span>
                      </div>
                      <div className="flex justify-center gap-1">
                        <span className={`text-xs font-medium ${
                          getBigSmall(item) === "大" ? "text-red-600" : getBigSmall(item) === "小" ? "text-green-600" : "text-gray-500"
                        }`}>
                          {getBigSmall(item)}
                        </span>
                        <span className={`text-xs font-medium ${
                          getOddEven(item) === "单" ? "text-orange-600" : getOddEven(item) === "双" ? "text-blue-600" : "text-gray-500"
                        }`}>
                          {getOddEven(item)}
                        </span>
                      </div>
                    </div>

                    {/* 形态 */}
                    <div className="text-center">
                      <div className="text-center text-xs text-red-600 font-medium ">
                        {getShape(item)}
                      </div>
                      <div className="text-center text-xs text-blue-600 font-medium mt-2">
                        {getShapeLungFuPao(item)}
                      </div>
                    </div>


                    {/* 投注/中奖 */}
                    <div className="text-center">
                      {hasBet ? (
                        <>
                          <div className="text-blue-600 font-medium">
                            投:{memberInfo.bet.toLocaleString()}
                          </div>
                          <div className={memberInfo.win > 0 ? "text-red-600 font-medium" : "text-gray-400"}>
                            中:{memberInfo.win.toLocaleString()}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400">
                          <div className="text-blue-600 font-medium">
                            投:{memberInfo.bet.toLocaleString()}
                          </div>
                          <div className={memberInfo.win > 0 ? "text-red-600 font-medium" : "text-gray-400 mt-2"}>
                            中:{memberInfo.win.toLocaleString()}
                          </div>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 加载更多 */}
            {hasMore && (
              <div className="py-4 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingLottery}
                  className="px-6 py-2 bg-red-600 text-white text-sm rounded-lg disabled:opacity-50"
                >
                  {isLoadingLottery ? "加载中..." : "加载更多"}
                </button>
              </div>
            )}

            {!hasMore && lotteryList.length > 0 && (
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
