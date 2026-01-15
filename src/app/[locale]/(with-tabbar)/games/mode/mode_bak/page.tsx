"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, CheckCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn, parseErrorMessage, parseAxiosError } from "@/lib/utils";
import { playAll, setMode, modeList, gameAll } from "@/api/game";
import { toast } from "sonner";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import {
  GamePlay,
  GamePlayMapItem,
  Game,
  GameTypeMapItem,
  ModeItem,
} from "@/types/game.type";
import { useAuthStore } from "@/utils/storage/auth";
import Image from "next/image";
import { useFormatter } from "use-intl";

interface PlayItem {
  id: number;
  name: string;
  odds: number;
  minBetGold: number;
}

interface PlayGroup {
  id: string | number;
  name: string;
  plays: PlayItem[];
}

export default function ModeEditPage() {
  useRequireLogin();
  const format = useFormatter();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lottery_id = searchParams.get("lottery_id") || "";
  const group_id = searchParams.get("group_id") || "";
  const mode_id = searchParams.get("mode_id") || "";

  const isEdit = !!mode_id && mode_id !== "0";

  const [gameName, setGameName] = useState("加载中...");
  const [modeName, setModeName] = useState("");
  const [groups, setGroups] = useState<PlayGroup[]>([]);
  const [isLoadingPlays, setIsLoadingPlays] = useState(true);
  const [isLoadingMode, setIsLoadingMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 快捷选择按钮
  const quickSelectGroupIds = [1, 3, 10, 14, 18, 22, 4, 26, 5, 16, 23, 6, 15, 24];
  const quickSelectButtons = ["全包", "反选", "大", "小", "中", "边", "单", "双", "极大", "极小"];

  const [activeGroup, setActiveGroup] = useState<PlayGroup | null>(null);
  const [selectedPlays, setSelectedPlays] = useState<string[]>([]);
  const [playAmounts, setPlayAmounts] = useState<Record<string, string>>({});
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [activeQuick, setActiveQuick] = useState<string | null>(null);
  const [modeDataLoaded, setModeDataLoaded] = useState(false);  // 标记模式数据是否已加载

  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoadingModeRef = useRef(false);  // 防止切换分组时清空选中
  const currentCustomer = useAuthStore((s) => s.currentCustomer);

  // 获取游戏名称
  const fetchGameName = async () => {
    if (!lottery_id) return;

    try {
      const res = await gameAll({});
      if (res.code === 200 && res.data) {
        const { gameTypeMap = [] } = res.data;
        for (const typeItem of gameTypeMap) {
          const foundGame = typeItem.children?.find((game: Game) => String(game.id) === String(lottery_id));
          if (foundGame) {
            setGameName(foundGame.name);
            return;
          }
        }
      }
    } catch (error) {
      console.error("获取游戏名称失败", error);
    }
  };

  // 获取玩法列表
  const fetchPlayMethods = async () => {
    if (!lottery_id) {
      router.push(`/games`);
      return;
    }

    try {
      setIsLoadingPlays(true);
      const res = await playAll({ lottery_id: parseInt(lottery_id) });

      if (res.code === 200 && res.data) {
        const { gamePlayMap = [] } = res.data;

        const playGroups: PlayGroup[] = gamePlayMap
          .map((mapItem: GamePlayMapItem) => ({
            id: mapItem.id,
            name: mapItem.name,
            plays: (mapItem.children || []).map((play: GamePlay): PlayItem => ({
              id: play.id,
              name: play.name,
              odds: play.multiple || 0,
              minBetGold: play.min_bet_gold || 0,
            })),
          }))
          .filter((g: PlayGroup) => g.plays.length > 0);

        setGroups(playGroups);

        // 如果是编辑模式，先加载模式数据（会设置正确的分组和选中状态）
        if (isEdit && mode_id) {
          await loadModeData(playGroups);
        } else {
          // 新增模式时，根据 group_id 参数设置默认分组
          if (group_id && playGroups.length > 0) {
            const targetGroup = playGroups.find((g) => String(g.id) === String(group_id));
            if (targetGroup) {
              setActiveGroup(targetGroup);
            } else {
              setActiveGroup(playGroups[0]);
            }
          } else if (playGroups.length > 0) {
            setActiveGroup(playGroups[0]);
          }
        }
      } else if (res.code !== 3001) {
        toast.error(parseErrorMessage(res, "获取玩法列表失败"));
      }
    } catch (error) {
      console.error("获取玩法列表失败", error);
      toast.error(parseAxiosError(error, "获取玩法列表失败，请稍后重试"));
    } finally {
      setIsLoadingPlays(false);
    }
  };

  // 加载已有模式数据
  const loadModeData = async (playGroups: PlayGroup[]) => {
    if (!isEdit || !lottery_id || !group_id || !mode_id) return;

    try {
      isLoadingModeRef.current = true;
      setIsLoadingMode(true);

      // 传递 mode_id 获取指定模式
      const res = await modeList({
        lottery_id: parseInt(lottery_id),
        game_group_id: parseInt(group_id),
        mode_id: parseInt(mode_id),
        page: 1,
        pageSize: 100,
      });

      if (res.code === 200 && res.data) {
        // 从返回列表中找到对应的模式（可能返回单条或多条）
        const list = res.data.list || [];
        const mode = list.find((m: ModeItem) => String(m.id) === String(mode_id)) || list[0];

        if (mode) {
          console.log("加载模式数据:", mode);

          // 1. 先找到对应的分组
          const targetGroup = playGroups.find((g) => Number(g.id) === mode.game_group_id);

          // 2. 解析已保存的数据
          const betNoStr = mode.bet_no || "";
          const betNos = betNoStr.split(",").filter((n: string) => n.trim() !== "");
          const betGoldStr = mode?.bet_no_gold || "";
          const betGolds = betGoldStr.split(",");
          const playedIdStr = mode.lottery_played_id || "";
          const playedIds = playedIdStr.split(",").filter((n: string) => n.trim() !== "");

          console.log("回显数据 - bet_no:", betNos, "lottery_played_id:", playedIds, "bet_gold:", betGolds);

          // 3. 根据 lottery_played_id 或 bet_no 找到对应的玩法名称
          let selectedPlayNames: string[] = [];
          const amounts: Record<string, string> = {};

          if (targetGroup && playedIds.length > 0) {
            // 优先使用 lottery_played_id 来匹配（更精确）
            playedIds.forEach((playId: string, idx: number) => {
              const playItem = targetGroup.plays.find((p) => String(p.id) === String(playId));
              if (playItem) {
                selectedPlayNames.push(playItem.name);
                amounts[playItem.name] = betGolds[idx] || "0";
              }
            });
            console.log("通过 lottery_played_id 匹配到的玩法:", selectedPlayNames);
          }

          // 如果通过 ID 没匹配到，则使用 bet_no（玩法名称）
          if (selectedPlayNames.length === 0 && betNos.length > 0) {
            selectedPlayNames = betNos;
            betNos.forEach((no: string, idx: number) => {
              amounts[no] = betGolds[idx] || "0";
            });
            console.log("通过 bet_no 匹配到的玩法:", selectedPlayNames);
          }

          // 4. 设置模式名称
          setModeName(mode.mode_name || "");

          // 5. 设置选中的玩法和金豆
          console.log("设置选中玩法:", selectedPlayNames);
          setSelectedPlays([...selectedPlayNames]);
          setPlayAmounts({...amounts});

          // 6. 切换到对应分组
          if (targetGroup) {
            setActiveGroup(targetGroup);
          }

          // 7. 标记模式数据已加载
          setModeDataLoaded(true);
        } else {
          console.warn("未找到模式数据, mode_id:", mode_id);
        }
      }
    } catch (error) {
      console.error("加载模式数据失败", error);
      toast.error("加载模式数据失败");
    } finally {
      setIsLoadingMode(false);
      isLoadingModeRef.current = false;
    }
  };

  useEffect(() => {
    fetchGameName();
    fetchPlayMethods();
  }, [lottery_id, group_id, mode_id]);

  // 切换玩法分组（用户手动切换时清空选中）
  const handleGroupChange = (group: PlayGroup) => {
    if (activeGroup && group.id === activeGroup.id) return;
    // 只有用户手动切换分组时才清空（不是加载模式数据时）
    if (!isLoadingModeRef.current) {
      setSelectedPlays([]);
      setPlayAmounts({});
      setActiveQuick(null);
      toast.info("已清空已选玩法");
    }
    setActiveGroup(group);
  };

  // 切换玩法
  const togglePlay = (playItem: PlayItem) => {
    const playName = playItem.name;
    setSelectedPlays((prev) => {
      if (prev.includes(playName)) {
        const newArr = prev.filter((p) => p !== playName);
        const newAmounts = { ...playAmounts };
        delete newAmounts[playName];
        setPlayAmounts(newAmounts);
        return newArr;
      }
      return [...prev, playName];
    });
  };

  const updatePlayAmount = (play: string, value: string) => {
    setPlayAmounts((prev) => ({ ...prev, [play]: value }));
  };

  // 从Dialog中删除玩法
  const removeFromSelectedPlays = (playName: string) => {
    setSelectedPlays((prev) => prev.filter((p) => p !== playName));
    const newAmounts = { ...playAmounts };
    delete newAmounts[playName];
    setPlayAmounts(newAmounts);
  };

  // 打开批量下注弹框
  const handleOpenBatchModal = () => {
    if (!activeGroup) return;

    // 为没有设置金豆的玩法设置默认最小金豆
    const newAmounts = { ...playAmounts };
    selectedPlays.forEach((playName) => {
      if (!newAmounts[playName]) {
        const playItem = activeGroup.plays.find((p) => p.name === playName);
        if (playItem && playItem.minBetGold > 0) {
          newAmounts[playName] = String(playItem.minBetGold);
        }
      }
    });
    setPlayAmounts(newAmounts);
    setShowBatchModal(true);
  };

  // 快速选择
  const handleQuickSelect = (type: string) => {
    if (!activeGroup) return;

    const groupId = Number(activeGroup.id);
    let newSelected: string[] = [];

    const numericPlays = activeGroup.plays
      .filter((p) => !isNaN(parseInt(p.name, 10)))
      .sort((a, b) => parseInt(a.name, 10) - parseInt(b.name, 10));

    switch (type) {
      case "全包":
        newSelected = activeGroup.plays.map((p) => p.name);
        break;
      case "反选":
        newSelected = activeGroup.plays
          .filter((p) => !selectedPlays.includes(p.name))
          .map((p) => p.name);
        break;
      case "单":
        numericPlays.forEach((p) => {
          const num = parseInt(p.name, 10);
          if (num % 2 === 1) newSelected.push(p.name);
        });
        break;
      case "双":
        numericPlays.forEach((p) => {
          const num = parseInt(p.name, 10);
          if (num % 2 === 0) newSelected.push(p.name);
        });
        break;
      case "极大":
        if (numericPlays.length >= 3) {
          const top3 = numericPlays.slice(-3);
          newSelected = top3.map((p) => p.name);
        }
        break;
      case "极小":
        if (numericPlays.length >= 3) {
          const bottom3 = numericPlays.slice(0, 3);
          newSelected = bottom3.map((p) => p.name);
        }
        break;
      case "大":
      case "小":
      case "中":
      case "边":
        if ([1, 3, 10, 14, 18, 22].includes(groupId)) {
          numericPlays.forEach((p) => {
            const num = parseInt(p.name, 10);
            if (type === "大" && num >= 14) newSelected.push(p.name);
            if (type === "小" && num <= 13) newSelected.push(p.name);
            if (type === "中" && num >= 10 && num <= 17) newSelected.push(p.name);
            if (type === "边" && ((num >= 0 && num <= 3) || (num >= 24 && num <= 27))) newSelected.push(p.name);
          });
        } else if ([4, 26].includes(groupId)) {
          numericPlays.forEach((p) => {
            const num = parseInt(p.name, 10);
            if (type === "大" && num >= 6) newSelected.push(p.name);
            if (type === "小" && num <= 5) newSelected.push(p.name);
            if (type === "中" && num >= 4 && num <= 7) newSelected.push(p.name);
            if (type === "边" && ((num >= 0 && num <= 3) || (num >= 8 && num <= 10))) newSelected.push(p.name);
          });
        } else if ([5, 16, 23].includes(groupId)) {
          numericPlays.forEach((p) => {
            const num = parseInt(p.name, 10);
            if (type === "大" && num >= 7) newSelected.push(p.name);
            if (type === "小" && num <= 6) newSelected.push(p.name);
            if (type === "中" && num >= 5 && num <= 9) newSelected.push(p.name);
            if (type === "边" && ((num >= 2 && num <= 4) || (num >= 10 && num <= 12))) newSelected.push(p.name);
          });
        } else if ([6, 15, 24].includes(groupId)) {
          numericPlays.forEach((p) => {
            const num = parseInt(p.name, 10);
            if (type === "大" && num >= 11) newSelected.push(p.name);
            if (type === "小" && num <= 10) newSelected.push(p.name);
            if (type === "中" && num >= 8 && num <= 13) newSelected.push(p.name);
            if (type === "边" && ((num >= 3 && num <= 7) || (num >= 14 && num <= 18))) newSelected.push(p.name);
          });
        }
        break;
    }

    setSelectedPlays(newSelected);
    setActiveQuick(type);
  };

  const handleInputFocus = (index: number) => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    const inputEl = scrollEl.children[index] as HTMLElement;
    if (!inputEl) return;
    const scrollTop = scrollEl.scrollTop;
    const scrollHeight = scrollEl.clientHeight;
    const inputBottom = inputEl.offsetTop + inputEl.clientHeight;
    if (inputBottom > scrollTop + scrollHeight) {
      scrollEl.scrollTo({ top: inputBottom - scrollHeight + 10, behavior: "smooth" });
    }
  };

  // 提交保存模式
  const handleSubmit = async () => {
    if (!activeGroup) {
      toast.error("请选择玩法分组");
      return;
    }

    if (!modeName.trim()) {
      toast.error("请输入模式名称");
      return;
    }

    if (selectedPlays.length === 0) {
      toast.error("请选择至少一个玩法");
      return;
    }

    const bet_no = selectedPlays.join(",");
    const bet_gold = selectedPlays.map((p) => playAmounts[p] || "0").join(",");
    const lottery_played_id = selectedPlays.map((playName) => {
      const playItem = activeGroup.plays.find((item) => item.name === playName);
      return playItem ? playItem.id : "";
    }).filter(id => id !== "").join(",");
    const total_gold = selectedPlays.reduce((sum, p) => sum + (parseInt(playAmounts[p] || "0", 10) || 0), 0);

    if (total_gold <= 0) {
      toast.error("请输入投注金豆");
      return;
    }

    const payload = {
      lottery_id,
      game_group_id: activeGroup.id,
      lottery_played_id,
      bet_no,
      bet_gold,
      total_gold,
      mode_name: modeName.trim(),
      mode_id: isEdit ? parseInt(mode_id) : 0,
      status: 1,
    };

    try {
      setIsSubmitting(true);
      const res = await setMode(payload);
      if (res.code === 200) {
        toast.success(isEdit ? "模式更新成功" : "模式保存成功");
        setShowBatchModal(false);
        router.back();
      } else {
        toast.error(parseErrorMessage(res, "保存失败"));
      }
    } catch (error) {
      console.error("保存模式失败：", error);
      toast.error(parseAxiosError(error, "保存失败，请稍后重试"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black relative pb-20">
      {/* 头部 */}
      <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between">
        <button className="text-white" onClick={() => router.back()}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">
          {isEdit ? "编辑模式" : "新增模式"} - {gameName}
        </h1>
        <div className="flex items-center">
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

      {/* 模式名称输入 */}
      <div className="bg-white p-3 my-2 mx-3 rounded-lg shadow">
        <label className="block text-sm font-bold text-gray-700 mb-2">模式名称</label>
        <input
          type="text"
          value={modeName}
          onChange={(e) => setModeName(e.target.value)}
          placeholder="请输入模式名称"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          maxLength={20}
        />
      </div>

      {/* 快速选择 */}
      {activeGroup && quickSelectGroupIds.includes(Number(activeGroup.id)) && (
        <div className="px-3 mb-2">
          <div className="flex flex-wrap gap-2">
            {quickSelectButtons.map((btn) => {
              const isActive = activeQuick === btn;
              return (
                <button
                  key={btn}
                  onClick={() => handleQuickSelect(btn)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold border",
                    isActive ? "bg-red-600 text-white border-red-600" : "bg-yellow-300 text-gray-800 border-yellow-300"
                  )}
                >{btn}</button>
              );
            })}
          </div>
        </div>
      )}

      {/* 玩法分组 */}
      <div className="flex mt-3 px-3">
        <div className="w-24 bg-white border-r">
          {isLoadingPlays ? (
            <div className="p-2 text-xs text-gray-500 text-center">加载中...</div>
          ) : (
            groups.map((g) => (
              <button
                key={g.id}
                onClick={() => handleGroupChange(g)}
                className={cn(
                  "block w-full p-2 text-xs text-left border-b",
                  activeGroup && activeGroup.id === g.id ? "bg-blue-600 text-white" : "bg-white text-gray-800"
                )}
              >{g.name}</button>
            ))
          )}
        </div>

        <div className="flex-1 p-2">
          {isLoadingPlays || isLoadingMode ? (
            <div className="flex justify-center items-center py-8">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : activeGroup ? (
            <div className="grid grid-cols-3 gap-2">
              {activeGroup.plays.map((playItem) => {
                const isSelected = selectedPlays.includes(playItem.name);
                const displayOdds = (playItem.odds / 1000).toFixed(3);
                return (
                  <button
                    key={playItem.id}
                    onClick={() => togglePlay(playItem)}
                    className={cn(
                      "p-2 rounded-lg text-center font-bold text-sm flex flex-col items-center justify-center border",
                      isSelected ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-700 border-gray-300"
                    )}
                  >
                    <div>{playItem.name}</div>
                    <div className="text-xs font-normal mt-1">{displayOdds}</div>
                    {isSelected && <CheckCircle className="inline mt-1" size={14} />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">暂无玩法数据</div>
          )}
        </div>
      </div>

      {/* 保存按钮 */}
      {selectedPlays.length > 0 && (
        <div className="pb-16 p-3">
          <button
            onClick={handleOpenBatchModal}
            className="w-full py-2 rounded-lg font-bold text-sm bg-red-600 text-white"
          >
            设置金豆并保存（已选 {selectedPlays.length} 项）
          </button>
        </div>
      )}

      {/* 批量设置金豆 Dialog */}
      <Dialog open={showBatchModal} onOpenChange={setShowBatchModal}>
        <DialogContent className="max-w-sm p-0 flex flex-col h-[60vh] md:h-[55vh] transition-all duration-300 ease-in-out">
          <DialogHeader className="p-3 border-b">
            <DialogTitle className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span>设置投注金豆（{selectedPlays.length}项）</span>
                <span className="text-sm font-normal text-gray-600">
                  累计：<span className="text-red-600 font-bold">
                    {format.number(selectedPlays.reduce((sum, p) => sum + (parseInt(playAmounts[p] || "0", 10) || 0), 0))}
                  </span>
                  <Image
                    alt="coin"
                    className="inline-block w-[13px] h-[13px]"
                    src="/ranking/coin.png"
                    width={13}
                    height={13}
                  />
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 space-y-3 scroll-smooth">
            {selectedPlays.map((play, idx) => (
              <div key={play} className="flex items-center border p-2 rounded-lg gap-2">
                <button
                  onClick={() => removeFromSelectedPlays(play)}
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors"
                >
                  <X size={14} />
                </button>
                <span className="font-bold text-gray-800 text-sm flex-1 text-center">{play}</span>
                <input
                  type="number"
                  className="h-10 w-24 rounded-md border px-2 text-center text-sm flex-shrink-0"
                  placeholder="金豆"
                  value={playAmounts[play] || ""}
                  onChange={(e) => updatePlayAmount(play, e.target.value)}
                  onFocus={() => handleInputFocus(idx)}
                />
              </div>
            ))}

            {selectedPlays.length === 0 && (
              <div className="text-center py-8 text-gray-500">暂无选中玩法</div>
            )}

            <div className="flex justify-between mt-2 pb-3">
              <Button variant="secondary" onClick={() => setShowBatchModal(false)}>取消</Button>
              <Button
                className="bg-red-600 text-white"
                onClick={handleSubmit}
                disabled={selectedPlays.length === 0 || isSubmitting}
              >
                {isSubmitting ? "保存中..." : "确认保存"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
