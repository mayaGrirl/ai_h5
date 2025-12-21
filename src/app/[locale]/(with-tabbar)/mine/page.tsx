"use client";

import Image from "next/image";
import * as React from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import styles from "./page.module.css"
import {CalendarCheck, Flag, MapPin, Settings} from "lucide-react";
import Link from "next/link";
import {useParams, useRouter, useSearchParams} from "next/navigation";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import SettingDrawer from "./setting.drawer";
import {useTranslations} from "use-intl";
import {toast} from "sonner";

export default function Mine() {
  // 页面需要登陆Hook
  useRequireLogin();

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const _t = useTranslations();

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

    router.replace(`?${params.toString()}`, { scroll: false });
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
                  <span className="text-2xl">🐧</span>
                </div>
                {/* 昵称 & ID */}
                <div className="leading-tight font-medium">
                  <div className="text-xs flex items-center">
                    ID48566（_sg48566）
                    <span>
                    <Image src={"/mine/level/0.png"} alt={'等级'} width={15} height={15} className="w-[15px] h-[15px]" />
                  </span>
                  </div>
                  <div className="mt-1 inline-flex h-4 items-center rounded-full text-[10px] px-1 bg-[rgb(64_63_63)]">
                    普通用户
                  </div>
                </div>
              </div>

              {/* 右上角图标 */}
              <div className="flex items-center space-x-3 text-xl cursor-pointer" onClick={() => setIsOpenSetting(true)}>
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
                               className="object-cover" />
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
              <Flag width={17} height={17}/> 新人任务
            </button>
            <button className="flex justify-center items-center h-10 rounded-md bg-[#ff3a00] font-medium text-white">
              <CalendarCheck width={17} height={17}/> 签到
            </button>
          </section>

          {/* 六个功能入口 */}
          <section className="mt-2 grid grid-cols-3 gap-2 px-3">
            {quickAccess.map(({label, href},index) => (
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
              我的会员卡
            </div>
            <div className="rounded-b-md bg-gradient-to-r from-[#ff8e4a] to-[#ff3a00] px-4 py-3 text-center  text-white">
              普通会员
              <div className="mt-1 text-[14px] opacity-90">
                注册新用户充值领取会员卡 →
              </div>
            </div>
          </section>

          {/* 登陆时间和地点 */}
          <section className="mt-3 px-3">
            <div
              className="w-full rounded-lg border border-[#c7e6ff] bg-[#f4fbff] px-3 py-2 text-[12px] text-[#4b84b6] flex items-center">
              <MapPin className="w-3 h-3 mr-1 text-[#4b84b6]"/>
              <span> 最后一次在象牙海岸 阿比让 ORANGE-COTE-IVOIRE (2025-12-04 22:49:19) 登录</span>
            </div>
          </section>

          {/* 账户信息：金币 / 存款 / 生态值 */}
          <section className="mt-3 px-3">
            <div className="grid grid-cols-3 rounded-t-md bg-white py-2 text-center border-t border-b border-gray-200">
              <Link className="flex flex-col cursor-pointer" href={""}>
                <div className="text-gray-500">金币</div>
                <div className="flex items-center justify-center mt-1 text-[13px] font-semibold text-[#ff3a00]">
                  <span>160</span>
                  <Image
                    src="/ranking/coin.png"
                    alt="gold"
                    width={13}
                    height={13}
                    className="inline-block ml-1 w-[13px] h-[13px]"
                  />
                </div>
              </Link>
              <Link className="flex flex-col border-x border-gray-200 cursor-pointer" href={"/mine/customer-transfer"}>
                <div className="text-gray-500">存款</div>
                <div className="flex items-center justify-center mt-1 text-[13px] font-semibold text-[#ff3a00]">
                  <span>111</span>
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
                <div className=" text-gray-500">生态值</div>
                <div className="mt-1 text-[13px] font-semibold text-gray-800">
                  0
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 rounded-t-md bg-white py-2 text-center border-t border-b border-gray-200">
              <div className="flex flex-col">
                <div className=" text-gray-500">今日排名</div>
                <div className="mt-1 text-[13px] font-semibold">500以外</div>
              </div>
              <div className="flex flex-col border-x border-gray-200">
                <div className=" text-gray-500">积分</div>
                <div className="mt-1 text-[13px] font-semibold text-gray-800">22</div>
              </div>
              <div className="flex flex-col">
                <div className=" text-gray-500">本周工资</div>
                <div className="mt-1 text-[13px] font-semibold text-gray-800">0</div>
              </div>
            </div>
          </section>

          {/* 昨日亏损 + 今日首充返利 + 今日亏损返利 区域 */}
          <section className="mt-3">
            {/* 昨日亏损 */}
            <div className="mt-1 flex items-center justify-between bg-[#ff3a00] px-3 py-2 text-white cursor-pointer">
              <div>
                <span>昨日亏损</span>
                <Image
                  className="inline-block ml-1 w-[13px] h-[13px]"
                  src="/ranking/coin.png"
                  alt="gold"
                  width={13}
                  height={13}
                />
              </div>
              <span className="text-sm">
              领取亏损奖励 &gt;
            </span>
            </div>

            {/* 今日首充返利 标题 */}
            <div className="mt-2 flex items-center justify-between bg-[#ff3a00] px-3 py-2 text-white cursor-pointer">
              <span>今日首充返利</span>
              <span className="text-sm">首充返利记录 &gt;</span>
            </div>

            {/* 今日首充返利 表格 */}
            <div className="overflow-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2">流水</th>
                  <th className="px-4 py-2">返利</th>
                  <th className="px-4 py-2">进度</th>
                  <th className="px-4 py-2 text-right">差值</th>
                </tr>
                </thead>
                <tbody className="bg-white text-gray-800">
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-2">8倍</td>
                  <td className="px-4 py-2">3%</td>
                  <td className="px-4 py-2">
                    <div className="relative w-24 h-4 bg-gray-200 rounded-full">
                      <div className="absolute left-0 top-0 h-4 w-13 bg-red-500 rounded-full text-white text-xs text-center leading-4">
                        13%
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-red-500">0</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-2">15倍</td>
                  <td className="px-4 py-2">6%</td>
                  <td className="px-4 py-2">
                    <div className="relative w-24 h-4 bg-gray-200 rounded-full">
                      <div className="absolute left-0 top-0 h-4 w-24 bg-red-500 rounded-full text-white text-xs text-center leading-4">
                        100%
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-red-500">0</td>
                </tr>
                <tr className="">
                  <td className="px-4 py-2">23倍</td>
                  <td className="px-4 py-2">10%</td>
                  <td className="px-4 py-2">
                    <div className="relative w-24 h-4 bg-gray-200 rounded-full">
                      <div className="absolute left-0 top-0 h-4 w-8 bg-red-500 rounded-full text-white text-xs text-center leading-4">
                        0%
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-red-500">0</td>
                </tr>
                </tbody>
              </table>
            </div>

            {/* 今日亏损返利 标题 */}
            <div className="mt-2 flex items-center justify-between bg-[#ff3a00] px-3 py-2 text-white">
              <span>今日亏损返利</span>
              <span className="text-sm">亏损返利记录 &gt;</span>
            </div>

            {/* 今日亏损返利 表格 */}
            <div className="overflow-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2">流水</th>
                  <th className="px-4 py-2">返利</th>
                  <th className="px-4 py-2">进度</th>
                  <th className="px-4 py-2 text-right">差值</th>
                </tr>
                </thead>
                <tbody className="bg-white text-gray-800">
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-2">4倍</td>
                  <td className="px-4 py-2">2%</td>
                  <td className="px-4 py-2">
                    <div className="relative w-24 h-4 bg-gray-200 rounded-full">
                      <div className="absolute left-0 top-0 h-4 w-24 bg-red-500 rounded-full text-white text-xs text-center leading-4">
                        100%
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-red-500">0</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-2">8倍</td>
                  <td className="px-4 py-2">3%</td>
                  <td className="px-4 py-2">
                    <div className="relative w-24 h-4 bg-gray-200 rounded-full">
                      <div className="absolute left-0 top-0 h-4 w-13 bg-red-500 rounded-full text-white text-xs text-center leading-4">
                        13%
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-red-500">0</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="px-4 py-2">15倍</td>
                  <td className="px-4 py-2">4%</td>
                  <td className="px-4 py-2">
                    <div className="relative w-24 h-4 bg-gray-200 rounded-full">
                      <div className="absolute left-0 top-0 h-4 w-24 bg-red-500 rounded-full text-white text-xs text-center leading-4">
                        100%
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-red-500">0</td>
                </tr>
                <tr className="">
                  <td className="px-4 py-2">20倍</td>
                  <td className="px-4 py-2">5%</td>
                  <td className="px-4 py-2">
                    <div className="relative w-24 h-4 bg-gray-200 rounded-full">
                      <div className="absolute left-0 top-0 h-4 w-8 bg-red-500 rounded-full text-white text-xs text-center leading-4">
                        0%
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-red-500">0</td>
                </tr>
                </tbody>
              </table>
            </div>
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
