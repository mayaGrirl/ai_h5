"use client"

import {useEffect, useRef, useState} from "react";
import * as React from "react";
import {useTranslations} from "use-intl";
import {signRecords} from "@/api/customer";
import {toast} from "sonner";
import {SignInRecord} from "@/types/customer.type";

export default function SignRecordPage() {
  const _t = useTranslations();

  const [list, setList] = useState<SignInRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchData = async (pageNo: number) => {
    setLoading(true);

    // 接口
    const {code, data, message} = await signRecords({
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
      if (pageNo == 1) {
        setList([]);
      }
      setList((prev) => [...prev, ...data]);
    } else {
      toast.error(message);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchData(1);
    }
    void init();
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
      {/* 表头 */}
      <div className="grid grid-cols-[0.5fr_1fr_1fr] px-3 py-2 text-xs text-muted-foreground border-b bg-[#cccccc]">
        <div className="text-center">{_t("mine.sign-in.record-table-header-1")}</div>
        <div className="text-center">{_t("mine.sign-in.record-table-header-2")}</div>
        <div className="text-center">{_t("mine.sign-in.record-table-header-3")}</div>
      </div>

      {list.map((item, index) => (
        <div
          key={`record-key-${index}`}
          className="grid grid-cols-[0.5fr_1fr_1fr] px-3 py-3 border-b text-sm items-center"
        >
          {/* 金豆 */}
          <div className="text-center font-medium">{item?.reward_points || 0}</div>
          {/* 积分 */}
          <div className="text-center font-medium">{item?.reward_base_coin || 0}</div>
          {/* 日期 */}
          <div className="text-center font-medium">{item?.sign_date || ''}</div>
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
