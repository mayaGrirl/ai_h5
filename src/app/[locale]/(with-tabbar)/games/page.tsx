"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { toast } from "sonner";
import { parseErrorMessage, parseAxiosError } from "@/lib/utils";

import { gameAll, playAll } from "@/api/game";

import {
  Game,
  GamePlayGroup,
  GamePlay,
  GameTypeMapItem,
} from "@/types/game.type";
import {PageHeader} from "@/components/page-header";
import {useTranslations} from "use-intl";

// 游戏系列数据结构
interface GameSeries {
  id: number;
  name: string;
  games: Game[];
}

// 玩法分组数据结构
interface PlayMethodGroup {
  id: number;
  name: string;
  plays: GamePlay[];
}

export default function Games() {
  useRequireLogin();
  const _t = useTranslations();

  const searchParams = useSearchParams();
  const urlLotteryId = searchParams.get("lottery_id") || ""; // <-- URL 传入的 lottery_id

  const [gameSeries, setGameSeries] = useState<GameSeries[]>([]);
  const [activeSeries, setActiveSeries] = useState<GameSeries | null>(null);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [playMethodGroups, setPlayMethodGroups] = useState<PlayMethodGroup[]>([]);

  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [isLoadingPlays, setIsLoadingPlays] = useState(false);

  // 防止重复请求
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // 防止 React StrictMode 下重复请求
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

        const series: GameSeries[] = (Array.isArray(gameTypeMap) ? gameTypeMap : [])
          .filter((item: GameTypeMapItem) => {
            return item.children && Array.isArray(item.children) && item.children.length > 0;
          })
          .map((item: GameTypeMapItem) => {
            const games = item.children
              .filter((game: Game) => game.is_show === undefined || game.is_show === 1)
              .map((game: Game): Game => ({
                id: game.id,
                name: game.name,
                logo: game.logo,
                lang_name: game.lang_name,
                game_class: game.game_class,
                is_hot: game.is_hot,
                is_show: game.is_show,
                info: game.info,
                lang_info: game.lang_info,
              }));

            return {
              id: item.id,
              name: item.title,
              games,
            };
          })
          .filter((s) => s.games.length > 0);

        setGameSeries(series);

        // ----------------------------------------
        // ⭐【新增核心逻辑】支持 URL 默认选中 lottery_id
        // ----------------------------------------
        let defaultSeries: GameSeries | null = null;
        let defaultGame: Game | null = null;

        if (urlLotteryId) {
          for (const seriesItem of series) {
            const findGame = seriesItem.games.find(
              (g) => String(g.id) === String(urlLotteryId)
            );
            if (findGame) {
              defaultSeries = seriesItem;
              defaultGame = findGame;
              break;
            }
          }
        }

        // 若 URL 没传 lottery_id 或找不到，默认第一个
        if (!defaultSeries) defaultSeries = series[0];
        if (!defaultGame) defaultGame = defaultSeries.games[0];

        setActiveSeries(defaultSeries);
        setActiveGame(defaultGame);

        // 拉取玩法
        fetchPlayAll(defaultGame.id);
      } else {
        toast.error(parseErrorMessage(res, "获取游戏列表失败"));
      }
    } catch (error) {
      toast.error(parseAxiosError(error, "获取游戏列表失败，请稍后重试"));
    } finally {
      setIsLoadingGames(false);
    }
  };

  const fetchPlayAll = async (lotteryId: number) => {
    try {
      setIsLoadingPlays(true);
      const res = await playAll({ lottery_id: lotteryId });

      if (res.code === 200 && res.data) {
        const { groupArr = [] } = res.data;

        const groups: PlayMethodGroup[] = groupArr
          .filter((group: GamePlayGroup) => group.status === 1)
          .map((group: GamePlayGroup): PlayMethodGroup => ({
            id: group.id,
            name: group.name,
            plays: [],
          }));

        setPlayMethodGroups(groups);
      } else {
        toast.error(parseErrorMessage(res, "获取玩法分组失败"));
        setPlayMethodGroups([]);
      }
    } catch (error) {
      toast.error(parseAxiosError(error, "获取玩法分组失败，请稍后重试"));
      setPlayMethodGroups([]);
    } finally {
      setIsLoadingPlays(false);
    }
  };

  const handleSeriesChange = (series: GameSeries) => {
    setActiveSeries(series);
    if (series.games.length > 0) {
      const game = series.games[0];
      setActiveGame(game);
      fetchPlayAll(game.id);
    }
  };

  const handleGameChange = (game: Game) => {
    setActiveGame(game);
    fetchPlayAll(game.id);
  };

  if (isLoadingGames) {
    return (
      <div className="flex min-h-screen justify-center items-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
          <p className="mt-3 text-gray-600 dark:text-gray-400">加载游戏列表中...</p>
        </div>
      </div>
    );
  }

  if (!activeSeries || !activeGame) {
    return (
      <div className="flex min-h-screen justify-center items-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">暂无游戏数据</p>
          <button onClick={fetchGameAll} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg">
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-3xl bg-white dark:bg-black">

        {/* 头部 */}
        <PageHeader title={_t("游戏大厅")}/>

        {/*<div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-sm flex justify-between items-center">
          <span>📷 即将抽出红包幸运儿</span>
          <button className="text-red-600">点击查看</button>
        </div>*/}

        {/* 系列横向 */}
        <div className="w-full overflow-x-auto whitespace-nowrap border-b py-3 px-4 bg-red-50">
          <div className="flex gap-4">
            {gameSeries.map((series) => (
              <button
                key={series.id}
                onClick={() => handleSeriesChange(series)}
                className={`px-4 py-2 rounded-full text-sm ${
                  activeSeries.id === series.id
                    ? "bg-red-600 text-white"
                    : "bg-white text-red-600 border border-red-600"
                }`}
              >
                {series.name}
              </button>
            ))}
          </div>
        </div>

        {/* 左边彩种 + 右边玩法分组 */}
        <div className="flex">

          {/* 左侧彩种 */}
          <div className="w-28 border-r p-3 flex flex-col gap-3 bg-gray-50 min-h-[70vh]">
            {activeSeries.games.map((game) => (
              <button
                key={game.id}
                onClick={() => handleGameChange(game)}
                className={`text-sm p-2 rounded ${
                  activeGame.id === game.id
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {game.name}
              </button>
            ))}
          </div>

          {/* 玩法分组 */}
          <div className="flex-1 p-4">
            <h2 className="text-lg font-bold mb-3">
              {activeGame.name}
            </h2>

            {isLoadingPlays ? (
              <div className="flex justify-center items-center py-8">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                <span className="ml-2 text-gray-600">加载玩法分组中...</span>
              </div>
            ) : playMethodGroups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无玩法分组数据
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {playMethodGroups.map((group) => (
                  <a
                    key={group.id}
                    href={`/games/play?lottery_id=${activeGame.id}&group_id=${group.id}`}
                    className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg
                               text-center text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <div className="font-medium">{group.name}</div>
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
