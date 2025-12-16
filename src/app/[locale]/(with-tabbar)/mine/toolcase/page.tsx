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

/**
 * 我的道具
 */
const schema = z.object({
  safe_ask: z.string().min(1, "请选择安全问题"),
  answer: z.string().min(1, "请输入答案").max(50, '不能超过50字符'),
});
type FormValues = z.infer<typeof schema>;

export default function Mine() {
  // 页面需要登陆Hook
  useRequireLogin();
  const router = useRouter();
  const _t = useTranslations();

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

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t("mine.setting.toolcase")}/>

          {/* 提示 */}
          <main className="px-3 pb-20 pt-3">
            {/* 提交表单 */}
            <form onSubmit={onSubmit} className="mt-5">
              <div className="bg-white rounded-xl shadow-sm p-2">
                {/* 手机号 */}
                <div className="flex justify-center items-center">
                  <label className="w-1/5 text-gray-700">{_t("mine.toolcase.form-label.question")}</label>
                  <select {...register("safe_ask")} className="w-4/5 text-gray-800 placeholder-gray-400 focus:outline-none h-12">
                    <option value={1}>{_t("mine.toolcase.question-options.1")}</option>
                    <option value={1}>{_t("mine.toolcase.question-options.1")}</option>
                    <option value={2}>{_t("mine.toolcase.question-options.2")}</option>
                    <option value={3}>{_t("mine.toolcase.question-options.3")}</option>
                    <option value={4}>{_t("mine.toolcase.question-options.4")}</option>
                    <option value={5}>{_t("mine.toolcase.question-options.5")}</option>
                    <option value={6}>{_t("mine.toolcase.question-options.6")}</option>
                    <option value={7}>{_t("mine.toolcase.question-options.7")}</option>
                    <option value={8}>{_t("mine.toolcase.question-options.8")}</option>
                    <option value={9}>{_t("mine.toolcase.question-options.9")}</option>
                    <option value={10}>{_t("mine.toolcase.question-options.10")}</option>
                    <option value={11}>{_t("mine.toolcase.question-options.11")}</option>
                    <option value={12}>{_t("mine.toolcase.question-options.12")}</option>
                    <option value={13}>{_t("mine.toolcase.question-options.13")}</option>
                    <option value={14}>{_t("mine.toolcase.question-options.14")}</option>
                    <option value={15}>{_t("mine.toolcase.question-options.15")}</option>
                    <option value={16}>{_t("mine.toolcase.question-options.16")}</option>
                    <option value={17}>{_t("mine.toolcase.question-options.17")}</option>
                    <option value={18}>{_t("mine.toolcase.question-options.18")}</option>
                    <option value={19}>{_t("mine.toolcase.question-options.19")}</option>
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

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  );
}
