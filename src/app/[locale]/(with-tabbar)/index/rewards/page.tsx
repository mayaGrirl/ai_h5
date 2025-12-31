"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type ReliefItem = {
  level: number;
  gold: number;
  limit: number;
};

const reliefList: ReliefItem[] = [
  { level: 1, gold: 50, limit: 50 },
  { level: 2, gold: 60, limit: 60 },
  { level: 3, gold: 70, limit: 70 },
  { level: 4, gold: 100, limit: 100 },
  { level: 5, gold: 120, limit: 120 },
  { level: 6, gold: 150, limit: 150 },
  { level: 7, gold: 200, limit: 200 },
  { level: 8, gold: 300, limit: 300 },
  { level: 9, gold: 500, limit: 500 },
  { level: 10, gold: 500, limit: 500 },
];

export default function ReliefPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen justify-center bg-[#eef3f8] text-[12px] leading-[14px]">
      <div className="w-full max-w-xl bg-[#f5f7fb]">

        {/* 顶部 */}
        <header className="h-10 bg-red-600 flex items-center px-2 relative">
          <button
            onClick={() => router.back()}
            className="text-white text-[12px]"
          >
            &lt; 返回
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 text-white font-bold text-sm">
            救济
          </span>
        </header>

        <main className="px-2 pt-1 pb-20">

          {/* 表头 */}
          <div className="grid grid-cols-[40px_1fr_200px] text-gray-500 border-b py-1 whitespace-nowrap">
            <div>等级</div>
            <div className="text-center">可领取金币</div>
            <div className="text-center">领取条件</div>
          </div>

          {/* 列表 */}
          <div className="bg-white rounded-lg mt-1 divide-y divide-gray-200">
            {reliefList.map((item) => (
              <div
                key={item.level}
                className="grid grid-cols-[40px_1fr_200px] items-center px-1 py-1 whitespace-nowrap"
              >
                {/* 等级 */}
                <div className="flex items-center justify-start gap-1">
                  <div className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold">
                    {item.level}
                  </div>
                </div>

                {/* 金币 */}
                <div className="flex items-center rounded-full gap-1 text-red-500 font-semibold text-[12px]">
                  {item.gold}
                  <span className="text-yellow-400 text-left">🪙</span>
                </div>

                {/* 条件 */}
                <div className="text-center text-gray-700 text-[12px]">
                  余额少于 {item.limit}，每日可领取 10
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* 底部按钮 */}
        <div className="fixed bottom-0 left-0 right-0 flex justify-center bg-transparent pb-1">
          <div className="w-full max-w-xl px-2">
            <button className="w-full h-8 rounded-md bg-blue-500 text-white font-semibold text-[12px]">
              剩余10次，立即领取
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
