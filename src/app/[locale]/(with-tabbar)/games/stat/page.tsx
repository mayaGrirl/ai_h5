"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { toast } from "sonner";
import { parseErrorMessage, parseAxiosError } from "@/lib/utils";

import { profitLoss } from "@/api/game";
import { useGameContext } from "../_context";

import { ProfitLossItem, ProfitLossSummary } from "@/types/game.type";

export default function StatPage() {
  useRequireLogin();

  // 从 Context 获取共享的游戏状态
  const {
    activeGame,
    selectedGroupId,
  } = useGameContext();

  const [statList, setStatList] = useState<ProfitLossItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 分页
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  // 汇总数据（从服务端获取的总计）
  const [summary, setSummary] = useState<ProfitLossSummary>({});

  // 当游戏或分组变化时获取统计数据
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
    setStatList([]);
    setPage(1);
    setHasMore(true);
    setSummary({});
    fetchProfitLoss(activeGame.id, selectedGroupId, 1, true);
  }, [activeGame, selectedGroupId]);

  const fetchProfitLoss = async (lotteryId: number, groupId: number, pageNum: number, reset: boolean = false) => {
    try {
      setIsLoading(true);
      const res = await profitLoss({
        lottery_id: lotteryId,
        game_group_id: groupId,
        page: pageNum,
        pageSize: pageSize,
      });

      if (res.code === 200 && res.data) {
        const list = res.data.list || [];
        if (reset) {
          setStatList(list);
          // 使用服务端返回的总计数据
          setSummary(res.data.summary || {});
        } else {
          setStatList((prev) => [...prev, ...list]);
        }
        setHasMore(list.length >= pageSize);
        setPage(pageNum);
      } else {
        toast.error(parseErrorMessage(res, "获取盈亏统计失败"));
        if (reset) setStatList([]);
      }
    } catch (error) {
      toast.error(parseAxiosError(error, "获取盈亏统计失败，请稍后重试"));
      if (reset) setStatList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!activeGame || isLoading || !hasMore) return;
    fetchProfitLoss(activeGame.id, selectedGroupId, page + 1, false);
  };

  return (
    <div className="bg-gray-100 dark:bg-black pb-16">
      {/* 汇总卡片 */}
      <div className="bg-white mx-3 my-3 rounded-lg shadow p-4">
        <div className="text-sm text-gray-600 mb-2">总计（当前游戏/分组）</div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-xs text-gray-500">投注金额</div>
            <div className="text-lg font-bold text-blue-600">
              {(summary.bet_gold || 0).toLocaleString()}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-xs text-gray-500">中奖金额</div>
            <div className="text-lg font-bold text-green-600">
              {(summary.win_gold || 0).toLocaleString()}
            </div>
          </div>
          <div className={`${(summary.profit || 0) >= 0 ? 'bg-red-50' : 'bg-gray-100'} rounded-lg p-3`}>
            <div className="text-xs text-gray-500">盈亏</div>
            <div className={`text-lg font-bold ${(summary.profit || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {(summary.profit || 0) >= 0 ? '+' : ''}{(summary.profit || 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 盈亏记录列表 */}
      <div className="bg-white mx-3 my-3 rounded-lg shadow">
        {/* 表头 */}
        <div className="grid grid-cols-4 text-xs text-gray-500 border-b bg-gray-50 px-3 py-2 gap-2 rounded-t-lg">
          <span>日期</span>
          <span className="text-right">投注/中奖</span>
          <span className="text-center">自动/次数</span>
          <span className="text-right">盈亏</span>
        </div>

        {isLoading && statList.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <span className="ml-2 text-gray-600">加载盈亏统计中...</span>
          </div>
        ) : statList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无盈亏记录
          </div>
        ) : (
          <div className="divide-y">
            {statList.map((item, index) => {
              const profit = item.profit || 0;
              return (
                <div
                  key={`${item.id || item.stat_date}-${index}`}
                  className={`px-3 py-3 text-xs ${profit > 0 ? "bg-red-50" : profit < 0 ? "bg-green-50" : "bg-white"}`}
                >
                  <div className="grid grid-cols-4 items-center gap-2">
                    {/* 日期 */}
                    <div>
                      <div className="text-sm text-gray-800 font-medium">
                        {item.stat_date ? String(item.stat_date).substring(0, 10) : "--"}
                      </div>
                    </div>

                    {/* 投注/中奖 */}
                    <div className="text-right">
                      <div className="text-blue-600 font-medium">
                        {(item.bet_gold || 0).toLocaleString()}
                      </div>
                      <div className={`text-[10px] ${item.win_gold && item.win_gold > 0 ? "text-green-600" : "text-gray-400"}`}>
                        {(item.win_gold || 0).toLocaleString()}
                      </div>
                    </div>

                    {/* 自动/次数 */}
                    <div className="text-center">
                      <div>
                        {(item.auto_bet_gold || 0) > 0 ? (
                          <span className="text-green-600 font-bold">√</span>
                        ) : (
                          <span className="text-red-500">×</span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {item.bet_count || 0}次
                      </div>
                    </div>

                    {/* 盈亏 */}
                    <div className="text-right">
                      <div className={`font-bold ${profit >= 0 ? "text-red-600" : "text-green-600"}`}>
                        {profit >= 0 ? "+" : ""}{profit.toLocaleString()}
                      </div>
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
                  disabled={isLoading}
                  className="px-6 py-2 bg-red-600 text-white text-sm rounded-lg disabled:opacity-50"
                >
                  {isLoading ? "加载中..." : "加载更多"}
                </button>
              </div>
            )}

            {!hasMore && statList.length > 0 && (
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
