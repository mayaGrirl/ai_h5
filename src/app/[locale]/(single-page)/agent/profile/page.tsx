"use client";

import {useRequireLogin} from "@/hooks/useRequireLogin";
import {PageHeader} from "@/components/page-header";
import * as React from "react";
import {useFormatter, useTranslations} from "use-intl";
import {useEffect} from "react";
import {agentProfile} from "@/api/agent";
import {AgentField} from "@/types/agent.type";

export default function AgentPage() {
  // 页面需要登陆Hook
  useRequireLogin();
  const _t = useTranslations();
  // 格式化金额
  const format = useFormatter();

  const [profile, setProfile] = React.useState<AgentField>();
  useEffect(() => {
    const init = async () => {
      const {code, data} = await agentProfile();
      if (code === 200) {
        setProfile(data);
      }
    }
    void init();
  }, []);

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t("agent.quick-menu-1")}/>

          <main className="px-3 pb-20 pt-3">
            <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
              <div className="flex justify-between px-2">
                <div className="text-gray-500">{_t('agent.profile.label-1')}</div>
                <div className="ml-1 text-[#c8c9cc]">{profile?.uid}</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
              <div className="flex justify-between px-2">
                <div className="text-gray-500">{_t('agent.profile.label-2')}</div>
                <div className="ml-1 text-[#c8c9cc]">{profile?.name}</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
              <div className="flex justify-between px-2">
                <div className="text-gray-500">{_t('agent.profile.label-3')}</div>
                <div className="ml-1 text-[#c8c9cc]">{(profile?.buycard_rate || 0) * 10}折</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
              <div className="flex justify-between px-2">
                <div className="text-gray-500">{_t('agent.profile.label-4')}</div>
                <div className="ml-1 text-[#c8c9cc]">{(profile?.reccard_rate || 0) * 10}折</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
              <div className="flex justify-between px-2">
                <div className="text-gray-500">{_t('agent.profile.label-5')}</div>
                <div className="ml-1 text-[#c8c9cc]">{format.number(profile?.reccard_profit_rate || 0)}</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
              <div className="flex justify-between px-2">
                <div className="text-gray-500">{_t('agent.profile.label-6')}</div>
                <div className="ml-1 text-[#c8c9cc]">{format.number(profile?.distribute_money || 0)}</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
              <div className="flex justify-between px-2">
                <div className="text-gray-500">{_t('agent.profile.label-7')}</div>
                <div className="ml-1 text-[#c8c9cc]">{profile?.state_label}</div>
              </div>
            </div>
          </main>

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  )
}
