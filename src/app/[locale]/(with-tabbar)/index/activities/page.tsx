"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { getActivities } from "@/api/home";
import { IndexDataItem } from "@/types/index.type";
import Link from "next/link";
import {useLocale, useTranslations} from "use-intl";
import {PageHeader} from "@/components/page-header";


export default function AnnouncementListPage() {
  const [activities, setAactivities] = useState<IndexDataItem[]>([]);
  const _t = useTranslations();

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
        <PageHeader title={_t("近期活动")}/>

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
