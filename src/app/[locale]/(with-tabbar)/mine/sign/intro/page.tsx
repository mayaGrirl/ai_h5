"use client"

import {useEffect, useState} from "react";
import {getBlockByIdentifier, getCustomerLevelOptions} from "@/api/common";
import Image from "next/image";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {useTranslations} from "use-intl";
import TextSkeleton from "@/components/text-skeleton";
import {CustomerLevelField} from "@/types/common.type";
import TableSkeleton from "@/components/table-skeleton";

export default function SignIntroPage() {
  // 页面需要登陆Hook
  useRequireLogin();
  const _t = useTranslations();

  const [content, setContent] = useState<string | null>(null);
  const [friendRewards, setFriendRewards] = useState<CustomerLevelField[]>();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const {data} = await getBlockByIdentifier('customer_sign_in_tips');
      setContent(data?.content || '');
      const res = await getCustomerLevelOptions();
      console.log(res.data);
      setFriendRewards(res.data)
      setLoading(false);
    };

    void fetchContent();
  }, []);

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
      {loading ? (
        <TableSkeleton
          rows={9}
          columns={[
            { type: "icon", width: "0.5fr" },
            { type: "text", width: "1fr", lines: 3 },
          ]}
        />
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          {/* 表头 */}
          <div className="grid grid-cols-[0.5fr_1fr] bg-[#fafafa] px-3 py-2 font-medium text-center text-gray-700">
            <div>{_t("mine.sign-in.intro-table-header-1")}</div>
            <div>{_t("mine.sign-in.intro-table-header-2")}</div>
          </div>

          {/* 表体 */}
          {friendRewards?.map((item) => (
            <div key={item.level}
                 className="grid grid-cols-[0.5fr_1fr] items-center border-t px-3 py-2 text-center"
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
              <div>
                <div>{_t('mine.sign-in.intro-table-desc-1')}</div>
                <div>{_t('mine.sign-in.intro-table-desc-2', {points:item.sign_in_blessing})}</div>
                <div>{_t('mine.sign-in.intro-table-desc-3', {points:item.sign_in_points})}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
