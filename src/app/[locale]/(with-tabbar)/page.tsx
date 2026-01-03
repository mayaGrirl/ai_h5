"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Link from "next/link";
import Image from "next/image";
import { Bell, Star, Gift, UsersRound, X } from "lucide-react";
import { useTranslations } from "use-intl";
import { cn } from "@/lib/utils";
import styles from "./page.module.css";
import { useParams } from "next/navigation";
import {
  getBanners,
  /*getAnnouncements,
  getActivities,
  getPartners,*/
  getHomePopup,
  getWebConfig,
  indexGameHotNew,
} from "@/api/home";
import {IndexDataItem, IndexGameItem, webConfig} from "@/types/index.type";

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

  useEffect(() => {

    getWebConfig().then(({ code, data }) => {
      if (code === 200 && data) setGetConfig(data);
    });

    //首页热门游戏
    indexGameHotNew({limit: 6}).then(({ code, data }) => {
      if (code === 200 && data) setGameHotNew(data);
    });



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
      <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
        <header className="h-16 bg-[#ff3a00] flex items-center justify-center">
          <span className="text-white text-2xl font-black tracking-wide">鼎丰28</span>
        </header>

        <main className="px-3 pb-20 pt-3">
          {/* 四个快捷入口 */}
          <section className="grid grid-cols-4 gap-2 mb-3">
            {quickActions.map(({ name, color, href, icon: Icon, count }) => (
              <Link key={name} href={`/${locale}/${href}`} className="flex flex-col items-center justify-center text-[13px] relative">
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg text-xl text-white shadow relative", color)}>
                  <Icon className="h-5 w-5" />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
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
              <div className="h-40 bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
                <span className="text-gray-400">加载中...</span>
              </div>
            ) : (
              <div className={styles.embla}>
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
                              className="object-cover"
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
            <span className="text-black font-medium">{_t("home.hot-games")}</span>
            {/*<button className="text-xs text-blue-600">网络检测</button>*/}
          </section>
          <section className="mb-4 grid grid-cols-3 gap-2">
            {gameHotNew?.hot && gameHotNew?.hot.map((item, index) => (
              <Link key={"hot-games" + index} href={`/${locale}/${item.id}`} className="block">
                <Image src={item.logo || ''} alt={item.name || ''} width={300} height={200} className="w-full rounded-md" />
              </Link>
            ))}
          </section>

          <section className="mb-2 flex items-center justify-between text-[13px]">
            <span className="text-black font-medium">{_t("home.new-games")}</span>
          </section>
          <section className="mb-4 grid grid-cols-3 gap-2">
            {gameHotNew?.new && gameHotNew?.new.map((item, index) => (
              <Link key={"hot-games" + index} href={`/${locale}/${item.id}`} className="block">
                <Image src={item.logo || ''} alt={item.name || ''} width={300} height={200} className="w-full rounded-md" />
              </Link>
            ))}
          </section>



          {/* 底部按钮 */}
          {getConfig && (
            <section className="space-y-3">
              <Link href={getConfig.pc_url} className="block">
                <button className="flex h-11 w-full items-center justify-center rounded-full bg-[#ff3a00] text-[14px] font-medium text-white shadow">电脑版</button>
              </Link>
              <Link href={getConfig.customer_link} className="block">
                <button className="flex h-11 w-full items-center justify-center rounded-full bg-[#ff3a00] text-[14px] font-medium text-white shadow">
                  联系客服
                </button>
              </Link>
            </section>
          )}

        </main>
      </div>

      {/* 首页弹框公告 (type=5) */}
      {showPopup && popupAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full max-h-[70vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-800 text-lg">{popupAnnouncement.title}</h3>
              <button onClick={closePopup} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              <div className="text-sm text-gray-600 leading-relaxed prose prose-sm" dangerouslySetInnerHTML={{ __html: popupAnnouncement.content }} />
            </div>
            <div className="p-4 border-t">
              <button onClick={closePopup} className="w-full bg-[#ff3a00] text-white rounded-full py-2.5 text-sm font-medium hover:bg-[#e63500] transition-colors">
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
