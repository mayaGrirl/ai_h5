"use client";

import * as React from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {PageHeader} from "@/components/page-header";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {packExchange} from "@/api/customer";
import {toast} from "sonner";
import {useTranslations} from "use-intl";

export default function GiftPage() {
  // 页面需要登陆Hook
  useRequireLogin();

  const _t = useTranslations();
  const [formKey, setFormKey] = React.useState(0);

  // 表单验证
  const schema = z.object({
    code: z.string().min(1, _t('gift.code-placeholder'))
      .max(20, _t('gift.code-max'))
      .regex(/^[a-zA-Z0-9]+$/, _t('gift.code-regex')),
  });

  type FormValues = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    reset,
    formState: {errors, isSubmitting},
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
  });

  // 提交表单
  const onSubmit = handleSubmit(async (values) => {
    const result = await packExchange({
      code: values.code,
    });
    const {code, message} = result;
    if (code !== 200) {
      toast.error(message);
    } else {
      toast.success(message);
      /**
       * reset 表单之后会导致输入框的值变成undefined
       * 导致验证规则失效
       * 使用formKey 让表单初始化成新的
       */
      reset();
      setFormKey((k) => k + 1);
    }
  })

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t("mine.setting.gift")}/>

          <div className="bg-gray-100 flex justify-center">
            <form onSubmit={onSubmit} key={formKey} className="w-full bg-gray-100 px-3 py-4">
              {/* 红包码 */}
              <div className="bg-white rounded-lg mb-3 overflow-hidden">
                <div className="flex items-center text-gray-600 px-4 py-3 pb-0">
                  <span className="w-1 h-4 bg-red-600 rounded mr-2"></span>
                  {_t('gift.title')}
                </div>
                <div className="flex items-center px-4 py-3 border-b">
                  <label className="w-2/7 text-gray-700" htmlFor="code">{_t('gift.code-label')}</label>
                  <input
                    type="text" id="code"
                    autoComplete="off"
                    {...register("code")}
                    placeholder={_t('gift.code-placeholder')}
                    className="text-gray-600 w-5/7 placeholder-gray-400 focus:outline-none h-10"
                    onCompositionEnd={(e) => {
                      e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-Z0-9]/g, "");
                    }}
                    onChange={(e) => {
                      const value = e.target.value;
                      // 只允许数字 + 大小写字母
                      e.target.value = value.replace(/[^a-zA-Z0-9]/g, "");
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const text = e.clipboardData.getData("text");
                      const filtered = text.replace(/[^a-zA-Z0-9]/g, "");
                      const input = e.currentTarget;
                      const start = input.selectionStart ?? 0;
                      const end = input.selectionEnd ?? 0;
                      input.value = input.value.slice(0, start) + filtered + input.value.slice(end);
                    }}
                  />
                </div>
                {errors.code && (
                  <p className="mt-1 text-xs text-red-500">{errors.code.message}</p>
                )}
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
