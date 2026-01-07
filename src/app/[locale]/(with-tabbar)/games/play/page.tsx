"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, Bell, Video, RefreshCcw, CheckCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn, parseErrorMessage, parseAxiosError } from "@/lib/utils";
import { playAll, betGame, fetchExpectInfo as fetchExpectInfoAPI, gameAll } from "@/api/game";
import { currentCustomer as fetchCurrentCustomer } from "@/api/auth";
import { toast } from "sonner";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {
  ExpectInfo,
  GamePlay,
  GamePlayMapItem,
  Game,
  GameTypeMapItem
} from "@/types/game.type";
import {useAuthStore} from "@/utils/storage/auth";
import Image from "next/image";
import {useFormatter} from "use-intl";

interface PlayItem {
  id: number;
  name: string;
  odds: number;  // 赔率，显示时要除以1000
  minBetGold: number;  // 最小投注金额
}

interface PlayGroup {
  id: string | number;
  name: string;
  plays: PlayItem[];
}

export default function BetPage() {
  useRequireLogin();
  // 格式化金额
  const format = useFormatter();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lottery_id = searchParams.get("lottery_id") || "";
  const group_id = searchParams.get("group_id") || "";

  const [gameName, setGameName] = useState("加载中...");
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [showGameSelector, setShowGameSelector] = useState(false);
  const tabs = ["投注", "开奖记录", "投注记录", "模式", "自动", "走势", "盈亏"];
  const [activeTab, setActiveTab] = useState("投注");

  const [groups, setGroups] = useState<PlayGroup[]>([]);
  const [isLoadingPlays, setIsLoadingPlays] = useState(true);

  // 支持快捷选择的玩法分组ID
  const quickSelectGroupIds = [1, 3, 10, 14, 18, 22, 4, 26, 5, 16, 23, 6, 15, 24];
  // 快捷选择按钮列表
  const quickSelectButtons = ["全包", "反选", "大", "小", "中", "边", "单", "双", "极大", "极小"];

  const [activeGroup, setActiveGroup] = useState<PlayGroup | null>(null);
  const [selectedPlays, setSelectedPlays] = useState<string[]>([]);
  const [playAmounts, setPlayAmounts] = useState<Record<string, string>>({});
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [activeQuick, setActiveQuick] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const currScrollRef = useRef<HTMLDivElement>(null);
  const shouldStopFetchingRef = useRef(false);
  const isFetchingRef = useRef(false); // 防止重复请求
  const remainingOpenRef = useRef(0); // 用于轮询定时器访问最新的倒计时值
  const previousExpectNoRef = useRef<string>(""); // 用于跟踪上一个期号

  const [currExpect, setCurrExpect] = useState<ExpectInfo | null>(null);
  const [lastExpect, setLastExpect] = useState<ExpectInfo | null>(null);
  const [remainingOpen, setRemainingOpen] = useState(0);
  const [remainingClose, setRemainingClose] = useState(0);
  const [statusCode, setStatusCode] = useState<number>(200);
  const [previousExpectNo, setPreviousExpectNo] = useState<string>("");

  const setCurrentCustomer = useAuthStore((s) => s.setCurrentCustomer);
  const currentCustomer = useAuthStore((s) => s.currentCustomer);

  // ====================== 刷新用户金豆 ======================
  const refreshUserPoints = async () => {
    try {
      const res = await fetchCurrentCustomer();
      if (res.code === 200 && res.data) {
        setCurrentCustomer(res.data);
      }
    } catch (error) {
      console.error("刷新用户金豆失败", error);
    }
  };

  // ====================== 获取游戏名称 ======================
  const fetchGameName = async () => {
    if (!lottery_id) return;

    try {
      const res = await gameAll({});
      if (res.code === 200 && res.data) {
        const { gameTypeMap = [] } = res.data;

        // 收集所有游戏到一个扁平数组
        const games: Game[] = [];
        gameTypeMap.forEach((typeItem: GameTypeMapItem) => {
          if (typeItem.children && Array.isArray(typeItem.children)) {
            typeItem.children.forEach((game: Game) => {
              if (game.is_show === undefined || game.is_show === 1) {
                games.push(game);
              }
            });
          }
        });
        setAllGames(games);

        // 遍历所有分类找到对应的游戏
        for (const typeItem of gameTypeMap) {
          const foundGame = typeItem.children?.find((game: Game) => String(game.id) === String(lottery_id));
          if (foundGame) {
            setGameName(foundGame.name);
            return;
          }
        }
      } else if (res.code !== 200 && res.code !== 3001) {
        toast.error(parseErrorMessage(res, "获取游戏信息失败"));
      }
    } catch (error) {
      console.error("获取游戏名称失败", error);
      toast.error(parseAxiosError(error, "获取游戏信息失败"));
    }
  };

  // ====================== 获取玩法列表 ======================
  const fetchPlayMethods = async () => {
    if (!lottery_id) {
      toast.error("缺少游戏ID参数");
      setIsLoadingPlays(false);
      return;
    }

    try {
      setIsLoadingPlays(true);
      const res = await playAll({ lottery_id: parseInt(lottery_id) });

      if (res.code === 200 && res.data) {
        const { gamePlayMap = [] } = res.data;

        // 使用 gamePlayMap 构建玩法分组列表
        const playGroups: PlayGroup[] = gamePlayMap
          .map((mapItem: GamePlayMapItem) => ({
            id: mapItem.id,
            name: mapItem.name,
            plays: (mapItem.children || []).map((play: GamePlay): PlayItem => ({
              id: play.id,
              name: play.name,
              odds: play.multiple || 0,  // multiple 字段作为赔率
              minBetGold: play.min_bet_gold || 0,  // 最小投注金额
            })),
          }))
          .filter((g: PlayGroup) => g.plays.length > 0);

        setGroups(playGroups);

        // 如果有 group_id 参数，设置为默认选中的分组
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
      } else if (res.code !== 3001) {
        // 统一处理非200和3001的状态码
        toast.error(parseErrorMessage(res, "获取玩法列表失败"));
      }
    } catch (error) {
      console.error("获取玩法列表失败", error);
      toast.error(parseAxiosError(error, "获取玩法列表失败，请稍后重试"));
    } finally {
      setIsLoadingPlays(false);
    }
  };

  // ====================== 获取开奖接口 ======================
  const fetchExpectInfo = async () => {
    if (!lottery_id || !group_id) return;

    try {
      const res = await fetchExpectInfoAPI({
        lottery_id: parseInt(lottery_id),
        game_group_id: parseInt(group_id)
      });

      setStatusCode(res.code);
      if (res.code === 200 && res.data) {
        const newExpectNo = res.data.currExpectInfo?.expect_no;

        // 检查是否获取到新期号（开奖完成，进入新一期）
        if (newExpectNo && newExpectNo !== previousExpectNoRef.current) {
          // 开奖完成后刷新用户金豆（可能中奖）- 排除首次加载
          if (previousExpectNoRef.current) {
            refreshUserPoints();
          }
          // 更新 ref 和 state
          previousExpectNoRef.current = newExpectNo;
          setPreviousExpectNo(newExpectNo);
        }

        // 先更新开奖信息，再更新倒计时（确保显示同步）
        setCurrExpect(res.data.currExpectInfo || null);
        setLastExpect(res.data.lastExpectInfo || null);

        const newOpenCountdown = res.data.currExpectInfo?.open_countdown || 0;
        remainingOpenRef.current = newOpenCountdown; // 同步更新 ref
        setRemainingOpen(newOpenCountdown);
        setRemainingClose(res.data.currExpectInfo?.close_countdown || 0);

        // 成功获取数据，重置停止标志
        shouldStopFetchingRef.current = false;
      } else if (res.code === 3001 && res.data) {
        // 封盘状态，解析并保存倒计时数据
        const currInfo = res.data.currExpectInfo;
        const lastInfo = res.data.lastExpectInfo;

        if (currInfo) {
          setCurrExpect(currInfo);

          const newOpenCountdown = currInfo.open_countdown || 0;
          remainingOpenRef.current = newOpenCountdown; // 同步更新 ref
          setRemainingOpen(newOpenCountdown);
          setRemainingClose(currInfo.close_countdown || 0);
        }

        if (lastInfo) {
          setLastExpect(lastInfo);
        }

        // 封盘期间继续倒计时轮询，当开奖倒计时结束后刷新
        shouldStopFetchingRef.current = false;
      } else {
        // 其他错误状态码，停止请求
        shouldStopFetchingRef.current = true;
        toast.error(parseErrorMessage(res, "获取开奖信息失败"));
      }
    } catch (error) {
      console.error("获取开奖信息失败", error);
      // 请求异常，停止请求
      shouldStopFetchingRef.current = true;
      toast.error(parseAxiosError(error, "获取开奖信息失败，请稍后重试"));
    }
  };

  // ====================== 初始化 & 倒计时 ======================
  useEffect(() => {
    // 重置状态（游戏或分组切换时）
    shouldStopFetchingRef.current = false;
    isFetchingRef.current = false;
    remainingOpenRef.current = 0;
    previousExpectNoRef.current = ""; // 重置期号 ref
    setPreviousExpectNo("");

    fetchGameName();
    fetchPlayMethods();
    fetchExpectInfo();

    // 倒计时定时器 - 每秒更新倒计时显示
    const countdownTimer = setInterval(() => {
      setRemainingOpen((prev) => {
        const newVal = prev > 0 ? prev - 1 : 0;
        remainingOpenRef.current = newVal; // 同步更新 ref
        return newVal;
      });
      setRemainingClose((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // 轮询定时器 - 每2秒检查一次，如果倒计时结束则请求开奖接口
    const pollTimer = setInterval(() => {
      if (remainingOpenRef.current <= 0 && !shouldStopFetchingRef.current && !isFetchingRef.current) {
        isFetchingRef.current = true;
        fetchExpectInfo().finally(() => {
          isFetchingRef.current = false;
        });
      }
    }, 2000);

    return () => {
      clearInterval(countdownTimer);
      clearInterval(pollTimer);
    };
  }, [lottery_id, group_id]);

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  };

  // ====================== 切换彩种 ======================
  const handleGameSwitch = (gameId: number) => {
    setShowGameSelector(false);
    // 重置选中状态
    setSelectedPlays([]);
    setPlayAmounts({});
    setActiveQuick(null);
    // 跳转到新的游戏页面，不保留group_id，让新游戏使用默认分组
    //const newUrl = `/games/play?lottery_id=${gameId}`;
    // 跳转到新的游戏页面，保持当前的group_id或使用默认值
    const newUrl = `/games/play?lottery_id=${gameId}${group_id ? `&group_id=${group_id}` : ''}`;
    router.push(newUrl);
  };

  // ====================== 切换玩法分组 ======================
  const handleGroupChange = (group: PlayGroup) => {
    if (activeGroup && group.id === activeGroup.id) return;
    setSelectedPlays([]);
    setPlayAmounts({});
    setActiveGroup(group);
    setActiveQuick(null);
    setToastMessage("已清空已选玩法");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // ====================== 切换玩法 ======================
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

  // ====================== 从Dialog中删除玩法 ======================
  const removeFromSelectedPlays = (playName: string) => {
    setSelectedPlays((prev) => prev.filter((p) => p !== playName));
    const newAmounts = { ...playAmounts };
    delete newAmounts[playName];
    setPlayAmounts(newAmounts);
  };

  // ====================== 打开批量下注弹框 ======================
  const handleOpenBatchModal = () => {

    if (!activeGroup) return;

    // 为没有设置金额的玩法设置默认最小金额
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

  // ====================== 快速选择 ======================
  const handleQuickSelect = (type: string) => {
    if (!activeGroup) return;

    const groupId = Number(activeGroup.id);
    let newSelected: string[] = [];

    // 获取所有数字玩法并按数字排序
    const numericPlays = activeGroup.plays
      .filter((p) => !isNaN(parseInt(p.name, 10)))
      .sort((a, b) => parseInt(a.name, 10) - parseInt(b.name, 10));

    switch (type) {
      case "全包":
        // 全选所有玩法
        newSelected = activeGroup.plays.map((p) => p.name);
        break;

      case "反选":
        // 选中当前未选中的，取消当前选中的
        newSelected = activeGroup.plays
          .filter((p) => !selectedPlays.includes(p.name))
          .map((p) => p.name);
        break;

      case "单":
        // 奇数：除以2不能整除
        numericPlays.forEach((p) => {
          const num = parseInt(p.name, 10);
          if (num % 2 === 1) newSelected.push(p.name);
        });
        break;

      case "双":
        // 偶数：除以2可以整除
        numericPlays.forEach((p) => {
          const num = parseInt(p.name, 10);
          if (num % 2 === 0) newSelected.push(p.name);
        });
        break;

      case "极大":
        // 前三个数（最大的三个）
        if (numericPlays.length >= 3) {
          const top3 = numericPlays.slice(-3);
          newSelected = top3.map((p) => p.name);
        }
        break;

      case "极小":
        // 后三个数（最小的三个）
        if (numericPlays.length >= 3) {
          const bottom3 = numericPlays.slice(0, 3);
          newSelected = bottom3.map((p) => p.name);
        }
        break;

      case "大":
      case "小":
      case "中":
      case "边":
        // 根据分组ID判断
        if ([1, 3, 10, 14, 18, 22].includes(groupId)) {
          // id为1,3,10,14,18,22时
          numericPlays.forEach((p) => {
            const num = parseInt(p.name, 10);
            if (type === "大" && num >= 14) newSelected.push(p.name);
            if (type === "小" && num <= 13) newSelected.push(p.name);
            if (type === "中" && num >= 10 && num <= 17) newSelected.push(p.name);
            if (type === "边" && ((num >= 0 && num <= 3) || (num >= 24 && num <= 27))) newSelected.push(p.name);
          });
        } else if ([4, 26].includes(groupId)) {
          // id为4,26时
          numericPlays.forEach((p) => {
            const num = parseInt(p.name, 10);
            if (type === "大" && num >= 6) newSelected.push(p.name);
            if (type === "小" && num <= 5) newSelected.push(p.name);
            if (type === "中" && num >= 4 && num <= 7) newSelected.push(p.name);
            if (type === "边" && ((num >= 0 && num <= 3) || (num >= 8 && num <= 10))) newSelected.push(p.name);
          });
        } else if ([5, 16, 23].includes(groupId)) {
          // id为5,16,23时
          numericPlays.forEach((p) => {
            const num = parseInt(p.name, 10);
            if (type === "大" && num >= 7) newSelected.push(p.name);
            if (type === "小" && num <= 6) newSelected.push(p.name);
            if (type === "中" && num >= 5 && num <= 9) newSelected.push(p.name);
            if (type === "边" && ((num >= 2 && num <= 4) || (num >= 10 && num <= 12))) newSelected.push(p.name);
          });
        } else if ([6, 15, 24].includes(groupId)) {
          // id为6,15,24时
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

  const handleSubmit = async () => {
    if (!activeGroup) {
      toast.error("请选择玩法分组");
      return;
    }

    const bet_expect_no = currExpect?.expect_no || "";
    const game_group_id = activeGroup.id;
    const bet_no = selectedPlays.join(",");
    const bet_gold = selectedPlays.map((p) => playAmounts[p] || "0").join(",");
    // 获取选中玩法的真实ID，与bet_no一一对应
    const lottery_played_id = selectedPlays.map((playName) => {
      const playItem = activeGroup.plays.find((item) => item.name === playName);
      return playItem ? playItem.id : "";
    }).filter(id => id !== "").join(",");
    const total_gold = selectedPlays.reduce((sum, p) => sum + (parseInt(playAmounts[p] || "0", 10) || 0), 0);

    // 验证
    if (!bet_expect_no) {
      toast.error("期号信息缺失，请稍后重试");
      return;
    }
    if (total_gold <= 0) {
      toast.error("请输入投注金额");
      return;
    }

    const payload = { game_group_id, lottery_id, bet_no, bet_expect_no, bet_gold, lottery_played_id, total_gold };

    try {
      const res = await betGame(payload);
      if (res.code === 200) {
        toast.success("投注成功！");
        setShowBatchModal(false);
        // 清空选择
        setSelectedPlays([]);
        setPlayAmounts({});
        setActiveQuick(null);
        // 刷新用户金豆
        refreshUserPoints();
      } else if (res.code !== 3001) {
        // 统一处理非200和3001的状态码
        toast.error(parseErrorMessage(res, "投注失败，请稍后重试"));
      }
    } catch (error) {
      console.error("投注失败：", error);
      toast.error(parseAxiosError(error, "投注失败，请稍后重试"));
    }
  };

  // ====================== 获取最终展示结果 ======================
  const getDisplayResult = (expectInfo: ExpectInfo | null) => {
    if (!expectInfo) return "--";
    const res = expectInfo.finalRes;
    if (res && activeGroup) {
      switch (activeGroup.id) {
        case "sum": return res.sum ?? expectInfo.action_no;
        case "shape": return res.shape ?? expectInfo.action_no;
        case "mix": return res.lungFuPao ?? expectInfo.action_no;
        default: return expectInfo.action_no;
      }
    }
    return expectInfo.action_no ?? "--";
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black relative pb-20">
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
          {/*<Bell /><Video />*/}
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
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 text-xs whitespace-nowrap",
                activeTab === tab ? "text-red-600 border-b-2 border-red-600 font-bold" : "text-gray-700"
              )}
            >{tab}</button>
          ))}
        </div>
      </div>

      {/* 投注页 */}
      {activeTab === "投注" && (
        <>
          {/* 当前期 & 上一期一行两列 */}
          <div className="bg-white p-3 my-2 mx-3 rounded-lg shadow text-sm flex justify-between">
            {/* 上一期左列 */}
            <div className="w-[48%] min-w-[200px] border-r pr-3 space-y-1">
              <div><span className="font-bold">第</span>{lastExpect?.expect_no || "--"}期</div>
              <div><span className="font-bold">时间：</span>{lastExpect?.open_time|| "--"}</div>
              <div className="break-words word-break-all"><span className="font-bold">奖号：</span>{getDisplayResult(lastExpect)}</div>
            </div>

            {/* 当前期右列 */}
            <div className="w-[48%] min-w-[200px] pl-3 space-y-1">
              <div className="flex items-center justify-between">
                <span><span className="font-bold">第</span>{currExpect?.expect_no || "--"}期</span>
                <RefreshCcw
                  onClick={() => {
                    shouldStopFetchingRef.current = false;
                    fetchExpectInfo();
                  }}
                  size={16}
                  className="flex float-left items-center text-blue-600 text-xs mr-1 cursor-pointer hover:text-blue-800"
                />
                <button ></button>
              </div>

              <>
                {/* 封盘期间显示不同的倒计时标签 */}
                {statusCode === 3001 ? (
                  <>
                    <div><span className="font-bold">封盘剩余：</span><span className="text-red-600">{formatTime(remainingClose)}</span></div>
                    <div><span className="font-bold">开奖倒计时：</span><span className="text-orange-600">{formatTime(remainingOpen)}</span></div>
                  </>
                ) : (
                  <>
                    <div><span className="font-bold">封盘截止：</span>{formatTime(remainingClose)}</div>
                    <div><span className="font-bold">开奖截止：</span>{formatTime(remainingOpen)}</div>
                  </>
                )}

                {/* 状态提示 - 按优先级显示 */}
                {statusCode === 3001 ? (
                  <div className="text-red-600 font-bold animate-pulse">🔒 封盘中，暂停投注</div>
                ) : remainingOpen === 0 && currExpect && currExpect.expect_no === previousExpectNo ? (
                  <div className="text-blue-600 font-bold">正在开奖中...</div>
                ) : remainingClose === 0 ? (
                  <div className="text-orange-600 font-bold">已封盘/暂时停盘</div>
                ) : remainingClose > 0 && remainingOpen > 0 ? (
                  <div className="text-green-600 font-bold">投注中....</div>
                ) : null}

                {/*<div className="overflow-x-auto whitespace-nowrap">
                  <span className="font-bold">预开奖:</span>
                  <span className="inline-block min-w-[50px]">{getDisplayResult(currExpect)}</span>
                </div>*/}
              </>
            </div>
          </div>

          {/* 快速选择 - 只有特定分组ID才显示 */}
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
              {isLoadingPlays ? (
                <div className="flex justify-center items-center py-8">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                  <span className="ml-2 text-gray-600">加载玩法中...</span>
                </div>
              ) : activeGroup ? (
                <div className="grid grid-cols-3 gap-2">
                  {activeGroup.plays.map((playItem) => {
                    const isSelected = selectedPlays.includes(playItem.name);
                    const displayOdds = (playItem.odds / 1000).toFixed(3);  // 除以1000并保留3位小数
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

          {/* 下注按钮 */}
          {selectedPlays.length > 0 && (
            <div className="pb-16 p-3">
              <button
                onClick={handleOpenBatchModal}
                disabled={statusCode === 3001}
                className={cn(
                  "w-full py-2 rounded-lg font-bold text-sm",
                  statusCode === 3001
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-red-600 text-white"
                )}
              >
                {statusCode === 3001
                  ? `封盘中，请等待 ${formatTime(remainingClose)}`
                  : `立即下注（已选 ${selectedPlays.length} 项）`}
              </button>
            </div>
          )}
        </>
      )}

      {/* 批量下注 Dialog */}
      <Dialog open={showBatchModal} onOpenChange={setShowBatchModal}>
        <DialogContent className="max-w-sm p-0 flex flex-col h-[55vh] md:h-[50vh] transition-all duration-300 ease-in-out">
          <DialogHeader className="p-3 border-b">
            <DialogTitle className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span>批量下注（{selectedPlays.length}项）</span>
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
                <span></span>
              </div>
              {selectedPlays.reduce((sum, p) => sum + (parseInt(playAmounts[p] || "0", 10) || 0), 0) > (currentCustomer?.points ?? 0) && (
                <div className="text-xs text-red-500 font-normal">
                  金豆不足！当前余额：{format.number(currentCustomer?.points ?? 0)}
                </div>
              )}
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
                  placeholder="金额"
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
                disabled={selectedPlays.length === 0}
              >
                确认提交
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                  onClick={() => handleGameSwitch(game.id)}
                  className={cn(
                    "p-3 rounded-lg text-center font-bold text-sm border transition-all",
                    String(game.id) === String(lottery_id)
                      ? "bg-red-600 text-white border-red-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-red-600 hover:text-red-600"
                  )}
                >
                  {game.name}
                  {String(game.id) === String(lottery_id) && (
                    <div className="text-xs mt-1">当前</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast */}
      <div
        className={cn(
          "fixed bottom-[280px] left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-md z-50 text-sm pointer-events-none transition-all duration-500 ease-in-out",
          showToast ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        )}
      >
        {toastMessage}
      </div>
    </div>
  );
}
