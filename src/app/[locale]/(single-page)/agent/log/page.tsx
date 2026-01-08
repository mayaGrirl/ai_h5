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
import {cn} from "@/lib/utils";
import {Search} from "lucide-react";

export default function AgentLogPage() {
  const _t = useTranslations();
  const locale = useLocale();
  // 格式化金额
  const format = useFormatter();
  // 币种符号
  const currency = LOCALE_CURRENCY_MAP[locale] ?? 'USD';

  const [keyword, setKeyword] = useState<string>("");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const [list, setList] = useState<AgentLogField[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchData = async (pageNo: number, uid?: string) => {
    setLoading(true);

    // 请求接口
    const {code, data, message} = await agentLogRecord({
      search: uid ? {uid: uid} : {},
      pagination: {
        page: pageNo,
        size: 20,
      }
    })
    await new Promise((r) => setTimeout(r, 552));
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
    if (!loadMoreRef.current || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          void fetchData(nextPage, keyword || undefined);
        }
      },
      {threshold: 1}
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [page, hasMore, loading, keyword]);

  const searchList = async () => {
    if (keyword?.trim()?.length < 1) return;

    setHasMore(true);
    setPage(1);
    setList([]);

    await fetchData(1, keyword);
  };

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t('agent.recharge.record-title')}/>

          {/* 表头 */}
          <div className="flex gap-2 px-3 py-2 text-xs text-muted-foreground border-b bg-white">
            <div className={cn(
              "relative flex w-full items-center rounded-2xl border border-input bg-background shadow-xs",
              "h-9 transition-[color,box-shadow]",
              "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
              "aria-invalid:border-destructive aria-invalid:ring-destructive/20"
            )}
            >
              {/* 左侧搜索图标 */}
              <div className="absolute left-2 flex items-center text-muted-foreground cursor-pointer">
                <Search className="h-4 w-4"/>
              </div>

              {/* 输入框 */}
              <input
                type="text"
                placeholder={_t('agent.recharge.form-uid-placeholder')}
                onChange={(e) => setKeyword(e.target.value)}
                className={cn(
                  "h-full w-full rounded-2xl bg-transparent text-base md:text-sm",
                  "pl-8 pr-3",
                  "outline-none border-0 shadow-none",
                  "placeholder:text-muted-foreground",
                  "disabled:pointer-events-none disabled:opacity-50"
                )}
              />
            </div>
            {/* 右侧搜索按钮 */}
            <button
              suppressHydrationWarning
              className="h-9 shrink-0 rounded-xl bg-blue-600 px-4 text-white text-sm transition
              active:scale-95 hover:bg-blue-700"
              onClick={searchList}
              disabled={loading}
            >
              <Search/>
            </button>
          </div>

          <div className="flex flex-col gap-2 px-3 mt-2">
            {list.map((item, index) => (
              <div key={index} className="bg-card text-card-foreground gap-2 rounded-xl border py-2 px-2 shadow-sm">
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <span className="text-gray-500">{_t('agent.log.grid-1')}：</span>
                  {item.type_label}
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <span className="text-gray-500">{_t('agent.log.grid-2')}：</span>
                  <div>
                    <strong>
                      {format.number((item.points ?? 0), {
                        minimumFractionDigits: 0
                      })}
                    </strong>
                    <span className="text-sm">
                      (
                      {format.number((item.points ?? 0) / 1000, {
                        style: 'currency',
                        currency: currency,
                        minimumFractionDigits: 0
                      })}
                      )
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <span className="text-gray-500">{_t('agent.log.grid-3')}：</span>
                  {format.number((item.totalpoints ?? 0), {
                    minimumFractionDigits: 0
                  })}
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <span className="text-gray-500">{_t('agent.log.grid-4')}：</span>
                  {dayjs.unix(item?.addtime || 0).format("YYYY-MM-DD HH:mm")}
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <span className="text-gray-500">{_t('agent.log.grid-5')}：</span>
                  {item.content}
                </div>
              </div>
            ))}
          </div>

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
