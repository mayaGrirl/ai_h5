"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { IndexDataItem } from "@/types/index.type";
import { getIndexDetail } from "@/api/home";
import { useParams, useRouter } from "next/navigation";

export default function AnnouncementDetailPage() {
  const { id } = useParams();
  const router = useRouter();

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
        <header className="h-8 bg-[#ff3a00] flex items-center px-3 sticky top-0 z-10">
          <ArrowLeft className="w-6 h-3 text-white cursor-pointer" onClick={() => router.back()} />
          <span className="text-white text-xl font-black tracking-wide ml-3">活动详情</span>
        </header>

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
