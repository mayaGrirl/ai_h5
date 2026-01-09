"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Link from "next/link";
import Image from "next/image";
import { Bell, Star, Gift, UsersRound, X, Loader2 } from "lucide-react";
import { useTranslations } from "use-intl";
import { cn } from "@/lib/utils";
import styles from "./page.module.css";
import { useParams } from "next/navigation";
import {
  getBanners,
  testData,
  /*getAnnouncements,
  getActivities,
  getPartners,*/
  getHomePopup,
  getWebConfig,
  indexGameHotNew,
} from "@/api/home";
import {IndexDataItem, IndexGameItem, webConfig} from "@/types/index.type";

// 骨架屏组件
const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-gray-200 rounded", className)} />
);

// 游戏卡片骨架屏
const GameCardSkeleton = () => (
  <div className="rounded-md overflow-hidden">
    <Skeleton className="w-full aspect-[3/2]" />
  </div>
);

const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "";
const getImageUrl = (pic: string) => {
  if (!pic) return "";
  if (pic.startsWith("http")) return pic;
  return `${IMAGE_BASE_URL}${pic.startsWith("/") ? "" : "/"}${pic}`;
};

// 默认轮播图数据类型
interface DefaultSlide {
  id: number;
  title: string;
  pic: string;
  jump_url: string;
}

