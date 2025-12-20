"use client";

import React from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {cn} from "@/lib/utils";

function Shop() {
  // 页面需要登陆Hook
  useRequireLogin();

  const prizeList = [
    { id: 1, amount: "5万豆豆", price: "50,000" },
    { id: 2, amount: "10万豆豆", price: "100,000" },
    { id: 3, amount: "20万豆豆", price: "200,000" },
    { id: 4, amount: "50万豆豆", price: "500,000" },
    { id: 5, amount: "100万豆豆", price: "1,000,000" },
    { id: 6, amount: "200万豆豆", price: "2,000,000" },
  ];

  const bgColors = [
    "from-blue-400 to-blue-600",
    "from-indigo-500 to-indigo-700",
    "from-purple-500 to-fuchsia-600",
    "from-pink-500 to-purple-500",
    "from-orange-400 to-orange-600",
    "from-green-400 to-green-600",
  ];

  return (
    <div className="flex min-h-screen justify-center bg-[#eef3f8]">
      {/* 中间内容区域，控制最大宽度模拟手机界面 */}
      <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">

        {/* Tabs */}
        <div className="flex bg-white border-b">
          <div className="flex-1 text-center py-3 font-medium text-red-500 border-b-2 border-red-500">
            金币奖品
          </div>
          <div className="flex-1 text-center py-3 text-gray-500">
            积分奖品
          </div>
        </div>

        {/* Grid */}
        <div className="p-3 grid grid-cols-2 gap-3">
          {prizeList.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm"
            >
              {/* Card Image */}
              <div
                className={cn(
                  "relative h-36 flex flex-col items-center justify-center text-white font-bold text-xl",
                  "bg-gradient-to-br",
                  bgColors[index % bgColors.length]
                )}
              >
                鼎丰28
                <div className="mt-2 bg-yellow-400 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
                  {item.amount}
                </div>
              </div>

              {/* Info */}
              <div className="p-3 text-sm text-gray-700">
                <div className="leading-snug">
                  【免手续费】{item.price} 豆豆购物返利卡
                </div>

                <div className="mt-2 flex items-center justify-center text-red-500 font-semibold">
                  兑换价 {item.price}
                  <span className="ml-1">🔥</span>
                </div>
              </div>
            </div>
          ))}
        </div>


      </div>
    </div>
  );
}

export default Shop;
