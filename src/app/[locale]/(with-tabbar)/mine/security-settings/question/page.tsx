"use client";

import * as React from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {PageHeader} from "@/components/page-header";
import {useRouter} from "next/navigation";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {toast} from "sonner";
import {z} from "zod";
import {setSecurityPass} from "@/api/customer";
import {useTranslations} from "use-intl";
import {SAFE_QUESTION_OPTIONS} from "@/constants/constants";
import {isEmpty} from "@/utils/utils";
import {useAuthStore} from "@/utils/storage/auth";

/**
 * 我的道具
 */
export default function Mine() {
  // 页面需要登陆Hook
  useRequireLogin();
  const router = useRouter();
  const _t = useTranslations();


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

  const onSubmit = handleSubmit(async (values) => {
    const result = await setSecurityPass({
      safe_ask: values.safe_ask,
      answer: values.answer,
    });
    const {code, message} = result;
    if (code !== 200) {
      toast.error(message);
    } else {
      toast.success(message);

      router.back();
    }
  })

  const currentCustomer = useAuthStore((s) => s.currentCustomer);

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t("mine.security-settings.group-pay.security")}/>
          <main className="px-3 pb-20 pt-3">
            {/* 提交表单 */}
            <form onSubmit={onSubmit} className="mt-5">
              <div className="bg-white rounded-xl shadow-sm p-2">
                {/* 手机号 */}
                <div className="flex justify-center items-center">
                  <label className="w-1/5 text-gray-700">{_t("mine.toolcase.form-label.question")}</label>
                  <select {...register("safe_ask")}
                          disabled={!isEmpty(currentCustomer?.securitypass)}
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
                    disabled={!isEmpty(currentCustomer?.securitypass)}
                    placeholder={_t("common.form.placeholder.enter") + _t("mine.toolcase.form-label.answer")}
                    {...register("answer")}
                    className="w-4/5 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
                  />
                </div>
                {errors.answer && (
                  <p className="mt-1 text-xs text-red-500">{errors.answer.message}</p>
                )}
              </div>

              <div className="rounded-lg mb-3 overflow-hidden">
                <div className="flex items-center text-gray-600 px-4 py-3  pb-0">
                  <span className="w-1 h-4 bg-red-600 rounded mr-2"></span>
                  {_t("mine.security-settings.group-account.password.tip")}
                </div>
                <div className="px-4 py-3 text-gray-600">
                  <p
                    className="relative pl-3 text-gray-600 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-1 before:rounded-full before:bg-red-400">
                    {_t("mine.security-settings.group-account.question.tip-1")}
                  </p>
                  <p
                    className="relative pl-3 text-red-600 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-1 before:rounded-full before:bg-red-400">
                    {_t("mine.security-settings.group-account.question.tip-2")}
                  </p>
                </div>
              </div>

              <button
                disabled={isSubmitting || !isEmpty(currentCustomer?.securitypass)}
                className={`mt-10 h-12 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white
                  font-medium tracking-wide transition transform active:scale-95
                  ${isSubmitting ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`
                }
              >
                {isSubmitting ? _t("common.form.button.submitting") : _t("common.form.button.submit")}
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
