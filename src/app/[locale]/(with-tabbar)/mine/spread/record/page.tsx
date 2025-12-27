"use client"

import {useEffect, useRef, useState} from "react";
import * as React from "react";
import {useTranslations} from "use-intl";
import {receiveRecommendReward, recommendCustomers} from "@/api/customer";
import {toast} from "sonner";
import {RecommendCustomer} from "@/types/customer.type";

export default function AllPage() {
  const _t = useTranslations();

  const [list, setList] = useState<RecommendCustomer[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [receivingLevel, setReceivingLevel] = useState(false);
  const [receivingBet, setReceivingBet] = useState(false);

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
    fetchData(1).then(() => {});
  }, []);

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchData(nextPage).then(() => {
          });
        }
      },
      {threshold: 1}
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [page, hasMore, loading]);

  /**
   * 一键领取奖励(升级 + 投注)
   * @param t
   * @param setLoading
   */
  const handleReceive = async (
    t: number,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setLoading(true);
    try {
      const {code, message} = await receiveRecommendReward({
        type: t
      });
      if (code === 200) {
        toast.success(message);
        // 可选：刷新列表
        setList([]);
        setPage(1);
        fetchData(1).then(() => {});
      } else {
        toast.error(message);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : _t('common.catch-error');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2 px-3">
        <button
          onClick={() => handleReceive(9, setReceivingLevel)}
          disabled={receivingLevel}
          className={`mb-1 h-9 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white
          font-medium transition active:scale-95 ${receivingLevel ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {receivingLevel ? _t("common.form.button.submitting") : _t("recommend.record-receive-btn-1")}
        </button>

        <button
          onClick={() => handleReceive(34, setReceivingBet)}
          disabled={receivingBet}
          className={`mb-1 h-9 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white
          font-medium transition active:scale-95 ${receivingBet ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {receivingBet ? _t("common.form.button.submitting") : _t("recommend.record-receive-btn-2")}
        </button>
      </div>

      {/* 表头 */}
      <div className="grid grid-cols-[0.5fr_1fr_1fr_1fr] px-3 py-2 text-xs text-muted-foreground border-b bg-[#cccccc]">
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
