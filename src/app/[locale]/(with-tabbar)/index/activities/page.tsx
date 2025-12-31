"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { getActivities } from "@/api/home";
import { IndexDataItem } from "@/types/index.type";
import Link from "next/link";
import {useLocale} from "use-intl";


export default function AnnouncementListPage() {
  const [activities, setAactivities] = useState<IndexDataItem[]>([]);

  const locale = useLocale();

  useEffect(() => {
    getActivities().then(({ code, data }) => {
      if (code === 200 && data) setAactivities(data);
    });
  }, []);

  return (
    <div className="flex min-h-screen justify-center bg-[#eef3f8]">
      <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">

        {/* 顶部标题 */}
        <header className="h-10 bg-[#ff3a00] flex items-center justify-center">
          <span className="text-white text-xl font-black tracking-wide">近期活动</span>
        </header>

        <main className="px-3 pb-20 pt-3">

          {/* 公告列表 */}
          <section className="space-y-3 px-0">
            {activities.map((item) => (
              <Link
                href={`/${locale}/index/activities/${item.id}`}
                key={item.id}
                className="block w-full bg-white rounded-lg shadow-sm overflow-hidden"
              >
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
