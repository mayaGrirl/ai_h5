"use client"

import {PageHeader} from "@/components/page-header";
import * as React from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {useTranslations} from "use-intl";
import Image from "next/image";
import {useEffect, useState} from "react";
import {getReliefData, receiveRelief} from "@/api/customer";
import {MemberLevel} from "@/types/customer.type";
import Skeleton from "./skeleton";
import {toast} from "sonner";

export default function ReliefPage() {
  // 页面需要登陆Hook
  useRequireLogin();

  const _t = useTranslations();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(true);
  const [levelList, setLevelList] = useState<MemberLevel[]>([]);
  // 剩余领取的次数
  const [remainingReceiveCount, setRemainingReceiveCount] = useState<number>(0);
  // 最大可领取的次数
  const [limit, setLimit] = useState<number>(10);

  useEffect(() => {
    const levelOptions = async () => {
      setLoading(true);
      const {code, data} = await getReliefData();
      if (code === 200) {
        setLevelList([]);
        setLevelList(data.options || []);
        setLimit(data?.limit);

        let remaining = 0;
        if (data.limit > data.receive_count) {
          remaining = data.limit - data.receive_count;
        }
        setRemainingReceiveCount(remaining);

        if (remaining > 0) {
          setIsSubmitting(false);
        }
      }
      setLoading(false);
    };

    void levelOptions();
  }, []);

  // 领取救济
  const handleSubmit = async () => {
    if (remainingReceiveCount < 1) {
      toast.error(_t('mine.relief.receive-limit-hit'));
      return;
    }

    const result = await receiveRelief();
    const {code, message} = result;
    if (code !== 200) {
      toast.error(message);
    } else {
      toast.success(message);

      setRemainingReceiveCount(remainingReceiveCount-1)
    }
  }

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t("mine.quick.relief")}/>

          <div className="p-2 pt-4 ">
            {/* 表头 */}
            <div className="grid grid-cols-[0.1fr_0.5fr_1fr] px-3 py-2 text-xs text-muted-foreground border-b">
              <div className="flex items-center justify-center">{_t('mine.relief.table-header-1')}</div>
              <div className="flex items-center justify-center">{_t('mine.relief.table-header-2')}</div>
              <div className="flex justify-center items-center">{_t('mine.relief.table-header-3')}</div>
            </div>

            {/* 骨架屏 */}
            {loading &&
              Array.from({length: 11}).map((_, i) => (
                <Skeleton key={`skeleton-${i}`}/>
              ))}

            {/* 实际数据*/}
            {!loading && levelList.map((item, index) => (
              <div key={`all-key-${index}`}
                   className="grid grid-cols-[0.1fr_0.5fr_1fr] px-3 py-3 border-b text-sm items-center"
              >
                <div className="flex items-center justify-center">
                  <Image src={`/mine/level/${item.level}.png`} alt={item.name || ''} width={15} height={15}
                         className="w-[15px] h-[15px]"/>
                </div>
                <div className="flex justify-center items-center gap-1 text-red-500 font-medium">
                  {item?.day_jiuji_point}
                  <Image
                    src="/ranking/coin.png"
                    alt="coin"
                    width={14}
                    height={14}
                    className="inline-block w-[13px] h-[13px]"
                  />
                </div>
                <div className="flex justify-center items-center font-medium">
                  {_t('mine.relief.table-row-hit', {point: item?.day_jiuji_point, limit: limit})}
                </div>
              </div>
            ))}
          </div>

          <button
            disabled={isSubmitting}
            className={`mt-10 h-12 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white
                  font-medium tracking-wide transition transform active:scale-95
                  ${isSubmitting ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`
            }
            onClick={handleSubmit}
          >
            {_t('mine.relief.button', {remaining: remainingReceiveCount})}
          </button>

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  );
}
