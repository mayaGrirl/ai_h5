"use client";

import * as React from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {PageHeader} from "@/components/page-header";
import Link from "next/link";
import {redirect, useParams, useSearchParams} from "next/navigation";
import {useTranslations} from "use-intl";

import Intro from "./intro/page";
import Receive from "./receive/page";
import Record from "./record/page";

// ------------- Tabs 定义 ----------------
const tabs = [
  {key: "intro", i18Key: "mine.salary.tab-1"},
  {key: "receive", i18Key: "mine.salary.tab-2"},
  {key: "record", i18Key: "mine.salary.tab-3"}
];

export default function Mine() {
  // 页面需要登陆Hook
  useRequireLogin();

  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const _t = useTranslations();

  const current = searchParams.get("tab");

  // 默认跳转到 /today
  if (!current) {
    redirect(`/${locale}/mine/salary?tab=intro`);
  }

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t('mine.quick.salary')} />

          <main className="">
            <div className="grid grid-cols-3 text-center text-sm bg-white">
              {tabs.map((item) => {
                const active = item.key === current;
                return (
                  <Link
                    key={item.key}
                    href={`/${locale}/mine/salary?tab=${item.key}`}
                    className={`py-3 text-center ${
                      active ? "text-red-500 font-bold border-b-2 border-red-500" : "text-gray-500"
                    }`}
                  >
                    {_t(item.i18Key)}
                  </Link>
                )
              })}
            </div>

            {/* 子页面渲染区域 */}
            <div className="p-2">
              {/* 注意：这里根据 tab 动态加载子页面模块 */}
              {current === "intro" && <Intro />}
              {current === "receive" && <Receive />}
              {current === "record" && <Record />}
            </div>
          </main>

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  );
}
