"use client";

import * as React from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {PageHeader} from "@/components/page-header";
import {useForm, useWatch} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {settingViewCardVerifyType} from "@/api/customer";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {useTranslations} from "use-intl";
import {useAuthStore} from "@/utils/storage/auth";
import {useEffect} from "react";
import {cn} from "@/lib/utils";

// 选项
const RadioOptions = [
  {value: "safeQuestion", i18nKey: "mine.security-settings.group-account.redeem.option-2"},
  {value: "emailVerify", i18nKey: "mine.security-settings.group-account.redeem.option-3"},
];

export default function CardPage() {
  // 页面需要登陆Hook
  useRequireLogin();

  const router = useRouter();
  const _t = useTranslations();

  // 当前登录会员信息
  const setCurrentCustomer = useAuthStore((s) => s.setCurrentCustomer);
  const currentCustomer = useAuthStore((s) => s.currentCustomer);
  const {hydrated} = useAuthStore();

  // 表单验证
  const schema = z.object({
    selectcardVerifyType: z.string(),
  });
  type FormValues = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: {isSubmitting},
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      selectcardVerifyType: "safeQuestion",
    },
    mode: "onSubmit",
  });
  const currentValue = useWatch({
    control,
    name: "selectcardVerifyType",
  });

  // 提交表单
  const onSubmit = handleSubmit(async (values) => {
    const result = await settingViewCardVerifyType({
      select_card_verify_type: values.selectcardVerifyType,
    });
    const {code, message} = result;
    if (code !== 200) {
      toast.error(message);
    } else {
      toast.success(message);

      if (currentCustomer) {
        setCurrentCustomer({
          ...currentCustomer,
          selectcardVerifyType: values.selectcardVerifyType,
        });
      }

      // 跳转登录页
      router.back();
    }
  })

  useEffect(() => {
    if (!hydrated) return;

    const init = async () => {
      if (currentCustomer && currentCustomer.selectcardVerifyType) {
        const radioValues = RadioOptions.map(item => item.value);

        let selectcardVerifyType = 'safeQuestion';
        if (radioValues.includes(currentCustomer.selectcardVerifyType)) {
          selectcardVerifyType = currentCustomer.selectcardVerifyType
        }
        setValue("selectcardVerifyType", selectcardVerifyType);
      }
    };

    void init();
  }, [setValue, hydrated, currentCustomer]);

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t("mine.security-settings.group-other.card")}/>

          <form onSubmit={onSubmit} className="w-full bg-gray-100 px-3 py-4">
            <div className="bg-white rounded-lg mb-3 overflow-hidden">
              <div className="flex flex-wrap flex-col items-start content-start px-4 py-3 border-b">
                {RadioOptions.map(({value, i18nKey}) => {
                  // 当前选中的radio
                  const checked = currentValue === value;
                  return (
                    <label
                      key={value}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 cursor-pointer",
                        checked ? "text-blue-600" : "text-gray-700"
                      )}
                    >
                      {/* 隐藏的 radio（真正被 RHF 管理） */}
                      <input
                        type="radio"
                        value={value}
                        {...register("selectcardVerifyType")}
                        className="hidden"
                      />

                      {/* 自定义 radio UI */}
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-full border",
                          checked
                            ? "border-red-600 bg-red-600"
                            : "border-gray-300"
                        )}
                      >
                        {checked && (
                          <span className="h-2 w-2 rounded-full bg-white"/>
                        )}
                      </span>
                      <span className="text-sm">{_t(i18nKey)}</span>
                    </label>
                  );
                })}
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

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  );
}
