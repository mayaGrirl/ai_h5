"use client";

import React from "react";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { useLocale } from "next-intl";
import { useGameContext } from "../_context";

export default function RulesPage() {
  useRequireLogin();
  const locale = useLocale();

  // 从 Context 获取共享的游戏状态
  const { playGroups, selectedGroupId } = useGameContext();

  // 获取当前选中的分组
  const currentGroup = playGroups.find((g) => g.id === selectedGroupId);

  // 获取规则内容：优先 lang_info，其次 info
  const getRuleContent = (): string => {
    if (!currentGroup) return "";

    // 优先使用 lang_info 对应当前语言
    if (currentGroup.lang_info && typeof currentGroup.lang_info === "object") {
      const langContent = currentGroup.lang_info[locale];
      if (langContent) return langContent;

      // 如果当前语言没有，尝试获取中文或英文
      if (currentGroup.lang_info["zh"] || currentGroup.lang_info["zh-CN"]) {
        return currentGroup.lang_info["zh"] || currentGroup.lang_info["zh-CN"] || "";
      }
      if (currentGroup.lang_info["en"] || currentGroup.lang_info["en-US"]) {
        return currentGroup.lang_info["en"] || currentGroup.lang_info["en-US"] || "";
      }
    }

    // 回退到 info
    return currentGroup.info || "";
  };

  const ruleContent = getRuleContent();

  return (
    <div className="bg-gray-100 dark:bg-black pb-16 min-h-screen">
      <div className="bg-white mx-3 my-3 rounded-lg shadow p-4">
        {currentGroup ? (
          <>
            <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
              {typeof currentGroup.lang_name === "object" && currentGroup.lang_name?.[locale]
                ? currentGroup.lang_name[locale]
                : currentGroup.name}
              <span className="text-sm font-normal text-gray-500 ml-2">游戏规则</span>
            </h2>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {ruleContent || (
                <div className="text-center text-gray-400 py-8">暂无游戏规则</div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">请选择游戏分组</div>
        )}
      </div>
    </div>
  );
}
