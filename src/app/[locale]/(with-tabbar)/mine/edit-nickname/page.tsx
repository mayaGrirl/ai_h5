"use client";

import * as React from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {AlertCircleIcon} from "lucide-react";
import Image from "next/image";
import {z} from "zod";
import {PageHeader} from "@/components/page-header";
import {Alert, AlertTitle} from "@/components/ui/alert";

const schema = z.object({
  nickname: z.string().min(1, "请输入昵称").max(50),
});
type FormValues = z.infer<typeof schema>;

export default function Mine() {
  // 页面需要登陆Hook
  useRequireLogin();

  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const onSubmit = handleSubmit(async (values) => {
    // 模拟接口请求
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(values)
  })

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title="修改昵称" />
          {/* 提示 */}
          <main className="px-3 pb-20 pt-3">
            <Alert variant="destructive">
              <div className="flex items-center gap-2">
                <AlertCircleIcon />
                <AlertTitle>
                  修改昵称需要花费 200
                  <Image
                    src="/ranking/coin.png"
                    alt="gold"
                    width={13}
                    height={13}
                    className="inline-block ml-1 w-[13px] h-[13px]"
                  />
                </AlertTitle>
              </div>
            </Alert>

            {/* 提交表单 */}
            <form onSubmit={onSubmit} className="mt-5">
              <div className="bg-white rounded-xl shadow-sm p-2">
                {/* 手机号 */}
                <div className="flex justify-center items-center ">
                  <label className="w-1/7 text-gray-700">昵称</label>
                  <input
                    type="text"
                    placeholder="请输入昵称"
                    {...register("nickname")}
                    className="w-6/7 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
                  />
                </div>
                {errors.nickname && (
                  <p className="mt-1 text-xs text-red-500">{errors.nickname.message}</p>
                )}
              </div>

              <button
                disabled={isSubmitting}
                className={`mt-10 h-12 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white
                  font-medium tracking-wide transition transform active:scale-95
                  ${isSubmitting ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`
                }
              >
                {isSubmitting ? "提交中..." : "确定修改"}
              </button>
            </form>
          </main>

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  );
}
