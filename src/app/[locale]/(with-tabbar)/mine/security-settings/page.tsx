"use client";

import * as React from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {PageHeader} from "@/components/page-header";
import {useTranslations} from "use-intl";
import {ChevronRight} from "lucide-react";
import Link from "next/link";
import {useEffect} from "react";
import {CustomerField} from "@/types/customer.type";
import {useAuthStore} from "@/utils/storage/auth";
import {isEmpty} from "@/utils/utils";

export default function SecuritySettingsPage() {
  // 页面需要登陆Hook
  useRequireLogin();
  const _t = useTranslations("mine");

  const [profile, setProfile] = React.useState<CustomerField>();

  const currentCustomer = useAuthStore((s) => s.currentCustomer);
  const {hydrated} = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;

    const init = async () => {
      if (currentCustomer) {
        setProfile(currentCustomer)
      }
    };

    void init();
  }, [hydrated, currentCustomer]);

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t("setting.security-settings")}/>

          <div className="min-h-screen bg-gray-100">
            <main className="px-4 pt-4 space-y-6">
              {/* 账户安全 */}
              <section>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <span className="w-1 h-4 bg-red-600 rounded mr-2"></span>
                  {_t("security-settings.group-account.title")}
                </div>
                <div className="space-y-3">
                  <Link href={"/mine/security-settings/password"}
                        className="flex items-center justify-between bg-white rounded-xl px-4 py-4 shadow-sm cursor-pointer">
                    <span className="text-gray-800 text-sm">{_t("security-settings.group-account.login")}</span>
                    <span className="text-red-600 text-lg"><ChevronRight/></span>
                  </Link>
                  <Link href={"/mine/security-settings/login-address"}
                        className="flex items-center justify-between bg-white rounded-xl px-4 py-4 shadow-sm cursor-pointer">
                    <span className="text-gray-800 text-sm">{_t("security-settings.group-account.address")}</span>
                    <span className="text-red-600 text-lg"><ChevronRight/></span>
                  </Link>
                  <Link href={"/mine/edit-password/login-sms"}
                        className="flex items-center justify-between bg-white rounded-xl px-4 py-4 shadow-sm cursor-pointer">
                    <span className="text-gray-800 text-sm">{_t("security-settings.group-account.sms")}</span>
                    <span className="text-red-600 text-lg"><ChevronRight/></span>
                  </Link>
                </div>
              </section>

              {/* 支付安全 */}
              <section>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <span className="w-1 h-4 bg-red-600 rounded mr-2"></span>
                  {_t("security-settings.group-pay.title")}
                </div>
                <div className="space-y-3">
                  <Link href={"/mine/security-settings/pay-password"}
                        className="flex items-center justify-between bg-white rounded-xl px-4 py-4 shadow-sm cursor-pointer">
                    <span className="text-gray-800 text-sm">{_t("security-settings.group-pay.pay")}</span>
                    <span className="text-red-600 text-lg"><ChevronRight/></span>
                  </Link>
                  {isEmpty(profile?.securitypass) && (
                    <Link href={"/mine/security-settings/question"}
                          className="flex items-center justify-between bg-white rounded-xl px-4 py-4 shadow-sm cursor-pointer">
                      <span className="text-gray-800 text-sm">{_t("security-settings.group-pay.security")}</span>
                      <span className="text-red-600 text-lg"><ChevronRight/></span>
                    </Link>
                  )}
                </div>
              </section>

              {/* 其他权限验证 */}
              <section>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <span className="w-1 h-4 bg-red-600 rounded mr-2"></span>
                  {_t("security-settings.group-other.title")}
                </div>
                <div className="space-y-3">
                  <Link href={"/mine/security-settings/redeem"}
                        className="flex items-center justify-between bg-white rounded-xl px-4 py-4 shadow-sm cursor-pointer">
                    <span className="text-gray-800 text-sm">{_t("security-settings.group-other.redeem")}</span>
                    <span className="text-red-600 text-lg"><ChevronRight/></span>
                  </Link>
                  <Link href={"/mine/security-settings/card"}
                        className="flex items-center justify-between bg-white rounded-xl px-4 py-4 shadow-sm cursor-pointer">
                    <span className="text-gray-800 text-sm">{_t("security-settings.group-other.card")}</span>
                    <span className="text-red-600 text-lg"><ChevronRight/></span>
                  </Link>
                </div>
              </section>
            </main>
          </div>

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  );
}
