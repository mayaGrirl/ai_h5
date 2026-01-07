"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { IndexDataItem } from "@/types/index.type";
import { getIndexDetail } from "@/api/home";
import { useParams, useRouter } from "next/navigation";
import {PageHeader} from "@/components/page-header";
import {useTranslations} from "use-intl";

export default function AnnouncementDetailPage() {
  const { id } = useParams();
  const _t = useTranslations();

  const [detail, setDetail] = useState<IndexDataItem | null>(null);

  useEffect(() => {
    if (!id) return;

    getIndexDetail(Number(id)).then(({ code, data }) => {
      if (code === 200 && data) setDetail(data);
    });
  }, [id]);

  if (!detail)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        加载中...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#eef3f8] overflow-auto">
      <div className="w-full max-w-xl mx-auto bg-[#f5f7fb] shadow-sm">

        {/* 顶部导航 */}
        <PageHeader title={_t("近期公告")}/>

        <main className="px-4 py-5 pb-20">
          <div className="text-xs text-gray-500">发布于 {detail.created_at}</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{detail.title}</div>
          {detail.pic && (
            <img
              src={detail.pic}
              className="mt-4 w-full rounded-lg shadow"
              alt={detail.title}
            />
          )}
          <div
            className="mt-4 text-gray-700 leading-7"
            dangerouslySetInnerHTML={{ __html: detail.content }}
          />

        </main>
      </div>
    </div>
  );
}
