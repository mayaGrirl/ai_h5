"use client";

import Image from "next/image";
import * as React from "react";
import {ChevronRight, MapPin, User, X} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {useFormatter, useLocale, useTranslations} from "use-intl";
import {CustomerField, MemberCapital, MemberField} from "@/types/customer.type";
import {useAuthStore} from "@/utils/storage/auth";
import {useEffect, useState} from "react";
import {customerProfile} from "@/api/customer";
import dayjs from "@/lib/dayjs";
import {LOCALE_CURRENCY_MAP} from "@/i18n/routing";
import {logout} from "@/api/auth";
import {accessToken} from "@/utils/storage/token";

// 快捷入口
const quickAccess = [
  {i18nKey: "agent.quick-menu-1", href: "agent/profile"},
  {i18nKey: "agent.quick-menu-2", href: "agent/recharge"},
  {i18nKey: "agent.quick-menu-3", href: "agent/recycle"},
  {i18nKey: "agent.quick-menu-4", href: "agent/conversion"},
  {i18nKey: "agent.quick-menu-5", href: "agent/log"},
  {i18nKey: "agent.quick-menu-6", href: "agent/stat"},
  {i18nKey: "agent.quick-menu-7", href: ""},
];

export default function AgentPage() {
  // 页面需要登陆Hook
  useRequireLogin();
  const locale = useLocale();
  const router = useRouter();

  // 格式化金额
  const format = useFormatter();
  // 币种符号
  const currency = LOCALE_CURRENCY_MAP[locale] ?? 'USD';

  const _t = useTranslations();
  const [member, setMember] = useState<CustomerField>();
  const [memberField, setMemberField] = useState<MemberField>();
  const [memberCapital, setMemberCapital] = useState<MemberCapital>();
  const {currentCustomer, hydrated} = useAuthStore();

  useEffect(() => {
    customerProfile().then(({data}) => {
      setMember(data.customer);
      setMemberField(data.member_field);
      setMemberCapital(data.member_capital);
    });
  }, []);

  // 退出登录
  const [loggingOut, setLoggingOut] = useState(false);
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      // 调用后端退出接口（如果有）
      await logout();
    } catch (e) {
      // 即使接口失败，也继续本地退出
      console.error("logout error", e);
    } finally {
      // 清理前端状态
      accessToken.remove();

      // 跳转登录页
      router.replace(`/${locale}/auth/login`);
    }
  };

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          {/* 顶部账号栏 */}
          <header className="bg-red-600 text-white px-3">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2">
                {/* 头像 */}
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
                  {/* 用真实图片时替换成 <Image /> */}
                  {/*<span className="text-2xl"><Image src={customer?.avatar_url || '🐧'} alt={customer?.avatar || ''} /></span>*/}
                  {!hydrated ? (
                    // 1. store 还没 hydrate：骨架
                    <div className="h-full w-full bg-gray-200 animate-pulse"/>
                  ) : currentCustomer?.avatar_url ? (
                    // 2. 有头像
                    <Image
                      src={currentCustomer.avatar_url}
                      alt="avatar"
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    // 3. 无头像
                    <User className="h-5 w-5 text-gray-400"/>
                  )}
                </div>
                {/* 昵称 & ID */}
                <div className="leading-tight font-medium">
                  <div className="text-xs flex items-center">
                    ID{currentCustomer?.id}（{memberField?.nickname}）
                    <span>
                      {!hydrated ? (
                        // 1. store 还没 hydrate：骨架
                        <Image src={`/mine/level/0.png`} alt={'level'} width={15} height={15}
                               className="w-[15px] h-[15px]"/>
                      ) : (
                        <Image src={`/mine/level/${currentCustomer?.level}.png`} alt={'level'} width={15} height={15}
                               className="w-[15px] h-[15px]"/>
                      )}
                    </span>
                  </div>
                  <div
                    className="min-w-12 mt-1 inline-flex h-4 items-center rounded-full text-[10px] px-1 bg-[rgb(64_63_63)]">
                    {member?.gid_label}
                  </div>
                </div>
              </div>
            </div>
          </header>


          {/* 账户信息：金币 / 存款 / 生态值 */}
          <section className="mt-3 px-3">
            <div className="grid grid-cols-2 rounded-2xl bg-white py-2 text-center border border-gray-200">
              <div className="flex flex-col">
                <div className="text-gray-500">{_t('mine.account-points')}</div>
                <div className="flex items-center justify-center mt-1 font-semibold text-[#ff3a00]">
                  <span>{format.number(memberCapital?.points ?? 0)}</span>
                  <Image
                    src="/ranking/coin.png"
                    alt="gold"
                    width={13}
                    height={13}
                    className="inline-block ml-1 w-[13px] h-[13px]"
                  />
                </div>
                <div>{format.number((memberCapital?.points || 0) / 1000, {style: 'currency', currency: currency})}</div>
              </div>
              <div className="flex flex-col border-l-2">
                <div className="text-gray-500">{_t('mine.account-bank-points')}</div>
                <div className="flex items-center justify-center mt-1 font-semibold text-[#ff3a00]">
                  <span>{format.number(memberCapital?.bankpoints ?? 0)}</span>
                  <Image
                    src="/ranking/coin.png"
                    alt="gold"
                    width={13}
                    height={13}
                    className="inline-block ml-1 w-[13px] h-[13px]"
                  />
                </div>
                <div>{format.number((memberCapital?.bankpoints || 0) / 1000, {
                  style: 'currency',
                  currency: currency
                })}</div>
              </div>
            </div>
          </section>

          {/* 登陆时间和地点 */}
          <section className="mt-3 px-3">
            <div
              className="w-full rounded-lg border border-[#c7e6ff] bg-[#f4fbff] px-3 py-2 text-[12px] text-[#4b84b6] flex items-center">
              <MapPin className="w-3 h-3 mr-1 text-[#4b84b6]"/>
              {currentCustomer && (
                <span>
                  {_t('mine.last-login-msg-1')}
                  {currentCustomer?.last_login_address} ({dayjs.unix(currentCustomer?.last_login_time || 0).format('YYYY-MM-DD HH:mm:ss')})
                  {_t('mine.last-login-msg-2')}
              </span>
              )}
            </div>
          </section>

          {/* 六个功能入口 */}
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              {quickAccess.map(({i18nKey, href}, index) => {
                if (href == "") {
                  return (
                    <button
                      key={`access-key-${index}`}
                      onClick={handleLogout}
                      className="flex flex-col items-center justify-center aspect-video rounded-2xl
                      border border-[#ebedf0] cursor-pointer bg-white hover:bg-gray-50 active:bg-gray-100
                      tracking-wide transition transform active:scale-95"
                    >
                      <span className="flex items-center">
                        <span className="text-center leading-tight">
                          {_t(i18nKey)}
                        </span>
                          {/* 箭头（始终垂直居中） */}
                          <span className="flex items-center">
                          <X className="h-5 w-5"/>
                        </span>
                      </span>
                    </button>
                  );
                }

                return (
                  <Link key={`access-key-${index}`} href={`/${locale}/${href}`}
                        className="flex flex-col items-center justify-center aspect-video rounded-2xl
                        border border-[#ebedf0] cursor-pointer bg-white hover:bg-gray-50 active:bg-gray-100
                        tracking-wide transition transform active:scale-95"
                  >
                    <span className="flex items-center">
                      <span className="text-center leading-tight">
                        {_t(i18nKey)}
                      </span>
                      {/* 箭头（始终垂直居中） */}
                      <span className="flex items-center">
                        <ChevronRight className="h-5 w-5"/>
                      </span>
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  );
}
