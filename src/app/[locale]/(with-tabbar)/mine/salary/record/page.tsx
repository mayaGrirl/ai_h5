"use client"

import Image from "next/image";
import {useEffect, useRef, useState} from "react";
import * as React from "react";
import {useTranslations} from "use-intl";
import {salaryRecords} from "@/api/customer";
import {toast} from "sonner";
import {SalaryRecordField} from "@/types/customer.type";
import dayjs from "@/lib/dayjs";

export default function AllPage() {
  const _t = useTranslations();

  const [list, setList] = useState<SalaryRecordField[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchData = async (pageNo: number) => {
    setLoading(true);

    // 请求接口
    const {code, data, message} = await salaryRecords({
      pagination: {
        page: pageNo,
        size: 20,
      }
    })
    await new Promise((r) => setTimeout(r, 555));
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
    const initList = async () => {
      await fetchData(1);
    }
    void initList();
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
      <div className="grid grid-cols-[0.2fr_0.8fr_0.5fr_1fr] px-3 py-2 text-xs text-muted-foreground border-b bg-white">
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
          <div className="leading-tight">{item.typestr}</div>

          {/* 统计金额 */}
          <div className="text-center font-medium">{item.basecoin}</div>

          {/* 获得工资 */}
          <div className="text-center font-medium text-red-500">
            {item.coin}
            <Image
              src="/ranking/coin.png"
              alt="coin"
              width={13}
              height={13}
              className="inline-block w-[13px] h-[13px]"
            />
          </div>

          {/* 记录日期 */}
          <div className="flex justify-end items-center gap-1 font-medium">
            {dayjs.unix(item?.addtime || 0).format("YYYY-MM-DD")}
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
