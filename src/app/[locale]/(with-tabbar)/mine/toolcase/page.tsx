"use client";

import React, {useEffect, useState} from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {PageHeader} from "@/components/page-header";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {toast} from "sonner";
import {z} from "zod";
import {checkSecurityPass} from "@/api/customer";
import {useTranslations} from "use-intl";
import {SAFE_QUESTION_OPTIONS} from "@/constants/constants";
import CardRecordPage from "./record/page";
import {getSecureToken, setSecureToken} from "./verify-key";

export default function ToolCasePage() {
  // 页面需要登陆Hook
  useRequireLogin();

  const _t = useTranslations();
  // 验证状态
  const [verified, setVerified] = useState<boolean|null>(null);

  useEffect(() => {
    const levelOptions = async () => {
      try {
        setVerified(!!getSecureToken());
      } catch {
        setVerified(false);
      }
    }
    void levelOptions();
  }, []);

  const schema = z.object({
    safe_ask: z.string().min(1, _t("mine.toolcase.question-options.default")),
    answer: z.string().min(1, _t("common.form.placeholder.enter") + _t("mine.toolcase.form-label.answer"))
      .max(50, _t("mine.security-settings.group-account.password.answer-max")),
  });
  type FormValues = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const onSubmit = async (values: { safe_ask: string; answer: string; }) => {
    const result = await checkSecurityPass({
      safe_ask: values.safe_ask,
      answer: values.answer,
    });
    const {code, message, data} = result;
    if (code !== 200) {
      toast.error(message);
    } else {
      toast.success(message);

      setVerified(true);
      setSecureToken(data.key, 480);
    }
  }

  if (verified == null) return;
  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t("mine.setting.toolcase")}/>

          {/* 提示 */}
          {!verified && (
            <main className="px-3 pb-20 pt-3">
              {/* 提交表单 */}
              <form onSubmit={handleSubmit(onSubmit)} className="mt-5">
                <div className="bg-white rounded-xl shadow-sm p-2">
                  {/* 手机号 */}
                  <div className="flex justify-center items-center">
                    <label className="w-1/5 text-gray-700">{_t("mine.toolcase.form-label.question")}</label>
                    <select {...register("safe_ask")}
                            className="w-4/5 text-gray-800 placeholder-gray-400 focus:outline-none h-12">
                      <option value="">{_t("mine.toolcase.question-options.default")}</option>
                      {SAFE_QUESTION_OPTIONS.map(({value, i18nKey}) => (
                        <option key={`safe-option-key-${value}`} value={value}>
                          {_t(i18nKey)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.safe_ask && (
                    <p className="mt-1 text-xs text-red-500">{errors.safe_ask.message}</p>
                  )}
                </div>
                <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
                  <div className="flex justify-center items-center ">
                    <label className="w-1/5 text-gray-700">{_t("mine.toolcase.form-label.answer")}</label>
                    <input
                      type="text"
                      placeholder={_t("common.form.placeholder.enter") + _t("mine.toolcase.form-label.answer")}
                      {...register("answer")}
                      className="w-4/5 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
                    />
                  </div>
                  {errors.answer && (
                    <p className="mt-1 text-xs text-red-500">{errors.answer.message}</p>
                  )}
                </div>

                <button
                  disabled={isSubmitting}
                  className={`mt-10 h-12 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white
                  font-medium tracking-wide transition transform active:scale-95
                  ${isSubmitting ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`
                  }
                >
                  {isSubmitting ? _t("common.form.button.submitting") : _t("common.form.button.submit")}
                </button>
              </form>
            </main>
          )}

          {verified && <CardRecordPage/>}

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  );
}
