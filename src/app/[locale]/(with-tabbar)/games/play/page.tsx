"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, Bell, Video, RefreshCcw, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn, parseErrorMessage, parseAxiosError } from "@/lib/utils";
import { playAll, betGame, fetchExpectInfo as fetchExpectInfoAPI, gameAll } from "@/api/game";
import { toast } from "sonner";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {
  ExpectInfo,
  GamePlay,
  GamePlayMapItem,
  Game,
  GameTypeMapItem
} from "@/types/game.type";

interface PlayItem {
  id: number;
  name: string;
  odds: number;  // 赔率，显示时要除以1000
}

interface PlayGroup {
  id: string | number;
  name: string;
  plays: PlayItem[];
}

export default function BetPage() {
  useRequireLogin();
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

  const quickSelect = ["大", "小", "单", "双", "极大", "极小"];

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

  const [currExpect, setCurrExpect] = useState<ExpectInfo | null>(null);
  const [lastExpect, setLastExpect] = useState<ExpectInfo | null>(null);
  const [remainingOpen, setRemainingOpen] = useState(0);
  const [remainingClose, setRemainingClose] = useState(0);
  const [statusCode, setStatusCode] = useState<number>(200);
  const [previousExpectNo, setPreviousExpectNo] = useState<string>("");

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

        // 检查是否获取到新期号
        if (newExpectNo && newExpectNo !== previousExpectNo) {
          setPreviousExpectNo(newExpectNo);
        }

        setCurrExpect(res.data.currExpectInfo || null);
        setLastExpect(res.data.lastExpectInfo || null);
        setRemainingOpen(res.data.currExpectInfo?.open_countdown || 0);
        setRemainingClose(res.data.currExpectInfo?.close_countdown || 0);

        // 成功获取数据，重置停止标志
        shouldStopFetchingRef.current = false;
      } else if (res.code === 3001) {
        // 封盘状态，不停止请求
        toast.error(parseErrorMessage(res, res.message || "封盘中..."));
        shouldStopFetchingRef.current = true;
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
    setPreviousExpectNo("");

    fetchGameName();
    fetchPlayMethods();
    fetchExpectInfo();

    const timer = setInterval(() => {
      setRemainingOpen((prev) => {
        if (prev <= 1) {
          // 当前期倒计时结束自动刷新下一期，但需要检查是否应该停止请求
          if (!shouldStopFetchingRef.current) {
            fetchExpectInfo();
          }
          return 0;
        }
        return prev - 1;
      });
      setRemainingClose((prev) => (prev > 0 ? prev - 1 : 0));
    }, 3000);

    return () => clearInterval(timer);
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

  // ====================== 快速选择 ======================
  const handleQuickSelect = (type: string) => {
    if (!activeGroup) return;
    // 只对包含数字的玩法分组启用快速选择
    const firstPlay = activeGroup.plays[0];
    if (!firstPlay || isNaN(parseInt(firstPlay.name))) return;

    const newSelected: string[] = [];
    activeGroup.plays.forEach((playItem) => {
      const num = parseInt(playItem.name, 10);
      if (isNaN(num)) return;
      switch (type) {
        case "大": if (num > 14) newSelected.push(playItem.name); break;
        case "小": if (num <= 14) newSelected.push(playItem.name); break;
        case "单": if (num % 2 === 1) newSelected.push(playItem.name); break;
        case "双": if (num % 2 === 0) newSelected.push(playItem.name); break;
        case "极大": if (num >= 22) newSelected.push(playItem.name); break;
        case "极小": if (num <= 7) newSelected.push(playItem.name); break;
      }
    });
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
    const lottery_played_id = selectedPlays.map((p, idx) => `${idx + 1}`).join(",");
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
        <div className="flex space-x-3 items-center"><Bell /><Video /><span className="font-bold text-sm">11,855,200🔥</span></div>
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
                <div><span className="font-bold">封盘截止：</span>{formatTime(remainingClose)}</div>
                <div><span className="font-bold">开奖截止：</span>{formatTime(remainingOpen)}</div>

                {/* 状态提示 - 按优先级显示 */}
                {statusCode === 3001 ? (
                  <div className="text-red-600 font-bold">封盘中...</div>
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

          {/* 快速选择 */}
          {activeGroup && activeGroup.plays.length > 0 && !isNaN(parseInt(activeGroup.plays[0].name)) && (
            <div className="px-3 mb-2">
              <div className="flex flex-wrap gap-2">
                {quickSelect.map((btn) => {
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
                onClick={() => setShowBatchModal(true)}
                className="w-full bg-red-600 text-white py-2 rounded-lg font-bold text-sm"
              >
                立即下注（已选 {selectedPlays.length} 项）
              </button>
            </div>
          )}
        </>
      )}

      {/* 批量下注 Dialog */}
      <Dialog open={showBatchModal} onOpenChange={setShowBatchModal}>
        <DialogContent className="max-w-sm p-0 flex flex-col h-[55vh] md:h-[50vh] transition-all duration-300 ease-in-out">
          <DialogHeader className="p-3"><DialogTitle>批量下注</DialogTitle></DialogHeader>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 space-y-3 scroll-smooth">
            {selectedPlays.map((play, idx) => (
              <div key={play} className="flex justify-between items-center border p-2 rounded-lg">
                <span className="font-bold text-gray-800 text-sm w-1/2 text-center">{play}</span>
                <input
                  type="number"
                  className="h-10 w-20 rounded-md border px-2 text-center text-sm"
                  placeholder="金额"
                  value={playAmounts[play] || ""}
                  onChange={(e) => updatePlayAmount(play, e.target.value)}
                  onFocus={() => handleInputFocus(idx)}
                />
              </div>
            ))}

            <div className="flex justify-between mt-2 pb-3">
              <Button variant="secondary" onClick={() => setShowBatchModal(false)}>取消</Button>
              <Button className="bg-red-600 text-white" onClick={handleSubmit}>确认提交</Button>
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
