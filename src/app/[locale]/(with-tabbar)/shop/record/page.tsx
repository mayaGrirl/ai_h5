"use client"

import Image from "next/image";
import {useEffect, useRef, useState} from "react";
import * as React from "react";
import {useFormatter, useLocale, useTranslations} from "use-intl";
import {toast} from "sonner";
import {PageHeader} from "@/components/page-header";
import {LOCALE_CURRENCY_MAP} from "@/i18n/routing";
import {depositRecords} from "@/api/customer";
import {DepositRecordField} from "@/types/customer.type";

export default function ExchangeRecordPage() {
  const _t = useTranslations();
  // 格式化金额
  const format = useFormatter();
  const locale = useLocale();
  // 币种符号
  const currency = LOCALE_CURRENCY_MAP[locale] ?? 'USD';

  const [list, setList] = useState<DepositRecordField[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchData = async (pageNo: number) => {
    setLoading(true);

    // 请求接口
    const {code, data, message} = await depositRecords({
      search: {type: 14},
      pagination: {
        page: pageNo,
        size: 20,
      }
    })
    await new Promise((r) => setTimeout(r, 554));
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
          <PageHeader title={'兑换记录'}/>

          {/* 子页面渲染区域 */}
          <div className="p-2">
            {/* 表头 */}
            <div className="grid grid-cols-[1fr_1fr_1fr] px-3 py-2 text-xs text-muted-foreground border-b bg-white">
              <div>{_t('shop.record-grid-1')}</div>
              <div className="text-center">{_t('shop.record-grid-2')}</div>
              <div className="text-right">{_t('shop.record-grid-3')}</div>
            </div>

            {list.map((item, index) => (
              <div
                key={`all-key-${index}`}
                className="grid grid-cols-[1fr_1fr_1fr] px-3 py-1 border-b  items-center"
              >
                {/* 记录日期 */}
                <div className="flex justify-start items-center gap-1 font-medium">
                  {item?.created_at}
                </div>

                {/* 兑换金豆 */}
                <div className="text-center font-medium ">
                  <div className="text-red-500 flex items-center text-center justify-center">
                    {format.number(item.deposit ?? 0)}
                    <Image
                      src="/ranking/coin.png"
                      alt="coin"
                      width={13}
                      height={13}
                      className="inline-block w-[13px] h-[13px]"
                    />
                  </div>
                  <div className="text-xs">{format.number((item.deposit ?? 0) / 1000, {style: 'currency', currency: currency})}</div>
                </div>

                {/* 银行余额 */}
                <div className="flex flex-col items-end font-medium ">
                  <div className="text-red-500 flex items-center text-center justify-center">
                    {format.number(item.a_deposit ?? 0)}
                    <Image
                      src="/ranking/coin.png"
                      alt="coin"
                      width={13}
                      height={13}
                      className="inline-block w-[13px] h-[13px]"
                    />
                  </div>
                  <div className="text-xs">{format.number((item.a_deposit ?? 0) / 1000, {style: 'currency', currency: currency})}</div>
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
          </div>

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  )
}
