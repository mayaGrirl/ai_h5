"use client";

import * as React from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {PageHeader} from "@/components/page-header";
import Link from "next/link";
import {redirect, useParams, useSearchParams} from "next/navigation";

import PointsPage from "./points/page";
import DepositPage from "./deposit/page";
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

  // 默认跳转到 /today
  if (!current) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "points");
    redirect(`/${locale}/mine/receipt-text?${params.toString()}`);
  }

  // ------------- Tabs 定义 ----------------
  const tabs = [
    {key: "points", i18Key: "capital-record.tab-1"},
    {key: "deposit", i18Key: "capital-record.tab-2"}
  ];

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t("mine.setting.receipt-text")}
                      cBack={fromDrawer ? `/${locale}/mine?drawer=setting` : undefined}/>

          <main className="">
            <div className="grid grid-cols-2 text-center text-sm bg-white">
              {tabs.map((item) => {
                const active = item.key === current;
                return (
                  <Link
                    key={item.key}
                    href={`/${locale}/mine/receipt-text?tab=${item.key}`}
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
              {/* 表头 */}
              <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr] px-3 py-2 text-xs text-muted-foreground border-b">
                <div className="text-center">{_t('capital-record.table-header-1')}</div>
                <div className="text-center">{_t('capital-record.table-header-2')}</div>
                <div className="text-center">{_t('capital-record.table-header-3')}</div>
                <div className="text-center">{_t('capital-record.table-header-4')}</div>
              </div>
              {/* 注意：这里根据 tab 动态加载子页面模块 */}
              {current === "points" && <PointsPage/>}
              {current === "deposit" && <DepositPage/>}
            </div>
          </main>

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  );
}
