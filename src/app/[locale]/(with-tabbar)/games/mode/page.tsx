"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, Plus, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { toast } from "sonner";
import { parseErrorMessage, parseAxiosError, cn } from "@/lib/utils";
import { useAuthStore } from "@/utils/storage/auth";
import { useFormatter } from "use-intl";
import Image from "next/image";

import { gameAll, modeList, setMode, playAll } from "@/api/game";

import {
  Game,
  GameTypeMapItem,
  ModeItem,
  GamePlayGroup,
} from "@/types/game.type";

export default function ModePage() {
  useRequireLogin();
  const format = useFormatter();
  const router = useRouter();

  const searchParams = useSearchParams();
  const urlLotteryId = searchParams.get("lottery_id") || "";
  const urlGroupId = searchParams.get("group_id") || "";

  // Tab navigation
  const tabs = ["投注", "开奖记录", "投注记录", "模式", "自动", "走势", "盈亏"];
  const activeTab = "模式";

  const currentCustomer = useAuthStore((s) => s.currentCustomer);

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
    if (tab === "自动") {
      router.push(`/games/auto?lottery_id=${currentLotteryId}&group_id=${selectedGroupId}&t=${Date.now()}`);
      return;
    }
    if (tab === "走势") {
      router.push(`/games/trend?lottery_id=${currentLotteryId}&group_id=${selectedGroupId}&t=${Date.now()}`);
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
  const [modes, setModes] = useState<ModeItem[]>([]);

  // 玩法分组
  const [playGroups, setPlayGroups] = useState<GamePlayGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);

  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isLoadingModes, setIsLoadingModes] = useState(false);

  // 分页
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;

  // 删除确认弹窗
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMode, setDeletingMode] = useState<ModeItem | null>(null);

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
          // 先获取玩法分组，再获取模式列表（默认选择第一个分组）
          const groups = await fetchPlayGroups(defaultGame.id);
          const defaultGroupId = groups.length > 0 ? groups[0].id : 0;
          setSelectedGroupId(defaultGroupId);
          fetchModeList(defaultGame.id, defaultGroupId, 1, true);
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

  // 切换彩种时默认选择第一个分组
  const handleGameSwitch = async (game: Game) => {
    setShowGameSelector(false);
    setActiveGame(game);
    setGameName(game.name);
    setModes([]);
    setPage(1);
    setHasMore(true);
    // 获取新彩种的玩法分组，并默认选择第一个
    const groups = await fetchPlayGroups(game.id);
    const defaultGroupId = groups.length > 0 ? groups[0].id : 0;
    setSelectedGroupId(defaultGroupId);
    fetchModeList(game.id, defaultGroupId, 1, true);
  };

  // 切换玩法分组
  const handleGroupChange = (groupId: number) => {
    setSelectedGroupId(groupId);
    setModes([]);
    setPage(1);
    setHasMore(true);
    if (activeGame) {
      fetchModeList(activeGame.id, groupId, 1, true);
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
      {/* 头部 - 与其他页面一致 */}
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

      {/* 玩法分组筛选 + 新增按钮 */}
      <div className="bg-white px-3 py-2 border-b flex items-center gap-2">
        {playGroups.length > 0 && (
          <select
            value={selectedGroupId}
            onChange={(e) => handleGroupChange(Number(e.target.value))}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            {playGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        )}
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
