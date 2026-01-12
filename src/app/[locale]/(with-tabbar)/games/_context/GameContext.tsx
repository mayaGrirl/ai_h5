"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { parseErrorMessage, parseAxiosError } from "@/lib/utils";
import { gameAll, playAll } from "@/api/game";
import {
  Game,
  GameTypeMapItem,
  GamePlayGroup,
} from "@/types/game.type";

interface GameContextType {
  // 游戏相关状态
  gameName: string;
  allGames: Game[];
  activeGame: Game | null;
  showGameSelector: boolean;
  setShowGameSelector: (show: boolean) => void;
  isLoadingGames: boolean;

  // 玩法分组
  playGroups: GamePlayGroup[];
  selectedGroupId: number;
  setSelectedGroupId: (id: number) => void;

  // 切换游戏
  handleGameSwitch: (game: Game) => void;

  // 获取玩法分组
  fetchPlayGroups: (lotteryId: number) => Promise<GamePlayGroup[]>;

  // URL 参数
  urlLotteryId: string;
  urlGroupId: string;

  // 开奖提示音
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function useGameContext() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
}

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const urlLotteryId = searchParams.get("lottery_id") || "";
  const urlGroupId = searchParams.get("group_id") || "";

  const [gameName, setGameName] = useState("加载中...");
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [showGameSelector, setShowGameSelector] = useState(false);
  const [isLoadingGames, setIsLoadingGames] = useState(true);

  // 玩法分组
  const [playGroups, setPlayGroups] = useState<GamePlayGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);

  // 开奖提示音 - 从 localStorage 读取初始值
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(false);

  // 初始化时从 localStorage 读取铃声设置
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("game_sound_enabled");
      setSoundEnabledState(saved === "true");
    }
  }, []);

  // 设置铃声开关并保存到 localStorage
  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem("game_sound_enabled", enabled ? "true" : "false");
    }
  };

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
        (Array.isArray(gameTypeMap) ? gameTypeMap : []).forEach(
          (typeItem: GameTypeMapItem) => {
            if (typeItem.children && Array.isArray(typeItem.children)) {
              typeItem.children.forEach((game: Game) => {
                if (game.is_show === undefined || game.is_show === 1) {
                  games.push(game);
                }
              });
            }
          }
        );
        setAllGames(games);

        // 找到URL指定的游戏或默认第一个
        let defaultGame: Game | null = null;
        if (urlLotteryId) {
          defaultGame =
            games.find((g) => String(g.id) === String(urlLotteryId)) || null;
        }
        if (!defaultGame && games.length > 0) {
          defaultGame = games[0];
        }

        if (defaultGame) {
          setActiveGame(defaultGame);
          setGameName(defaultGame.name);
          // 获取玩法分组
          const groups = await fetchPlayGroups(defaultGame.id);
          // 如果 URL 中有 group_id，使用它；否则用第一个分组
          const defaultGroupId = urlGroupId
            ? Number(urlGroupId)
            : groups.length > 0
            ? groups[0].id
            : 0;
          setSelectedGroupId(defaultGroupId);
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

  // 切换彩种
  const handleGameSwitch = async (game: Game) => {
    setShowGameSelector(false);
    setActiveGame(game);
    setGameName(game.name);
    // 获取新彩种的玩法分组，并默认选择第一个
    const groups = await fetchPlayGroups(game.id);
    const defaultGroupId = groups.length > 0 ? groups[0].id : 0;
    setSelectedGroupId(defaultGroupId);

    // 更新 URL 以触发子页面刷新
    // 检查是否在子页面（非游戏大厅）
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, "");
    const isGamesRoot = pathWithoutLocale === "/games" || pathWithoutLocale === "/games/";

    // 只有在子页面才更新 URL
    if (!isGamesRoot) {
      // 使用完整路径（包含locale）更新URL
      const newUrl = `${pathname}?lottery_id=${game.id}&group_id=${defaultGroupId}`;
      router.push(newUrl);
    }
  };

  const value: GameContextType = {
    gameName,
    allGames,
    activeGame,
    showGameSelector,
    setShowGameSelector,
    isLoadingGames,
    playGroups,
    selectedGroupId,
    setSelectedGroupId,
    handleGameSwitch,
    fetchPlayGroups,
    urlLotteryId,
    urlGroupId,
    soundEnabled,
    setSoundEnabled,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
