"use client"

import Image from "next/image";
import {useEffect, useRef, useState} from "react";
import * as React from "react";
import {useFormatter, useLocale, useTranslations} from "use-intl";
import {toast} from "sonner";
import {LOCALE_CURRENCY_MAP} from "@/i18n/routing";
import {cardRecords} from "@/api/shop";
import {CardRecordField} from "@/types/shop.type";
import {getSecureToken, clearSecureToken} from "../verify-key";
import {maskString} from "@/utils/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import dayjs from "@/lib/dayjs";

/**
 * 卡密列表
 * @constructor
 */
export default function CardRecordPage() {
  const _t = useTranslations();
  // 格式化金额
  const format = useFormatter();
  const locale = useLocale();
  // 币种符号
  const currency = LOCALE_CURRENCY_MAP[locale] ?? 'USD';

  const [list, setList] = useState<CardRecordField[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [alertDialogContent, setAlertDialogContent] = useState('');


  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  // 请求接口查询卡密数据
  const fetchData = async (pageNo: number) => {
    setLoading(true);

    const t = getSecureToken();

    // 请求接口
    const {code, data, message} = await cardRecords({
      search: {t: t},
      pagination: {
        page: pageNo,
        size: 20,
      }
    })
    await new Promise((r) => setTimeout(r, 554));
    if (code === 200) {
      if (data.length < 20) {
        setHasMore(false);
      }
      if (pageNo == 1) {
        setList([]);
      }
      setList((prev) => [...prev, ...data]);
    } else if (code === 2002) {
      setHasMore(false);
      setAlertDialogContent(message);
      setOpen(true)
    } else {
      setHasMore(false);
      setAlertDialogContent(message);
      setOpen(true)
    }
    setLoading(false);
  };

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

  const refreshList = async () => {
    setHasMore(true);
    setPage(1);
    setList([]);
    await fetchData(1);
  };

  // 单个复制
  const handleCopy = async (n: string, p: string, i: number) => {
    const copiedText = `${n} ${p}`;
    try {
      // 现代浏览器
      await navigator.clipboard.writeText(copiedText);
      toast.success(_t('mine.toolcase.record-copied'));
    } catch {
      // 兼容旧浏览器
      const textarea = document.createElement("textarea");
      textarea.value = copiedText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      toast.success(_t('mine.toolcase.record-copied'));
      return success;
    }
  };

  // 复制所有
  const handleCopyAll = async () => {
    const text = list.filter(item => item.state === 0)
      .map(item => `${item.no} ${item.pwd}`).join("\n");

    try {
      // 现代浏览器
      await navigator.clipboard.writeText(text);
      toast.success(_t('mine.toolcase.record-copied'));
    } catch {
      // 兼容旧浏览器
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      toast.success(_t('mine.toolcase.record-copied'));
      return success;
    }
  };

  return (
    <>
      <div className="flex justify-between items-center px-3 py-2">
        <span className="text-sm font-medium">{_t('mine.toolcase.record-title')}</span>

        <button
          onClick={() => handleCopyAll()}
          className={`text-xs text-blue-600`}>
          {_t('mine.toolcase.record-copy-all')}
        </button>

        <button
          onClick={refreshList}
          className="text-xs text-blue-600"
          disabled={loading}
        >
          {loading ? _t('mine.toolcase.record-refresh-pending') : _t('mine.toolcase.record-refresh')}
        </button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{_t("mine.security-settings.group-account.password.tip")}</AlertDialogTitle>
            <AlertDialogDescription>{alertDialogContent}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              clearSecureToken();
              window.location.reload();
            }}>{_t('common.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 子页面渲染区域 */}
      <div className="p-1">
        {/* 表头 */}
        <div className="grid grid-cols-[0.5fr_0.5fr_1fr_0.7fr_0.4fr] py-2 text-xs text-muted-foreground border-b bg-white">
          <div>{_t('mine.toolcase.record-grid-1')}</div>
          <div className="text-center">{_t('mine.toolcase.record-grid-2')}</div>
          <div className="text-center">{_t('mine.toolcase.record-grid-3')}</div>
          <div className="text-center">{_t('mine.toolcase.record-grid-4')}</div>
          <div className="text-right">{_t('mine.toolcase.record-grid-5')}</div>
        </div>

        {list.map((item, index) => (
          <div
            key={`all-key-${index}`}
            className="grid grid-cols-[0.5fr_0.5fr_1fr_0.7fr_0.4fr] py-1 border-b  items-center"
          >
            {/* 卡号 */}
            <div className="flex justify-start items-center gap-1 font-medium" data-no={item?.no}>
              {maskString(item?.no || '')}
            </div>
            {/* 密码 */}
            <div className="flex justify-center items-center gap-1 font-medium" data-pwd={item?.pwd}>
              {maskString(item?.pwd || '')}
            </div>

            {/* 金豆 */}
            <div className="text-center font-medium ">
              <div className="text-red-500 flex items-center text-center justify-center font-bold">
                {format.number(item.points ?? 0)}
                <Image
                  src="/ranking/coin.png"
                  alt="coin"
                  width={13}
                  height={13}
                  className="inline-block w-[13px] h-[13px]"
                />
              </div>
              <div className="text-xs">{format.number((item.points ?? 0) / 1000, {
                style: 'currency',
                currency: currency
              })}</div>
            </div>
            {/* 获得时间 */}
            <div className="flex h-full flex-col items-center justify-center text-xs leading-tight">
              <div>{dayjs.unix(item?.addtime || 0).format("YYYY-MM-DD")}</div>
              <div>{dayjs.unix(item?.addtime || 0).format("HH:mm")}</div>
            </div>

            {/* 操作 */}
            <div className="flex flex-col items-end">
              {item.state == 0 && (
                <button
                  onClick={() => handleCopy(item.no || '', item.pwd || '', item.id || 0)}
                  className="px-0.5 bg-red-700 cursor-pointer rounded whitespace-nowrap transition">
                  {_t('mine.toolcase.record-copy-one')}
                </button>
              )}
              {item.state != 0 && (
                <span className="text-sm text-[#cccccc]">{item.state_label}</span>
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
      </div>
    </>
  )
}
