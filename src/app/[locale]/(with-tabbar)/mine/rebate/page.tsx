"use client";

import * as React from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {PageHeader} from "@/components/page-header";
import Link from "next/link";
import {redirect, useParams, useSearchParams} from "next/navigation";

import RechargePage from "./recharge/page";
import LossPage from "./loss/page";
import {useTranslations} from "use-intl";

export default function ReceiptTextPage() {
  // 页面需要登陆Hook
  useRequireLogin();

  const _t = useTranslations();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;

  const current = searchParams.get("tab");
  const fromDrawer = searchParams.get("from") === "drawer";

  // 默认跳转到 /recharge
  if (!current) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "recharge");
    redirect(`/${locale}/mine/rebate?${params.toString()}`);
  }

  // ------------- Tabs 定义 ----------------
  const tabs = [
    {key: "recharge", i18Key: "rebate.tab-1"},
    {key: "loss", i18Key: "rebate.tab-2"},
  ];

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t('rebate.header-title')}
                      cBack={fromDrawer ? `/${locale}/mine?drawer=setting` : undefined}/>

          <main className="">
            <div className="grid grid-cols-2 text-center text-sm bg-white">
              {tabs.map((item) => {
                const active = item.key === current;
                return (
                  <Link
                    key={item.key}
                    href={`/${locale}/mine/rebate?tab=${item.key}`}
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
              {current === "recharge" && <RechargePage />}
              {current === "loss" && <LossPage />}
            </div>
          </main>

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  );
}
