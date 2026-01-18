"use client";

import React, {useEffect, useRef, useState} from "react";
import Image from "next/image";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {login, loginSendSmsToMobile} from '@/api/auth';
import {HttpRes} from "@/types/http.type";
import {LoginReq} from "@/types/login.type";
import {toast} from "sonner";
import {useParams, useRouter, useSearchParams} from "next/navigation";
import {useAuthStore} from "@/utils/storage/auth";
import Link from "next/link";
import {useTranslations} from "use-intl";
import {cn} from "@/lib/utils";

// 倒计时页面刷新继续保持的存储key
const STORAGE_KEY = "sms_countdown_end_at_login";

export default function LoginPage() {
  const _t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  // 原样保留
  const queryString = searchParams.toString();
  const params = useParams();
  const locale = params.locale as string;
  // 登录方式
  const [loginType, setLoginType] = useState<number>(1);

  // 提交数据
  const schema = z.object({
    login_type: z.number(), // 1=密码 2=短信
    mobile: z.string().min(1, _t('register.mobile-placeholder'))
      .regex(/^1[3-9]\d{9}$/, _t("register.mobile-regex")),
    password: z.string().optional(),
    verify_code: z.string().optional(),
  }).superRefine((data, ctx) => {
    // 密码登录
    if (data.login_type === 1) {
      if (!data.password || data.password.length < 1) {
        ctx.addIssue({
          path: ["password"],
          message: _t("register.password-placeholder"),
          code: 'custom',
        })
      }
    }

    // 短信登录
    if (data.login_type === 2) {
      if (!data.verify_code || data.verify_code.length < 1) {
        ctx.addIssue({
          path: ["verify_code"],
          message: _t("common.sms-verify_code-placeholder"),
          code: 'custom',
        })
      }
    }
  });

  type FormValues = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    clearErrors,
    setValue,
    formState: {errors, isSubmitting},
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      login_type: 1,
    },
  });

  const setToken = useAuthStore((s) => s.setToken);

  // 表单提交
  const onSubmit = handleSubmit((values) => {
    login({
      type: loginType,
      mobile: values.mobile,
      password: values.password || '',
      code: values.verify_code || '',
    }).then((result: HttpRes<LoginReq>) => {
      const {code, data, message} = result;
      if (code !== 200) {
        toast.error(message);
      } else {
        toast.success(message);

        // 设置token
        // 用 Zustand 统一设置
        setToken(data?.access_token, data?.token_type, data?.expires_at);

        // 跳转到指定页面
        let redirect = searchParams.get('redirect')
        if (!redirect || redirect?.includes('auth/login')) {
          redirect = `/${locale}`;
        }
        router.replace(redirect);
      }
    }).catch(error => {
      toast.warning(error.message);
    });
  });

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
        message: _t('register.mobile-placeholder'),
      });
      return;
    }

    // 立刻锁定， 防止重复点击
    setIsSending(true);
    try {
      const {code, message} = await loginSendSmsToMobile(mobile);
      if (code !== 200) {
        toast.error(message);
      } else {
        setCountdown(duration);
        const endAt = Date.now() + duration * 1000;
        localStorage.setItem(STORAGE_KEY, String(endAt));
        toast.success(message);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : _t('common.sms-verify_code-send-failed');
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

  // tab切换
  const switchLoginType = (type: number) => {
    setLoginType(type)
    setValue("login_type", type)
  }

  return (
    <div className="flex min-h-screen justify-center bg-[#eef3f8]">
      {/* 中间内容区域，控制最大宽度模拟手机界面 */}
      <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
        <main className="px-3 pb-20 pt-3">
          <div className="pt-13 flex items-center justify-center">
            <Image src={"/login-logo.png"} alt={'Login'} width={200} height={200} className="w-32 h-auto" priority/>
          </div>

          {/*from-[#ff6a3a] to-[#ff1020]*/}
          <div className="flex bg-white rounded-full shadow-sm overflow-hidden mt-4">
            <button
              type="button"
              onClick={() => switchLoginType(1)}
              className={`flex-1 py-2 text-sm font-medium transition cursor-pointer ${loginType === 1 ? "bg-[#ff1020] text-white" : "text-gray-500"}`}
            >
              密码登录
            </button>

            <button
              type="button"
              onClick={() => switchLoginType(2)}
              className={`flex-1 py-2 text-sm font-medium transition cursor-pointer ${loginType === 2 ? "bg-[#ff1020] text-white" : "text-gray-500"}`}
            >
              短信登录
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-5">
            <input type="text" {...register("login_type")} hidden={true} />
            <div className="bg-white rounded-xl shadow-sm p-2 border border-gray-100">
              {/* 手机号 */}
              <div className="flex justify-center items-center border-b border-gray-200">
                <label className="w-1/4 text-gray-700">{_t('register.mobile-label')}</label>
                <input
                  type="text"
                  placeholder={_t('register.mobile-placeholder')}
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
              {errors.mobile && (
                <p className="mt-1 text-xs text-red-500">{errors.mobile.message}</p>
              )}

              {/* 密码 */}
              {loginType == 1 && (
                <>
                  <div className="flex justify-center items-center">
                    <label className="w-1/4 text-gray-700">{_t('register.password-label')}</label>
                    <input
                      type="password"
                      {...register("password")}
                      placeholder={_t('register.password-placeholder')}
                      className=" w-3/4 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                  )}
                </>
              )}

              {loginType == 2 && (
                <>
                  {/* 验证码 */}
                  <div className="flex justify-center items-center ">
                    <label className="w-1/4 text-gray-700"
                           htmlFor={'verify_code'}>{_t('common.sms-verify_code-label')}</label>
                    <div className="flex w-3/4 items-center gap-2 flex-wrap sm:flex-nowrap">
                      <input
                        id="verify_code"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="one-time-code"
                        placeholder={_t('common.sms-verify_code-placeholder')}
                        {...register("verify_code")}
                        className="flex-1 min-w-0 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
                      />
                      <button
                        type="button"
                        disabled={countdown > 0 || isSending || isDisable}
                        onClick={sendSms}
                        className={cn(
                          "shrink-0 h-8 px-3 rounded text-xs whitespace-nowrap transition",
                          countdown > 0 || isSending || isDisable
                            ? "bg-gray-600 text-white cursor-not-allowed"
                            : "bg-blue-600 text-white active:scale-95 cursor-pointer"
                        )}
                      >
                        {/*{sendButI18Key}*/}
                        {isSending ? _t('common.sms-verify_code-sending') : countdown > 0 ? `${countdown}s` : _t('common.sms-verify_code-send-btn')}
                      </button>
                    </div>
                  </div>
                  {errors.verify_code && (
                    <p className="mt-1 text-xs text-red-500">{errors.verify_code.message}</p>
                  )}
                </>
              )}
            </div>

            <button
              disabled={isSubmitting}
              className={`mt-10 h-12 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white
              font-medium tracking-wide transition transform active:scale-95
              ${isSubmitting ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`
              }
            >
              {isSubmitting ? _t("common.form.button.submitting") : _t('login.submit-btn')}
            </button>
          </form>
          <Link
            href={`/${locale}/auth/register?${queryString}`}
            className="mt-3 h-12 w-full flex items-center justify-center rounded-full bg-[#0d6efd] text-white font-medium tracking-wide transition transform active:scale-95">
            {_t('login.register-btn')}
          </Link>

          {loginType == 1 && (
            <Link href={`/${locale}/auth/forgot-password?${queryString}`}
                  className={"flex justify-center items-center mt-6 text-[rgb(0,0,238)]"}
            >{_t('login.forgot-password-btn')}</Link>
          )}
        </main>
      </div>
    </div>
  );
}
