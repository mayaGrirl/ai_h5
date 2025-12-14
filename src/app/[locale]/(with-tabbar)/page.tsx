"use client";

import * as React from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'

import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  Star,
  Gift,
  UsersRound,
} from "lucide-react";
import {useTranslations} from "use-intl";
import {cn} from "@/utils/utils";
import styles from "./page.module.css";
import { useParams } from "next/navigation";

export default function HomePage() {
  const params = useParams();
  const locale = params.locale as string;

  const _t = useTranslations();

  const quickActions = [
    {name: _t("home.announcement"), href: "", color: "bg-[#ffb84d]", icon: Bell},
    {name: _t("home.events"), href: "", color: "bg-[#b47cff]", icon: Star},
    {name: _t("home.rewards"), href: "", color: "bg-[#ff6b6b]", icon: Gift},
    {name: _t("home.partners"), href: "", color: "bg-[#4ec5ff]", icon: UsersRound}
  ];

  const emblaSlides = [
    {name: "01", src: "/home/slide/01.png", href: ""},
    {name: "02", src: "/home/slide/02.png", href: ""},
    {name: "03", src: "/home/slide/03.png", href: ""},
    {name: "04", src: "/home/slide/04.png", href: ""}
  ];

  const hotGames = [
    {name: "加拿大28", src: "/home/hot-games/1.png", href: ""},
    {name: "宾果28", src: "/home/hot-games/2.png", href: ""},
    {name: "蛋蛋28", src: "/home/hot-games/3.png", href: ""},
    {name: "美国28", src: "/home/hot-games/4.png", href: ""},
    {name: "韩国28", src: "/home/hot-games/5.png", href: ""},
    {name: "加拿大10", src: "/home/hot-games/6.png", href: ""},
  ];

  const [emblaRef] = useEmblaCarousel({loop: true}, [Autoplay({playOnInit: true, delay: 2000})])

  return (
    <div className="flex min-h-screen justify-center bg-[#eef3f8]">
      {/* 中间内容区域，控制最大宽度模拟手机界面 */}
      <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
        {/* 顶部 LOGO 区域 */}
        <header className="h-16 bg-[#ff3a00] flex items-center justify-center">
          {/* 你可以用 Image 换成真实 logo */}
          {/* <Image src="/logo.png" alt="logo" width={140} height={40} /> */}
          <span className="text-white text-2xl font-black tracking-wide">
            鼎丰28
          </span>
        </header>

        {/* 内容滚动区，底部预留给 TabBar */}
        <main className="px-3 pb-20 pt-3">
          {/* 四个快捷入口 */}
          <section className="grid grid-cols-4 gap-2 mb-3">
            {quickActions.map(({name, color, href, icon: Icon}) => (
              <Link
                key={name}
                href={`/${locale}/${href}`}
                className="flex flex-col items-center justify-center text-[13px]"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-lg text-xl text-white shadow ${color}`}>
                  <Icon
                    className={cn("h-5 w-5 text-white-600")}
                  />
                </div>
                <span className="mt-1 text-[12px] text-gray-700">
                    {name}
                  </span>
              </Link>

            ))}
          </section>

          {/* 顶部大 Banner */}
          <section className="mb-3">
            <div className={styles.embla}>
              <div className={styles.embla__viewport} ref={emblaRef}>
                <div className={styles.embla__container}>
                  {emblaSlides.map(({name, src, href}, index) => (
                    <div className={styles.embla__slide} key={'slide' + index}>
                      <div className={styles.embla__slide__image}>
                        <Image src={src} alt={name}
                               fill
                               priority={index === 0}
                               loading={index === 0 ? "eager" : "lazy"}
                               sizes="(max-width: 768px) 100vw, 768px"
                               className="object-cover"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 热门游戏标题行 */}
          <section className="mb-2 flex items-center justify-between text-[13px]">
            <div className="flex items-center gap-1">
              <span className="text-black font-medium">{_t("home.hot-games")}</span>
            </div>
            <button className="text-xs text-blue-600">网络检测</button>
          </section>

          {/* 热门游戏 6 宫格 */}
          <section className="mb-4 grid grid-cols-3 gap-2">
            {hotGames.map(({name, src, href}, index) => (
              <Link
                key={'hot-games' + index}
                href={`/${locale}/${href}`}
                className="block"
              >
                <Image
                  src={src}
                  alt={name}
                  width={300}   // 给任意宽高比，例如 300 x 200 = 3:2
                  height={200}
                  className="w-full rounded-md"
                />
              </Link>
            ))}
          </section>

          {/* 两个红色按钮 */}
          <section className="space-y-3">
            <button
              className="flex h-11 w-full items-center justify-center rounded-full bg-[#ff3a00] text-[14px] font-medium text-white shadow">
              <span className="mr-1.5 text-[15px]">💻</span>
              电脑版
            </button>
            <button
              className="flex h-11 w-full items-center justify-center rounded-full bg-[#ff3a00] text-[14px] font-medium text-white shadow">
              <span className="mr-1.5 text-[16px]">🎧</span>
              联系客服
            </button>
          </section>

        </main>
      </div>
    </div>
  );
}
