"use client";

import * as React from 'react'
import Link from "next/link";
import Image from "next/image";
import {useParams, useSearchParams, redirect} from "next/navigation";
import {useTranslations} from "use-intl";
import Today from "./today/page";
import Yesterday from "./yesterday/page";
import Activity from "./activity/page";
import LastWeek from "./last-week/page";

export default function Ranking() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;

  const current = searchParams.get("tab");

  // 默认跳转到 /today
  if (!current) {
    redirect(`/${locale}/ranking?tab=today`);
  }

  const _t = useTranslations();

  // ------------- Tabs 定义 ----------------
  const tabs = [
    {key: "today", name: "今日榜"},
    {key: "yesterday", name: "昨日榜"},
    {key: "activity", name: "活动榜"},
    {key: "last-week", name: "上周榜"}
  ];

  return (
    <div className="flex min-h-screen justify-center bg-[#eef3f8]">
      {/* 中间内容区域，控制最大宽度模拟手机界面 */}
      <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
        {/* 顶部 LOGO 区域 */}
        <header className="h-16 bg-[#ff3a00] flex items-center justify-center">
          {/* 你可以用 Image 换成真实 logo */}
          <Image src="/ranking/header.png" alt="logo" width={140} height={40}/>
        </header>

        {/* 内容滚动区，底部预留给 TabBar */}
        <main className="">
          <div className="grid grid-cols-4 text-center text-sm bg-white">
            {tabs.map((item) => {
              const active = item.key === current;
              return (
                <Link
                  key={item.key}
                  href={`/${locale}/ranking?tab=${item.key}`}
                  className={`py-3 text-center ${
                    active ? "text-red-500 font-bold border-b-2 border-red-500" : "text-gray-500"
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* 子页面渲染区域 */}
          <div className="p-2">
            {/* 注意：这里根据 tab 动态加载子页面模块 */}
            {current === "today" && <Today />}
            {current === "yesterday" && <Yesterday />}
            {current === "activity" && <Activity />}
            {current === "last-week" && <LastWeek />}
          </div>
        </main>
      </div>
    </div>
  );
}

