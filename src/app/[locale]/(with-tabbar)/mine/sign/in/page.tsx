"use client"

import {useEffect, useState} from "react";
import {signIn, signStat} from "@/api/customer";
import {toast} from "sonner";
import {useTranslations} from "use-intl";
import {SignInStatisticsField} from "@/types/customer.type";
import * as React from "react";

export default function SignInPage() {
  const _t = useTranslations();

  // 是否已签到
  const [isSign, setIsSign] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statData, setStatData] = useState<SignInStatisticsField>();

  useEffect(() => {
    const fetchContent = async () => {
      const {data} = await signStat();
      setStatData(data);
      if (data.is_sign) {
        setIsSign(true);
      }
    };
    void fetchContent();
  }, []);

  /**
   * 签到
   */
  const handleSign = async () => {
    if (isSign) {
      return;
    }
    setIsLoading(true);
    try {
      const {code, message, data} = await signIn();
      if (code === 200) {
        toast.success(message);

        setStatData(prev => {
          if (!prev) return prev;
          return {
            total_people: prev.total_people + 1,
            total_points: prev.total_points + data.total_points,
            total_base_coin: prev.total_base_coin + data.total_base_coin,
            continue_days: prev.continue_days + 1,
            total_days: prev.total_days + 1,
            is_sign: true,
          };
        });
        setIsSign(true);
      } else {
        toast.error(message);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : _t('common.catch-error');
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 py-4 bg-white rounded-lg">
      {/* 统计 */}
      <div className="mb-3">
        <div className="bg-[#f5f5f5] py-3">
          {_t.rich("mine.sign-in.sign-stat-1", {
            count: statData?.total_people,
            points: statData?.total_points,
            beans: statData?.total_base_coin,
            win: (chunks: string) => <span className="win">{chunks}</span>,
            coin: (chunks: string) => <span className="text-red-600">{chunks}</span>,
          })}
        </div>
        <div className="bg-[#fffae8] text-[#f79304] py-3 my-3">
          {_t.rich("mine.sign-in.sign-stat-2", {
            day1: statData?.continue_days,
            day2: statData?.total_days,
            win: (chunks: string) => <strong className="">{chunks}</strong>,
          })}
        </div>
      </div>

      {/* 按钮 */}
      <button
        type="button"
        onClick={handleSign}
        className={`fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full
        flex items-center justify-center text-white text-base font-medium shadow-lg transition-transform
        active:scale-95 ${isSign || isLoading ? "bg-[#cccccc]" : "bg-[#ff5a1f]"}`}
      >
        {isSign ? _t('mine.sign-in.sign-btn-2') : isLoading ? _t("common.form.button.submitting") : _t('mine.sign-in.sign-btn-1')}
      </button>
    </div>
  )
}
