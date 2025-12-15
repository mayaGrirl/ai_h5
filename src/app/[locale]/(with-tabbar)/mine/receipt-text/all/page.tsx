"use client"

import Image from "next/image";
import {useEffect, useRef, useState} from "react";

export default function AllPage() {
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
      {list.map((item, index) => (
        <div
          key={`all-key-${index}`}
          className="grid grid-cols-[1.2fr_0.8fr_1fr] px-3 py-3 border-b text-sm items-center"
          // onTouchStart={onTouchStart}
          // onTouchMove={onTouchMove}
        >
          {/* 来源 + 时间 */}
          <div className="leading-tight">
            <div className="text-foreground">银行存储</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              12-15 16:07:12
            </div>
          </div>

          {/* 金额 */}
          <div className="text-center font-medium text-red-500">
            10000
          </div>

          {/* 余额 */}
          <div className="flex justify-end items-center gap-1 text-red-500 font-medium">
            20000
            <Image
              src="/ranking/coin.png"
              alt="coin"
              width={14}
              height={14}
              className="inline-block w-[13px] h-[13px]"
            />
          </div>
        </div>
      ))}

      {/* 底部哨兵 */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-4 text-center text-xs text-gray-400">
          {loading ? "加载中..." : "上拉加载更多"}
        </div>
      )}

      {!hasMore && (
        <div className="py-4 text-center text-xs text-gray-400">
          没有更多数据了
        </div>
      )}
    </>
  )
}
