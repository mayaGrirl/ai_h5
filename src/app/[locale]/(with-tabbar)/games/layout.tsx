"use client";

import React, { Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GameProvider, useGameContext } from "./_context";
import { GameHeader } from "./_components";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Tab配置项 */
interface TabItem {
  name: string;
  path: string;
  needGroupId?: boolean;
}

/** 默认的Tab配置 */
const DEFAULT_TABS: TabItem[] = [
  { name: "投注", path: "/games/play", needGroupId: false },
  { name: "开奖记录", path: "/games/open", needGroupId: false },
  { name: "投注记录", path: "/games/record", needGroupId: false },
  { name: "模式", path: "/games/mode", needGroupId: false },
  { name: "自动", path: "/games/auto", needGroupId: false },
  { name: "走势", path: "/games/trend", needGroupId: false },
  { name: "盈亏", path: "/games/stat", needGroupId: false },
];

/**
 * 内部布局组件 - 使用 GameContext
 */
function GamesLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    gameName,
    allGames,
    activeGame,
    showGameSelector,
    setShowGameSelector,
    isLoadingGames,
    handleGameSwitch,
    selectedGroupId,
    soundEnabled,
    setSoundEnabled,
  } = useGameContext();

  // 判断是否是游戏大厅页面（games根路径）
  const isGamesRoot = () => {
    // 移除 locale 前缀，如 /zh/games -> /games
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, "");
    return pathWithoutLocale === "/games" || pathWithoutLocale === "/games/";
  };

  // 如果是游戏大厅页面，直接渲染 children，不显示共享的 header 和 tabs
  if (isGamesRoot()) {
    return <>{children}</>;
  }

  // 从路径名确定当前Tab
  const getActiveTab = () => {
    // 移除 locale 前缀，如 /zh/games/play -> /games/play
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, "");

    for (const tab of DEFAULT_TABS) {
      if (pathWithoutLocale.startsWith(tab.path)) {
        return tab.name;
      }
    }
    return "投注"; // 默认
  };

  const activeTab = getActiveTab();

  // 处理Tab点击 - 使用 Next.js router 进行导航
  const handleTabClick = (tab: TabItem) => {
    if (tab.name === activeTab || !activeGame) return;

    let url = `${tab.path}?lottery_id=${activeGame.id}`;
    if (tab.needGroupId && selectedGroupId) {
      url += `&group_id=${selectedGroupId}`;
    }

    // 使用 Next.js router 进行导航，正确触发页面刷新
    router.push(url);
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
    <div className="min-h-screen bg-gray-100 dark:bg-black flex flex-col">
      {/* 固定头部 */}
      <GameHeader
        gameName={gameName}
        onGameChange={() => setShowGameSelector(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* 固定Tab导航 */}
      <div className="bg-white border-b">
        <div className="flex overflow-x-auto no-scrollbar">
          {DEFAULT_TABS.map((tab) => (
            <button
              key={tab.name}
              onClick={() => handleTabClick(tab)}
              className={cn(
                "px-4 py-2 text-xs whitespace-nowrap",
                activeTab === tab.name
                  ? "text-red-600 border-b-2 border-red-600 font-bold"
                  : "text-gray-700"
              )}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* 子页面内容区域 - 使用 key 强制在路径变化时重新挂载 */}
      <div className="flex-1" key={pathname}>
        {children}
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
    </div>
  );
}

/**
 * Games Layout - 包装所有 games 子页面
 * 提供共享的头部、Tab导航和游戏状态
 */
export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen justify-center items-center bg-zinc-50 dark:bg-black">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
            <p className="mt-3 text-gray-600 dark:text-gray-400">加载中...</p>
          </div>
        </div>
      }
    >
      <GameProvider>
        <GamesLayoutInner>{children}</GamesLayoutInner>
      </GameProvider>
    </Suspense>
  );
}
