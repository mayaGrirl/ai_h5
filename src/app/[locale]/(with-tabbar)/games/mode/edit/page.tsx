"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn, parseErrorMessage, parseAxiosError } from "@/lib/utils";
import { playAll, setMode, modeList, gameAll } from "@/api/game";
import { toast } from "sonner";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import {
  GamePlay,
  GamePlayMapItem,
  Game,
  ModeItem,
} from "@/types/game.type";
import { useAuthStore } from "@/utils/storage/auth";
import Image from "next/image";
import { useFormatter } from "use-intl";
import GameHeader from "@/components/game/GameHeader";

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
  betMultiplier?: string;
  startNum?: number;
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
  const [groupName, setGroupName] = useState("");
  const [modeName, setModeName] = useState("");
  const [groups, setGroups] = useState<PlayGroup[]>([]);
  const [isLoadingPlays, setIsLoadingPlays] = useState(true);
  const [isLoadingMode, setIsLoadingMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 快捷选择相关
  const quickSelectGroupIds = [1, 2, 3, 10, 14, 18, 22, 4, 26, 5, 16, 23, 6, 15, 24];
  const quickButtons1 = ["全包", "单", "大单", "小单", "单边", "双"];
  const quickButtons2 = ["大双", "小双", "双边", "大", "小", "中"];
  const quickButtons3 = ["边", "大边", "小边"];
  const specialButtons = ["反选", "清空"];
  const tailButtons = ["0尾", "1尾", "2尾", "3尾", "4尾", "5尾", "6尾", "7尾", "8尾", "9尾", "小尾", "大尾"];
  const mod3Buttons = ["3余0", "3余1", "3余2"];
  const mod4Buttons = ["4余0", "4余1", "4余2", "4余3"];
  const mod5Buttons = ["5余0", "5余1", "5余2", "5余3", "5余4"];
  const multiplierButtons1 = [0.1, 0.5, 0.8, 1.2, 1.5, 2];
  const multiplierButtons2 = [5, 10, 20, 30, 50, 100];

  const [activeGroup, setActiveGroup] = useState<PlayGroup | null>(null);
  const [selectedPlays, setSelectedPlays] = useState<string[]>([]);
  const [playAmounts, setPlayAmounts] = useState<Record<string, string>>({});
  const [activeQuick, setActiveQuick] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMultiplier, setSelectedMultiplier] = useState<number | null>(null);
  const [modeDataLoaded, setModeDataLoaded] = useState(false);

  const currentCustomer = useAuthStore((s) => s.currentCustomer);
  const isLoadingModeRef = useRef(false);

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
        const { gamePlayMap = [], groupArr = [] } = res.data;

        // 创建分组配置映射
        const groupConfigMap: Record<number, { betMultiplier: string; startNum: number }> = {};
        groupArr.forEach((g: { id: number; bet_multiplier?: string; start_num?: number }) => {
          groupConfigMap[g.id] = {
            betMultiplier: g.bet_multiplier || "",
            startNum: g.start_num || 0,
          };
        });

        const playGroups: PlayGroup[] = gamePlayMap
          .map((mapItem: GamePlayMapItem) => {
            const config = groupConfigMap[mapItem.id] || { betMultiplier: "", startNum: 0 };
            return {
              id: mapItem.id,
              name: mapItem.name,
              betMultiplier: config.betMultiplier,
              startNum: config.startNum,
              plays: (mapItem.children || []).map((play: GamePlay): PlayItem => ({
                id: play.id,
                name: play.name,
                odds: play.multiple || 0,
                minBetGold: play.min_bet_gold || 0,
              })),
            };
          })
          .filter((g: PlayGroup) => g.plays.length > 0);

        setGroups(playGroups);

        if (isEdit && mode_id) {
          await loadModeData(playGroups);
        } else {
          if (group_id && playGroups.length > 0) {
            const targetGroup = playGroups.find((g) => String(g.id) === String(group_id));
            if (targetGroup) {
              setActiveGroup(targetGroup);
              setGroupName(targetGroup.name);
            } else {
              setActiveGroup(playGroups[0]);
              setGroupName(playGroups[0].name);
            }
          } else if (playGroups.length > 0) {
            setActiveGroup(playGroups[0]);
            setGroupName(playGroups[0].name);
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

      const res = await modeList({
        lottery_id: parseInt(lottery_id),
        game_group_id: parseInt(group_id),
        mode_id: parseInt(mode_id),
        page: 1,
        pageSize: 100,
      });

      if (res.code === 200 && res.data) {
        const list = res.data.list || [];
        const mode = list.find((m: ModeItem) => String(m.id) === String(mode_id)) || list[0];

        if (mode) {
          const targetGroup = playGroups.find((g) => Number(g.id) === mode.game_group_id);

          const betNoStr = mode.bet_no || "";
          const betNos = betNoStr.split(",").filter((n: string) => n.trim() !== "");
          const betGoldStr = mode?.bet_no_gold || "";
          const betGolds = betGoldStr.split(",");
          const playedIdStr = mode.lottery_played_id || "";
          const playedIds = playedIdStr.split(",").filter((n: string) => n.trim() !== "");

          let selectedPlayNames: string[] = [];
          const amounts: Record<string, string> = {};

          if (targetGroup && playedIds.length > 0) {
            playedIds.forEach((playId: string, idx: number) => {
              const playItem = targetGroup.plays.find((p) => String(p.id) === String(playId));
              if (playItem) {
                selectedPlayNames.push(playItem.name);
                amounts[playItem.name] = betGolds[idx] || "0";
              }
            });
          }

          if (selectedPlayNames.length === 0 && betNos.length > 0) {
            selectedPlayNames = betNos;
            betNos.forEach((no: string, idx: number) => {
              amounts[no] = betGolds[idx] || "0";
            });
          }

          setModeName(mode.mode_name || "");
          setSelectedPlays([...selectedPlayNames]);
          setPlayAmounts({ ...amounts });

          if (targetGroup) {
            setActiveGroup(targetGroup);
            setGroupName(targetGroup.name);
          }

          setModeDataLoaded(true);
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
      } else {
        const defaultAmount = playItem.minBetGold || 0;
        if (defaultAmount > 0) {
          setPlayAmounts((prevAmounts) => ({
            ...prevAmounts,
            [playName]: String(defaultAmount),
          }));
        }
        return [...prev, playName];
      }
    });
  };

  const updatePlayAmount = (play: string, value: string) => {
    setPlayAmounts((prev) => ({ ...prev, [play]: value }));
  };

  // 快速选择
  const handleQuickSelect = (type: string) => {
    if (!activeGroup) return;

    const groupId = Number(activeGroup.id);
    const numericPlays = activeGroup.plays
      .filter((p) => !isNaN(parseInt(p.name, 10)))
      .sort((a, b) => parseInt(a.name, 10) - parseInt(b.name, 10));

    const exclusiveButtons = [
      "全包", "单", "双", "大单", "小单", "大双", "小双", "单边", "双边",
      "大", "小", "中", "边", "大边", "小边",
      "0尾", "1尾", "2尾", "3尾", "4尾", "5尾", "6尾", "7尾", "8尾", "9尾", "小尾", "大尾",
      "3余0", "3余1", "3余2", "4余0", "4余1", "4余2", "4余3", "5余0", "5余1", "5余2", "5余3", "5余4"
    ];

    if (exclusiveButtons.includes(type) && activeQuick === type) {
      setSelectedPlays([]);
      setPlayAmounts({});
      setActiveQuick(null);
      return;
    }

    const getGroupConfig = (gId: number) => {
      if ([1, 2, 3, 10, 14, 18, 22].includes(gId)) {
        return { min: 0, max: 27, bigStart: 14, smallEnd: 13, midStart: 10, midEnd: 17, bigEdgeStart: 18, smallEdgeEnd: 9 };
      } else if ([6, 15, 24].includes(gId)) {
        return { min: 3, max: 18, bigStart: 11, smallEnd: 10, midStart: 8, midEnd: 13, bigEdgeStart: 14, smallEdgeEnd: 7 };
      } else if ([5, 16, 23].includes(gId)) {
        return { min: 2, max: 12, bigStart: 7, smallEnd: 6, midStart: 5, midEnd: 9, bigEdgeStart: 10, smallEdgeEnd: 4 };
      } else if ([4, 26].includes(gId)) {
        return { min: 1, max: 10, bigStart: 6, smallEnd: 5, midStart: 4, midEnd: 7, bigEdgeStart: 8, smallEdgeEnd: 3 };
      }
      return null;
    };

    const config = getGroupConfig(groupId);
    let newSelected: string[] = [];
    let newActiveQuick: string | null = type;

    switch (type) {
      case "清空":
        setSelectedPlays([]);
        setPlayAmounts({});
        setActiveQuick(null);
        return;

      case "反选":
        newSelected = activeGroup.plays
          .filter((p) => !selectedPlays.includes(p.name))
          .map((p) => p.name);
        newActiveQuick = null;
        break;

      case "全包":
        newSelected = activeGroup.plays.map((p) => p.name);
        break;

      case "单":
        if (config) {
          newSelected = numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= config.min && num <= config.max && num % 2 === 1;
          }).map(p => p.name);
        }
        break;

      case "双":
        if (config) {
          newSelected = numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= config.min && num <= config.max && num % 2 === 0;
          }).map(p => p.name);
        }
        break;

      case "大单":
        if (config) {
          newSelected = numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= config.bigStart && num <= config.max && num % 2 === 1;
          }).map(p => p.name);
        }
        break;

      case "小单":
        if (config) {
          newSelected = numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= config.min && num <= config.smallEnd && num % 2 === 1;
          }).map(p => p.name);
        }
        break;

      case "大双":
        if (config) {
          newSelected = numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= config.bigStart && num <= config.max && num % 2 === 0;
          }).map(p => p.name);
        }
        break;

      case "小双":
        if (config) {
          newSelected = numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= config.min && num <= config.smallEnd && num % 2 === 0;
          }).map(p => p.name);
        }
        break;

      case "单边":
        if (config) {
          newSelected = numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= config.min && num <= config.max &&
              (num < config.midStart || num > config.midEnd) && num % 2 === 1;
          }).map(p => p.name);
        }
        break;

      case "双边":
        if (config) {
          newSelected = numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= config.min && num <= config.max &&
              (num < config.midStart || num > config.midEnd) && num % 2 === 0;
          }).map(p => p.name);
        }
        break;

      case "大":
        if (config) {
          newSelected = numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= config.bigStart && num <= config.max;
          }).map(p => p.name);
        }
        break;

      case "小":
        if (config) {
          newSelected = numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= config.min && num <= config.smallEnd;
          }).map(p => p.name);
        }
        break;

      case "中":
        if (config) {
          newSelected = numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= config.midStart && num <= config.midEnd;
          }).map(p => p.name);
        }
        break;

      case "边":
        if (config) {
          newSelected = numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= config.min && num <= config.max &&
              (num < config.midStart || num > config.midEnd);
          }).map(p => p.name);
        }
        break;

      case "大边":
        if (config) {
          newSelected = numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= config.bigEdgeStart && num <= config.max;
          }).map(p => p.name);
        }
        break;

      case "小边":
        if (config) {
          newSelected = numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= config.min && num <= config.smallEdgeEnd;
          }).map(p => p.name);
        }
        break;

      case "0尾": case "1尾": case "2尾": case "3尾": case "4尾":
      case "5尾": case "6尾": case "7尾": case "8尾": case "9尾": {
        const tailNum = parseInt(type.replace("尾", ""), 10);
        newSelected = numericPlays.filter(p => parseInt(p.name, 10) % 10 === tailNum).map(p => p.name);
        break;
      }

      case "小尾":
        newSelected = numericPlays.filter(p => parseInt(p.name, 10) % 10 <= 4).map(p => p.name);
        break;

      case "大尾":
        newSelected = numericPlays.filter(p => parseInt(p.name, 10) % 10 >= 5).map(p => p.name);
        break;

      case "3余0": case "3余1": case "3余2": {
        const mod3Val = parseInt(type.replace("3余", ""), 10);
        newSelected = numericPlays.filter(p => parseInt(p.name, 10) % 3 === mod3Val).map(p => p.name);
        break;
      }

      case "4余0": case "4余1": case "4余2": case "4余3": {
        const mod4Val = parseInt(type.replace("4余", ""), 10);
        newSelected = numericPlays.filter(p => parseInt(p.name, 10) % 4 === mod4Val).map(p => p.name);
        break;
      }

      case "5余0": case "5余1": case "5余2": case "5余3": case "5余4": {
        const mod5Val = parseInt(type.replace("5余", ""), 10);
        newSelected = numericPlays.filter(p => parseInt(p.name, 10) % 5 === mod5Val).map(p => p.name);
        break;
      }
    }

    const newAmounts: Record<string, string> = {};
    newSelected.forEach(name => {
      const playItem = activeGroup.plays.find(p => p.name === name);
      if (playItem && playItem.minBetGold > 0) {
        newAmounts[name] = String(playItem.minBetGold);
      }
    });

    setPlayAmounts(newAmounts);
    setSelectedPlays(newSelected);
    setActiveQuick(newActiveQuick);
  };

  // 倍数投注
  const handleMultiplierSelect = (multiplier: number) => {
    setSelectedMultiplier(multiplier);
    if (selectedPlays.length === 0) {
      toast.info("请先选择玩法");
      return;
    }
    const newAmounts = { ...playAmounts };
    selectedPlays.forEach((playName) => {
      const currentAmount = parseInt(newAmounts[playName] || "0", 10) || 0;
      if (currentAmount > 0) {
        newAmounts[playName] = String(Math.floor(currentAmount * multiplier));
      }
    });
    setPlayAmounts(newAmounts);
  };

  // 金额倍数调整
  const handleAmountMultiplier = (playName: string, multiplier: number) => {
    const currentAmount = parseInt(playAmounts[playName] || "0", 10) || 0;
    if (currentAmount > 0) {
      setPlayAmounts((prev) => ({
        ...prev,
        [playName]: String(Math.floor(currentAmount * multiplier)),
      }));
    }
  };

  // 取消
  const handleCancel = () => {
    router.back();
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
      toast.error("请输入投注金额");
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

  const totalBetAmount = selectedPlays.reduce((sum, p) => sum + (parseInt(playAmounts[p] || "0", 10) || 0), 0);

  return (
    <div className="bg-gray-100 dark:bg-black min-h-screen pb-32">
      {/* 头部 */}
      <GameHeader
        gameName={gameName}
        customTitle={isEdit ? "编辑模式" : "新增模式"}
        showDropdown={false}
        groupName={groupName}
      />

      {/* 快捷选择区域 */}
      {activeGroup && (
        <div className="bg-white mx-3 mt-3 rounded-lg shadow p-3">
          {quickSelectGroupIds.includes(Number(activeGroup.id)) ? (
            <>
              <div className="grid grid-cols-6 gap-2 mb-2">
                {quickButtons1.map(btn => (
                  <button
                    key={btn}
                    onClick={() => handleQuickSelect(btn)}
                    className={cn(
                      "py-1.5 text-xs rounded border",
                      activeQuick === btn
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-white text-gray-700 border-red-300 hover:border-red-500"
                    )}
                  >
                    {btn}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-6 gap-2 mb-2">
                {quickButtons2.map(btn => (
                  <button
                    key={btn}
                    onClick={() => handleQuickSelect(btn)}
                    className={cn(
                      "py-1.5 text-xs rounded border",
                      activeQuick === btn
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-white text-gray-700 border-red-300 hover:border-red-500"
                    )}
                  >
                    {btn}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-6 gap-2">
                {quickButtons3.map(btn => (
                  <button
                    key={btn}
                    onClick={() => handleQuickSelect(btn)}
                    className={cn(
                      "py-1.5 text-xs rounded border",
                      activeQuick === btn
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-white text-gray-700 border-red-300 hover:border-red-500"
                    )}
                  >
                    {btn}
                  </button>
                ))}
                {specialButtons.map(btn => (
                  <button
                    key={btn}
                    onClick={() => handleQuickSelect(btn)}
                    className="py-1.5 text-xs rounded bg-red-600 text-white"
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {["全包", "反选", "清空"].map(btn => (
                <button
                  key={btn}
                  onClick={() => handleQuickSelect(btn)}
                  className="py-1.5 text-xs rounded bg-red-600 text-white"
                >
                  {btn}
                </button>
              ))}
            </div>
          )}

          {/* 可收起区域 */}
          {isExpanded && (
            <>
              {quickSelectGroupIds.includes(Number(activeGroup.id)) && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center mb-2">
                      <span className="text-xs text-gray-500">—</span>
                      <span className="text-xs text-gray-600 mx-1">追加尾数</span>
                      <span className="text-xs text-gray-500 flex-1">———</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {tailButtons.slice(0, 4).map(btn => (
                        <button
                          key={btn}
                          onClick={() => handleQuickSelect(btn)}
                          className={cn(
                            "py-1 text-[10px] rounded border",
                            activeQuick === btn
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white text-gray-700 border-red-300"
                          )}
                        >
                          {btn}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-1 mt-1">
                      {tailButtons.slice(4, 8).map(btn => (
                        <button
                          key={btn}
                          onClick={() => handleQuickSelect(btn)}
                          className={cn(
                            "py-1 text-[10px] rounded border",
                            activeQuick === btn
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white text-gray-700 border-red-300"
                          )}
                        >
                          {btn}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-1 mt-1">
                      {tailButtons.slice(8).map(btn => (
                        <button
                          key={btn}
                          onClick={() => handleQuickSelect(btn)}
                          className={cn(
                            "py-1 text-[10px] rounded border",
                            activeQuick === btn
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white text-gray-700 border-red-300"
                          )}
                        >
                          {btn}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center mb-2">
                      <span className="text-xs text-gray-500">—</span>
                      <span className="text-xs text-gray-600 mx-1">追加余数</span>
                      <span className="text-xs text-gray-500 flex-1">———</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {mod3Buttons.map(btn => (
                        <button
                          key={btn}
                          onClick={() => handleQuickSelect(btn)}
                          className={cn(
                            "py-1 text-[10px] rounded border",
                            activeQuick === btn
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white text-gray-700 border-red-300"
                          )}
                        >
                          {btn}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-1 mt-1">
                      {mod4Buttons.map(btn => (
                        <button
                          key={btn}
                          onClick={() => handleQuickSelect(btn)}
                          className={cn(
                            "py-1 text-[10px] rounded border",
                            activeQuick === btn
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white text-gray-700 border-red-300"
                          )}
                        >
                          {btn}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-5 gap-1 mt-1">
                      {mod5Buttons.map(btn => (
                        <button
                          key={btn}
                          onClick={() => handleQuickSelect(btn)}
                          className={cn(
                            "py-1 text-[10px] rounded border",
                            activeQuick === btn
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white text-gray-700 border-red-300"
                          )}
                        >
                          {btn}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 倍数投注 */}
              <div className="mt-4">
                <div className="flex items-center mb-2">
                  <span className="text-xs text-gray-500">——</span>
                  <span className="text-xs text-gray-600 mx-2">倍数投注</span>
                  <span className="text-xs text-gray-500 flex-1">——————————</span>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {multiplierButtons1.map(mult => (
                    <button
                      key={mult}
                      onClick={() => handleMultiplierSelect(mult)}
                      className={cn(
                        "py-1.5 text-xs rounded border",
                        selectedMultiplier === mult
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-white text-gray-700 border-red-300"
                      )}
                    >
                      {mult}倍
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {multiplierButtons2.map(mult => (
                    <button
                      key={mult}
                      onClick={() => handleMultiplierSelect(mult)}
                      className={cn(
                        "py-1.5 text-xs rounded border",
                        selectedMultiplier === mult
                          ? "bg-red-600 text-white border-red-600"
                          : "bg-white text-gray-700 border-red-300"
                      )}
                    >
                      {mult}倍
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 收起/展开按钮 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-3 py-2 bg-orange-500 text-white rounded-lg flex items-center justify-center gap-1"
          >
            {isExpanded ? "收起" : "展开"}
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      )}

      {/* 号码列表区域 */}
      <div className="bg-white mx-3 mt-3 mb-[20px] rounded-lg shadow">
        {/* 表头 */}
        <div className="grid grid-cols-[80px_1fr_100px_90px] text-xs text-gray-500 border-b px-3 py-2">
          <span>号码</span>
          <span className="text-center">赔率</span>
          <span className="text-center">投注</span>
          <span></span>
        </div>

        {/* 号码列表 */}
        {isLoadingPlays || isLoadingMode ? (
          <div className="flex justify-center items-center py-8">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        ) : activeGroup ? (
          <div className="divide-y">
            {activeGroup.plays.map((playItem) => {
              const isSelected = selectedPlays.includes(playItem.name);
              const displayOdds = (playItem.odds / 1000).toFixed(2);
              const amount = playAmounts[playItem.name] || "";

              return (
                <div
                  key={playItem.id}
                  className={cn(
                    "grid grid-cols-[80px_1fr_100px_90px] items-center px-3 py-2",
                    isSelected ? "bg-orange-50" : "bg-white"
                  )}
                >
                  {/* 号码 */}
                  <div className="flex flex-col items-start">
                    <button
                      onClick={() => togglePlay(playItem)}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-blue-100 text-blue-700"
                      )}
                    >
                      {playItem.name}
                    </button>
                  </div>

                  {/* 赔率 */}
                  <div className="text-center text-sm text-gray-600">
                    {displayOdds}
                  </div>

                  {/* 投注输入 */}
                  <div className="flex justify-center">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => updatePlayAmount(playItem.name, e.target.value)}
                      placeholder="0"
                      className={cn(
                        "w-20 h-8 px-2 text-center text-sm border rounded",
                        isSelected
                          ? "border-orange-400 bg-orange-50"
                          : "border-gray-300 bg-gray-50"
                      )}
                    />
                  </div>

                  {/* 倍数按钮 */}
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleAmountMultiplier(playItem.name, 0.5)}
                      className="text-xs text-blue-600"
                    >
                      ×0.5
                    </button>
                    <button
                      onClick={() => handleAmountMultiplier(playItem.name, 2)}
                      className="text-xs text-blue-600"
                    >
                      ×2
                    </button>
                    <button
                      onClick={() => handleAmountMultiplier(playItem.name, 10)}
                      className="text-xs text-blue-600"
                    >
                      ×10
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">暂无玩法数据</div>
        )}
      </div>

      {/* 底部固定操作栏 */}
      <div className="fixed bottom-12 left-0 right-0 bg-white border-t shadow-lg">
        {/* 模式名称输入 + 总投入 */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <input
            type="text"
            value={modeName}
            onChange={(e) => setModeName(e.target.value)}
            placeholder="填写模式名称"
            className="flex-1 h-8 px-3 text-sm border border-gray-300 rounded mr-3"
            maxLength={20}
          />
          <div className="flex items-center text-sm flex-shrink-0">
            <span className="text-gray-600">总投入</span>
            <span className="text-red-600 font-bold ml-1">{format.number(totalBetAmount)}</span>
            <Image
              alt="coin"
              className="inline-block w-4 h-4 ml-0.5"
              src="/ranking/coin.png"
              width={16}
              height={16}
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="grid grid-cols-2 h-12">
          <button
            onClick={handleCancel}
            className="bg-white text-gray-700 font-bold flex items-center justify-center gap-1 border-r"
          >
            <span className="text-lg">&lt;</span> 取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedPlays.length === 0 || totalBetAmount <= 0}
            className={cn(
              "font-bold flex items-center justify-center gap-1",
              isSubmitting || selectedPlays.length === 0 || totalBetAmount <= 0
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-blue-600 text-white"
            )}
          >
            <span className="text-lg">✓</span> 保存模式
          </button>
        </div>
      </div>
    </div>
  );
}
