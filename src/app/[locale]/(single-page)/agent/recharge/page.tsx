"use client";

import {useRequireLogin} from "@/hooks/useRequireLogin";
import {PageHeader} from "@/components/page-header";
import * as React from "react";
import {useFormatter, useLocale, useTranslations} from "use-intl";
import Link from "next/link";
import {ChevronRight} from "lucide-react";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {toast} from "sonner";
import {LOCALE_CURRENCY_MAP} from "@/i18n/routing";
import Image from "next/image";
import {AgentField} from "@/types/agent.type";
import {useEffect, useState} from "react";
import {agentProfile, agentRecharge, checkUid} from "@/api/agent";
import {cn} from "@/lib/utils";

const fastAmount = [100, 500, 1000, 5000];

export default function AgentRechargePage() {
  // 页面需要登陆Hook
  useRequireLogin();
  const _t = useTranslations();
  const locale = useLocale();

  // 币种符号
  const currency = LOCALE_CURRENCY_MAP[locale] ?? 'USD';
  // 格式化金额
  const format = useFormatter();

  const [profile, setProfile] = useState<AgentField>();
  useEffect(() => {
    const init = async () => {
      const {code, data} = await agentProfile();
      if (code === 200) {
        setProfile(data);
      }
    }
    void init();
  }, []);

  // 是否开始检测账号
  const [isSending, setIsSending] = useState(false);
  // 表单Key
  const [formKey, setFormKey] = useState(0);
  // 表单验证
  const schema = z.object({
    uid: z.number({message: _t('agent.recharge.form-uid-placeholder')}),
    amount: z.number({message: _t('agent.recharge.form-amount-placeholder')})
  }).superRefine((data, ctx) => {
    // 银行余额
    const max = profile?.bankpoints || 0;
    const ca = data.amount * 1000;
    if (max !== undefined && ca > max) {
      ctx.addIssue({
        path: ["amount"],
        message: _t('agent.recharge.form-uid-min'),
        code: "custom",
      });
    }
  });
  type FormValues = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
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
      toast.info(_t('agent.recharge.form-amount-min'))
      return;
    }
    const result = await agentRecharge({
      amount: values.amount,
      uid: values.uid,
    });
    const {code, message, data} = result;
    if (code !== 200) {
      toast.error(message);
    } else {
      toast.success(message);
      reset();
      setCheckData('')
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

  // 检测用户ID是否存在
  const [checkData, setCheckData] = useState<string>();
  const checkCustomer = async () => {
    if (isSending) return;

    const uid = getValues("uid");
    if (!/^\d+$/.test(String(uid))) {
      setError("uid", {
        type: "manual",
        message: _t('agent.recharge.form-uid-placeholder'),
      });
      return;
    }

    // 立刻锁定， 防止重复点击
    setIsSending(true);
    try {
      const {code, data, message} = await checkUid(uid);
      if (code !== 200) {
        toast.error(message);
      } else {
        const msg = _t("agent.recharge.form-check-hit", {
          aid: data.aid,
          nickname: data.nickname,
          realname: data.realname
        });
        setCheckData(msg)
        clearErrors('uid')
        toast.success(message);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : _t('common.sms-verify_code-send-failed');
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  // 快速设置金额
  const fastAmountClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // 防止点到空白区域
    const span = target.closest("span[data-val]") as HTMLElement | null;
    if (!span) return;

    // 金额
    const val = span.dataset.val;
    if (!val) return;

    const amount = Number(val);

    // 设置金额
    setValue("amount", amount)
    clearErrors('amount')
  }
  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t("agent.quick-menu-2")}/>
          <main className="px-2">
            <div className="flex items-center justify-end">
              <Link
                key='recharge-record-key'
                href={`/${locale}/agent/recharge/record`}
                className={`flex py-2 text-[#0000EE] font-bold`}
              >
                {_t('agent.recharge.record-title')}<ChevronRight/>
              </Link>
            </div>

            <div className="">
              {/* 余额 */}
              <div className="w-full bg-gray-100">
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
                  {/* 金豆余额 */}
                  <div className="flex px-3 py-3 bg-white rounded-lg">
                    <div className="w-1/4">{_t('agent.recharge.head-rate')}</div>
                    <div className="">{(profile?.buycard_rate || 0) * 10} {_t('agent.recharge.head-rate-unit')}</div>
                  </div>
                </div>
              </div>

              <form onSubmit={onSubmit} key={formKey} className="w-full bg-gray-100 pb-8">
                <div className="bg-white rounded-lg mb-3 overflow-hidden">

                  {/* 用户ID */}
                  <div className="flex items-center px-4 mt-3">
                    <label className="w-2/7 text-gray-700" htmlFor={'uid'}>{_t('agent.recharge.form-uid-label')}</label>
                    <div className="flex w-5/7 items-center gap-2 flex-wrap sm:flex-nowrap">
                      <input id="uid" type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder={_t('agent.recharge.form-uid-placeholder')}
                        {...register("uid", {
                          valueAsNumber: true,
                        })}
                        onChange={(e) => {
                          if (e.target.value) {
                            // 只保留数字
                            const _v = Number(e.target.value.replace(/[^\d]/g, ""));
                            setValue("uid", _v);
                            clearErrors('uid')
                          }
                        }}
                        className="flex-1 min-w-0 text-gray-800 placeholder-gray-400 focus:outline-none h-10 border"
                      />
                      <button
                        type="button"
                        disabled={isSending}
                        onClick={checkCustomer}
                        className={cn(
                          "shrink-0 h-8 px-3 rounded whitespace-nowrap transition",
                          isSending
                            ? "bg-gray-600 text-white cursor-not-allowed"
                            : "bg-blue-600 text-white active:scale-95 cursor-pointer"
                        )}
                      >
                        {isSending ? _t('common.form.button.submitting') : _t('agent.recharge.form-uid-check-btn')}
                      </button>
                    </div>
                  </div>
                  <div className="px-4"><p className="ml-[calc(2/7*100%)] text-xs">{checkData}</p></div>
                  {errors.uid && (
                    <p className="mt-1 text-xs text-red-500">{errors.uid.message}</p>
                  )}

                  {/* 金额 */}
                  <div className="flex items-center px-4 py-3">
                    <div className="w-2/7 text-gray-700">{_t('agent.recharge.form-amount-label')}</div>
                    <div className="flex flex-wrap gap-2 justify-start w-5/7" onClick={fastAmountClick}>
                      {fastAmount.map((v) => (
                        <span key={`span-key-${v}`}
                              data-val={v}
                              className="shrink-0 h-8 px-3 py-1 rounded whitespace-nowrap transition bg-blue-600
                              text-white active:scale-95 cursor-pointer">
                          {format.number(v, {
                            style: "currency",
                            currency,
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center px-4 pb-3">
                    <label className="w-2/7 text-gray-700" htmlFor="amount"></label>
                    <input type="text" id="amount"
                           pattern="[0-9]*"
                           inputMode="numeric"
                           {...register("amount", {
                             valueAsNumber: true,
                           })}
                           placeholder={_t('agent.recharge.form-amount-placeholder')}
                           className="text-gray-600 w-5/7 placeholder-gray-400 focus:outline-none h-10 border"
                           onChange={(e) => {
                             if (e.target.value) {
                               // 只保留数字
                               const _v = Number(e.target.value.replace(/[^\d]/g, ""));
                               setValue("amount", _v);
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
            </div>
          </main>

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  )
}
