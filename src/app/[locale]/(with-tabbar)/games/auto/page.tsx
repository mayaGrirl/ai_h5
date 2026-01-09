"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { toast } from "sonner";
import { parseErrorMessage, parseAxiosError, cn } from "@/lib/utils";
import { useAuthStore } from "@/utils/storage/auth";
import { useFormatter } from "use-intl";
import Image from "next/image";

import { gameAll, playAll, autoOne, setAuto, modeList } from "@/api/game";
import {
  Game,
  GameTypeMapItem,
  GamePlayGroup,
  ModeItem,
  AutoItem,
} from "@/types/game.type";

export default function AutoPage() {
  useRequireLogin();
  const format = useFormatter();
  const router = useRouter();

  const searchParams = useSearchParams();
  const urlLotteryId = searchParams.get("lottery_id") || "";
  const urlGroupId = searchParams.get("group_id") || "";

  // Tab navigation
  const tabs = ["投注", "开奖记录", "投注记录", "模式", "自动", "走势", "盈亏"];
  const activeTab = "自动";

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
    if (tab === "模式") {
      router.push(`/games/mode?lottery_id=${currentLotteryId}&group_id=${selectedGroupId}&t=${Date.now()}`);
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

  // 玩法分组
  const [playGroups, setPlayGroups] = useState<GamePlayGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);

  // 模式列表
  const [modes, setModes] = useState<ModeItem[]>([]);
  const [showModeSelector, setShowModeSelector] = useState(false);

  // 自动配置表单
  const [totalExpectNums, setTotalExpectNums] = useState<string>("1");
  const [minGold, setMinGold] = useState<string>("");
  const [maxGold, setMaxGold] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<ModeItem | null>(null);
  const [autoStatus, setAutoStatus] = useState<number>(0);  // 0关闭，1启动
  const [existingAuto, setExistingAuto] = useState<AutoItem | null>(null);

  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isLoadingAuto, setIsLoadingAuto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 防止重复请求
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    fetchGameAll();
  }, []);

  /**
   * 获取所有游戏
   */
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
          const defaultGroupId = groups.length > 0 ? groups[0].id : 0;
          setSelectedGroupId(defaultGroupId);
          // 获取模式列表
          const modesList = await fetchModes(defaultGame.id, defaultGroupId);
          // 获取自动配置，传入模式列表
          await fetchAutoConfig(defaultGame.id, modesList);
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

  // 获取玩法分组
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

  // 获取模式列表
  const fetchModes = async (lotteryId: number, groupId: number): Promise<ModeItem[]> => {
    try {
      const res = await modeList({
        lottery_id: lotteryId,
        game_group_id: groupId,
        page: 1,
        pageSize: 100,
      });
      if (res.code === 200 && res.data) {
        const list = res.data.list || [];
        setModes(list);
        return list;
      } else {
        setModes([]);
        return [];
      }
    } catch (error) {
      console.error("获取模式列表失败", error);
      setModes([]);
      return [];
    }
  };

  // 获取自动配置
  const fetchAutoConfig = async (lotteryId: number, modesList?: ModeItem[]) => {
    try {
      setIsLoadingAuto(true);
      const res = await autoOne({ lottery_id: lotteryId });

      // 数据直接在 res.data 中，不是 res.data.auto
      if (res.code === 200 && res.data && res.data.id) {
        const auto = res.data;
        setExistingAuto(auto);
        setTotalExpectNums(String(auto.total_expect_nums || 1));
        setMinGold(String(auto.min_gold || ""));
        setMaxGold(String(auto.max_gold || ""));
        setAutoStatus(auto.status || 0);

        // 设置选中的模式 - 使用 auto_id 或 mode_id
        const modeId = auto.mode_id || auto.auto_id;
        if (modeId) {
          // 优先使用传入的 modesList，因为 modes state 可能还没更新
          const availableModes = modesList || modes;
          const mode = availableModes.find((m) => m.id === modeId);
          if (mode) {
            setSelectedMode(mode);
          }
        }

        // 如果有 game_group_id，设置选中的分组
        if (auto.game_group_id) {
          setSelectedGroupId(auto.game_group_id);
        }
      } else {
        // 没有已配置的自动，使用默认值
        setExistingAuto(null);
        setTotalExpectNums("1");
        setMinGold("");
        setMaxGold("");
        setSelectedMode(null);
        setAutoStatus(0);
      }
    } catch (error) {
      console.error("获取自动配置失败", error);
    } finally {
      setIsLoadingAuto(false);
    }
  };

  // 切换彩种
  const handleGameSwitch = async (game: Game) => {
    setShowGameSelector(false);
    setActiveGame(game);
    setGameName(game.name);
    setSelectedMode(null);
    setExistingAuto(null);

    const groups = await fetchPlayGroups(game.id);
    const defaultGroupId = groups.length > 0 ? groups[0].id : 0;
    setSelectedGroupId(defaultGroupId);
    const modesList = await fetchModes(game.id, defaultGroupId);
    await fetchAutoConfig(game.id, modesList);
  };

  // 切换分组时重新获取模式
  const handleGroupChange = async (groupId: number) => {
    setSelectedGroupId(groupId);
    if (activeGame) {
      await fetchModes(activeGame.id, groupId);
    }
  };

  // 选择模式
  const handleSelectMode = (mode: ModeItem) => {
    setSelectedMode(mode);
    setShowModeSelector(false);
  };

  // 验证并提交
  const handleSubmit = async (status: number) => {
    if (!activeGame) {
      toast.error("请选择游戏");
      return;
    }

    if (!selectedGroupId) {
      toast.error("请选择玩法分组");
      return;
    }

    if (!selectedMode) {
      toast.error("请选择投注模式");
      return;
    }

    const expectNums = parseInt(totalExpectNums, 10);
    if (isNaN(expectNums) || expectNums < 1) {
      toast.error("执行期数必须大于等于1");
      return;
    }
    if (expectNums > 1440) {
      toast.error("执行期数最大不能超过1440期");
      return;
    }

    const minGoldNum = parseInt(minGold, 10) || 0;
    const maxGoldNum = parseInt(maxGold, 10) || 0;

    if (minGoldNum < 0 || maxGoldNum < 0) {
      toast.error("金币数值不能为负数");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await setAuto({
        lottery_id: activeGame.id,
        game_group_id: selectedGroupId,
        mode_id: selectedMode.id,
        total_expect_nums: expectNums,
        min_gold: minGoldNum,
        max_gold: maxGoldNum,
        status: status,
      });

      if (res.code === 200) {
        toast.success(status === 1 ? "自动投注已启动" : "自动投注已关闭");
        setAutoStatus(status);
        // 刷新配置
        await fetchAutoConfig(activeGame.id);
      } else {
        toast.error(parseErrorMessage(res, "操作失败"));
      }
    } catch (error) {
      toast.error(parseAxiosError(error, "操作失败，请稍后重试"));
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="min-h-screen bg-gray-100 dark:bg-black pb-32">
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

      {/* 自动投注配置表单 */}
      <div className="space-y-3 mt-3">
        {/* 基础设置 */}
        <div className="bg-white mx-3 rounded-lg shadow">
          <div className="px-4 py-3 text-gray-500 text-sm font-medium border-b">基础设置</div>

          {/* 玩法分组 */}
          {playGroups.length > 0 && (
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <span className="text-sm">玩法分组</span>
              <select
                value={selectedGroupId}
                onChange={(e) => handleGroupChange(Number(e.target.value))}
                className="w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                {playGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 执行期数 */}
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <span className="text-sm">执行期数</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={totalExpectNums}
                onChange={(e) => setTotalExpectNums(e.target.value)}
                placeholder="1-1440"
                min={1}
                max={1440}
                className="w-24 px-3 py-2 text-sm border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <span className="text-gray-500 text-sm">期</span>
            </div>
          </div>

          {/* 金币下限 */}
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <span className="text-sm">金币下限</span>
            <input
              type="number"
              value={minGold}
              onChange={(e) => setMinGold(e.target.value)}
              placeholder="金币≤该值时停止"
              className="w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* 金币上限 */}
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <span className="text-sm">金币上限</span>
            <input
              type="number"
              value={maxGold}
              onChange={(e) => setMaxGold(e.target.value)}
              placeholder="金币≥该值时停止"
              className="w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* 选择模式 */}
          <div
            className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-gray-50"
            onClick={() => setShowModeSelector(true)}
          >
            <span className="text-sm">投注模式</span>
            <div className="flex items-center gap-2 text-gray-500">
              {selectedMode ? (
                <span className="text-red-600 font-medium">{selectedMode.mode_name}</span>
              ) : (
                <span className="text-gray-400">点击选择投注模式</span>
              )}
              <ChevronRight size={16} />
            </div>
          </div>
        </div>

        {/* 当前状态 */}
        {existingAuto && (
          <div className="bg-white mx-3 rounded-lg shadow px-4 py-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">当前状态</span>
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-medium",
                autoStatus === 1 ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
              )}>
                {autoStatus === 1 ? "运行中" : "已关闭"}
              </span>
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="mx-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-center text-gray-500 text-sm mb-2">—— 自动投注设置 ——</div>
          <div className="text-xs text-gray-600 leading-relaxed space-y-1">
            <p>1、设置自动投注期数（1-1440期）</p>
            <p>2、设置账户金币上限和下限</p>
            <p>3、选择自动投注使用的模式</p>
            <p>4、系统将在指定期数内自动投注</p>
            <p>5、开启后对号和追号模式将自动关闭</p>
          </div>
        </div>
      </div>

      {/* 底部按钮 - 使用 pb-32 确保不被底部菜单遮挡 */}
      <div className="fixed bottom-16 left-0 right-0 bg-white p-4 border-t shadow-lg">
        <div className="flex gap-3">
          {autoStatus === 1 ? (
            <Button
              className="flex-1 h-12 bg-gray-500 text-white hover:bg-gray-600"
              onClick={() => handleSubmit(0)}
              disabled={isSubmitting}
            >
              {isSubmitting ? "处理中..." : "关闭托管"}
            </Button>
          ) : (
            <Button
              className="flex-1 h-12 bg-red-600 text-white hover:bg-red-700"
              onClick={() => handleSubmit(1)}
              disabled={isSubmitting || !selectedMode}
            >
              {isSubmitting ? "处理中..." : "启动托管"}
            </Button>
          )}
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

      {/* 模式选择 Dialog */}
      <Dialog open={showModeSelector} onOpenChange={setShowModeSelector}>
        <DialogContent className="max-w-sm p-0 flex flex-col max-h-[70vh] transition-all duration-300 ease-in-out">
          <DialogHeader className="p-3 border-b">
            <DialogTitle>选择投注模式</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {modes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>暂无模式</p>
                <p className="text-sm mt-2">请先在"模式"页面创建投注模式</p>
              </div>
            ) : (
              <div className="divide-y">
                {modes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => handleSelectMode(mode)}
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-gray-50 flex justify-between items-center",
                      selectedMode?.id === mode.id && "bg-red-50"
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-5 font-medium">
                        <span>{mode.mode_name}</span>
                        <span>{mode.bet_gold}</span>
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        玩法: {mode.bet_no}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        金豆: {mode.bet_no_gold}
                      </div>
                    </div>
                    {selectedMode?.id === mode.id && (
                      <span className="text-red-600 text-sm">已选</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
