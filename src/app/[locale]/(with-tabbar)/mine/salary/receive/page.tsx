"use client"

import Image from "next/image";
import {useEffect, useRef, useState} from "react";
import {useTranslations} from "use-intl";
import {receiveSalaryZ, receiveSalaryZAll, salaryZRecords} from "@/api/customer";
import {toast} from "sonner";
import {SalaryZRecordField} from "@/types/customer.type";
import dayjs from "@/lib/dayjs";
import * as React from "react";
import {cn} from "@/lib/utils";

export default function ReceivePage() {
  const _t = useTranslations();

  const [list, setList] = useState<SalaryZRecordField[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchData = async (pageNo: number) => {
    setLoading(true);

    // 请求接口
    const {code, data, message} = await salaryZRecords({
      pagination: {
        page: pageNo,
        size: 20,
      }
    })
    await new Promise((r) => setTimeout(r, 700));
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
  // 默认加载第一页数据
  useEffect(() => {
    const initList = async () => {
      await fetchData(1);
    }
    void initList();
  }, []);
  // 加载更多
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


  const [receivingSet, setReceivingSet] = useState<Set<number>>(new Set());
  /**
   * 领取工资
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
      const {code, data, message} = await receiveSalaryZ(t);
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
  const [receivingAll, setReceivingAll] = useState(false);
  // 一键领取

  /**
   * 一键领取工资
   * @param t
   * @param setLoading
   */
  const handleReceiveAll = async (
    setLoading: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setLoading(true);
    try {
      const {code, message} = await receiveSalaryZAll();
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
      <div className="grid px-3">
        {list.length > 0 && (
          <button
            onClick={() => handleReceiveAll(setReceivingAll)}
            disabled={receivingAll}
            className={`mb-1 h-9 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white
          font-medium transition active:scale-95 ${receivingAll ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {receivingAll ? _t("common.form.button.submitting") : _t("mine.salary.receive-all-btn")}
          </button>
        )}
      </div>
      {list.map((item, index) => (
        <div
          key={`all-key-${index}`}
          className="grid grid-cols-[1.2fr_0.8fr] px-3 py-3 border-b text-sm items-center"
        >
          <div className="leading-tight">
            <div className=" text-muted-foreground">
              {_t('mine.salary.receive-grid-1', {start: dayjs.unix(item?.ctdateA || 0).format("YYYY-MM-DD"), end: dayjs.unix(item?.ctdateB || 0).format("YYYY-MM-DD")})}
            </div>
            <div className="mt-0.5 text-foreground">
              {_t('mine.salary.receive-grid-2')} <span className="text-red-500 font-semibold ml-1">{item.coin}</span>
              <Image
                className="inline-block w-[13px] h-[13px]"
                src="/ranking/coin.png"
                alt="gold"
                width={13}
                height={13}
              />
            </div>
          </div>

          <div className={"flex justify-end items-center gap-1 font-medium"}>
            {item.status === 0 && (
              <button
                className={cn(
                  "px-2 py-1 text-xs rounded",
                  receivingSet.has(item.id || 0)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-500 text-white cursor-pointer"
                )}
                onClick={() => handleReceive(item.id || 0)}
              >
                {receivingSet.has(item.id || 0) ? _t("common.form.button.submitting") : _t("mine.salary.receive-grid-btn")}
              </button>
            )}
            {item.status !== 0 && (
              <div className={"grid justify-items-end"}>
                {item.status_label}
                <div>({dayjs.unix(item?.gettime || 0).format("YYYY-MM-DD HH:mm")})</div>
              </div>
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
