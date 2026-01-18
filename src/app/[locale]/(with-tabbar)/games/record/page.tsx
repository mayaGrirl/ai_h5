"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { toast } from "sonner";
import { parseErrorMessage, parseAxiosError } from "@/lib/utils";
import { useFormatter } from "use-intl";

import { betRecords } from "@/api/game";
import { useGameContext } from "../_context";

import {
  BetRecordItem,
  BetNoItem,
} from "@/types/game.type";

export default function RecordPage() {
  useRequireLogin();
  const format = useFormatter();

  // 从 Context 获取共享的游戏状态
  const {
    activeGame,
    selectedGroupId,
  } = useGameContext();

  const [recordList, setRecordList] = useState<BetRecordItem[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);

  // 分页
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 15;

  // 当游戏或分组变化时获取投注记录
  const prevGameIdRef = useRef<number | null>(null);
  const prevGroupIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!activeGame || !selectedGroupId) return;

    // 检查是否是相同的游戏和分组，避免重复请求
    if (prevGameIdRef.current === activeGame.id && prevGroupIdRef.current === selectedGroupId) {
      return;
    }

    prevGameIdRef.current = activeGame.id;
    prevGroupIdRef.current = selectedGroupId;

    // 重置列表并获取数据
    setRecordList([]);
    setPage(1);
    setHasMore(true);
    fetchBetRecords(activeGame.id, selectedGroupId, 1, true);
  }, [activeGame, selectedGroupId]);

  const getDisplayBetNoList = (list: BetNoItem[]) => {
    if (!Array.isArray(list) || list.length === 0) return [];
    // 中奖的
    const winList = list.filter(bet => (bet.win_gold || 0) > 0);
    // 未中奖的
    const loseList = list.filter(bet => (bet.win_gold || 0) <= 0);

    // 先放中奖的，再用未中奖补齐
    const result: BetNoItem[] = [];

    for (const bet of winList) {
      if (result.length < 3) result.push(bet);
    }

    for (const bet of loseList) {
      if (result.length < 3) result.push(bet);
    }

    return result;
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

  // 获取状态文本 status: 0未结算 1已结算 2已回滚 3已删除
  const getStatusInfo = (item: BetRecordItem): { text: string; color: string } => {
    const status = Number(item.status);
    switch (status) {
      case 0:
        return { text: "未结算", color: "text-orange-600 bg-orange-50" };
      case 1:
        // 已结算时根据是否中奖显示不同状态
        if (item.is_win === 2) {
          return { text: "已中奖", color: "text-red-600 bg-red-50" };
        }
        return { text: "未中奖", color: "text-gray-600 bg-gray-100" };
      case 2:
        return { text: "已回滚", color: "text-yellow-600 bg-yellow-50" };
      case 3:
        return { text: "已删除", color: "text-gray-400 bg-gray-100" };
      default:
        return { text: "--", color: "text-gray-500" };
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-black pb-16">
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
              const displayList = getDisplayBetNoList(betNoList);
              const showEllipsis = betNoList.length > 3;

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
                      {displayList.length === 0 ? (
                        <span className="text-gray-400">--</span>
                      ) : (
                        <div className="space-y-1">
                          {displayList.map((bet, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-center gap-1 text-xs"
                            >
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                {bet.bet_no || "--"}
                              </span>
                              <span className="text-gray-500">
                                x {bet.win_gold || 0}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {showEllipsis && (
                        <div className="text-gray-400 text-xs text-center">......</div>
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

    </div>
  );
}
