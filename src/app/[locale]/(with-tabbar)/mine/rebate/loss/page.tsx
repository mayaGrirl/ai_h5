"use client"

import {useEffect, useRef, useState} from "react";
import {receiveWages, wagesRecords} from "@/api/customer";
import {toast} from "sonner";
import {WagesRecordField} from "@/types/customer.type";
import {useFormatter, useTranslations} from "use-intl";
import * as React from "react";
import dayjs from "@/lib/dayjs";
import {cn} from "@/lib/utils";

export default function LossPage() {
  // 格式化金额
  const format = useFormatter();
  const _t = useTranslations();
  const [list, setList] = useState<WagesRecordField[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [receivingSet, setReceivingSet] = useState<Set<number>>(new Set());

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchData = async (pageNo: number) => {
    setLoading(true);
    // 请求接口
    const {code, data, message} = await wagesRecords({
      pagination: {
        page: pageNo,
        size: 20,
      }
    })
    await new Promise((r) => setTimeout(r, 600));
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

  /**
   * 领取返利
   * @param t
   */
  const handleReceive = async (
    t: number
  ) => {
    // 已经在领取中，直接拦截
    if (receivingSet.has(t)) return;

    // 标记该行正在领取
    setReceivingSet((prev) => new Set(prev).add(t));

    try {
      const {code, data, message} = await receiveWages(t);
      if (code === 200) {
        toast.success(message);
        // 局部更新行状态
        setList(prev => prev.map(item => item.id === t ? data : item))
      } else {
        toast.error(message);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : _t('common.catch-error');
      toast.error(msg);
    } finally {
      // 移除 loading 标记
      setReceivingSet((prev) => {
        const next = new Set(prev);
        next.delete(t);
        return next;
      });
    }
  };

  return (
    <>
      {/* 表头 */}
      <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr_1fr] px-3 py-2 text-xs text-muted-foreground border-b">
        <div className="text-center">{_t('rebate.loss-table-header-1')}</div>
        <div className="text-center">{_t('rebate.loss-table-header-2')}</div>
        <div className="text-center">{_t('rebate.loss-table-header-3')}</div>
        <div className="text-center">{_t('rebate.loss-table-header-4')}</div>
        <div className="text-center">{_t('rebate.loss-table-header-5')}</div>
      </div>
      {list.map((item, index) => (
        <div
          key={`all-key-${index}`}
          className="grid grid-cols-[1.2fr_0.8fr_0.8fr_1fr_1fr] px-3 py-3 border-b text-sm items-center"
        >
          {/* 日期 */}
          <div className="text-center">
            <div className="text-foreground">{dayjs.unix(item?.addtime || 0).format("YYYY-MM-DD HH:mm")}</div>
          </div>

          {/* 亏损 */}
          <div className="text-center font-medium">{format.number(item?.points || 0)}</div>

          {/* 充值 */}
          <div className="text-center font-medium">{format.number((item?.cz || 0) * 1000)}</div>

          {/* 返利 */}
          <div className="text-center font-medium">{format.number(item?.hdpoints || 0)}</div>

          {/* 状态 */}
          <div className="text-center font-medium">
            {item.state === 1 && (
              <div>{item.state_label}({dayjs.unix(item?.gettime || 0).format("HH:mm")})</div>
            )}
            {(item.state === 2 || item.state === 3) && <div>{item.state_label}</div>}
            {(item.state !== 1 && item.state !== 2) && (
              <button
                className={cn(
                  "px-2 py-1 text-xs rounded",
                  receivingSet.has(item.id || 0)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-500 text-white cursor-pointer"
                )}
                onClick={() => handleReceive(item.id || 0)}
              >
                {receivingSet.has(item.id || 0) ? _t("common.form.button.submitting") : _t("rebate.recharge-receive-btn")}
              </button>
            )}
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
