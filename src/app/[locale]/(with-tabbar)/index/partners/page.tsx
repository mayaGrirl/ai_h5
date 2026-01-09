"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { getPartners } from "@/api/home";
import { IndexDataItem } from "@/types/index.type";
import Link from "next/link";
import { useLocale, useTranslations } from "use-intl";
import { PageHeader } from "@/components/page-header";
import { UsersRound, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

// 骨架屏组件
const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-blue-400/50 rounded", className)} />
);

// 合作商家卡片骨架屏
const PartnerSkeleton = () => (
  <div className="bg-gradient-to-b from-[#1e9bff] to-[#0063f8] rounded-xl p-3 shadow-md min-h-[90px]">
    <div className="flex items-center gap-2 mb-2">
      <Skeleton className="w-8 h-8 rounded-lg" />
      <Skeleton className="h-4 w-20" />
    </div>
    <Skeleton className="h-3 w-full mb-1" />
    <Skeleton className="h-3 w-3/4" />
  </div>
);

export default function PartnersPage() {
  const _t = useTranslations();
  const [partners, setPartners] = useState<IndexDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);
  const locale = useLocale();

  useEffect(() => {
    setTimeout(() => setPageLoaded(true), 100);

    getPartners()
      .then(({ code, data }) => {
        if (code === 200 && data) setPartners(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex justify-center bg-[#eef3f8] overflow-auto">
      <div className={cn(
        "w-full max-w-xl bg-[#f5f7fb] shadow-sm transition-opacity duration-500",
        pageLoaded ? "opacity-100" : "opacity-0"
      )}>

        {/* 顶部标题 */}
        <PageHeader title={_t("合作商家")}/>

        <main className="px-3 pb-24 pt-3">

          {loading ? (
            // 骨架屏加载
            <section className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <PartnerSkeleton key={`skeleton-${i}`} />
              ))}
            </section>
          ) : partners.length === 0 ? (
            // 空状态
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <UsersRound className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-sm">暂无合作商家</p>
            </div>
          ) : (
            // 合作商家列表
            <section className="grid grid-cols-2 gap-3">
              {partners.map((item, index) => (
                <Link
                  href={item.jump_url || "#"}
                  key={item.id}
                  className="bg-gradient-to-br from-[#1e9bff] via-[#0080ff] to-[#0063f8] rounded-xl p-3 shadow-lg text-white min-h-[90px] flex hover:shadow-xl transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-1 active:scale-[0.98]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.pic ? (
                          <Image
                            src={item.pic}
                            alt={item.title}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UsersRound className="w-5 h-5 text-white/80" />
                        )}
                      </div>
                      <div className="font-bold text-sm truncate flex-1">{item.title}</div>
                      <ExternalLink className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
                    </div>

                    <div
                      className="mt-2 text-[11px] leading-[15px] text-white/80 whitespace-pre-line overflow-hidden line-clamp-3"
                      dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                  </div>
                </Link>
              ))}
            </section>
          )}

        </main>
      </div>
    </div>
  );
}
