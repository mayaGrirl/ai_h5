"use client";

import * as React from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {PageHeader} from "@/components/page-header";
import Link from "next/link";
import {redirect, useParams, useSearchParams} from "next/navigation";

import AllPage from "./all/page";
import CreditPage from "./credit/page";
import ExpensePage from "./expenses/page";

export default function Mine() {
  // 页面需要登陆Hook
  useRequireLogin();

  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;

  const current = searchParams.get("tab");

  // 默认跳转到 /today
  if (!current) {
    redirect(`/${locale}/mine/receipt-text?tab=all`);
  }

  // ------------- Tabs 定义 ----------------
  const tabs = [
    {key: "all", name: "全部明细"},
    {key: "credit", name: "获取明细"},
    {key: "expenses", name: "支出明细"}
  ];

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title="账户记录" cBack={`/${locale}/mine?drawer=setting`} />

          <main className="">
            <div className="grid grid-cols-3 text-center text-sm bg-white">
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
                    {item.name}
                  </Link>
                )
              })}
            </div>

            {/* 子页面渲染区域 */}
            <div className="p-2">
              {/* 表头 */}
              <div className="grid grid-cols-[1.2fr_0.8fr_1fr] px-3 py-2 text-xs text-muted-foreground border-b">
                <div>来源</div>
                <div className="text-center">金额</div>
                <div className="text-right">余额</div>
              </div>
              {/* 注意：这里根据 tab 动态加载子页面模块 */}
              {current === "all" && <AllPage />}
              {current === "credit" && <CreditPage />}
              {current === "expenses" && <ExpensePage />}
            </div>
          </main>

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  );
}
