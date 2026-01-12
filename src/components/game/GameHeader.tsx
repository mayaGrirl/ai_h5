"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, BellOff } from "lucide-react";
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
}

/**
 * 游戏页面通用头部组件
 * - 左侧：返回按钮
 * - 中间：游戏名称（可点击切换彩种）
 * - 右侧：用户积分/金豆
 */
export default function GameHeader({
  gameName,
  onGameChange,
  showDropdown = true,
  customTitle,
  soundEnabled = false,
  onToggleSound,
}: GameHeaderProps) {
  const _t = useTranslations();
  const router = useRouter();
  const format = useFormatter();
  const currentCustomer = useAuthStore((s) => s.currentCustomer);

  const displayTitle = customTitle || gameName;

  return (
    <div className="bg-red-600 text-white px-4 py-3 flex items-center h-11 justify-between">
      {/* 左：返回按钮 */}
      <button className="absolute left-2 flex items-center gap-1 text-white hover:bg-white/10 cursor-pointer" onClick={() => router.back()}>
        {/*<ChevronLeft size={24} />*/}
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm">{_t("common.header.back")}</span>
      </button>

      {/* 中：游戏名称 */}
      <h1
        className={`text-lg font-bold mx-auto font-medium ${
          onGameChange && showDropdown
            ? "cursor-pointer hover:opacity-80 transition-opacity"
            : ""
        }`}
        onClick={onGameChange && showDropdown ? onGameChange : undefined}
      >
        {displayTitle}
        {showDropdown && !customTitle && " ▼"}
      </h1>

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
