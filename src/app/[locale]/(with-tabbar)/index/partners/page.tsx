"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { getPartners } from "@/api/home";
import { IndexDataItem } from "@/types/index.type";
import Link from "next/link";
import {useLocale, useTranslations} from "use-intl";
import {PageHeader} from "@/components/page-header";

export default function PartnersPage() {
  const _t = useTranslations();
  const [partners, setPartners] = useState<IndexDataItem[]>([]);
  const locale = useLocale();

  useEffect(() => {
    getPartners().then(({ code, data }) => {
      if (code === 200 && data) setPartners(data);
    });
  }, []);

  return (
    <div className="min-h-screen flex justify-center bg-[#eef3f8] overflow-auto">
      <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">

        {/* 顶部标题 */}
        <PageHeader title={_t("合作商家")}/>

        <main className="px-2 pb-24 pt-2">

          <section className="grid grid-cols-2 gap-2 mb-1">
            {partners.map((item) => (
              <Link
                href="#"
                key={item.id}
                className="bg-gradient-to-b from-[#1e9bff] to-[#0063f8] rounded-lg p-2 shadow-md text-white min-h-[75px] flex"
              >
                <div className="flex flex-col w-full">

                  <div className="flex items-center gap-2">
                    <img
                      src={item.pic || "/placeholder.png"}
                      alt={item.title}
                      className="w-6 h-6 rounded bg-white flex-shrink-0"
                    />
                    <div className="font-bold text-sm truncate">{item.title}</div>
                  </div>

                  <div
                    className="mt-1 text-[10px] leading-[13px] whitespace-pre-line overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />
                </div>
              </Link>
            ))}
          </section>

        </main>
      </div>
    </div>
  );
}
