"use client"

import {useEffect, useState} from "react";
import Skeleton from './skeleton'
import {getBlockByIdentifier} from "@/api/common";
import Image from "next/image";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {useTranslations} from "use-intl";

export default function IntroPage() {
  // 页面需要登陆Hook
  useRequireLogin();
  const _t = useTranslations();

  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const {data} = await getBlockByIdentifier('customer_salary_intro_tips');
      setContent(data?.content || '');
      setLoading(false);
    };

    void fetchContent();
  }, []);

  return (
    <div className="px-4 py-4 bg-white rounded-lg">
      <div className="flex items-center mb-2">
        {_t('mine.salary.intro-accumulated-salary')}
        <span className="text-red-500 font-semibold ml-1">49</span>
        <Image
          className="inline-block w-[13px] h-[13px]"
          src="/ranking/coin.png"
          alt="gold"
          width={13}
          height={13}
        />
      </div>

      {/* 异步加载工资简介 */}
      {loading ? (
        <Skeleton lines={12}/>
      ) : (
        <div
          className="prose prose-sm max-w-none text-gray-700"
          dangerouslySetInnerHTML={{__html: content!}}
        />
      )}
    </div>
  )
}
