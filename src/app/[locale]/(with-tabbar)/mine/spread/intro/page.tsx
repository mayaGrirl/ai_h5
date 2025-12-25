"use client"

import {useEffect, useState} from "react";
import {getBlockByIdentifier} from "@/api/common";
import Image from "next/image";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {useTranslations} from "use-intl";
import TextSkeleton from "@/components/text-skeleton";

export default function IntroPage() {
  // 页面需要登陆Hook
  useRequireLogin();
  const _t = useTranslations();

  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const {data} = await getBlockByIdentifier('customer_spread_intro_tips');
      setContent(data?.content || '');
      setLoading(false);
    };

    void fetchContent();
  }, []);

  const friendRewards = [
    { level: 0, eco: 0, reward: 0, rate: "0.2%" },
    { level: 1, eco: 500, reward: 10000, rate: "0.2%" },
    { level: 2, eco: 2000, reward: 30000, rate: "0.2%" },
    { level: 3, eco: 10000, reward: 80000, rate: "0.2%" },
    { level: 4, eco: 60000, reward: 160000, rate: "0.2%" },
    { level: 5, eco: 420000, reward: 300000, rate: "0.2%" },
    { level: 6, eco: 800000, reward: 500000, rate: "0.2%" },
    { level: 7, eco: 2000000, reward: 600000, rate: "0.2%" },
    { level: 8, eco: 8000000, reward: 700000, rate: "0.2%" },
    { level: 9, eco: 15000000, reward: 800000, rate: "0.2%" },
    { level: 10, eco: 30000000, reward: 900000, rate: "0.2%" },
  ];

  return (
    <div className="px-4 py-4 bg-white rounded-lg">
      {/* 异步加载简介 */}
      {loading ? (
        <TextSkeleton lines={3}/>
      ) : (
        <div
          className="prose prose-sm max-w-none text-gray-700"
          dangerouslySetInnerHTML={{__html: content!}}
        />
      )}

      {/* 表格 */}
      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        {/* 表头 */}
        <div className="grid grid-cols-4 bg-[#fafafa] px-3 py-2 font-medium text-center text-gray-700">
          <div>{_t("recommend.intro-table-header-1")}</div>
          <div>{_t("recommend.intro-table-header-2")}</div>
          <div>{_t("recommend.intro-table-header-3")}</div>
          <div>{_t("recommend.intro-table-header-4")}</div>
        </div>

        {/* 表体 */}
        {friendRewards.map((item) => (
          <div key={item.level}
            className="grid grid-cols-4 items-center border-t px-3 py-2 text-center"
          >
            {/* 等级 */}
            <div className="flex justify-center items-center gap-1">
              <Image
                className="inline-block w-[18px] h-[18px]"
                src={`/mine/level/${item.level}.png`}
                alt={`level-${item.level}`}
                width={18}
                height={18}
              />
            </div>

            {/* 生态值 */}
            <div>{item.eco.toLocaleString()}</div>

            {/* 奖励 */}
            <div className="flex justify-center items-center gap-1 text-orange-500 font-medium">
              {item.reward.toLocaleString()}
              <Image
                className="inline-block w-[13px] h-[13px]"
                src="/ranking/coin.png"
                alt="coin"
                width={13}
                height={13}
              />
            </div>

            {/* 提成 */}
            <div>{item.rate}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
