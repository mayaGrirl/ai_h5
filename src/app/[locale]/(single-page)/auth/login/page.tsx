"use client";

import React from "react";
import Image from "next/image";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {login} from '@/api/auth';
import {HttpRes} from "@/types/http.type";
import {LoginReq} from "@/types/login.type";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {useAuthStore} from "@/utils/storage/auth";

const schema = z.object({
  mobile: z.string().min(1, "请输入手机号码").max(50),
  password: z.string().min(1, "请输入密码"),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const setToken = useAuthStore((s) => s.setToken);

  const router = useRouter();

  // 表单提交
  const onSubmit = handleSubmit((values) => {
    login({
      mobile: values.mobile,
      password: values.password,
      mfa_code: '',
    }).then((result: HttpRes<LoginReq>) => {
      const {code, data} = result;
      if (code !== 200) {
        toast.error(result.message);
      } else {
        toast.success(result.message);

        // 设置token
        // accessToken.setToken(data?.access_token, data?.token_type, data?.expires_at);
        // 用 Zustand 统一设置
        setToken(data?.access_token, data?.token_type, data?.expires_at);

        // 查询并设置会员信息

        // 跳转到指定页面
        const urlParams = new URL(window.location.href).searchParams;
        router.replace(urlParams.get('redirect') || '/');
      }
    }).catch(error => {
      toast.warning(error.message);
    });
  });

  return (
    <div className="flex min-h-screen justify-center bg-[#eef3f8]">
      {/* 中间内容区域，控制最大宽度模拟手机界面 */}
      <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
        <main className="px-3 pb-20 pt-3">
          <div className="pt-13 flex items-center justify-center">
            <Image src={"/login-logo.png"} alt={'Login'} width={200} height={200} className="w-32 h-auto" priority/>
          </div>

          <form onSubmit={onSubmit} className="mt-5">
            <div className="bg-white rounded-xl shadow-sm p-2">
              {/* 手机号 */}
              <div className="flex justify-center items-center border-b border-gray-200">
                <label className="w-1/4 text-gray-700">手机号码</label>
                <input
                  type="text"
                  placeholder="手机号码"
                  {...register("mobile")}
                  className=" w-3/4 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
                />
              </div>
              {errors.mobile && (
                <p className="mt-1 text-xs text-red-500">{errors.mobile.message}</p>
              )}

              {/* 密码 */}
              <div className="flex justify-center items-center">
                <label className="w-1/4 text-gray-700">密码</label>
                <input
                  type="password"
                  {...register("password")}
                  placeholder="密码"
                  className=" w-3/4 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/*<button*/}
            {/*  disabled={isSubmitting}*/}
            {/*  className={`mt-10 w-full h-12 rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white tracking-wide font-medium cursor-pointer`}*/}
            {/*>*/}
            {/*  {isSubmitting ? "登陆中..." : "登陆"}*/}
            {/*</button>*/}
            <button
              disabled={isSubmitting}
              className={`mt-10 h-12 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white
              font-medium tracking-wide transition transform active:scale-95
              ${isSubmitting ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`
              }
            >
              {isSubmitting ? "登陆中..." : "登陆"}
            </button>
            <button
              className="mt-3 w-full h-12 rounded-full bg-[#0d6efd] text-white tracking-wide font-medium cursor-pointer">注册
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
