"use client"

import {useEffect, useRef, useState} from "react";
import * as React from "react";
import {useFormatter, useLocale, useTranslations} from "use-intl";
import {toast} from "sonner";
import dayjs from "@/lib/dayjs";
import {PageHeader} from "@/components/page-header";
import {agentLogRecord} from "@/api/agent";
import {AgentLogField} from "@/types/agent.type";
import {LOCALE_CURRENCY_MAP} from "@/i18n/routing";

export default function AgentRecycleRecordPage() {
  const _t = useTranslations();
  const locale = useLocale();
  // 格式化金额
  const format = useFormatter();
  // 币种符号
  const currency = LOCALE_CURRENCY_MAP[locale] ?? 'USD';
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [list, setList] = useState<AgentLogField[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchData = async (pageNo: number) => {
    setLoading(true);

    // 请求接口
    const {code, data, message} = await agentLogRecord({
      search: {type: 2},
      pagination: {
        page: pageNo,
        size: 20,
      }
    })
    await new Promise((r) => setTimeout(r, 553));
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
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t('agent.recycle.form-btn-2')}/>

          {/* 表头 */}
          <div className="grid grid-cols-[0.4fr_0.5fr_1fr] px-1 py-1 text-xs text-muted-foreground border-b bg-white">
            <div className="text-center">{_t('agent.recharge.record-grid-1')}</div>
            <div className="text-center">{_t('agent.recharge.record-grid-2')}</div>
            <div className="text-center">{_t('agent.recharge.record-grid-3')}</div>
          </div>

          {list.map((item, index) => (
            <div
              key={`all-key-${index}`}
              className="grid grid-cols-[0.4fr_0.5fr_1fr] px-1 py-1 border-b text-sm items-center"
            >
              {/* 记录日期 */}
              <div className="text-center font-medium">
                <div>{dayjs.unix(item?.addtime || 0).format("YYYY-MM-DD")}</div>
                <div>{dayjs.unix(item?.addtime || 0).format("HH:mm")}</div>
              </div>

              {/* 统计金额 */}
              <div className="text-center font-medium">
                <div className="text-red-600">{item.points}</div>
                <div>
                  {format.number(
                    (item?.points || 0) / 1000,
                    {style: 'currency', currency: currency, minimumFractionDigits: 0}
                  )}
                </div>
              </div>

              {/* 获得工资 */}
              <div className="text-center font-medium">
                {item.content}
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

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  )
}
