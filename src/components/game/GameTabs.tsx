"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/** Tab配置项 */
interface TabItem {
  /** Tab名称 */
  name: string;
  /** 路由路径 */
  path: string;
  /** 是否需要传递 group_id */
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
  { name: "规则", path: "/games/rules", needGroupId: false },
];

interface GameTabsProps {
  /** 当前激活的Tab名称 */
  activeTab: string;
  /** 当前彩种ID */
  lotteryId: string;
  /** 当前分组ID（可选） */
  groupId?: string;
  /** 自定义Tab配置（可选，默认使用DEFAULT_TABS） */
  tabs?: TabItem[];
  /** 点击当前Tab的回调（可选） */
  onCurrentTabClick?: () => void;
}

/**
 * 游戏页面通用Tab导航组件
 * - 支持横向滚动
 * - 选中状态：红色文字 + 红色下边框
 * - 点击跳转到对应页面
 */
export default function GameTabs({
  activeTab,
  lotteryId,
  groupId,
  tabs = DEFAULT_TABS,
  onCurrentTabClick,
}: GameTabsProps) {
  const router = useRouter();

  const handleTabClick = (tab: TabItem) => {
    // 如果点击的是当前Tab，执行回调（如果有）
    if (tab.name === activeTab) {
      onCurrentTabClick?.();
      return;
    }

    // 构建URL参数
    let url = `${tab.path}?lottery_id=${lotteryId}`;
    if (tab.needGroupId && groupId) {
      url += `&group_id=${groupId}`;
    }
    // 添加时间戳确保刷新
    url += `&t=${new globalThis.Date().getTime()}`;

    router.push(url);
  };

  return (
    <div className="bg-white border-b">
      <div className="flex overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
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
  );
}
