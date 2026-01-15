"use client";

import * as React from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {PageHeader} from "@/components/page-header";
import {cn} from "@/lib/utils";

export default function Mine() {
  // 页面需要登陆Hook
  useRequireLogin();

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title="闯关星星" />

          <div
            data-slot="empty"
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 rounded-lg border-dashed p-6 text-center text-balance md:p-12",
            )}
          >
            <div
              data-slot="empty-header"
              className={cn(
                "flex max-w-sm flex-col items-center gap-2 text-center",
              )}
            >
              <div
                data-slot="empty-title"
                className={cn("text-lg font-medium tracking-tight")}
              >
                功能开发中...
              </div>
              <div
                data-slot="empty-description"
                className={cn(
                  "text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4",
                )}
              >
                闯关星星即将上线，敬请期待！
              </div>
            </div>
          </div>

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  );
}
