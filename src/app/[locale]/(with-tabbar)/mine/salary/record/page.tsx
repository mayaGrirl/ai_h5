"use client"

import Image from "next/image";
import {useEffect, useRef, useState} from "react";
import * as React from "react";
import {useTranslations} from "use-intl";

export default function AllPage() {
  const _t = useTranslations();

  const [list, setList] = useState<unknown[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchData = async (pageNo: number) => {
    setLoading(true);

    // 模拟接口
    await new Promise((r) => setTimeout(r, 1000));

    const newData = Array.from({length: 20}).map((_, i) => ({
      id: `${pageNo}-${i}`,
      title: "银行存储",
      time: "12-15 16:07:12",
      amount: 1000,
      balance: 20000,
    }));

    setList((prev) => [...prev, ...newData]);
    setHasMore(pageNo < 5); // 模拟 5 页结束
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(1).then(() => {});
  }, []);

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchData(nextPage);
        }
      },
      {threshold: 1}
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [page, hasMore, loading]);

  return (
    <>
      {/* 表头 */}
      <div className="grid grid-cols-[0.2fr_0.8fr_0.5fr_1fr] px-3 py-2 text-xs text-muted-foreground border-b">
        <div>{_t('mine.salary.record-grid-1')}</div>
        <div className="text-center">{_t('mine.salary.record-grid-2')}</div>
        <div className="text-center">{_t('mine.salary.record-grid-3')}</div>
        <div className="text-right">{_t('mine.salary.record-grid-4')}</div>
      </div>

      {list.map((item, index) => (
        <div
          key={`all-key-${index}`}
          className="grid grid-cols-[0.2fr_0.8fr_0.5fr_1fr] px-3 py-3 border-b text-sm items-center"
        >
          {/* 类型 */}
          <div className="leading-tight">
            游戏
          </div>

          {/* 统计金额 */}
          <div className="text-center font-medium">
            976610
          </div>

          {/* 获得工资 */}
          <div className="text-center font-medium text-red-500">
            49
            <Image
              src="/ranking/coin.png"
              alt="coin"
              width={14}
              height={14}
              className="inline-block w-[13px] h-[13px]"
            />
          </div>

          {/* 记录日期 */}
          <div className="flex justify-end items-center gap-1 font-medium">
            2025-12-21
          </div>
        </div>
      ))}

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
    </>
  )
}
