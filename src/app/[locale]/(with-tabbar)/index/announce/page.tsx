"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { getAnnouncements } from "@/api/home";
import { IndexDataItem } from "@/types/index.type";
import Link from "next/link";
import { useLocale, useTranslations } from "use-intl";
import { PageHeader } from "@/components/page-header";
import { Bell, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

// 骨架屏组件
const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-gray-200 rounded", className)} />
);

// 公告卡片骨架屏
const AnnouncementSkeleton = () => (
  <div className="bg-white rounded-xl px-4 py-4 shadow-sm">
    <Skeleton className="h-3 w-24 mb-2" />
    <Skeleton className="h-5 w-3/4 mb-2" />
    <Skeleton className="h-32 w-full rounded-lg" />
  </div>
);

// 👉 图片占位（假数据）
const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/500x200.png?text=Announcement";

export default function AnnouncementListPage() {
  const _t = useTranslations();
  const [announcements, setAnnouncements] = useState<IndexDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);

  const locale = useLocale();

  useEffect(() => {
    setTimeout(() => setPageLoaded(true), 100);

    getAnnouncements()
      .then(({ code, data }) => {
        if (code === 200 && data) setAnnouncements(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen justify-center bg-[#eef3f8]">
      <div
        className={cn(
          "w-full max-w-xl bg-[#f5f7fb] shadow-sm transition-opacity duration-500",
          pageLoaded ? "opacity-100" : "opacity-0"
        )}
      >
        {/* 顶部标题 */}
        <PageHeader title={_t("近期公告")} />

        <main className="px-3 pb-20 pt-3">
          {/* 公告列表 */}
          <section className="space-y-3">
            {loading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <AnnouncementSkeleton key={`skeleton-${i}`} />
                ))}
              </>
            ) : announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Bell className="h-16 w-16 mb-4 text-gray-300" />
                <p className="text-sm">暂无公告</p>
              </div>
            ) : (
              announcements.map((item, index) => (
                <Link
                  href={`/${locale}/index/announce/${item.id}`}
                  key={item.id}
                  className="block bg-white rounded-xl px-4 py-4 shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                        <Bell className="h-3 w-3" />
                        <span>发布于 {item.created_at}</span>
                      </div>
                      <div className="text-base font-semibold text-gray-900 line-clamp-2">
                        {item.title}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 flex-shrink-0 ml-2" />
                  </div>

                  {/* ✅ 图片始终显示（无 pic 时用占位图） */}
                  <div className="mt-3 rounded-lg overflow-hidden">
                    <Image
                      src={item.pic || PLACEHOLDER_IMAGE}
                      alt={item.title}
                      width={500}
                      height={200}
                      className="w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                </Link>
              ))
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
