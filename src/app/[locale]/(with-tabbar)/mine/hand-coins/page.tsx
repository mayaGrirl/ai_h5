"use client";

import * as React from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {PageHeader} from "@/components/page-header";
import Image from "next/image";

export default function HandCoinsPage() {
  // 页面需要登陆Hook
  useRequireLogin();

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title="免费兑换"/>

          <div className="bg-gray-100">
            <div className="bg-white rounded-lg mb-3 overflow-hidden px-3 py-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm text-gray-700">近7日流水</span>
                <span className="flex items-center gap-1 text-sm text-red-500 font-medium">
                  2,961,600
                  <Image
                    src="/ranking/coin.png"
                    alt="coin"
                    width={14}
                    height={14}
                    className="inline-block w-[13px] h-[13px]"
                  />
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-sm text-gray-700">近7日免手续费奖励</span>
                <span className="flex items-center gap-1 text-sm text-red-500 font-medium">
                  250,000
                  <Image
                    src="/ranking/coin.png"
                    alt="coin"
                    width={14}
                    height={14}
                    className="inline-block w-[13px] h-[13px]"
                  />
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-700">
                  当前可免手续费的兑换额度
                </span>
                <span className="flex items-center gap-1 text-sm text-red-500 font-medium">
                  490,400
                  <Image
                    src="/ranking/coin.png"
                    alt="coin"
                    width={14}
                    height={14}
                    className="inline-block w-[13px] h-[13px]"
                  />
                </span>
              </div>
            </div>
          </div>

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  );
}
