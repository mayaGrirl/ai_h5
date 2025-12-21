"use client"

import {PageHeader} from "@/components/page-header";
import * as React from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {useParams, useRouter} from "next/navigation";
import {useTranslations} from "use-intl";

export default function CustomerTransferPage() {
  // 页面需要登陆Hook
  useRequireLogin();

  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const _t = useTranslations();

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={"转账"}/>

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  );
}