export default function HomePage() {
  const params = useParams();
  const locale = params.locale as string;
  const _t = useTranslations();

  const [gameHotNew, setGameHotNew] = useState<IndexGameItem>();
  const [gamesLoading, setGamesLoading] = useState(true);
  // 轮播图 (type=1)
  const [banners, setBanners] = useState<IndexDataItem[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  // 公告 (type=2)
  /*const [announcements, setAnnouncements] = useState<IndexDataItem[]>([]);
  // 活动 (type=3)
  const [activities, setActivities] = useState<IndexDataItem[]>([]);
  // 合作商家 (type=4)
  const [partners, setPartners] = useState<IndexDataItem[]>([]);*/
  // 首页弹框公告 (type=5)
  const [popupAnnouncement, setPopupAnnouncement] = useState<IndexDataItem | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  const [getConfig, setGetConfig] = useState<webConfig|null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [getTestData, setGetTestData] = useState<webConfig|null>(null);

  // 页面初始加载状态
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    // 页面加载动画延迟
    const timer = setTimeout(() => setPageLoaded(true), 100);

    // 获取网站配置
    getWebConfig()
      .then(({ code, data }) => {
        if (code === 200 && data) setGetConfig(data);
      })
      .finally(() => setConfigLoading(false));

    /*testData({lottery_id:1, game_group_id:1, page:1, pageSize:30}).then(({ code, data }) => {
      if (code === 200 && data) setGetTestData(data);
    });*/

    // 首页热门游戏
    indexGameHotNew({ limit: 6 })
      .then(({ code, data }) => {
        if (code === 200 && data) setGameHotNew(data);
      })
      .finally(() => setGamesLoading(false));

    // type=1 轮播图
    getBanners()
      .then(({ code, data }) => {
        if (code === 200 && data) setBanners(data);
      })
      .finally(() => setBannersLoading(false));

    // type=5 弹框公告 (使用 sessionStorage，每次会话显示一次)
    getHomePopup().then(({ code, data }) => {
      if (code === 200 && data && data.length > 0) {
        const popup = data[0];
        setPopupAnnouncement(popup);
        const key = `home_popup_${popup.id}`;
        // 使用 sessionStorage 替代 localStorage，这样每次新会话都会显示弹窗
        if (!sessionStorage.getItem(key)) {
          setShowPopup(true);
          sessionStorage.setItem(key, "true");
        }
      }
    });

    return () => clearTimeout(timer);
  }, []);

  const quickActions = [
    { name: _t("home.announcement"), href: "index/announce", color: "bg-[#ffb84d]", icon: Bell, count: 0 },
    { name: _t("home.events"), href: "index/activities", color: "bg-[#b47cff]", icon: Star, count:0 },
    { name: _t("home.rewards"), href: "/mine/relief", color: "bg-[#ff6b6b]", icon: Gift, count: 0 },
    { name: _t("home.partners"), href: "index/partners", color: "bg-[#4ec5ff]", icon: UsersRound, count: 0 },
  ];

  const defaultSlides: DefaultSlide[] = [
    { id: 1, title: "01", pic: "/home/slide/01.png", jump_url: "" },
    { id: 2, title: "02", pic: "/home/slide/02.png", jump_url: "" },
    { id: 3, title: "03", pic: "/home/slide/03.png", jump_url: "" },
    { id: 4, title: "04", pic: "/home/slide/04.png", jump_url: "" },
  ];
  const emblaSlides = banners.length > 0 ? banners : defaultSlides;

  const hotGames = [
    { name: "加拿大28", src: "/home/hot-games/1.png", href: "" },
    { name: "宾果28", src: "/home/hot-games/2.png", href: "" },
    { name: "蛋蛋28", src: "/home/hot-games/3.png", href: "" },
    { name: "美国28", src: "/home/hot-games/4.png", href: "" },
    { name: "韩国28", src: "/home/hot-games/5.png", href: "" },
    { name: "加拿大10", src: "/home/hot-games/6.png", href: "" },
  ];

  // const hotApiGames = gameHotNew.length > 0 ? gameHotNew : hotGames;

  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ playOnInit: true, delay: 2000 })]);
  const closePopup = () => setShowPopup(false);

  return (
    <div className="flex min-h-screen justify-center bg-[#eef3f8]">
      <div className={cn(
        "w-full max-w-xl bg-[#f5f7fb] shadow-sm transition-opacity duration-500",
        pageLoaded ? "opacity-100" : "opacity-0"
      )}>
        {/* 头部 */}
        <header className="h-16 bg-gradient-to-r from-red-600 to-red-500 flex items-center justify-center shadow-md">
          <span className="text-white text-2xl font-black tracking-wide drop-shadow">鼎丰28</span>
        </header>

        <main className="px-3 pb-20 pt-3">
          {/* 四个快捷入口 */}
          <section className="grid grid-cols-4 gap-2 mb-3">
            {quickActions.map(({ name, color, href, icon: Icon, count }, index) => (
              <Link
                key={name}
                href={`/${locale}/${href}`}
                className="flex flex-col items-center justify-center text-[13px] relative transform transition-transform duration-200 hover:scale-105 active:scale-95"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-lg text-xl text-white shadow-md relative transition-shadow hover:shadow-lg",
                  color
                )}>
                  <Icon className="h-5 w-5" />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </div>
                <span className="mt-1 text-[12px] text-gray-700">{name}</span>
              </Link>
            ))}
          </section>

          {/* 轮播图 (type=1) */}
          <section className="mb-3">
            {bannersLoading ? (
              <div className="h-40 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl animate-pulse flex items-center justify-center shadow-sm">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                  <span className="text-gray-400 text-sm">加载中...</span>
                </div>
              </div>
            ) : (
              <div className={cn(styles.embla, "rounded-xl overflow-hidden shadow-sm")}>
                <div className={styles.embla__viewport} ref={emblaRef}>
                  <div className={styles.embla__container}>
                    {emblaSlides.map((slide, index) => (
                      <div className={styles.embla__slide} key={"slide-" + slide.id}>
                        <Link href={slide.jump_url || "#"}>
                          <div className={styles.embla__slide__image}>
                            <Image
                              src={slide.pic.startsWith("/") ? slide.pic : getImageUrl(slide.pic)}
                              alt={slide.title}
                              fill
                              priority={index === 0}
                              sizes="(max-width: 768px) 100vw, 768px"
                              className="object-cover transition-transform duration-300 hover:scale-105"
                            />
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 热门游戏 */}
          <section className="mb-2 flex items-center justify-between text-[13px]">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 bg-red-500 rounded-full"></span>
              <span className="text-black font-bold">{_t("home.hot-games")}</span>
            </div>
            {gamesLoading && (
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
            )}
          </section>
          <section className="mb-4 grid grid-cols-3 gap-2">
            {gamesLoading ? (
              // 骨架屏
              <>
                {[1, 2, 3].map((i) => (
                  <GameCardSkeleton key={`hot-skeleton-${i}`} />
                ))}
              </>
            ) : gameHotNew?.hot && gameHotNew?.hot.length > 0 ? (
              gameHotNew.hot.map((item, index) => (
                <Link
                  key={"hot-games" + index}
                  href={`/${locale}/games?lottery_id=${item.id}`}
                  className="block transform transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 rounded-md overflow-hidden"
                >
                  <Image
                    src={item.logo || ''}
                    alt={item.name || ''}
                    width={300}
                    height={200}
                    className="w-full rounded-md"
                  />
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center py-4 text-gray-400 text-sm">
                暂无热门游戏
              </div>
            )}
          </section>

          {/* 最新游戏 */}
          <section className="mb-2 flex items-center justify-between text-[13px]">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
              <span className="text-black font-bold">{_t("home.new-games")}</span>
            </div>
            {gamesLoading && (
              <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
            )}
          </section>
          <section className="mb-4 grid grid-cols-3 gap-2">
            {gamesLoading ? (
              // 骨架屏
              <>
                {[1, 2, 3].map((i) => (
                  <GameCardSkeleton key={`new-skeleton-${i}`} />
                ))}
              </>
            ) : gameHotNew?.new && gameHotNew?.new.length > 0 ? (
              gameHotNew.new.map((item, index) => (
                <Link
                  key={"new-games" + index}
                  href={`/${locale}/games?lottery_id=${item.id}`}
                  className="block transform transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 rounded-md overflow-hidden"
                >
                  <Image
                    src={item.logo || ''}
                    alt={item.name || ''}
                    width={300}
                    height={200}
                    className="w-full rounded-md"
                  />
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center py-4 text-gray-400 text-sm">
                暂无最新游戏
              </div>
            )}
          </section>

          {/* 底部按钮 */}
          {configLoading ? (
            <section className="space-y-3">
              <Skeleton className="h-11 w-full rounded-full" />
              <Skeleton className="h-11 w-full rounded-full" />
            </section>
          ) : getConfig && (
            <section className="space-y-3">
              <Link href={getConfig.pc_url} className="block">
                <button className="flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#ff3a00] to-[#ff6b35] text-[14px] font-medium text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                  电脑版
                </button>
              </Link>
              <Link href={getConfig.customer_link} className="block">
                <button className="flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#ff3a00] to-[#ff6b35] text-[14px] font-medium text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                  联系客服
                </button>
              </Link>
            </section>
          )}

        </main>
      </div>

      {/* 首页弹框公告 (type=5) */}
      {showPopup && popupAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl max-w-sm w-full max-h-[70vh] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-red-500 to-red-600">
              <h3 className="font-bold text-white text-lg">{popupAnnouncement.title}</h3>
              <button
                onClick={closePopup}
                className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              <div className="text-sm text-gray-600 leading-relaxed prose prose-sm" dangerouslySetInnerHTML={{ __html: popupAnnouncement.content }} />
            </div>
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={closePopup}
                className="w-full bg-gradient-to-r from-[#ff3a00] to-[#ff6b35] text-white rounded-full py-3 text-sm font-bold hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
