"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { RefreshCcw, ChevronUp, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn, parseErrorMessage, parseAxiosError } from "@/lib/utils";
import { playAll, betGame, fetchExpectInfo as fetchExpectInfoAPI, lotteryRecord, modeList, betRecords } from "@/api/game";
import { currentCustomer as fetchCurrentCustomer } from "@/api/auth";
import { toast } from "sonner";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {
  ExpectInfo,
  GamePlay,
  GamePlayMapItem,
  LotteryResultItem,
  ModeItem,
} from "@/types/game.type";
import {useAuthStore} from "@/utils/storage/auth";
import Image from "next/image";
import {useFormatter} from "use-intl";
import { useGameContext } from "../_context";

// 扩展 Window 接口以支持 webkitAudioContext（Safari 兼容）
interface WebkitWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

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
  betMultiplier?: string;  // 权重字符串，如 "1,3,6,10,15,..."
  startNum?: number;       // 起始数字，用于计算权重索引
}

export default function BetPage() {
  useRequireLogin();
  // 格式化金额
  const format = useFormatter();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lottery_id = searchParams.get("lottery_id") || "";
  const group_id = searchParams.get("group_id") || "";
  const refreshTs = searchParams.get("t") || ""; // 用于强制刷新的时间戳

  // 从 Context 获取游戏信息（头部和Tab由layout处理）
  const { soundEnabled, selectedGroupId, playGroups } = useGameContext();

  // 播放开奖提示音
  const playNotificationSound = () => {
    try {
      // 使用 Web Audio API 生成简单的叮咚声
      const AudioContextClass = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioContext = new AudioContextClass();

      // 创建第一个音调（叮）
      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);
      oscillator1.frequency.value = 880; // A5 音符
      oscillator1.type = "sine";
      gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.3);

      // 创建第二个音调（咚）- 延迟 0.15 秒
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      oscillator2.frequency.value = 1320; // E6 音符
      oscillator2.type = "sine";
      gainNode2.gain.setValueAtTime(0, audioContext.currentTime + 0.15);
      gainNode2.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.16);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator2.start(audioContext.currentTime + 0.15);
      oscillator2.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error("播放提示音失败", error);
    }
  };

  const [groups, setGroups] = useState<PlayGroup[]>([]);
  const [isLoadingPlays, setIsLoadingPlays] = useState(true);

  // 支持快捷选择的玩法分组ID
  const quickSelectGroupIds = [1, 3, 10, 14, 18, 22, 4, 26, 5, 16, 23, 6, 15, 24];

  const [activeGroup, setActiveGroup] = useState<PlayGroup | null>(null);
  const [selectedPlays, setSelectedPlays] = useState<string[]>([]);
  const [playAmounts, setPlayAmounts] = useState<Record<string, string>>({});
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [activeQuick, setActiveQuick] = useState<string | null>(null);

  // 新增状态：收起/展开、倍数、筹码
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMultiplier, setSelectedMultiplier] = useState<number | null>(null);
  const [quickAmount, setQuickAmount] = useState<string>("");

  // 自定义模式相关状态
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [modes, setModes] = useState<ModeItem[]>([]);
  const [isLoadingModes, setIsLoadingModes] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ModeItem | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const currScrollRef = useRef<HTMLDivElement>(null);
  const shouldStopFetchingRef = useRef(false);
  const isFetchingRef = useRef(false); // 防止重复请求
  const remainingOpenRef = useRef(0); // 用于轮询定时器访问最新的倒计时值
  const previousExpectNoRef = useRef<string>(""); // 用于跟踪上一个期号
  const activeGroupIdRef = useRef<number | null>(null); // 用于轮询定时器访问当前选中的分组ID
  const soundEnabledRef = useRef(soundEnabled); // 用于回调函数访问最新的铃声状态

  // 同步 soundEnabled 到 ref
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const [currExpect, setCurrExpect] = useState<ExpectInfo | null>(null);
  const [lastExpect, setLastExpect] = useState<ExpectInfo | null>(null);
  const [remainingOpen, setRemainingOpen] = useState(0);
  const [remainingClose, setRemainingClose] = useState(0);
  const [statusCode, setStatusCode] = useState<number>(200);
  const [previousExpectNo, setPreviousExpectNo] = useState<string>("");

  // 最近开奖记录弹窗
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<LotteryResultItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 当前期号的已投注金额（按玩法名汇总）
  const [myBetAmounts, setMyBetAmounts] = useState<Record<string, number>>({});

  const setCurrentCustomer = useAuthStore((s) => s.setCurrentCustomer);
  const currentCustomer = useAuthStore((s) => s.currentCustomer);

  // 快捷选择按钮配置
  const quickButtons1 = ["全包", "单", "大单", "小单", "单边", "双"];
  const quickButtons2 = ["大双", "小双", "双边", "大", "小", "中"];
  const quickButtons3 = ["边", "大边", "小边"];
  const specialButtons = ["上期", "反选", "清空"];

  // 尾数按钮
  const tailButtons = ["0尾", "1尾", "2尾", "3尾", "4尾", "5尾", "6尾", "7尾", "8尾", "9尾", "小尾", "大尾"];

  // 余数按钮
  const mod3Buttons = ["3余0", "3余1", "3余2"];
  const mod4Buttons = ["4余0", "4余1", "4余2", "4余3"];
  const mod5Buttons = ["5余0", "5余1", "5余2", "5余3", "5余4"];

  // 倍数按钮
  const multiplierButtons1 = [0.1, 0.5, 0.8, 1.2, 1.5, 2];
  const multiplierButtons2 = [5, 10, 20, 30, 50, 100];

  // 筹码配置：显示值、实际值（乘以1000）、图片路径
  const chipConfig = [
    { display: "10", value: 10000, img: "/chips/10.png" },
    { display: "100", value: 100000, img: "/chips/100.png" },
    { display: "500", value: 500000, img: "/chips/500.png" },
    { display: "1K", value: 1000000, img: "/chips/1000.png" },
    { display: "5K", value: 5000000, img: "/chips/5000.png" },
  ];

  // 解析权重字符串获取权重数组
  const getWeightsArray = (betMultiplier: string | undefined): number[] => {
    if (!betMultiplier) return [];
    return betMultiplier.split(",").map(s => parseInt(s.trim(), 10) || 1);
  };

  // 获取玩法对应的权重
  // playName: 玩法名
  // weightsArray: 权重数组
  // startNum: 起始数字（用于数字玩法名计算索引）
  // plays: 当前分组的玩法列表（用于非数字玩法名或索引越界时按位置查找）
  const getPlayWeight = (
    playName: string,
    weightsArray: number[],
    startNum: number,
    plays: PlayItem[]
  ): number => {
    if (weightsArray.length === 0) return 1;

    // 尝试将玩法名解析为数字
    const playNum = parseInt(playName, 10);

    if (!isNaN(playNum)) {
      // 玩法名是数字，使用 playNum - startNum 作为索引
      const index = playNum - startNum;
      if (index >= 0 && index < weightsArray.length) {
        return weightsArray[index];
      }
    }

    // 玩法名不是数字或索引越界，使用玩法在分组中的位置作为索引
    const positionIndex = plays.findIndex(p => p.name === playName);
    if (positionIndex >= 0 && positionIndex < weightsArray.length) {
      return weightsArray[positionIndex];
    }

    // 都找不到时默认权重1
    return 1;
  };

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

  // ====================== 获取最近开奖记录 ======================
  const fetchHistoryRecords = async () => {
    if (!lottery_id || !activeGroupIdRef.current) return;

    try {
      setIsLoadingHistory(true);
      const res = await lotteryRecord({
        lottery_id: parseInt(lottery_id),
        game_group_id: activeGroupIdRef.current,
        page: 1,
        pageSize: 11,
      });

      if (res.code === 200 && res.data) {
        // 过滤掉未开奖的记录（is_opened !== 1）
        const openedRecords = (res.data.list || []).filter(
          (item) => item.is_opened === 1
        );
        setHistoryRecords(openedRecords);
      } else {
        toast.error(parseErrorMessage(res, "获取开奖记录失败"));
      }
    } catch (error) {
      console.error("获取开奖记录失败", error);
      toast.error(parseAxiosError(error, "获取开奖记录失败"));
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 打开历史记录弹窗
  const handleOpenHistory = () => {
    setShowHistoryModal(true);
    fetchHistoryRecords();
  };

  // ====================== 获取当前期号的已投注记录 ======================
  const fetchMyBetRecords = async (expectNo: string) => {
    if (!lottery_id || !activeGroupIdRef.current || !expectNo) return;

    try {
      const res = await betRecords({
        lottery_id: parseInt(lottery_id),
        game_group_id: activeGroupIdRef.current,
        expect_no: expectNo,
        page: 1,
        pageSize: 100, // 获取足够多的记录
      });

      if (res.code === 200 && res.data) {
        // 汇总每个玩法的投注金额
        const betAmounts: Record<string, number> = {};
        const list = res.data.list || [];

        list.forEach((record) => {
          // bet_no 是对象，key是玩法ID，value包含 bet_no(玩法名) 和 bet_gold
          const betNoObj = record.bet_no;
          if (betNoObj && typeof betNoObj === "object") {
            Object.values(betNoObj).forEach((betInfo: any) => {
              const playName = betInfo.bet_no; // 玩法名
              const betGold = betInfo.bet_gold || 0;
              if (playName) {
                betAmounts[playName] = (betAmounts[playName] || 0) + betGold;
              }
            });
          }
        });

        setMyBetAmounts(betAmounts);
      } else {
        setMyBetAmounts({});
      }
    } catch (error) {
      console.error("获取已投注记录失败", error);
      setMyBetAmounts({});
    }
  };

  // ====================== 获取上期投注并回显 ======================
  const fetchPreviousPeriodBets = async () => {
    if (!lottery_id || !activeGroupIdRef.current || !lastExpect?.expect_no) {
      toast.error("无法获取上期投注记录");
      return;
    }

    try {
      const res = await betRecords({
        lottery_id: parseInt(lottery_id),
        game_group_id: activeGroupIdRef.current,
        expect_no: lastExpect.expect_no,
        page: 1,
        pageSize: 100,
      });

      if (res.code === 200 && res.data) {
        const list = res.data.list || [];
        if (list.length === 0) {
          toast.info("上期没有投注记录");
          return;
        }

        // 收集上期投注的玩法名和金额
        const prevBets: Record<string, number> = {};
        list.forEach((record) => {
          const betNoObj = record.bet_no;
          if (betNoObj && typeof betNoObj === "object") {
            Object.values(betNoObj).forEach((betInfo: any) => {
              const playName = betInfo.bet_no;
              const betGold = betInfo.bet_gold || 0;
              if (playName) {
                prevBets[playName] = (prevBets[playName] || 0) + betGold;
              }
            });
          }
        });

        // 选中上期投注的玩法
        const playNames = Object.keys(prevBets);
        if (playNames.length === 0) {
          toast.info("上期没有投注记录");
          return;
        }

        // 更新选中状态
        setSelectedPlays(playNames);

        // 更新金额
        const newAmounts: Record<string, string> = {};
        playNames.forEach((name) => {
          newAmounts[name] = String(prevBets[name]);
        });
        setPlayAmounts(newAmounts);

        toast.success(`已加载上期 ${playNames.length} 个投注`);
      } else {
        toast.info("上期没有投注记录");
      }
    } catch (error) {
      console.error("获取上期投注记录失败", error);
      toast.error("获取上期投注记录失败");
    }
  };

  // 获取开奖结果显示文本
  const getHistoryResult = (item: LotteryResultItem): string => {
    const fr = item.final_res;
    if (!fr) return "--";

    // 优先使用 finalResRecord
    if (fr.finalResRecord) {
      return String(fr.finalResRecord);
    }

    // 其次尝试根据当前分组ID获取对应的结果
    const groupId = activeGroupIdRef.current;
    if (groupId) {
      const resultKey = `finalOpenRes${groupId}` as keyof typeof fr;
      const resultValue = fr[resultKey];
      if (resultValue !== undefined && resultValue !== null) {
        return String(resultValue);
      }
    }

    // 回退到开奖号码
    const nums = fr.nums;
    if (nums) {
      if (Array.isArray(nums)) return nums.join(",");
      if (typeof nums === "object") return Object.values(nums).join(",");
      return String(nums);
    }

    return "--";
  };

  // 获取上期开奖结果显示文本（用于底部栏显示）
  const getLastExpectResult = (): string => {
    if (!lastExpect?.finalRes) return "--";
    const fr = lastExpect.finalRes;

    // 优先尝试根据当前分组ID获取对应的结果
    const groupId = activeGroupIdRef.current;
    if (groupId) {
      const resultKey = `finalOpenRes${groupId}` as keyof typeof fr;
      const resultValue = fr[resultKey];
      if (resultValue !== undefined && resultValue !== null) {
        return String(resultValue);
      }
    }

    // 回退到开奖号码
    const nums = fr.nums;
    if (nums) {
      if (Array.isArray(nums)) return nums.join(",");
      if (typeof nums === "object") return Object.values(nums).join(",");
      return String(nums);
    }

    return "--";
  };

  // ====================== 获取玩法列表 ======================
  const fetchPlayMethods = async () => {
    if (!lottery_id) {//跳转到游戏大厅
      const newUrl = `/games`;
      router.push(newUrl);
      return;
    }

    try {
      setIsLoadingPlays(true);
      const res = await playAll({ lottery_id: parseInt(lottery_id) });

      if (res.code === 200 && res.data) {
        const { gamePlayMap = [], groupArr = [] } = res.data;

        // 创建分组配置映射（用于获取 bet_multiplier 和 start_num）
        const groupConfigMap: Record<number, { betMultiplier: string; startNum: number }> = {};
        groupArr.forEach((g: { id: number; bet_multiplier?: string; start_num?: number }) => {
          groupConfigMap[g.id] = {
            betMultiplier: g.bet_multiplier || "",
            startNum: g.start_num || 0,
          };
        });

        // 使用 gamePlayMap 构建玩法分组列表
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
                odds: play.multiple || 0,  // multiple 字段作为赔率
                minBetGold: play.min_bet_gold || 0,  // 最小投注金额
              })),
            };
          })
          .filter((g: PlayGroup) => g.plays.length > 0);

        setGroups(playGroups);

        // 如果有 group_id 参数，设置为默认选中的分组
        let defaultGroupId: number | null = null;
        if (group_id && playGroups.length > 0) {
          const targetGroup = playGroups.find((g) => String(g.id) === String(group_id));
          if (targetGroup) {
            setActiveGroup(targetGroup);
            defaultGroupId = Number(targetGroup.id);
          } else {
            setActiveGroup(playGroups[0]);
            defaultGroupId = Number(playGroups[0].id);
          }
        } else if (playGroups.length > 0) {
          setActiveGroup(playGroups[0]);
          defaultGroupId = Number(playGroups[0].id);
        }

        // 更新 ref 以供轮询使用
        activeGroupIdRef.current = defaultGroupId;

        // 如果 URL 没有 group_id，用默认分组ID调用开奖接口
        if (!group_id && defaultGroupId) {
          fetchExpectInfo(defaultGroupId);
        }
      } else if (res.code !== 3001) {
        // 统一处理非200和3001的状态码
        toast.error(parseErrorMessage(res, "获取玩法列表失败"));
      }
    } catch (error) {
      console.error("获取玩法列表失败", error);
      toast.error(parseAxiosError(error, "获取玩法列表失败，请稀后重试"));
    } finally {
      setIsLoadingPlays(false);
    }
  };

  // ====================== 获取开奖接口 ======================
  const fetchExpectInfo = async (groupIdOverride?: number) => {
    // 使用传入的 groupId 或 URL 的 group_id 或 ref 中保存的最新分组ID
    const effectiveGroupId = groupIdOverride ?? (group_id ? parseInt(group_id) : activeGroupIdRef.current);
    if (!lottery_id || !effectiveGroupId) return;

    try {
      const res = await fetchExpectInfoAPI({
        lottery_id: parseInt(lottery_id),
        game_group_id: Number(effectiveGroupId)
      });

      setStatusCode(res.code);
      if (res.code === 200 && res.data) {
        const newExpectNo = res.data.currExpectInfo?.expect_no;

        // 检查是否获取到新期号（开奖完成，进入新一期）
        if (newExpectNo && newExpectNo !== previousExpectNoRef.current) {
          // 开奖完成后刷新用户金豆（可能中奖）- 排除首次加载
          if (previousExpectNoRef.current) {
            refreshUserPoints();
            // 如果开启了提示音，播放叮咚声
            if (soundEnabledRef.current) {
              playNotificationSound();
            }
          }
          // 更新 ref 和 state
          previousExpectNoRef.current = newExpectNo;
          setPreviousExpectNo(newExpectNo);

          // 获取新期号的已投注记录
          fetchMyBetRecords(newExpectNo);
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
      toast.error(parseAxiosError(error, "获取开奖信息失败，请稀后重试"));
    }
  };

  // ====================== 初始化 & 倒计时 ======================
  useEffect(() => {
    // 重置状态（游戏或分组切换时）
    shouldStopFetchingRef.current = false;
    isFetchingRef.current = false;
    remainingOpenRef.current = 0;
    previousExpectNoRef.current = ""; // 重置期号 ref
    activeGroupIdRef.current = group_id ? parseInt(group_id) : null; // 重置分组ID ref
    setPreviousExpectNo("");

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
  }, [lottery_id, group_id, refreshTs]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  };

  // ====================== 监听 Context 分组切换 ======================
  useEffect(() => {
    if (!selectedGroupId || groups.length === 0) return;

    // 从 groups 中找到对应的分组
    const targetGroup = groups.find((g) => Number(g.id) === selectedGroupId);
    if (targetGroup && (!activeGroup || Number(activeGroup.id) !== selectedGroupId)) {
      setSelectedPlays([]);
      setPlayAmounts({});
      setActiveGroup(targetGroup);
      setActiveQuick(null);
      // 重置模式相关状态
      setShowModeSelector(false);
      setModes([]);
      setSelectedMode(null);
      // 清空当前分组的已投注记录
      setMyBetAmounts({});
      // 更新 ref 以供轮询使用
      activeGroupIdRef.current = selectedGroupId;
      // 切换分组后立即获取新分组的开奖信息
      fetchExpectInfo(selectedGroupId);
      // 切换分组后获取新分组的已投注记录
      if (currExpect?.expect_no) {
        // 延迟调用，确保 activeGroupIdRef 已更新
        setTimeout(() => {
          fetchMyBetRecords(currExpect.expect_no);
        }, 100);
      }
    }
  }, [selectedGroupId, groups]);

  // ====================== 切换玩法 ======================
  const togglePlay = (playItem: PlayItem) => {
    const playName = playItem.name;
    setSelectedPlays((prev) => {
      if (prev.includes(playName)) {
        // 取消选中：删除该玩法的金额
        const newArr = prev.filter((p) => p !== playName);
        const newAmounts = { ...playAmounts };
        delete newAmounts[playName];
        setPlayAmounts(newAmounts);
        return newArr;
      } else {
        // 选中：设置默认金额为 min_bet_gold
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

  // ====================== 快速选择 ======================
  const handleQuickSelect = (type: string) => {
    if (!activeGroup) return;

    const groupId = Number(activeGroup.id);
    let newSelected: string[] = [...selectedPlays];

    // 获取所有数字玩法并按数字排序
    const numericPlays = activeGroup.plays
      .filter((p) => !isNaN(parseInt(p.name, 10)))
      .sort((a, b) => parseInt(a.name, 10) - parseInt(b.name, 10));

    // 辅助函数：切换选择状态
    const toggleSelection = (names: string[]) => {
      names.forEach(name => {
        if (newSelected.includes(name)) {
          newSelected = newSelected.filter(n => n !== name);
        } else {
          newSelected.push(name);
        }
      });
    };

    switch (type) {
      case "清空":
        newSelected = [];
        setPlayAmounts({});
        break;

      case "全包":
        newSelected = activeGroup.plays.map((p) => p.name);
        break;

      case "反选":
        newSelected = activeGroup.plays
          .filter((p) => !selectedPlays.includes(p.name))
          .map((p) => p.name);
        break;

      case "上期":
        // 获取上期投注并回显（异步操作）
        fetchPreviousPeriodBets();
        return; // 直接返回，不执行后续的 setSelectedPlays

      case "单":
        toggleSelection(numericPlays.filter(p => parseInt(p.name, 10) % 2 === 1).map(p => p.name));
        break;

      case "双":
        toggleSelection(numericPlays.filter(p => parseInt(p.name, 10) % 2 === 0).map(p => p.name));
        break;

      case "大单":
        if ([1, 3, 10, 14, 18, 22].includes(groupId)) {
          toggleSelection(numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= 14 && num % 2 === 1;
          }).map(p => p.name));
        }
        break;

      case "小单":
        if ([1, 3, 10, 14, 18, 22].includes(groupId)) {
          toggleSelection(numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num <= 13 && num % 2 === 1;
          }).map(p => p.name));
        }
        break;

      case "大双":
        if ([1, 3, 10, 14, 18, 22].includes(groupId)) {
          toggleSelection(numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= 14 && num % 2 === 0;
          }).map(p => p.name));
        }
        break;

      case "小双":
        if ([1, 3, 10, 14, 18, 22].includes(groupId)) {
          toggleSelection(numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num <= 13 && num % 2 === 0;
          }).map(p => p.name));
        }
        break;

      case "单边":
        if ([1, 3, 10, 14, 18, 22].includes(groupId)) {
          toggleSelection(numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return ((num >= 0 && num <= 3) || (num >= 24 && num <= 27)) && num % 2 === 1;
          }).map(p => p.name));
        }
        break;

      case "双边":
        if ([1, 3, 10, 14, 18, 22].includes(groupId)) {
          toggleSelection(numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return ((num >= 0 && num <= 3) || (num >= 24 && num <= 27)) && num % 2 === 0;
          }).map(p => p.name));
        }
        break;

      case "大":
        if ([1, 3, 10, 14, 18, 22].includes(groupId)) {
          toggleSelection(numericPlays.filter(p => parseInt(p.name, 10) >= 14).map(p => p.name));
        } else if ([4, 26].includes(groupId)) {
          toggleSelection(numericPlays.filter(p => parseInt(p.name, 10) >= 6).map(p => p.name));
        } else if ([5, 16, 23].includes(groupId)) {
          toggleSelection(numericPlays.filter(p => parseInt(p.name, 10) >= 7).map(p => p.name));
        } else if ([6, 15, 24].includes(groupId)) {
          toggleSelection(numericPlays.filter(p => parseInt(p.name, 10) >= 11).map(p => p.name));
        }
        break;

      case "小":
        if ([1, 3, 10, 14, 18, 22].includes(groupId)) {
          toggleSelection(numericPlays.filter(p => parseInt(p.name, 10) <= 13).map(p => p.name));
        } else if ([4, 26].includes(groupId)) {
          toggleSelection(numericPlays.filter(p => parseInt(p.name, 10) <= 5).map(p => p.name));
        } else if ([5, 16, 23].includes(groupId)) {
          toggleSelection(numericPlays.filter(p => parseInt(p.name, 10) <= 6).map(p => p.name));
        } else if ([6, 15, 24].includes(groupId)) {
          toggleSelection(numericPlays.filter(p => parseInt(p.name, 10) <= 10).map(p => p.name));
        }
        break;

      case "中":
        if ([1, 3, 10, 14, 18, 22].includes(groupId)) {
          toggleSelection(numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= 10 && num <= 17;
          }).map(p => p.name));
        } else if ([4, 26].includes(groupId)) {
          toggleSelection(numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= 4 && num <= 7;
          }).map(p => p.name));
        } else if ([5, 16, 23].includes(groupId)) {
          toggleSelection(numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= 5 && num <= 9;
          }).map(p => p.name));
        } else if ([6, 15, 24].includes(groupId)) {
          toggleSelection(numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= 8 && num <= 13;
          }).map(p => p.name));
        }
        break;

      case "边":
        if ([1, 3, 10, 14, 18, 22].includes(groupId)) {
          toggleSelection(numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return (num >= 0 && num <= 3) || (num >= 24 && num <= 27);
          }).map(p => p.name));
        }
        break;

      case "大边":
        if ([1, 3, 10, 14, 18, 22].includes(groupId)) {
          toggleSelection(numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= 24 && num <= 27;
          }).map(p => p.name));
        }
        break;

      case "小边":
        if ([1, 3, 10, 14, 18, 22].includes(groupId)) {
          toggleSelection(numericPlays.filter(p => {
            const num = parseInt(p.name, 10);
            return num >= 0 && num <= 3;
          }).map(p => p.name));
        }
        break;

      // 尾数选择
      case "0尾": case "1尾": case "2尾": case "3尾": case "4尾":
      case "5尾": case "6尾": case "7尾": case "8尾": case "9尾":
        const tailNum = parseInt(type.replace("尾", ""), 10);
        toggleSelection(numericPlays.filter(p => parseInt(p.name, 10) % 10 === tailNum).map(p => p.name));
        break;

      case "小尾":
        toggleSelection(numericPlays.filter(p => parseInt(p.name, 10) % 10 <= 4).map(p => p.name));
        break;

      case "大尾":
        toggleSelection(numericPlays.filter(p => parseInt(p.name, 10) % 10 >= 5).map(p => p.name));
        break;

      // 余数选择
      case "3余0": case "3余1": case "3余2":
        const mod3Val = parseInt(type.replace("3余", ""), 10);
        toggleSelection(numericPlays.filter(p => parseInt(p.name, 10) % 3 === mod3Val).map(p => p.name));
        break;

      case "4余0": case "4余1": case "4余2": case "4余3":
        const mod4Val = parseInt(type.replace("4余", ""), 10);
        toggleSelection(numericPlays.filter(p => parseInt(p.name, 10) % 4 === mod4Val).map(p => p.name));
        break;

      case "5余0": case "5余1": case "5余2": case "5余3": case "5余4":
        const mod5Val = parseInt(type.replace("5余", ""), 10);
        toggleSelection(numericPlays.filter(p => parseInt(p.name, 10) % 5 === mod5Val).map(p => p.name));
        break;
    }

    // 为新选中的玩法设置默认金额（min_bet_gold）
    const newAmounts = { ...playAmounts };

    // 找出新增选中的玩法
    const newlySelected = newSelected.filter(name => !selectedPlays.includes(name));
    newlySelected.forEach(name => {
      const playItem = activeGroup.plays.find(p => p.name === name);
      if (playItem && playItem.minBetGold > 0 && !newAmounts[name]) {
        newAmounts[name] = String(playItem.minBetGold);
      }
    });

    // 移除被取消选中的玩法的金额
    const deselected = selectedPlays.filter(name => !newSelected.includes(name));
    deselected.forEach(name => {
      delete newAmounts[name];
    });

    setPlayAmounts(newAmounts);
    setSelectedPlays(newSelected);
    setActiveQuick(type);
  };

  // ====================== 倍数投注 ======================
  const handleMultiplierSelect = (multiplier: number) => {
    setSelectedMultiplier(multiplier);
    // 应用倍数到所有已选玩法
    if (selectedPlays.length > 0) {
      const newAmounts = { ...playAmounts };
      selectedPlays.forEach(play => {
        const currentAmount = parseInt(newAmounts[play] || "0", 10);
        if (currentAmount > 0) {
          newAmounts[play] = String(Math.floor(currentAmount * multiplier));
        }
      });
      setPlayAmounts(newAmounts);
    }
  };

  // ====================== 筹码金额选择 ======================
  const handleChipSelect = (value: number) => {
    setQuickAmount(String(value));
  };

  // ====================== 定额梭哈（按权重分配） ======================
  const handleFixedAllIn = () => {
    if (!quickAmount || selectedPlays.length === 0 || !activeGroup) return;
    const totalAmount = parseInt(quickAmount, 10);
    if (isNaN(totalAmount) || totalAmount <= 0) return;

    // 获取当前分组的权重配置
    const weightsArray = getWeightsArray(activeGroup.betMultiplier);
    const startNum = activeGroup.startNum || 0;
    const plays = activeGroup.plays || [];

    // 计算选中玩法的总权重
    let totalWeight = 0;
    const playWeights: Record<string, number> = {};
    selectedPlays.forEach(play => {
      const weight = getPlayWeight(play, weightsArray, startNum, plays);
      playWeights[play] = weight;
      totalWeight += weight;
    });

    // 按权重分配金额并追踪已分配总额
    const newAmounts: Record<string, string> = {};
    let allocatedSum = 0;
    selectedPlays.forEach((play, index) => {
      const weight = playWeights[play];
      const existingAmount = parseInt(playAmounts[play] || "0", 10) || 0;
      const allocatedAmount = Math.floor((weight / totalWeight) * totalAmount);
      allocatedSum += allocatedAmount;
      newAmounts[play] = String(allocatedAmount + existingAmount);
    });

    // 如果有剩余金额，加到最后一个玩法上
    const remainder = totalAmount - allocatedSum;
    if (remainder > 0 && selectedPlays.length > 0) {
      const lastPlay = selectedPlays[selectedPlays.length - 1];
      const currentAmount = parseInt(newAmounts[lastPlay], 10);
      newAmounts[lastPlay] = String(currentAmount + remainder);
    }

    setPlayAmounts(newAmounts);
  };

  // ====================== 获取自定义模式列表 ======================
  const fetchModeList = async () => {
    if (!lottery_id || !activeGroupIdRef.current) return;

    try {
      setIsLoadingModes(true);
      const res = await modeList({
        lottery_id: parseInt(lottery_id),
        game_group_id: activeGroupIdRef.current,
        page: 1,
        pageSize: 100,
      });

      if (res.code === 200 && res.data) {
        setModes(res.data.list || []);
      } else {
        setModes([]);
      }
    } catch (error) {
      console.error("获取模式列表失败", error);
      setModes([]);
    } finally {
      setIsLoadingModes(false);
    }
  };

  // ====================== 点击自定义模式按钮 ======================
  const handleModeClick = () => {
    setShowModeSelector(true);
    fetchModeList();
  };

  // ====================== 应用自定义模式 ======================
  const handleApplyMode = (mode: ModeItem) => {
    if (!activeGroup) return;

    // 解析模式中的投注号码和金额
    const betNos = mode.bet_no.split(",").map(s => s.trim()).filter(s => s);
    const betGolds = mode.bet_no_gold.split(",").map(s => s.trim()).filter(s => s);

    // 设置选中的玩法
    const newSelectedPlays: string[] = [];
    const newPlayAmounts: Record<string, string> = {};

    betNos.forEach((betNo, index) => {
      // 检查该玩法是否在当前分组中存在
      const playExists = activeGroup.plays.some(p => p.name === betNo);
      if (playExists) {
        newSelectedPlays.push(betNo);
        // 设置对应的投注金额
        if (betGolds[index]) {
          newPlayAmounts[betNo] = betGolds[index];
        }
      }
    });

    setSelectedPlays(newSelectedPlays);
    setPlayAmounts(newPlayAmounts);
    setSelectedMode(mode);
    setShowModeSelector(false);

    toast.success(`已应用模式: ${mode.mode_name}`);
  };

  // ====================== 梭哈（全部投入，按权重分配） ======================
  const handleAllIn = () => {
    if (selectedPlays.length === 0 || !currentCustomer || !activeGroup) return;
    const totalPoints = currentCustomer.points || 0;
    if (totalPoints <= 0) return;

    // 获取当前分组的权重配置
    const weightsArray = getWeightsArray(activeGroup.betMultiplier);
    const startNum = activeGroup.startNum || 0;
    const plays = activeGroup.plays || [];

    // 计算选中玩法的总权重
    let totalWeight = 0;
    const playWeights: Record<string, number> = {};
    selectedPlays.forEach(play => {
      const weight = getPlayWeight(play, weightsArray, startNum, plays);
      playWeights[play] = weight;
      totalWeight += weight;
    });

    // 按权重分配金额并追踪已分配总额
    const newAmounts: Record<string, string> = {};
    let allocatedSum = 0;
    selectedPlays.forEach((play, index) => {
      const weight = playWeights[play];
      const existingAmount = parseInt(playAmounts[play] || "0", 10) || 0;
      const allocatedAmount = Math.floor((weight / totalWeight) * totalPoints);
      allocatedSum += allocatedAmount;
      newAmounts[play] = String(allocatedAmount + existingAmount);
    });

    // 如果有剩余金额，加到最后一个玩法上
    const remainder = totalPoints - allocatedSum;
    if (remainder > 0 && selectedPlays.length > 0) {
      const lastPlay = selectedPlays[selectedPlays.length - 1];
      const currentAmount = parseInt(newAmounts[lastPlay], 10);
      newAmounts[lastPlay] = String(currentAmount + remainder);
    }

    setPlayAmounts(newAmounts);
  };

  // ====================== 单个玩法金额倍数调整 ======================
  const handleAmountMultiplier = (play: string, multiplier: number) => {
    const currentAmount = parseInt(playAmounts[play] || "0", 10);
    const newAmount = Math.max(0, Math.floor(currentAmount * multiplier));
    setPlayAmounts(prev => ({ ...prev, [play]: String(newAmount) }));
  };

  // ====================== 提交投注 ======================
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
      toast.error("期号信息缺失，请稀后重试");
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

        // 立即更新本地已投注显示（在清空前）
        setMyBetAmounts((prev) => {
          const updated = { ...prev };
          selectedPlays.forEach((playName) => {
            const betAmount = parseInt(playAmounts[playName] || "0", 10) || 0;
            if (betAmount > 0) {
              updated[playName] = (updated[playName] || 0) + betAmount;
            }
          });
          return updated;
        });

        // 清空选择
        setSelectedPlays([]);
        setPlayAmounts({});
        setActiveQuick(null);
        // 刷新用户金豆
        refreshUserPoints();
      } else if (res.code !== 3001) {
        // 统一处理非200和3001的状态码
        toast.error(parseErrorMessage(res, "投注失败，请稀后重试"));
      }
    } catch (error) {
      console.error("投注失败：", error);
      toast.error(parseAxiosError(error, "投注失败，请稀后重试"));
    }
  };

  // ====================== 取消投注 ======================
  const handleCancel = () => {
    setSelectedPlays([]);
    setPlayAmounts({});
    setActiveQuick(null);
  };

  // ====================== 获取最终展示结果 ======================
  const getDisplayResult = (expectInfo: ExpectInfo | null) => {
    if (!expectInfo) return "--";
    const res = expectInfo.finalRes;

    // 根据当前选中的分组ID获取对应的开奖结果
    if (res && activeGroupIdRef.current) {
      const groupId = activeGroupIdRef.current;
      const resultKey = `finalOpenRes${groupId}` as keyof typeof res;
      const resultValue = res[resultKey];
      if (resultValue !== undefined && resultValue !== null) {
        return String(resultValue);
      }
    }

    // 回退到原始开奖号码
    return expectInfo.action_no ?? "--";
  };

  // 计算本次投注总额
  const totalBetAmount = selectedPlays.reduce((sum, p) => sum + (parseInt(playAmounts[p] || "0", 10) || 0), 0);

  return (
    <div className="bg-gray-100 dark:bg-black min-h-screen pb-32">
      {/* 快捷选择区域 - 通用部分（所有分组都显示） */}
      {activeGroup && (
        <div className="bg-white mx-3 mt-3 rounded-lg shadow p-3">
          {/* 分组特定快捷按钮（仅特定分组显示） */}
          {quickSelectGroupIds.includes(Number(activeGroup.id)) ? (
            <>
              {/* 第一行快捷按钮 */}
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

              {/* 第二行快捷按钮 */}
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

              {/* 第三行：边+特殊按钮 */}
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
            /* 通用按钮（非特定分组显示）：全包, 上期, 反选, 清空 */
            <div className="grid grid-cols-4 gap-2">
              {["全包", "上期", "反选", "清空"].map(btn => (
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
              {/* 追加尾数 - 仅特定分组显示 */}
              {quickSelectGroupIds.includes(Number(activeGroup.id)) && (
                <div className="mt-4">
                  <div className="flex items-center mb-2">
                    <span className="text-xs text-gray-500">——</span>
                    <span className="text-xs text-gray-600 mx-2">追加尾数</span>
                    <span className="text-xs text-gray-500 flex-1">——————————</span>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {tailButtons.slice(0, 6).map(btn => (
                      <button
                        key={btn}
                        onClick={() => handleQuickSelect(btn)}
                        className={cn(
                          "py-1.5 text-xs rounded border",
                          activeQuick === btn
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white text-gray-700 border-red-300"
                        )}
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-6 gap-2 mt-2">
                    {tailButtons.slice(6).map(btn => (
                      <button
                        key={btn}
                        onClick={() => handleQuickSelect(btn)}
                        className={cn(
                          "py-1.5 text-xs rounded border",
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
              )}

              {/* 追加余数 - 仅特定分组显示 */}
              {quickSelectGroupIds.includes(Number(activeGroup.id)) && (
                <div className="mt-4">
                  <div className="flex items-center mb-2">
                    <span className="text-xs text-gray-500">——</span>
                    <span className="text-xs text-gray-600 mx-2">追加余数</span>
                    <span className="text-xs text-gray-500 flex-1">——————————</span>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {mod3Buttons.map(btn => (
                      <button
                        key={btn}
                        onClick={() => handleQuickSelect(btn)}
                        className={cn(
                          "py-1.5 text-xs rounded border",
                          activeQuick === btn
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white text-gray-700 border-red-300"
                        )}
                      >
                        {btn}
                      </button>
                    ))}
                    {mod4Buttons.slice(0, 3).map(btn => (
                      <button
                        key={btn}
                        onClick={() => handleQuickSelect(btn)}
                        className={cn(
                          "py-1.5 text-xs rounded border",
                          activeQuick === btn
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white text-gray-700 border-red-300"
                        )}
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-6 gap-2 mt-2">
                    {mod4Buttons.slice(3).map(btn => (
                      <button
                        key={btn}
                        onClick={() => handleQuickSelect(btn)}
                        className={cn(
                          "py-1.5 text-xs rounded border",
                          activeQuick === btn
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white text-gray-700 border-red-300"
                        )}
                      >
                        {btn}
                      </button>
                    ))}
                    {mod5Buttons.map(btn => (
                      <button
                        key={btn}
                        onClick={() => handleQuickSelect(btn)}
                        className={cn(
                          "py-1.5 text-xs rounded border",
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
              )}

              {/* 倍数投注 - 通用（所有分组都显示） */}
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

          {/* 收起/展开按钮 - 通用 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-3 py-2 bg-orange-500 text-white rounded-lg flex items-center justify-center gap-1"
          >
            {isExpanded ? "收起" : "展开"}
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* 自定义模式和梭哈 - 通用 */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              onClick={handleModeClick}
              className="py-2 border border-gray-300 rounded-lg text-sm text-gray-600 flex items-center justify-center gap-1"
            >
              自定义模式 <ChevronDown size={14} />
            </button>
            <button
              onClick={handleAllIn}
              className="py-2 border border-gray-300 rounded-lg text-sm text-gray-600"
            >
              梭哈
            </button>
          </div>

          {/* 筹码和定额梭哈 - 通用 */}
          <div className="flex items-center gap-1.5 mt-3">
            <div className="flex gap-0.5 flex-shrink-0">
              {chipConfig.map(chip => (
                <button
                  key={chip.display}
                  onClick={() => handleChipSelect(chip.value)}
                  className="w-9 h-9 flex-shrink-0 hover:scale-110 transition-transform"
                >
                  <Image
                    src={chip.img}
                    alt={chip.display}
                    width={36}
                    height={36}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
            <input
              type="number"
              value={quickAmount}
              onChange={(e) => setQuickAmount(e.target.value)}
              className="w-20 h-8 px-2 border border-gray-300 rounded text-sm flex-shrink-0"
              placeholder="金额"
            />
            <button
              onClick={handleFixedAllIn}
              className="h-8 px-2 bg-red-600 text-white text-xs rounded flex-shrink-0 whitespace-nowrap"
            >
              定额梭哈
            </button>
          </div>
        </div>
      )}

      {/* 号码列表区域 */}
      <div className="bg-white mx-3 mt-3 mb-[50px] rounded-lg shadow">
        {/* 表头 */}
        <div className="grid grid-cols-[80px_1fr_100px_90px] text-xs text-gray-500 border-b px-3 py-2">
          <span>号码</span>
          <span className="text-center">我的已投注</span>
          <span className="text-center">投注</span>
          <span></span>
        </div>

        {/* 号码列表 */}
        {isLoadingPlays ? (
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
              const myBetAmount = myBetAmounts[playItem.name] || 0;

              return (
                <div
                  key={playItem.id}
                  className={cn(
                    "grid grid-cols-[80px_1fr_100px_90px] items-center px-3 py-2",
                    isSelected ? "bg-orange-50" : "bg-white"
                  )}
                >
                  {/* 号码球 */}
                  <div className="flex flex-col items-start">
                    <button
                      onClick={() => togglePlay(playItem)}
                      className={cn(
                        "w-8 h-8 rounded-full text-white font-bold text-sm flex items-center justify-center",
                        isSelected ? "bg-orange-500" : "bg-blue-400"
                      )}
                    >
                      {playItem.name}
                    </button>
                    <span className="text-xs text-gray-500 mt-1">{displayOdds}</span>
                  </div>

                  {/* 我的已投注 */}
                  <div className={cn(
                    "text-center text-sm",
                    myBetAmount > 0 ? "text-red-600 font-medium" : "text-gray-400"
                  )}>
                    {myBetAmount > 0 ? myBetAmount.toLocaleString() : "-"}
                  </div>

                  {/* 投注输入框 */}
                  <div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => updatePlayAmount(playItem.name, e.target.value)}
                      onFocus={() => {
                        if (!isSelected) togglePlay(playItem);
                      }}
                      className="w-full h-8 px-2 border border-gray-300 rounded text-sm text-center"
                      placeholder=""
                    />
                  </div>

                  {/* 倍数按钮 */}
                  <div className="flex gap-1 justify-end">
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
        {/* 上期开奖结果 */}
        {lastExpect && (
          <div className="flex items-center justify-between px-4 py-1.5 bg-gray-50 border-b text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">上期:</span>
              <span className="text-blue-700 font-medium">{lastExpect.expect_no || "--"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-600 font-bold">{getLastExpectResult()}</span>
            </div>
            <div className="text-gray-400 text-[10px]">
              {lastExpect.open_time || ""}
            </div>
          </div>
        )}

        {/* 投注统计 */}
        <div className="flex justify-between px-4 py-2 border-b">
          <div className="flex items-center text-sm">
            <span className="text-gray-600">已投注</span>
            <span className="text-red-600 font-bold ml-1">0</span>
            <Image
              alt="coin"
              className="inline-block w-4 h-4 ml-0.5"
              src="/ranking/coin.png"
              width={16}
              height={16}
            />
          </div>
          <div className="flex items-center text-sm">
            <span className="text-gray-600">本次投注</span>
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
        <div className="grid grid-cols-3 h-12">
          <button
            onClick={handleCancel}
            className="bg-blue-600 text-white font-bold flex items-center justify-center gap-1"
          >
            <span className="text-lg">&lt;</span> 取消
          </button>
          <button className="bg-white text-gray-700 font-bold flex flex-col items-center justify-center border-x">
            {remainingClose > 0 ? (
              <>
                <span className="text-xs text-gray-500">截止投注</span>
                <span className="text-red-600 font-bold">{formatTime(remainingClose)}</span>
              </>
            ) : (
              <>
                <span className="text-xs text-gray-500">开奖倒计时</span>
                <span className="text-orange-600 font-bold">{formatTime(remainingOpen)}</span>
              </>
            )}
          </button>
          <button
            onClick={handleSubmit}
            disabled={statusCode === 3001 || totalBetAmount <= 0}
            className={cn(
              "font-bold flex items-center justify-center gap-1",
              statusCode === 3001 || totalBetAmount <= 0
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-red-600 text-white"
            )}
          >
            <span className="text-lg">✓</span> 投注
          </button>
        </div>
      </div>

      {/* 自定义模式选择 Dialog */}
      <Dialog open={showModeSelector} onOpenChange={setShowModeSelector}>
        <DialogContent className="max-w-sm p-0 flex flex-col max-h-[70vh]">
          <DialogHeader className="p-3 border-b">
            <DialogTitle>选择投注模式</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {isLoadingModes ? (
              <div className="flex justify-center items-center py-8">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
                <span className="ml-2 text-gray-600">加载中...</span>
              </div>
            ) : modes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>暂无模式</p>
                <p className="text-sm mt-2">请先在"模式"页面创建投注模式</p>
              </div>
            ) : (
              <div className="divide-y">
                {modes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => handleApplyMode(mode)}
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-gray-50 flex justify-between items-center",
                      selectedMode?.id === mode.id && "bg-orange-50"
                    )}
                  >
                    <span className="font-medium text-gray-800">{mode.mode_name}</span>
                    <span className="font-bold text-red-600">{mode.bet_gold}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 最近开奖记录 Dialog */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-sm p-0 flex flex-col max-h-[70vh]">
          <DialogHeader className="p-3 border-b">
            <DialogTitle>最近开奖记录</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {isLoadingHistory ? (
              <div className="flex justify-center items-center py-8">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <span className="ml-2 text-gray-600">加载中...</span>
              </div>
            ) : historyRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无开奖记录
              </div>
            ) : (
              <div className="divide-y">
                {historyRecords.map((item, index) => (
                  <div key={`${item.expect_no}-${index}`} className="px-4 py-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-blue-700">
                        第{item.expect_no || "--"}期
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.open_time || "--"}
                      </span>
                    </div>
                    <div className="text-sm text-gray-800">
                      <span className="text-gray-500">开奖结果：</span>
                      <span className="font-medium text-red-600">
                        {getHistoryResult(item)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowHistoryModal(false)}
            >
              关闭
            </Button>
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
