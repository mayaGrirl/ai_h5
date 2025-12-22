"use client";

import React, {useEffect, useRef, useState} from "react";
import Image from "next/image";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {registration, sendSmsToMobile} from '@/api/auth';
import {HttpRes} from "@/types/http.type";
import {RegistrationReq} from "@/types/login.type";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {useTranslations} from "use-intl";
import {cn} from "@/lib/utils";

// 倒计时页面刷新继续保持的存储key
const STORAGE_KEY = "sms_countdown_end_at_register";

const schema = z.object({
  mobile: z.string().min(1, "请输入手机号码").max(50),
  verify_code: z.string().min(1, "请输入验证码").max(6),
  password: z.string().min(1, "请输入密码"),
  confirm_password: z.string(),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const _t = useTranslations();

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    clearErrors,
    formState: {errors, isSubmitting},
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });
  const router = useRouter();

  // 发送短信相关
  const duration = 60;
  const [countdown, setCountdown] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isDisable, setIsDisable] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // 初始化：从 localStorage 恢复
  useEffect(() => {
    const endAt = Number(localStorage.getItem(STORAGE_KEY));
    if (!endAt) return;

    const remain = Math.floor((endAt - Date.now()) / 1000);
    if (remain > 0) {
      setCountdown(remain);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);
  const sendSms = async () => {
    if (countdown > 0 || isSending) return;

    const mobile = getValues("mobile").trim();
    if (mobile.length < 1) {
      setError("mobile", {
        type: "manual",
        message: "请输入手机号",
      });
      return;
    }

    // 立刻锁定， 防止重复点击
    setIsSending(true);
    try {
      const {code, message} = await sendSmsToMobile(mobile);
      if (code !== 200) {
        toast.error(message);
      } else {
        setCountdown(duration);
        const endAt = Date.now() + duration * 1000;
        localStorage.setItem(STORAGE_KEY, String(endAt));
        toast.success(message);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "发送失败";
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };
  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    timerRef.current = setTimeout(() => {
      setCountdown((c) => c - 1);
      if (countdown <= 1) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [countdown]);

  // 表单提交
  const onSubmit = handleSubmit((values) => {
    registration({
      mobile: values.mobile,
      verify_code: values.verify_code,
      password: values.password,
      confirm_password: values.password,
    }).then((result: HttpRes<RegistrationReq>) => {
      const {code, message} = result;
      if (code !== 200) {
        toast.error(message);
      } else {
        toast.success(message);

        // 跳转到指定页面
        const urlParams = new URL(window.location.href).searchParams;
        router.replace(urlParams.get('redirect') || '/auth/login');
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
                <label className="w-1/4 text-gray-700" htmlFor={'mobile'}>手机号码</label>
                <div className="w-3/4">
                  <input
                    id="mobile"
                    type="text"
                    placeholder="请输入手机号码"
                    {...register("mobile")}
                    className=" w-3/4 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
                    onChange={(e)  => {
                      if  (e.target.value.length > 0) {
                        setIsDisable(false);
                        clearErrors("mobile");
                      } else {
                        setIsDisable(true);
                      }
                    }}
                  />
                </div>
              </div>
              {errors.mobile && (
                <p className="mt-1 text-xs text-red-500">{errors.mobile.message}</p>
              )}
              {/* 验证码 */}
              <div className="flex justify-center items-center border-b border-gray-200">
                <label className="w-1/4 text-gray-700" htmlFor={'verify_code'}>验证码</label>
                <div className="flex w-3/4 items-center gap-2">
                  <input
                    id="verify_code"
                    type="text"
                    placeholder="请输入验证码"
                    {...register("verify_code")}
                    className="flex-1 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
                  />
                  <button
                    type="button"
                    disabled={countdown > 0 || isSending || isDisable}
                    onClick={sendSms}
                    className={cn(
                      "h-8 px-3 rounded text-xs whitespace-nowrap transition",
                      countdown > 0 || isSending || isDisable
                        ? "bg-gray-600 text-white cursor-not-allowed"
                        : "bg-blue-600 text-white active:scale-95 cursor-pointer"
                    )}
                  >
                    {/*{sendButI18Key}*/}
                    {isSending ? "发送中..." : countdown > 0 ? `${countdown}s` : "发送验证码"}
                  </button>
                </div>
              </div>
              {errors.verify_code && (
                <p className="mt-1 text-xs text-red-500">{errors.verify_code.message}</p>
              )}

              {/* 密码 */}
              <div className="flex justify-center items-center border-b border-gray-200">
                <label className="w-1/4 text-gray-700" htmlFor={'password'}>密码</label>
                <div className="w-3/4">
                  <input
                    id="password"
                    type="password"
                    {...register("password")}
                    placeholder="请输入密码"
                    className=" w-3/4 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
                  />
                </div>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}

              {/* 确认密码 */}
              <div className="flex justify-center items-center">
                <label className="w-1/4 text-gray-700" htmlFor={'confirm_password'}>确认密码</label>
                <div className="w-3/4">
                  <input
                    id="confirm_password"
                    type="password"
                    {...register("confirm_password")}
                    placeholder="请输入确认密码"
                    className=" w-3/4 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
                  />
                </div>
              </div>
              {errors.confirm_password && (
                <p className="mt-1 text-xs text-red-500">{errors.confirm_password.message}</p>
              )}
            </div>

            <button
              disabled={isSubmitting}
              className={`mt-10 h-12 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white
              font-medium tracking-wide transition transform active:scale-95
              ${isSubmitting ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`
              }
            >
              {isSubmitting ? _t("common.form.button.submitting") : "免费注册"}
            </button>
          </form>
          <Link href={`/auth/login`}
                className={"flex justify-center items-center mt-6 text-[rgb(0,0,238)]"}
          >已有账号了，去登录吧</Link>
        </main>
      </div>
    </div>
  );
}
