"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { toast } from "sonner";
import { parseErrorMessage, parseAxiosError } from "@/lib/utils";
import { useFormatter } from "use-intl";

import { modeList, setMode } from "@/api/game";
import { useGameContext } from "../_context";

import {
  ModeItem,
} from "@/types/game.type";

export default function ModePage() {
  useRequireLogin();
  const format = useFormatter();
  const router = useRouter();

  // 从 Context 获取共享的游戏状态
  const {
    activeGame,
    playGroups,
    selectedGroupId,
    setSelectedGroupId,
  } = useGameContext();

  const [modes, setModes] = useState<ModeItem[]>([]);
  const [isLoadingModes, setIsLoadingModes] = useState(false);

  // 分页
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;

  // 删除确认弹窗
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMode, setDeletingMode] = useState<ModeItem | null>(null);

  // 当游戏或分组变化时获取模式列表
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
    setModes([]);
    setPage(1);
    setHasMore(true);
    fetchModeList(activeGame.id, selectedGroupId, 1, true);
  }, [activeGame, selectedGroupId]);

  const fetchModeList = async (lotteryId: number, groupId: number, pageNum: number, reset: boolean = false) => {
    try {
      setIsLoadingModes(true);
      const res = await modeList({
        lottery_id: lotteryId,
        game_group_id: groupId,
        page: pageNum,
        pageSize: pageSize,
      });

      if (res.code === 200 && res.data) {
        const list = res.data.list || [];
        if (reset) {
          setModes(list);
        } else {
          setModes((prev) => [...prev, ...list]);
        }
        setHasMore(list.length >= pageSize);
        setPage(pageNum);
      } else {
        toast.error(parseErrorMessage(res, "获取模式列表失败"));
        if (reset) setModes([]);
      }
    } catch (error) {
      toast.error(parseAxiosError(error, "获取模式列表失败，请稍后重试"));
      if (reset) setModes([]);
    } finally {
      setIsLoadingModes(false);
    }
  };

  const handleLoadMore = () => {
    if (!activeGame || isLoadingModes || !hasMore) return;
    fetchModeList(activeGame.id, selectedGroupId, page + 1, false);
  };

  // 新增模式
  const handleAddMode = () => {
    if (!activeGame) return;
    router.push(`/games/mode/edit?lottery_id=${activeGame.id}&group_id=${selectedGroupId}`);
  };

  // 编辑模式
  const handleEditMode = (mode: ModeItem) => {
    if (!activeGame) return;
    router.push(`/games/mode/edit?lottery_id=${activeGame.id}&group_id=${mode.game_group_id}&mode_id=${mode.id}`);
  };

  // 删除模式
  const handleDeleteClick = (mode: ModeItem) => {
    setDeletingMode(mode);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingMode || !activeGame) return;

    try {
      const res = await setMode({
        lottery_id: activeGame.id,
        game_group_id: deletingMode.game_group_id,
        lottery_played_id: deletingMode.lottery_played_id,
        bet_no: deletingMode.bet_no,
        bet_gold: deletingMode.bet_gold,
        total_gold: deletingMode.total_gold,
        mode_name: deletingMode.mode_name,
        mode_id: deletingMode.id,
        status: 0,  // 删除
      });

      if (res.code === 200) {
        toast.success("删除成功");
        setShowDeleteConfirm(false);
        setDeletingMode(null);
        // 刷新列表
        fetchModeList(activeGame.id, selectedGroupId, 1, true);
      } else {
        toast.error(parseErrorMessage(res, "删除失败"));
      }
    } catch (error) {
      toast.error(parseAxiosError(error, "删除失败，请稍后重试"));
    }
  };

  // 获取分组名称
  const getGroupName = (groupId: number): string => {
    const group = playGroups.find((g) => g.id === groupId);
    return group?.name || `分组${groupId}`;
  };

  return (
    <div className="bg-gray-100 dark:bg-black">
      {/* 新增按钮 */}
      <div className="bg-white px-3 py-2 border-b flex items-center justify-end">
        <button
          onClick={handleAddMode}
          className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus size={16} />
          新增
        </button>
      </div>

      {/* 模式列表 */}
      <div className="bg-white mx-3 my-3 rounded-lg shadow">
        {/* 表头 */}
        <div className="grid grid-cols-[1fr_1fr_1fr_80px] text-xs text-gray-500 border-b bg-gray-50 px-3 py-2 gap-2 rounded-t-lg">
          <span>模式名称</span>
          <span className="text-center">分组</span>
          <span className="text-center">总金豆</span>
          <span className="text-center">操作</span>
        </div>

        {isLoadingModes && modes.length === 0 ? (
          <div className="flex justify-center items-center py-8">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <span className="ml-2 text-gray-600">加载模式列表中...</span>
          </div>
        ) : modes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            暂无模式数据，点击"新增"创建
          </div>
        ) : (
          <div className="divide-y">
            {modes.map((mode, index) => (
              <div
                key={`${mode.id}-${index}`}
                className="px-3 py-3 text-sm bg-white hover:bg-gray-50"
              >
                <div className="grid grid-cols-[1fr_1fr_1fr_80px] items-center gap-2">
                  {/* 模式名称 */}
                  <div className="font-medium text-gray-800 truncate">
                    {mode.mode_name}
                  </div>

                  {/* 分组 */}
                  <div className="text-center text-gray-600">
                    {mode.game_group_name || getGroupName(mode.game_group_id)}
                  </div>

                  {/* 金豆 */}
                  <div className="text-center text-red-600 font-medium text-xs">
                    {mode.bet_gold}
                  </div>

                  {/* 操作 */}
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleEditMode(mode)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      title="编辑"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(mode)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* 投注详情 */}
                <div className="mt-2 text-xs text-gray-500">
                  <span>玩法: {mode.bet_no}</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <span>金豆: {mode.bet_no_gold}</span>
                </div>
              </div>
            ))}

            {/* 加载更多 */}
            {hasMore && (
              <div className="py-4 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingModes}
                  className="px-6 py-2 bg-red-600 text-white text-sm rounded-lg disabled:opacity-50"
                >
                  {isLoadingModes ? "加载中..." : "加载更多"}
                </button>
              </div>
            )}

            {!hasMore && modes.length > 0 && (
              <div className="py-4 text-center text-gray-400 text-sm">
                没有更多数据了
              </div>
            )}
          </div>
        )}
      </div>

      {/* 使用说明 */}
      <div className="mx-3 mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="text-xs text-gray-600 leading-relaxed">
          您可以保存多个自定义模式，使用它们进行投注、托管、对号投注，方便您进行多样化的操作！
        </div>
      </div>

      {/* 删除确认 Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              确定要删除模式 <span className="font-bold text-gray-800">{deletingMode?.mode_name}</span> 吗？
            </p>
            <p className="text-sm text-gray-500 mt-2">此操作不可撤销。</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
              取消
            </Button>
            <Button className="bg-red-600 text-white hover:bg-red-700" onClick={confirmDelete}>
              确认删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
