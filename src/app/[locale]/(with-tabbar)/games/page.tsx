"use client";

import React, { useState, useEffect } from "react";
import { useRequireLogin } from "@/hooks/useRequireLogin";

// 系列数据
const GAME_SERIES = [
  {
    id: "lucky",
    name: "幸运系列",
    games: [
      { id: "lucky28", name: "幸运28" },
      { id: "lucky16", name: "幸运16" },
      { id: "lucky11", name: "幸运11" },
      { id: "lucky36", name: "幸运36" },
      { id: "lucky10", name: "幸运10" },
      { id: "lucky22", name: "幸运22" },
      { id: "lucky_gp", name: "幸运冠亚军" },
    ],
  },
  {
    id: "ca",
    name: "加拿大系列",
    games: [
      { id: "ca28", name: "加拿大28" },
      { id: "ca16", name: "加拿大16" },
      { id: "ca11", name: "加拿大11" },
      { id: "ca10", name: "加拿大10" },
      { id: "ca36", name: "加拿大36" },
    ],
  },
  {
    id: "us",
    name: "美国系列",
    games: [
      { id: "us28", name: "美国28" },
      { id: "us16", name: "美国16" },
      { id: "us11", name: "美国11" },
      { id: "us36", name: "美国36" },
    ],
  },
  {
    id: "ko",
    name: "韩国系列",
    games: [
      { id: "us28", name: "美国28" },
      { id: "us16", name: "美国16" },
      { id: "us11", name: "美国11" },
      { id: "us36", name: "美国36" },
    ],
  },

  {
    id: "bingo",
    name: "宾果系列",
    games: [
      { id: "us28", name: "美国28" },
      { id: "us16", name: "美国16" },
      { id: "us11", name: "美国11" },
      { id: "us36", name: "美国36" },
    ],
  },

  {
    id: "egg",
    name: "蛋蛋系列",
    games: [
      { id: "us28", name: "美国28" },
      { id: "us16", name: "美国16" },
      { id: "us11", name: "美国11" },
      { id: "us36", name: "美国36" },
    ],
  },
];

// 彩种玩法
const PLAY_METHODS = {
  lucky28: ["总和玩法", "形态玩法", "大小单双", "混合玩法"],
  lucky16: ["大小玩法", "单双玩法"],
  ca28: ["总和玩法", "加拿大形态"],
  us28: ["总和玩法"],
};

export default function Games() {
  useRequireLogin();

  const [activeSeries, setActiveSeries] = useState(GAME_SERIES[0]);
  const [activeGame, setActiveGame] = useState(activeSeries.games[0]);
  const [playMethods, setPlayMethods] = useState<string[]>([]);

  useEffect(() => {
    const firstGame = activeSeries.games[0];
    setActiveGame(firstGame);
    setPlayMethods(PLAY_METHODS[firstGame.id] || []);
  }, [activeSeries]);

  const handleGameChange = (game: any) => {
    setActiveGame(game);
    setPlayMethods(PLAY_METHODS[game.id] || []);
  };

  return (
    <div className="flex min-h-screen justify-center bg-zinc-50 dark:bg-black">
      <main className="w-full max-w-3xl bg-white dark:bg-black">

        {/* ============= 顶部红色游戏大厅 ============= */}
        <div className="relative bg-red-600 text-white py-5 flex items-center justify-center">
          <span className="absolute left-4 text-lg font-bold">🔔</span>
          <h1 className="text-xl font-bold text-center">游戏大厅</h1>
          <span className="absolute right-4 text-lg font-bold">11,855,200🔥</span>
        </div>

        {/* 红包提示 */}
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-sm flex justify-between items-center">
          <span>📷 即将抽出红包幸运儿</span>
          <button className="text-red-600">点击查看</button>
        </div>

        {/* 横向系列分类 */}
        <div className="w-full overflow-x-auto whitespace-nowrap border-b py-3 px-4 bg-red-50">
          <div className="flex gap-4">
            {GAME_SERIES.map((series) => (
              <button
                key={series.id}
                onClick={() => setActiveSeries(series)}
                className={`px-4 py-2 rounded-full text-sm
                  ${activeSeries.id === series.id
                  ? "bg-red-600 text-white"
                  : "bg-white text-red-600 border border-red-600"
                }
                `}
              >
                {series.name}
              </button>
            ))}
          </div>
        </div>

        {/* 左侧彩种 + 右侧玩法 */}
        <div className="flex">

          {/* 左侧彩种列表 */}
          <div className="w-28 border-r p-3 flex flex-col gap-3 bg-gray-50 min-h-[70vh]">
            {activeSeries.games.map((game) => (
              <button
                key={game.id}
                onClick={() => handleGameChange(game)}
                className={`text-sm p-2 rounded
                  ${activeGame.id === game.id
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-600"
                }
                `}
              >
                {game.name}
              </button>
            ))}
          </div>

          {/* 右侧玩法列表 */}
          <div className="flex-1 p-4">
            <h2 className="text-lg font-bold mb-3">
              {activeGame.name} - 玩法列表
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {playMethods.map((method) => (
                <a
                  key={method}
                  href={`/games/${activeGame.id}/${method.replace(/[\s]/g, "").toLowerCase()}`}
                  className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg
                             text-center text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  {method}
                </a>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
