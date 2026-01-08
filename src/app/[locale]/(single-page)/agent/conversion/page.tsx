"use client";

import {useRequireLogin} from "@/hooks/useRequireLogin";
import {PageHeader} from "@/components/page-header";
import * as React from "react";
import {useFormatter, useLocale, useTranslations} from "use-intl";
import Image from "next/image";
import {LOCALE_CURRENCY_MAP} from "@/i18n/routing";
import {useEffect, useState} from "react";
import {AgentField} from "@/types/agent.type";
import {agentOptions, agentProfile, agentTransfer} from "@/api/agent";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {toast} from "sonner";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {HttpRes} from "@/types/http.type";

export default function AgentConversionPage() {
  // 页面需要登陆Hook
  useRequireLogin();
  const _t = useTranslations();
  const locale = useLocale();

  // 币种符号
  const currency = LOCALE_CURRENCY_MAP[locale] ?? 'USD';
  // 格式化金额
  const format = useFormatter();

  const [loading, setLoading] = useState(false)
  // 转换代理选项
  const [options, setOptions] = useState<AgentField[]>([])

  const [profile, setProfile] = useState<AgentField>();
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const {code, data} = await agentProfile();
      if (code === 200) {
        setProfile(data);
      }

      const res: HttpRes<AgentField[]> = await agentOptions();
      if (res.code === 200) {
        setOptions(res.data);
      }
      setLoading(false)
    }
    void init();
  }, []);

  // 表单Key
  const [formKey, setFormKey] = useState(0);
  // 表单验证
  const schema = z.object({
    uid: z.number({message: _t('agent.conversion.form-uid-placeholder')}),
    amount: z.number({message: _t('agent.conversion.form-amount-placeholder')})
  }).superRefine((data, ctx) => {
    // 银行余额
    const max = profile?.bankpoints || 0;
    const ca = data.amount * 1000;
    if (max !== undefined && ca > max) {
      ctx.addIssue({
        path: ["amount"],
        message: _t('agent.conversion.form-amount-min'),
        code: "custom",
      });
    }
  });
  type FormValues = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    reset,
    formState: {isSubmitting, errors},
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
  });
  // 提交表单
  const onSubmit = handleSubmit(async (values) => {
    const bankPoints = profile?.bankpoints || 0;
    if (bankPoints < 1) {
      toast.info(_t('agent.conversion.form-amount-min'))
      return;
    }
    const result = await agentTransfer({
      amount: values.amount,
      uid: values.uid,
    });
    const {code, message, data} = result;
    if (code !== 200) {
      toast.error(message);
    } else {
      toast.success(message);
      reset();
      setFormKey((k) => k + 1);
      setProfile(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          bankpoints: data.bankpoints || 0,
        };
      });
    }
  })

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t("agent.quick-menu-4")}/>

          <main className="px-2">
            <div className="w-full bg-gray-100 mt-2">
              <div className="bg-white rounded-lg mb-3 overflow-hidden">
                {/* 银行余额 */}
                <div className="flex items-center px-3 py-3 bg-white rounded-lg">
                  <div className="w-1/4">{_t('agent.recharge.head-bank-point')}</div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-red-500 font-semibold">
                      {format.number(profile?.bankpoints || 0)}
                      <Image
                        alt="coin"
                        className="inline-block w-[13px] h-[13px]"
                        src="/ranking/coin.png"
                        width={13}
                        height={13}
                      />
                    </div>
                    <div className="text-sm">
                      {format.number((profile?.bankpoints || 0) / 1000, {
                        style: 'currency',
                        currency: currency
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={onSubmit} key={formKey} className="w-full bg-gray-100 pb-8">
              <div className="bg-white rounded-lg mb-3 overflow-hidden">
                {/* 金额 */}
                <div className="flex items-center px-4 py-3">
                  <label className="w-2/7 text-gray-700" htmlFor="amount">{_t('agent.conversion.form-amount-label')}</label>
                  <input type="text" id="amount"
                         pattern="[0-9]*"
                         inputMode="numeric"
                         {...register("amount", {
                           valueAsNumber: true,
                         })}
                         placeholder={_t('agent.conversion.form-amount-placeholder')}
                         className="w-5/7 flex h-9 items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                         onChange={(e) => {
                           if (e.target.value) {
                             // 只保留数字
                             const _v = Number(e.target.value.replace(/[^\d]/g, ""));
                             setValue("amount", _v);
                             clearErrors('amount')
                           }
                         }}
                         autoComplete="off"
                         autoCorrect="off"
                         spellCheck={false}
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
                )}

                <div className="flex items-center px-4 pb-3">
                  <label className="w-2/7 text-gray-700" htmlFor="uid">{_t('agent.conversion.form-uid-label')}</label>
                  <Select {...register("uid")} onValueChange={(v) => {
                    setValue('uid', Number(v));
                    clearErrors('uid');
                  }}>
                    <SelectTrigger className="w-5/7" id="uid">
                      <SelectValue placeholder={loading ? _t('common.loading') : _t('agent.conversion.form-uid-placeholder')}/>
                    </SelectTrigger>
                    <SelectContent className="max-h-[60vh] overflow-y-auto touch-pan-y">
                      {options.map((item) => (
                        <SelectItem key={`agent-option-${item.uid}`} value={String(item.uid)}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {errors.uid && (
                  <p className="mt-1 text-xs text-red-500">{errors.uid.message}</p>
                )}

              </div>

              {/* 确认按钮 */}
              <button
                disabled={isSubmitting}
                className={`h-12 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white
                  font-medium tracking-wide
                  ${(isSubmitting) ? "opacity-60 cursor-not-allowed" : "cursor-pointer transition transform active:scale-95"}`
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
  )
}
