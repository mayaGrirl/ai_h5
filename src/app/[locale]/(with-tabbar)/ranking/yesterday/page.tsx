"use client"

import Image from "next/image";
import Medal from "@/components/medal";
import {TodayField} from "@/types/rank.type";
import {yesterday} from "@/api/rank";
import {toast} from "sonner";
import TextSkeleton from "@/components/text-skeleton";
import * as React from "react";
import {useEffect, useState} from "react";

export default function Yesterday() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<TodayField[]>([]);

  useEffect(() => {
    const initList = async () => {
      setLoading(true);

      // 请求接口
      const {code, data, message} = await yesterday()
      await new Promise((r) => setTimeout(r, 554));
      if (code === 200) {
        setLoading(false);
        setList(data);
      } else {
        toast.error(message);
      }
    }
    void initList();
  }, [])

  return (
    loading ? (
        <TextSkeleton lines={20}/>
      ) : (
        <div className="bg-white">
          {list.map((item) => (
            <div
              key={item.rank}
              className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
            >
              {/* 左侧：排名 + 图标 + 名称 */}
              <div className="flex items-center space-x-3">
                <Medal rank={item.rank}/>

                {/* 图标 */}
                <Image className="inline-block" src={`/ranking/vip/${item.level}.png`} alt={item.name} width={20} height={20}/>

                {/* 名称 */}
                <div className="flex flex-col">
                  <div className="text-gray-800 text-sm">{item.name}</div>
                  <div className="text-red-500 text-xs">{item.score}</div>
                </div>
              </div>

              {/* 右侧：分数 */}
              <div className="flex items-center space-x-1">
              <span className="text-red-500 font-semibold text-sm">
                {item.score}
              </span>
                <Image
                  className="inline-block w-[13px] h-[13px]"
                  src="/ranking/coin.png"
                  alt="gold"
                  width={13}
                  height={13}
                />
              </div>
            </div>
          ))}
        </div>
      )
  )
}
