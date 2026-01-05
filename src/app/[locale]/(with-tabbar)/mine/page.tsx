"use client";

import Image from "next/image";
import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import styles from "./page.module.css"
import {CalendarCheck, ChevronRight, Flag, MapPin, Settings, User} from "lucide-react";
import Link from "next/link";
import {useParams, useRouter, useSearchParams} from "next/navigation";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import SettingDrawer from "./setting.drawer";
import {useFormatter, useTranslations} from "use-intl";
import {toast} from "sonner";
import {CustomerField, MemberCapital, MemberField} from "@/types/customer.type";
import {useAuthStore} from "@/utils/storage/auth";
import {useEffect, useState} from "react";
import {customerProfile, vipReceiveWelfare} from "@/api/customer";
import dayjs from "@/lib/dayjs";

export default function Mine() {
  // 页面需要登陆Hook
  useRequireLogin();

  // 格式化金额
  const format = useFormatter();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const _t = useTranslations();
  const [member, setMember] = useState<CustomerField>();
  const [memberField, setMemberField] = useState<MemberField>();
  const [memberCapital, setMemberCapital] = useState<MemberCapital>();
  const {currentCustomer, hydrated} = useAuthStore();

  // banner
  const emblaSlides = [
    {name: "01", src: "/mine/slide/01.png", href: ""},
    {name: "02", src: "/mine/slide/01.png", href: ""},
    {name: "03", src: "/mine/slide/01.png", href: ""},
    {name: "04", src: "/mine/slide/01.png", href: ""}
  ];
  const [emblaRef] = useEmblaCarousel({loop: true}, [Autoplay({playOnInit: true, delay: 2000})])
  // 6个快捷入口
  const quickAccess = [
    {label: _t("mine.quick.mail"), href: "/mine/message"},
    {label: _t("mine.setting.toolcase"), href: "/mine/toolcase"},
    {label: _t("mine.quick.challenge"), href: "/mine/challenge"},
    {label: _t("mine.quick.relief"), href: "/mine/relief"},
    {label: _t("mine.quick.salary"), href: "/mine/salary"},
    {label: _t("mine.quick.commission"), href: "/mine/spread"},
  ];

  // 设置弹框状态
  // 从设置抽屉进入页面之后返回到首页默认打开抽屉
  const isOpenSetting = searchParams.get("drawer") === "setting";
  const setIsOpenSetting = (open: boolean) => {
    const params = new URLSearchParams(searchParams.toString());

    if (open) {
      params.set("drawer", "setting");
    } else {
      params.delete("drawer");
    }

    router.replace(`?${params.toString()}`, {scroll: false});
  };

  useEffect(() => {
    customerProfile().then(({data}) => {
      setMember(data.customer);
      setMemberField(data.member_field);
      setMemberCapital(data.member_capital);
    }).finally();
  }, []);

  const [receiveWelfare, setReceiveWelfare] = useState(false);
  /**
   * VIP 领取福利
   */
  const handleReceiveWelfare = async () => {
    setReceiveWelfare(true);
    try {
      const {code, message} = await vipReceiveWelfare();
      if (code === 200) {
        toast.success(message);
      } else {
        toast.error(message);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : _t('common.catch-error');
      toast.error(msg);
    } finally {
      setReceiveWelfare(false);
    }
  };

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          {/* 顶部账号栏 */}
          <header className="bg-[#ff3a00] px-3 pt-3 pb-2 text-white">
            <div className="flex items-center justify-between">
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

              {/* 右上角图标 */}
              <div className="flex items-center space-x-3 text-xl cursor-pointer"
                   onClick={() => setIsOpenSetting(true)}>
                <span><Settings/></span>
              </div>
            </div>
          </header>

          {/* 大 Banner */}
          <section className="mb-3">
            <div className={styles.embla}>
              <div className={styles.embla__viewport} ref={emblaRef}>
                <div className={styles.embla__container}>
                  {emblaSlides.map(({name, src, href}, index) => (
                    <div className={styles.embla__slide} key={'slide' + index}>
                      <div className={styles.embla__slide__image}>
                        <Image src={src} alt={name} fill
                               priority={index === 0}
                               sizes="(max-width: 768px) 100vw, 768px"
                               className="object-cover"/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 新人任务 / 签到 */}
          <section className="mt-2 grid grid-cols-2 gap-2 px-3">
            <button className="flex justify-center items-center h-10 rounded-md bg-[#ff3a00] font-medium text-white"
                    onClick={() => {
                      toast.info('新人任务即将上线');
                    }}
            >
              <span className="flex items-center gap-1 leading-none">
                <Flag width={17} height={17} />
                {_t('mine.btn-tasks')}
              </span>
            </button>
            <Link href={`/${locale}/mine/sign?tab=in`} className="flex justify-center items-center h-10 rounded-md bg-[#ff3a00] font-medium text-white">
              <span className="flex items-center gap-1 leading-none">
                <CalendarCheck width={17} height={17} />
                {_t('mine.btn-sign_in')}
              </span>
            </Link>
          </section>

          {/* 六个功能入口 */}
          <section className="mt-2 grid grid-cols-3 gap-2 px-3">
            {quickAccess.map(({label, href}, index) => (
              <Link className="rounded-md bg-white py-3 text-center shadow-sm"
                    key={`quick-key-${index}`}
                    href={`/${locale}/${href}`}
              >
                {label}
              </Link>
            ))}
          </section>

          {/* 会员卡区域 */}
          <section className="mt-3 px-3">
            <div className="rounded-t-md border-b border-[#ff3a00] bg-white py-1 text-center  text-[#ff3a00]">
              {_t('mine.vip_title')}
            </div>
            <div className="rounded-b-md bg-gradient-to-r from-[#ff8e4a] to-[#ff3a00] px-4 py-3 text-center  text-white">
              <div className={"min-h-6"}>{member?.vip ? member?.vip_label : member?.gid_label}</div>
              <div className={"h-12"}>
                {(member && member?.vip > 0) && (
                  <button className={`mt-2 h-12 w-1/5 rounded-2xl bg-[#ffffff] text-black
                  font-medium tracking-wide transition transform active:scale-95
                  ${receiveWelfare ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`
                  } onClick={() => handleReceiveWelfare()}>
                    {receiveWelfare ? _t("common.form.button.submitting") : _t('mine.vip-btn-receive')}
                  </button>
                )}
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

          {/* 账户信息：金币 / 存款 / 生态值 */}
          <section className="mt-3 px-3">
            <div className="grid grid-cols-3 rounded-t-md bg-white py-2 text-center border-t border-b border-gray-200">
              <Link className="flex flex-col cursor-pointer" href={`/${locale}/mine/receipt-text`}>
                <div className="text-gray-500">{_t('mine.account-points')}</div>
                <div className="flex items-center justify-center mt-1 text-[13px] font-semibold text-[#ff3a00]">
                  <span>{format.number(memberCapital?.points ?? 0)}</span>
                  <Image
                    src="/ranking/coin.png"
                    alt="gold"
                    width={13}
                    height={13}
                    className="inline-block ml-1 w-[13px] h-[13px]"
                  />
                </div>
              </Link>
              <Link className="flex flex-col border-x border-gray-200 cursor-pointer" href={`/${locale}/mine/customer-transfer`}>
                <div className="text-gray-500">{_t('mine.account-bank-points')}</div>
                <div className="flex items-center justify-center mt-1 text-[13px] font-semibold text-[#ff3a00]">
                  <span>{format.number(memberCapital?.bankpoints ?? 0)}</span>
                  <Image
                    src="/ranking/coin.png"
                    alt="gold"
                    width={13}
                    height={13}
                    className="inline-block ml-1 w-[13px] h-[13px]"
                  />
                </div>
              </Link>
              <div className="flex flex-col">
                <div className=" text-gray-500">{_t('mine.account-experience')}</div>
                <div className="mt-1 text-[13px] font-semibold text-gray-800">
                  {memberCapital?.experience ?? 0}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 rounded-t-md bg-white py-2 text-center border-t border-b border-gray-200">
              <div className="flex flex-col">
                <div className=" text-gray-500">{_t('mine.account-rank')}</div>
                <div className="mt-1 text-[13px] font-semibold">500以外</div>
              </div>
              <div className="flex flex-col border-x border-gray-200">
                <div className=" text-gray-500">{_t('mine.account-blessing')}</div>
                <div className="mt-1 text-[13px] font-semibold text-gray-800">{memberCapital?.blessing ?? 0}</div>
              </div>
              <div className="flex flex-col">
                <div className=" text-gray-500">{_t('mine.account-freeze')}</div>
                <div className="mt-1 text-[13px] font-semibold text-[#ff3a00]">{format.number(memberCapital?.frozen ?? 0)}</div>
              </div>
            </div>
          </section>

          {/* 昨日亏损 + 今日首充返利 + 今日亏损返利 区域 */}
          <section className="mt-3">
            {/* 昨日亏损 */}
            <Link href={`/${locale}/mine/rebate?tab=loss`}
                  className="mt-1 flex items-center justify-between bg-[#ff3a00] px-3 py-2 text-white cursor-pointer">
              <div>
                <span>{_t('mine.yesterday_loss')}</span>
                {/*<Image*/}
                {/*  className="inline-block ml-1 w-[13px] h-[13px]"*/}
                {/*  src="/ranking/coin.png"*/}
                {/*  alt="gold"*/}
                {/*  width={13}*/}
                {/*  height={13}*/}
                {/*/>*/}
              </div>
              <span className="flex justify-center items-center text-sm">
                {_t('mine.yesterday_loss_btn')} <ChevronRight />
              </span>
            </Link>

            {/* 今日首充返利 标题 */}
            <Link href={`/${locale}/mine/rebate?tab=recharge`}
                  className="mt-2 flex items-center justify-between bg-[#ff3a00] px-3 py-2 text-white cursor-pointer">
              <span>{_t('mine.recharge_rebate')}</span>
              <span className="flex justify-center items-center text-sm">
                {_t('mine.recharge_rebate_btn')} <ChevronRight />
              </span>
            </Link>

            {/* 今日首充返利 表格 */}
            {/*<div className="overflow-auto">*/}
            {/*  <table className="w-full text-sm text-left">*/}
            {/*    <thead className="bg-gray-100 text-gray-700">*/}
            {/*    <tr>*/}
            {/*      <th className="px-4 py-2">流水</th>*/}
            {/*      <th className="px-4 py-2">返利</th>*/}
            {/*      <th className="px-4 py-2">进度</th>*/}
            {/*      <th className="px-4 py-2 text-right">差值</th>*/}
            {/*    </tr>*/}
            {/*    </thead>*/}
            {/*    <tbody className="bg-white text-gray-800">*/}
            {/*    <tr className="border-b border-gray-100">*/}
            {/*      <td className="px-4 py-2">8倍</td>*/}
            {/*      <td className="px-4 py-2">3%</td>*/}
            {/*      <td className="px-4 py-2">*/}
            {/*        <div className="relative w-24 h-4 bg-gray-200 rounded-full">*/}
            {/*          <div*/}
            {/*            className="absolute left-0 top-0 h-4 w-13 bg-red-500 rounded-full text-white text-xs text-center leading-4">*/}
            {/*            13%*/}
            {/*          </div>*/}
            {/*        </div>*/}
            {/*      </td>*/}
            {/*      <td className="px-4 py-2 text-right text-red-500">0</td>*/}
            {/*    </tr>*/}
            {/*    <tr className="border-b border-gray-100">*/}
            {/*      <td className="px-4 py-2">15倍</td>*/}
            {/*      <td className="px-4 py-2">6%</td>*/}
            {/*      <td className="px-4 py-2">*/}
            {/*        <div className="relative w-24 h-4 bg-gray-200 rounded-full">*/}
            {/*          <div*/}
            {/*            className="absolute left-0 top-0 h-4 w-24 bg-red-500 rounded-full text-white text-xs text-center leading-4">*/}
            {/*            100%*/}
            {/*          </div>*/}
            {/*        </div>*/}
            {/*      </td>*/}
            {/*      <td className="px-4 py-2 text-right text-red-500">0</td>*/}
            {/*    </tr>*/}
            {/*    <tr className="">*/}
            {/*      <td className="px-4 py-2">23倍</td>*/}
            {/*      <td className="px-4 py-2">10%</td>*/}
            {/*      <td className="px-4 py-2">*/}
            {/*        <div className="relative w-24 h-4 bg-gray-200 rounded-full">*/}
            {/*          <div*/}
            {/*            className="absolute left-0 top-0 h-4 w-8 bg-red-500 rounded-full text-white text-xs text-center leading-4">*/}
            {/*            0%*/}
            {/*          </div>*/}
            {/*        </div>*/}
            {/*      </td>*/}
            {/*      <td className="px-4 py-2 text-right text-red-500">0</td>*/}
            {/*    </tr>*/}
            {/*    </tbody>*/}
            {/*  </table>*/}
            {/*</div>*/}

            {/* 今日亏损返利 标题 */}
            {/*<div className="mt-2 flex items-center justify-between bg-[#ff3a00] px-3 py-2 text-white">*/}
            {/*  <span>今日亏损返利</span>*/}
            {/*  <span className="text-sm">亏损返利记录 &gt;</span>*/}
            {/*</div>*/}

            {/* 今日亏损返利 表格 */}
            {/*<div className="overflow-auto">*/}
            {/*  <table className="w-full text-sm text-left">*/}
            {/*    <thead className="bg-gray-100 text-gray-700">*/}
            {/*    <tr>*/}
            {/*      <th className="px-4 py-2">流水</th>*/}
            {/*      <th className="px-4 py-2">返利</th>*/}
            {/*      <th className="px-4 py-2">进度</th>*/}
            {/*      <th className="px-4 py-2 text-right">差值</th>*/}
            {/*    </tr>*/}
            {/*    </thead>*/}
            {/*    <tbody className="bg-white text-gray-800">*/}
            {/*    <tr className="border-b border-gray-100">*/}
            {/*      <td className="px-4 py-2">4倍</td>*/}
            {/*      <td className="px-4 py-2">2%</td>*/}
            {/*      <td className="px-4 py-2">*/}
            {/*        <div className="relative w-24 h-4 bg-gray-200 rounded-full">*/}
            {/*          <div*/}
            {/*            className="absolute left-0 top-0 h-4 w-24 bg-red-500 rounded-full text-white text-xs text-center leading-4">*/}
            {/*            100%*/}
            {/*          </div>*/}
            {/*        </div>*/}
            {/*      </td>*/}
            {/*      <td className="px-4 py-2 text-right text-red-500">0</td>*/}
            {/*    </tr>*/}
            {/*    <tr className="border-b border-gray-100">*/}
            {/*      <td className="px-4 py-2">8倍</td>*/}
            {/*      <td className="px-4 py-2">3%</td>*/}
            {/*      <td className="px-4 py-2">*/}
            {/*        <div className="relative w-24 h-4 bg-gray-200 rounded-full">*/}
            {/*          <div*/}
            {/*            className="absolute left-0 top-0 h-4 w-13 bg-red-500 rounded-full text-white text-xs text-center leading-4">*/}
            {/*            13%*/}
            {/*          </div>*/}
            {/*        </div>*/}
            {/*      </td>*/}
            {/*      <td className="px-4 py-2 text-right text-red-500">0</td>*/}
            {/*    </tr>*/}
            {/*    <tr className="border-b border-gray-100">*/}
            {/*      <td className="px-4 py-2">15倍</td>*/}
            {/*      <td className="px-4 py-2">4%</td>*/}
            {/*      <td className="px-4 py-2">*/}
            {/*        <div className="relative w-24 h-4 bg-gray-200 rounded-full">*/}
            {/*          <div*/}
            {/*            className="absolute left-0 top-0 h-4 w-24 bg-red-500 rounded-full text-white text-xs text-center leading-4">*/}
            {/*            100%*/}
            {/*          </div>*/}
            {/*        </div>*/}
            {/*      </td>*/}
            {/*      <td className="px-4 py-2 text-right text-red-500">0</td>*/}
            {/*    </tr>*/}
            {/*    <tr className="">*/}
            {/*      <td className="px-4 py-2">20倍</td>*/}
            {/*      <td className="px-4 py-2">5%</td>*/}
            {/*      <td className="px-4 py-2">*/}
            {/*        <div className="relative w-24 h-4 bg-gray-200 rounded-full">*/}
            {/*          <div*/}
            {/*            className="absolute left-0 top-0 h-4 w-8 bg-red-500 rounded-full text-white text-xs text-center leading-4">*/}
            {/*            0%*/}
            {/*          </div>*/}
            {/*        </div>*/}
            {/*      </td>*/}
            {/*      <td className="px-4 py-2 text-right text-red-500">0</td>*/}
            {/*    </tr>*/}
            {/*    </tbody>*/}
            {/*  </table>*/}
            {/*</div>*/}
          </section>

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>

      {/* 设置弹框 */}
      <SettingDrawer
        open={isOpenSetting}
        onOpenChange={setIsOpenSetting}
        locale={locale}
      />
    </>
  );
}
