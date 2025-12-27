"use client"

import Image from "next/image";
import {useEffect, useRef, useState} from "react";
import {depositRecords} from "@/api/customer";
import {toast} from "sonner";
import {DepositRecordField} from "@/types/customer.type";
import {useFormatter, useTranslations} from "use-intl";

export default function LossPage() {
  // 格式化金额
  const format = useFormatter();
  const _t = useTranslations();
  const [list, setList] = useState<DepositRecordField[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchData = async (pageNo: number) => {
    setLoading(true);
    // 请求接口
    const {code, data, message} = await depositRecords({
      pagination: {
        page: pageNo,
        size: 20,
      }
    })
    await new Promise((r) => setTimeout(r, 500));
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
      {list.map((item, index) => (
        <div
          key={`all-key-${index}`}
          className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr] px-3 py-3 border-b text-sm items-center"
        >
          {/* 来源 */}
          <div className="text-center">
            <div className="text-foreground">{item?.type_label || ''}</div>
          </div>

          {/* 金额 */}
          <div className="text-center font-medium text-red-500">{format.number(item?.b_deposit || 0)}</div>

          {/* 金额 */}
          <div className="text-center font-medium text-red-500">{format.number(item?.deposit || 0)}</div>

          {/* 余额 */}
          <div className="flex justify-center items-center gap-1 text-red-500 font-medium">
            {format.number(item?.a_deposit || 0)}
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
