"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { toast } from "sonner";
import { parseErrorMessage, parseAxiosError } from "@/lib/utils";
import { useFormatter } from "use-intl";

import { lotteryRecord } from "@/api/game";
import { useGameContext } from "../_context";

import {
  LotteryResultItem,
  MemberBetItem,
} from "@/types/game.type";

export default function OpenPage() {
  useRequireLogin();
  const format = useFormatter();

  // 从 Context 获取共享的游戏状态
  const {
    activeGame,
    selectedGroupId,
  } = useGameContext();

  const [lotteryList, setLotteryList] = useState<LotteryResultItem[]>([]);
  const [isLoadingLottery, setIsLoadingLottery] = useState(false);

  // 分页
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 15;

  // 当游戏或分组变化时获取开奖记录
  const hasFetchedRef = useRef(false);
  const prevGameIdRef = useRef<number | null>(null);
  const prevGroupIdRef = useRef<number | null>(null);

  useEffect(() => {
    // 当 activeGame 或 selectedGroupId 变化时获取数据
    if (!activeGame || !selectedGroupId) return;

    // 检查是否是相同的游戏和分组，避免重复请求
    if (prevGameIdRef.current === activeGame.id && prevGroupIdRef.current === selectedGroupId) {
      return;
    }

    prevGameIdRef.current = activeGame.id;
    prevGroupIdRef.current = selectedGroupId;

    // 重置列表并获取数据
    setLotteryList([]);
    setPage(1);
    setHasMore(true);
    fetchLotteryList(activeGame.id, selectedGroupId, 1, true);
  }, [activeGame, selectedGroupId]);

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
    } else if (shape === 'ban') {
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


  return (
    <div className="bg-gray-100 dark:bg-black pb-16">
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

    </div>
  );
}
