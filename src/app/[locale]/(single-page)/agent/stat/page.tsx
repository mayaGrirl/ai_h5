"use client"

import * as React from "react";
import {useTranslations} from "use-intl";
import {PageHeader} from "@/components/page-header";
import {PageEmpty} from "@/components/page-empty";

export default function AgentLogPage() {
  const _t = useTranslations();

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t('agent.quick-menu-6')}/>

          <PageEmpty empty={true} />

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  )
}
