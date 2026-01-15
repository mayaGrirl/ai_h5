"use client";

import * as React from "react";
import {useEffect, useRef, useState} from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {PageHeader} from "@/components/page-header";
import {toast} from "sonner";
import {systemMessage} from "@/api/home";
import {useTranslations} from "use-intl";
import {IndexDataItem} from "@/types/index.type";

export default function Mine() {
  // 页面需要登陆Hook
  useRequireLogin();
  const _t = useTranslations();
  const [list, setList] = useState<IndexDataItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchData = async (pageNo: number) => {
    setLoading(true);
    // 请求接口
    const {code, data, message} = await systemMessage({
      pagination: {
        page: pageNo,
        size: 20,
      }
    })
    await new Promise((r) => setTimeout(r, 499));
    if (code === 200) {
      setLoading(false);
      if (data.length < 20) {
        setHasMore(false);
      }
      if (pageNo == 1) {
        setList([]);
      }
      setList((prev) => [...prev, ...data]);
    } else {
      toast.error(message);
    }
  };

  useEffect(() => {
    const levelOptions = async () => {
      await fetchData(1);
    }
    void levelOptions();
  }, []);

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          void fetchData(nextPage);
        }
      },
      {threshold: 1}
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [page, hasMore, loading]);

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t('mine.quick.mail')} />

          <div className="flex flex-col gap-2 px-3 mt-2">
            {list.map((item, index) => (
              <div key={index} className="bg-card text-card-foreground gap-2 rounded-xl border py-2 px-2 shadow-sm">
                <div className="flex justify-between">
                  {/*<span className="text-gray-500">标题：</span>*/}
                  <div className="font-bold text-lg">{item?.title}</div>
                  <div>{item?.created_at}</div>
                </div>
                <div>
                  {item.content}
                </div>
              </div>
            ))}
          </div>

          {/* 底部哨兵 */}
          {hasMore && (
            <div ref={loadMoreRef} className="py-4 text-center text-xs text-gray-400">
              {loading ? _t("common.loading") : _t("common.loading-hit")}
            </div>
          )}

          {!hasMore && (
            <div className="py-4 text-center text-xs text-gray-400">
              {_t("common.loading-list-empty")}
            </div>
          )}

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  );
}
