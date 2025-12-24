"use client";

import * as React from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {PageHeader} from "@/components/page-header";
import {useForm, useWatch} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {getMemberCapital, memberCapitalTransfer} from "@/api/customer";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {useFormatter, useTranslations} from "use-intl";
import {useEffect, useState} from "react";
import {cn} from "@/lib/utils";
import Image from "next/image";
import {MemberCapital} from "@/types/customer.type";

// 选项
const RadioOptions = [
  {value: "in", i18nKey: "mine.transfer.type-option-1"},
  {value: "out", i18nKey: "mine.transfer.type-option-2"},
];

export default function CustomerTransferPage() {
  // 页面需要登陆Hook
  useRequireLogin();

  // 格式化金额
  const format = useFormatter();
  const router = useRouter();
  const _t = useTranslations();
  const [memberCapital, setMemberCapital] = useState<MemberCapital>();

  useEffect(() => {
    getMemberCapital().then(({data}) => {
      setMemberCapital(data);
    }).finally();
  }, []);

  // 表单验证
  const schema = z.object({
    type: z.string(),
    amount: z.number({message: _t('mine.transfer.amount-placeholder')}).
    int(_t('mine.transfer.amount-verify-int')).
    positive(_t('mine.transfer.amount-verify-gt0')),
    pay_password: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (data.type === "out" && !data.pay_password) {
      ctx.addIssue({
        path: ["pay_password"],
        message: _t('mine.transfer.pay_password-verify-out'),
        code: 'custom',
      });
    }
  }).superRefine((data, ctx) => {
    const max =
      data.type === "out" ? memberCapital?.bankpoints : memberCapital?.points;
    if (max !== undefined && data.amount > max) {
      ctx.addIssue({
        path: ["amount"],
        message: _t('mine.transfer.amount-verify-max'),
        code: "custom",
      });
    }
  });
  type FormValues = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    control,
    formState: {isSubmitting, errors},
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "in",
    },
    mode: "onSubmit",
  });

  const currentValue = useWatch({
    control,
    name: "type",
  });

  // 提交表单
  const onSubmit = handleSubmit(async (values) => {
    const result = await memberCapitalTransfer({
      type: values.type,
      amount: values.amount,
      pay_password: values.pay_password,
    });
    const {code, message} = result;
    if (code !== 200) {
      toast.error(message);
    } else {
      toast.success(message);

      // 返回上一页
      router.back();
    }
  })

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t('mine.setting.landmark')}/>

          <div className="grid grid-cols-2 gap-2 px-3 pt-3">
            <div className="flex justify-center items-center px-3 py-3 bg-white rounded-lg">
              <div className="text-muted-foreground">{_t('common.points')}</div>
              <div className="flex items-center gap-1 text-red-500 font-semibold">
                {format.number(memberCapital?.points ?? 0)}
                <Image
                  alt="coin"
                  className="inline-block w-[13px] h-[13px]"
                  src="/ranking/coin.png"
                  width={13}
                  height={13}
                />
              </div>
            </div>

            <div className="flex justify-center items-center px-3 py-3 bg-white rounded-lg">
              <div className="text-muted-foreground">{_t('mine.transfer.type-option-1')}</div>
              <div className="flex items-center gap-1 text-red-500 font-semibold">
                {format.number(memberCapital?.bankpoints ?? 0)}
                <Image
                  alt="coin"
                  className="inline-block w-[13px] h-[13px]"
                  src="/ranking/coin.png"
                  width={13}
                  height={13}
                />
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="w-full bg-gray-100 px-3 py-4">
            <div className="bg-white rounded-lg mb-3 overflow-hidden">
              <div className="flex items-center  px-4 py-3 border-b">
                <label className="w-2/7 text-gray-700" htmlFor="amount">{_t('mine.transfer.type-label')}</label>
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
                        {...register("type")}
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

              {/* 金额 */}
              <div className="flex items-center px-4 py-3">
                <label className="w-2/7 text-gray-700" htmlFor="amount">{_t('mine.transfer.amount-label')}</label>
                <input type="text" id="amount"
                       pattern="[0-9]*"
                       inputMode="numeric"
                       {...register("amount", {
                         valueAsNumber: true,
                       })}
                       placeholder={_t('mine.transfer.amount-placeholder')}
                       className="text-gray-600 w-5/7 placeholder-gray-400 focus:outline-none h-10"
                       onChange={(e) => {
                         // 只保留数字
                         e.target.value = e.target.value.replace(/[^\d]/g, "");
                       }}
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
              )}

              {/* 二级密码 */}
              {currentValue === "out" && (
                <>
                  <div className="flex items-center px-4 py-3  border-t">
                    <label className="w-2/7 text-gray-700" htmlFor="pay_password">{_t("mine.security-settings.group-pay.pay")}</label>
                    <input type="text" id="pay_password"
                           {...register("pay_password")}
                           placeholder={_t("mine.security-settings.group-account.pay-password.password-placeholder")}
                           className="text-gray-600 w-5/7 placeholder-gray-400 focus:outline-none h-10"
                    />
                  </div>
                  {errors.pay_password && (
                    <p className="mt-1 text-xs text-red-500">{errors.pay_password.message}</p>
                  )}
                </>
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

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  );
}
