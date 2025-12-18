"use client";

import * as React from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {PageHeader} from "@/components/page-header";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {updatePayPassword} from "@/api/customer";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {useTranslations} from "use-intl";
import {SAFE_QUESTION_OPTIONS} from "@/constants/constants";

export default function Mine() {
  // 页面需要登陆Hook
  useRequireLogin();

  const router = useRouter();

  const _t = useTranslations();

  // 表单验证
  const schema = z.object({
    safe_ask: z.string().min(1, _t("mine.toolcase.question-options.default")),
    answer: z.string().min(1, _t("common.form.placeholder.enter") + _t("mine.toolcase.form-label.answer"))
      .max(50, _t("mine.security-settings.group-account.password.answer-max")),
    password: z.string().min(8, _t("mine.security-settings.group-account.pay-password.password-min")),
    confirm_password: z.string(),
  }).refine(
    (data) => data.password === data.confirm_password,
    {
      path: ["confirm_password"],
      message: _t("mine.security-settings.group-account.password.confirm-password-eq"),
    }
  );
  type FormValues = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
  });

  // 提交表单
  const onSubmit = handleSubmit(async (values) => {
    const result = await updatePayPassword({
      safe_ask: values.safe_ask,
      answer: values.answer,
      password: values.password,
      confirm_password: values.confirm_password,
    });
    const {code, message} = result;
    if (code !== 200) {
      toast.error(message);
    } else {
      toast.success(message);

      // 跳转登录页
      router.back();
    }
  })

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t("mine.setting.edit-pay-password")}/>

          <div className="bg-gray-100 flex justify-center">
            <form onSubmit={onSubmit} className="w-full bg-gray-100 px-3 py-4">
              {/* 修改二级密码 */}
              <div className="bg-white rounded-lg mb-3 overflow-hidden">
                <div className="flex items-center text-gray-600 px-4 py-3 pb-0">
                  <span className="w-1 h-4 bg-red-600 rounded mr-2"></span>
                  {_t("mine.security-settings.group-account.pay-password.password")}
                </div>
                <div className="flex items-center px-4 py-3 border-b">
                  <label className="w-2/7 text-gray-700" htmlFor="password">{_t("mine.security-settings.group-account.pay-password.password")}</label>
                  <input type="text" id="password"
                         {...register("password")}
                         placeholder={_t("mine.security-settings.group-account.pay-password.password-placeholder")}
                         className="text-gray-600 w-5/7 placeholder-gray-400 focus:outline-none h-10"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                )}
                <div className="flex items-center px-4 py-3">
                  <label className="w-2/7 text-gray-700" htmlFor="confirm_password">{_t("mine.security-settings.group-account.pay-password.confirm-password")}</label>
                  <input type="text" id="confirm_password"
                         {...register("confirm_password")}
                         placeholder={_t("mine.security-settings.group-account.pay-password.confirm-password-placeholder")}
                         className="text-gray-600 w-5/7 placeholder-gray-400 focus:outline-none h-10"
                  />
                </div>
                {errors.confirm_password && (
                  <p className="mt-1 text-xs text-red-500">{errors.confirm_password.message}</p>
                )}
              </div>

              {/* 安全问题 */}
              <div className="bg-white rounded-lg mb-3 overflow-hidden">
                <div className="flex items-center text-gray-600 px-4 py-3 pb-0">
                  <span className="w-1 h-4 bg-red-600 rounded mr-2"></span>
                  {_t("mine.security-settings.group-account.password.safe-ask-valid")}
                </div>
                <div className="flex items-center px-4 py-3 border-b">
                  <label className="w-2/7 text-gray-700"
                         htmlFor="safe_ask">{_t("mine.toolcase.form-label.question")}</label>
                  <select id="safe_ask" {...register("safe_ask")}
                          className="text-gray-600 w-5/7 placeholder-gray-400 focus:outline-none h-10">
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
                <div className="flex items-center px-4 py-3">
                  <label className="w-2/7 text-gray-700"
                         htmlFor="answer">{_t("mine.toolcase.form-label.answer")}</label>
                  <input type="text" id="answer"
                         {...register("answer")}
                         placeholder={_t("common.form.placeholder.enter") + _t("mine.toolcase.form-label.answer")}
                         className="text-gray-600 w-5/7 placeholder-gray-400 focus:outline-none h-10"
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
                    {_t("mine.security-settings.group-account.pay-password.tip-1")}
                  </p>
                  <p
                    className="relative pl-3 text-gray-600 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-1 before:rounded-full before:bg-red-400">
                    {_t("mine.security-settings.group-account.password.tip-2")}
                  </p>
                  <p
                    className="relative pl-3 text-gray-600 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-1 before:rounded-full before:bg-red-400">
                    {_t("mine.security-settings.group-account.password.tip-3")}
                  </p>
                </div>
              </div>

              {/* 确认按钮 */}
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
          </div>

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  );
}
