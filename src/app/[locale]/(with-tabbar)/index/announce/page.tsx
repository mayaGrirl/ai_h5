"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { getAnnouncements } from "@/api/home";
import { IndexDataItem } from "@/types/index.type";
import Link from "next/link";
import {useLocale, useTranslations} from "use-intl";
import {PageHeader} from "@/components/page-header";


export default function AnnouncementListPage() {
  const _t = useTranslations();
  const [announcements, setAnnouncements] = useState<IndexDataItem[]>([]);

  const locale = useLocale();

  useEffect(() => {
    getAnnouncements().then(({ code, data }) => {
      if (code === 200 && data) setAnnouncements(data);
    });
  }, []);

  return (
    <div className="flex min-h-screen justify-center bg-[#eef3f8]">
      <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">

        {/* 顶部标题 */}
        <PageHeader title={_t("近期公告")}/>

        <main className="px-3 pb-20 pt-3">

          {/* 公告列表 */}
          <section className="space-y-3">
            {announcements.map((item) => (
              <Link href={`/${locale}/index/announce/${item.id}`}
                key={item.id}
                className="block bg-white rounded-lg px-4 py-3 shadow-sm cursor-pointer"
              >
                <div className="text-xs text-gray-500">发布于 {item.created_at}</div>
                <div className="mt-1 text-base font-semibold text-gray-900">{item.title}</div>
                {item.pic && (
                  <img
                    src={item.pic}
                    className="w-full"
                    alt={item.title}
                  />
                )}
              </Link>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
