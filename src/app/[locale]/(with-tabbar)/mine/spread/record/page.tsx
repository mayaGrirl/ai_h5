"use client"

import {useEffect, useRef, useState} from "react";
import * as React from "react";
import {useTranslations} from "use-intl";
import {recommendCustomers} from "@/api/customer";
import {toast} from "sonner";
import {RecommendCustomer} from "@/types/customer.type";

export default function AllPage() {
  const _t = useTranslations();

  const [list, setList] = useState<RecommendCustomer[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchData = async (pageNo: number) => {
    setLoading(true);

    // 模拟接口
    const {code, data, message} = await recommendCustomers({
      pagination: {
        page: pageNo,
        size: 20,
      }
    })
    await new Promise((r) => setTimeout(r, 1000));
    if (code === 200) {
      setLoading(false);
      if (data.length < 20) {
        setHasMore(false); // 模拟 5 页结束
      }
      setList((prev) => [...prev, ...data]);
    } else {
      toast.error(message);
    }
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
      {/* 表头 */}
      <div className="grid grid-cols-[0.5fr_1fr_1fr_1fr] px-3 py-2 text-xs text-muted-foreground border-b">
        <div className="text-center">{_t("recommend.record-table-header-1")}</div>
        <div className="text-center">{_t("recommend.record-table-header-2")}</div>
        <div className="text-center">{_t("recommend.record-table-header-3")}</div>
        <div className="text-center">{_t("recommend.record-table-header-4")}</div>
      </div>

      {list.map((item, index) => (
        <div
          key={`record-key-${index}`}
          className="grid grid-cols-[0.5fr_1fr_1fr_1fr] px-3 py-3 border-b text-sm items-center"
        >
          {/* 昵称 */}
          <div className="leading-tight">{item?.nickname || ''}</div>

          {/* 生态值 */}
          <div className="text-center font-medium">{item?.experience || 0}</div>

          {/* 今日提成 */}
          <div className="text-center font-medium">{item?.tzpoints || 0}</div>

          {/* 累计提成 */}
          <div className="text-center font-medium">{item?.tgall || 0}</div>
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
