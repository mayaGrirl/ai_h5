"use client";

import * as React from "react";
import {useEffect, useRef, useState} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {toast} from "sonner";
import {useParams, useRouter} from "next/navigation";
import {cn} from "@/lib/utils";
import Image from "next/image";
import {useTranslations} from "use-intl";
import {forgetPasswordReset, forgotPasswordSendSms, forgotPasswordVerifyCode} from "@/api/auth";

const STORAGE_KEY = "sms_countdown_end_at_find_password";

export default function FindPasswordPage() {
  const _t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  // step: 1=短信验证 2=重置密码
  const [step, setStep] = useState<1 | 2>(1);

  // ---------- Step1 form ----------
  const step1Schema = z.object({
    mobile: z.string().min(1, _t('register.mobile-placeholder')).max(50, _t('register.mobile-max')),
    verify_code: z.string().min(1, _t('common.sms-verify_code-placeholder')).max(6, _t('common.sms-verify_code-max')),
  });
  type Step1Values = z.infer<typeof step1Schema>;
  const step1 = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    mode: "onSubmit",
    defaultValues: {mobile: "", verify_code: ""},
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
  const sendSms = async () => {
    if (countdown > 0 || isSending) return;

    const mobile = step1.getValues("mobile").trim();
    if (mobile.length < 1) {
      step1.setError("mobile", {
        type: "manual",
        message: _t('register.mobile-placeholder'),
      });
      return;
    }

    // 立刻锁定， 防止重复点击
    setIsSending(true);
    try {
      const {code, message} = await forgotPasswordSendSms(mobile);
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

  // -------------------- Step1 验证验证码 --------------------
  const onVerify = step1.handleSubmit(async (values) => {
    try {
      // 验证手机号 + 验证码
      const {code, message} = await forgotPasswordVerifyCode({
        mobile: values.mobile,
        verify_code: values.verify_code,
        password: "",
        confirm_password: ""
      });
      if (code == 200) {
        toast.success(message);
        setStep(2);
      } else {
        toast.error(message);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : _t('common.catch-error');
      toast.error(msg);
    }
  });

  // -------------------- Step2 form --------------------
  const step2Schema = z
    .object({
      password: z.string().min(8, _t("register.password-placeholder")),
      confirm_password: z.string(),
    }).refine(
      (data) => data.password === data.confirm_password,
      {
        path: ["confirm_password"],
        message: _t("register.confirm_password-eq"),
      }
    );
  type Step2Values = z.infer<typeof step2Schema>;
  const step2Form = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    mode: "onSubmit",
    defaultValues: {password: "", confirm_password: ""},
  });
  const onResetPassword = step2Form.handleSubmit(async (values) => {
    try {
      // 重置密码
      const {code, message} = await forgetPasswordReset({
        mobile: step1.getValues('mobile'),
        verify_code: step1.getValues('verify_code'),
        password: values.password,
        confirm_password: values.confirm_password,
      });

      if (code == 200) {
        toast.success(message);
        router.replace(`/${locale}/auth/login`);
      } else {
        toast.error(message);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : _t('common.catch-error');
      toast.error(msg);
    }
  });

  return (
    <div className="flex min-h-screen justify-center bg-[#eef3f8]">
      <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
        <div className="pt-13 flex items-center justify-center">
          <Image src={"/login-logo.png"} alt={'Login'} width={200} height={200} className="w-32 h-auto" priority/>
        </div>

        {/* Step 指示 */}
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between text-sm p-14 pt-0 pb-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                "h-2.5 w-2.5 rounded-full",
                step === 1 ? "bg-red-600" : "bg-gray-300"
              )}/>
              <span className={cn(step === 1 ? "text-gray-900 font-medium" : "text-gray-500")}>
                {_t('forgot-password.submit-step1')}
              </span>
            </div>
            <div className="flex-1 mx-2 h-[1px] bg-gray-200"/>
            <div className="flex items-center gap-2">
              <span className={cn(
                "h-2.5 w-2.5 rounded-full",
                step === 2 ? "bg-red-600" : "bg-gray-300"
              )}/>
              <span className={cn(step === 2 ? "text-gray-900 font-medium" : "text-gray-500")}>
                {_t('forgot-password.submit-step2')}
              </span>
            </div>
          </div>
        </div>

        {/* 内容 */}
        <main className="px-3 pb-20 pt-4">
          {step === 1 ? (
            <form onSubmit={onVerify} className="space-y-3">
              <div className="bg-white rounded-xl shadow-sm p-3">
                {/* 手机号 */}
                <div className="flex justify-center items-center border-b border-gray-200">
                  <label className="w-1/4 text-gray-700" htmlFor={'mobile'}>{_t('register.mobile-label')}</label>
                  <div className="w-3/4">
                    <input
                      id="mobile"
                      type="text"
                      placeholder={_t('register.mobile-placeholder')}
                      {...step1.register("mobile")}
                      className=" w-3/4 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
                      onChange={(e) => {
                        if (e.target.value.length > 0) {
                          setIsDisable(false);
                          step1.clearErrors("mobile");
                        } else {
                          setIsDisable(true);
                        }
                      }}
                    />
                  </div>
                </div>
                {step1.formState.errors.mobile && (
                  <p className="mt-1 text-xs text-red-500">{step1.formState.errors.mobile.message}</p>
                )}

                {/* 验证码 */}
                <div className="flex justify-center items-center">
                  <label className="w-1/4 text-gray-700"
                         htmlFor={'verify_code'}>{_t('common.sms-verify_code-label')}</label>
                  <div className="flex w-3/4 items-center gap-2">
                    <input
                      id="verify_code"
                      type="text"
                      placeholder={_t('common.sms-verify_code-placeholder')}
                      {...step1.register("verify_code")}
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
                      {isSending ? _t('common.sms-verify_code-sending') : countdown > 0 ? `${countdown}s` : _t('common.sms-verify_code-send-btn')}
                    </button>
                  </div>
                </div>
                {step1.formState.errors.verify_code && (
                  <p className="mt-1 text-xs text-red-500">{step1.formState.errors.verify_code.message}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white font-medium"
                disabled={step1.formState.isSubmitting}
              >
                {step1.formState.isSubmitting ? _t("common.form.button.submitting") : _t("forgot-password.submit-btn1")}
              </button>
            </form>
          ) : (
            <form onSubmit={onResetPassword} className="space-y-3">
              <div className="bg-white rounded-xl shadow-sm p-3">
                {/* 密码 */}
                <div className="flex justify-center items-center border-b border-gray-200">
                  <label className="w-1/4 text-gray-700" htmlFor={'password'}>{_t('register.password-label')}</label>
                  <div className="w-3/4">
                    <input
                      id="password"
                      type="password"
                      {...step2Form.register("password")}
                      placeholder={_t('register.password-placeholder')}
                      className=" w-3/4 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
                    />
                  </div>
                </div>
                {step2Form.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-500">{step2Form.formState.errors.password.message}</p>
                )}

                {/* 确认密码 */}
                <div className="flex justify-center items-center">
                  <label className="w-1/4 text-gray-700"
                         htmlFor={'confirm_password'}>{_t('register.confirm_password-label')}</label>
                  <div className="w-3/4">
                    <input
                      id="confirm_password"
                      type="password"
                      {...step2Form.register("confirm_password")}
                      placeholder={_t('register.confirm_password-placeholder')}
                      className=" w-3/4 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
                    />
                  </div>
                </div>
                {step2Form.formState.errors.confirm_password && (
                  <p className="mt-1 text-xs text-red-500">{step2Form.formState.errors.confirm_password.message}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white font-medium"
                disabled={step2Form.formState.isSubmitting}
              >
                {step2Form.formState.isSubmitting ? _t("common.form.button.submitting") : _t("forgot-password.submit-btn2")}
              </button>

              <button
                type="button"
                className="w-full text-gray-500"
                onClick={() => setStep(1)}
              >
                {_t("common.forgot-password.submit-btn3")}
              </button>
            </form>
          )}
        </main>

        <div className="h-14"/>
      </div>
    </div>
  );
}

function StepDot({active, text}: { active: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "h-2.5 w-2.5 rounded-full",
          active ? "bg-red-600" : "bg-gray-300"
        )}
      />
      <span className={cn(active ? "text-gray-900 font-medium" : "text-gray-500")}>
        {text}
      </span>
    </div>
  );
}
