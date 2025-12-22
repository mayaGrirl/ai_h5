"use client"

import Image from "next/image";
import {useEffect, useRef, useState} from "react";
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
          fetchData(nextPage).then(() => {});
        }
      },
      {threshold: 1}
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [page, hasMore, loading]);

  return (
    <>
      {list.map((item, index) => (
        <div
          key={`all-key-${index}`}
          className="grid grid-cols-[1.2fr_0.8fr] px-3 py-3 border-b text-sm items-center"
        >
          <div className="leading-tight">
            <div className=" text-muted-foreground">
              {_t('mine.salary.receive-grid-1', {start: '2025-12-14', end: '2025-12-20'})}
            </div>
            <div className="mt-0.5 text-foreground">
              {_t('mine.salary.receive-grid-2')} <span className="text-red-500 font-semibold ml-1">49</span>
              <Image
                className="inline-block w-[13px] h-[13px]"
                src="/ranking/coin.png"
                alt="gold"
                width={13}
                height={13}
              />
            </div>
          </div>

          <div className="flex justify-end items-center gap-1 text-red-500 font-medium cursor-pointer">{_t('mine.salary.receive-grid-btn')}</div>
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
