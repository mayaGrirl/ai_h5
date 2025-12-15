"use client";

import * as React from "react";
import {useEffect} from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {PageHeader} from "@/components/page-header";
import {PageEmpty} from "@/components/page-empty";
import {PageLoading} from "@/components/page-loading";

export default function Mine() {
  // 页面需要登陆Hook
  useRequireLogin();

  // 加载中
  const [loading, setLoading] = React.useState(true);
  // 是否为空
  const [isEmpty, setIsEmpty] = React.useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setIsEmpty(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title="我的消息" />

          <PageLoading loading={loading} />

          <PageEmpty empty={isEmpty} />


          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  );
}
