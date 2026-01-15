"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, BellOff, ChevronDown } from "lucide-react";
import Image from "next/image";
import {useFormatter, useTranslations} from "use-intl";
import { useAuthStore } from "@/utils/storage/auth";

interface GameHeaderProps {
  /** 游戏名称 */
  gameName: string;
  /** 点击游戏名称切换彩种 */
  onGameChange?: () => void;
  /** 是否显示下拉箭头（可切换彩种） */
  showDropdown?: boolean;
  /** 自定义标题（用于不需要切换的页面如模式编辑） */
  customTitle?: string;
  /** 开奖提示音是否开启 */
  soundEnabled?: boolean;
  /** 切换提示音开关 */
  onToggleSound?: () => void;
  /** 当前分组名称 */
  groupName?: string;
  /** 点击分组切换 */
  onGroupChange?: () => void;
}

/**
 * 游戏页面通用头部组件
 * - 左侧：返回按钮
 * - 中间：游戏名称 | 分组名称（可点击切换）
 * - 右侧：用户积分/金豆
 */
export default function GameHeader({
  gameName,
  onGameChange,
  showDropdown = true,
  customTitle,
  soundEnabled = false,
  onToggleSound,
  groupName,
  onGroupChange,
}: GameHeaderProps) {
  const _t = useTranslations();
  const router = useRouter();
  const format = useFormatter();
  const currentCustomer = useAuthStore((s) => s.currentCustomer);

  const displayTitle = customTitle || gameName;

  return (
    <div className="bg-red-600 text-white px-4 py-3 flex items-center h-11 justify-between">
      {/* 左：返回按钮 */}
      <button className="absolute left-2 p-1 text-white hover:bg-white/10 rounded-full cursor-pointer" onClick={() => router.back()}>
        <ArrowLeft className="h-5 w-5" />
      </button>

      {/* 中：游戏名称 | 分组名称 */}
      <div className="flex items-center gap-1 mx-auto">
        {/* 彩种选择 */}
        <button
          className={`flex items-center gap-0.5 text-base font-bold ${
            onGameChange && showDropdown && !customTitle
              ? "cursor-pointer hover:opacity-80 transition-opacity"
              : ""
          }`}
          onClick={onGameChange && showDropdown && !customTitle ? onGameChange : undefined}
        >
          <span>{displayTitle}</span>
          {showDropdown && !customTitle && <ChevronDown size={14} />}
        </button>

        {/* 分隔符 + 分组选择（仅在有分组时显示） */}
        {groupName && onGroupChange && !customTitle && (
          <>
            <span className="text-white/60 mx-1">|</span>
            <button
              className="flex items-center gap-0.5 text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity"
              onClick={onGroupChange}
            >
              <span>{groupName}</span>
              <ChevronDown size={12} />
            </button>
          </>
        )}
      </div>

      {/* 右：铃铛 + 用户积分/金豆 */}
      <div className="flex items-center gap-3">
        {/* 开奖提示音铃铛 */}
        {onToggleSound && (
          <button
            onClick={onToggleSound}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
            title={soundEnabled ? "关闭开奖提示音" : "开启开奖提示音"}
          >
            {soundEnabled ? (
              <Bell size={18} className="text-yellow-300" />
            ) : (
              <BellOff size={18} className="text-white/60" />
            )}
          </button>
        )}

        {/* 用户积分/金豆 */}
        <div
          className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => router.push("/mine/receipt-text?tab=points")}
        >
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
    </div>
  );
}
