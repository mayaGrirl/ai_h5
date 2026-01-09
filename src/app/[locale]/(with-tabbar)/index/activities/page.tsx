"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { getActivities } from "@/api/home";
import { IndexDataItem } from "@/types/index.type";
import Link from "next/link";
import { useLocale, useTranslations } from "use-intl";
import { PageHeader } from "@/components/page-header";
import { Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

// 骨架屏组件
const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-gray-200 rounded", className)} />
);

// 活动卡片骨架屏
const ActivitySkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
    <Skeleton className="w-full aspect-[2/1]" />
  </div>
);

export default function ActivitiesListPage() {
  const [activities, setActivities] = useState<IndexDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);
  const _t = useTranslations();

  const locale = useLocale();

  useEffect(() => {
    setTimeout(() => setPageLoaded(true), 100);

    getActivities()
      .then(({ code, data }) => {
        if (code === 200 && data) setActivities(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen justify-center bg-[#eef3f8]">
      <div className={cn(
        "w-full max-w-xl bg-[#f5f7fb] shadow-sm transition-opacity duration-500",
        pageLoaded ? "opacity-100" : "opacity-0"
      )}>

        {/* 顶部标题 */}
        <PageHeader title={_t("近期活动")}/>

        <main className="px-3 pb-20 pt-3">

          {/* 活动列表 */}
          <section className="space-y-3">
            {loading ? (
              // 骨架屏加载
              <>
                {[1, 2, 3].map((i) => (
                  <ActivitySkeleton key={`skeleton-${i}`} />
                ))}
              </>
            ) : activities.length === 0 ? (
              // 空状态
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Star className="h-16 w-16 mb-4 text-gray-300" />
                <p className="text-sm">暂无活动</p>
              </div>
            ) : (
              // 活动列表
              activities.map((item, index) => (
                <Link
                  href={`/${locale}/index/activities/${item.id}`}
                  key={item.id}
                  className="block w-full bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  {item.pic ? (
                    <div className="relative overflow-hidden">
                      <Image
                        src={item.pic}
                        alt={item.title}
                        width={600}
                        height={300}
                        className="w-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                      {/* 活动标题悬浮层 */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <h3 className="text-white font-bold text-sm truncate">{item.title}</h3>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900">{item.title}</h3>
                    </div>
                  )}
                </Link>
              ))
            )}
          </section>

        </main>
      </div>
    </div>
  );
}
