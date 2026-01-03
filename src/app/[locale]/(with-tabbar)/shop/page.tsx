"use client";

import React, {useEffect, useState} from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import Image from "next/image";
import Link from "next/link";
import {PageHeader} from "@/components/page-header";
import {useFormatter, useLocale, useTranslations} from "use-intl";
import {LOCALE_CURRENCY_MAP} from "@/i18n/routing";
import {ChevronRight} from "lucide-react";
import {toast} from "sonner";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {SAFE_QUESTION_OPTIONS} from "@/constants/constants";
import TextSkeleton from "@/components/text-skeleton";
import {cardExchange, cardDetail} from "@/api/shop";
import {CardDetailResponse} from "@/types/shop.type";

// 手续费
const free = 0.02;

export default function ShopPage() {
  // 页面需要登陆Hook
  useRequireLogin();
  const locale = useLocale();
  const _t = useTranslations();

  // 币种符号
  const currency = LOCALE_CURRENCY_MAP[locale] ?? 'USD';
  // 格式化金额
  const format = useFormatter();

  const [formKey, setFormKey] = React.useState(0);
  // 页面初始化查询数据
  const [loading, setLoading] = useState<boolean>(true);
  // 温馨提示
  const [tipContent, setTipContent] = useState<string | null>(null);
  // 兑换卡密需要的明细数据
  const [detailData, setDetailData] = useState<CardDetailResponse>();
  // 是否可以提交表单
  const [isSubmit, setIsSubmit] = useState<boolean>(true);
  // 免除手续费的可领取金豆
  const [exemptCommissionBankPoints, setExemptCommissionBankPoints] = useState<number>(0);

  const fetchData = async (isTip: boolean) => {
    // 查询兑换需要的明细数据
    setLoading(true);
    const {data, code} = await cardDetail();
    if (code == 200) {
      // 设置温馨提示
      if (isTip) setTipContent(data?.block_content || '');
      // 设置明细数据
      setDetailData(data);
      // 免除手续费的可领取金豆
      setExemptCommissionBankPoints(data.exempt_commission_bank_points || 0)

      // 银行存款
      const bankPoints = data.bank_points || 0;

      /**
       * 会员所在的分组是否允许兑换
       * 银行存款必须大于100
       */
      if (data.is_allowed_exchange && bankPoints >= 100) {
        setIsSubmit(false);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    const initData = async () => {
      void await fetchData(true);
    };

    void initData();
  }, []);

  // 表单验证
  const schema = z.object({
    amount: z.number({message: _t('mine.transfer.amount-placeholder')})
      .int(_t('mine.transfer.amount-verify-int'))
      .positive(_t('mine.transfer.amount-verify-gt0'))
      .refine((v) => v % 100 === 0, {
        message: _t('shop.form-placeholder-1'),
      }),
    commission: z.number().optional(),
    safe_ask: z.string().min(1, _t("mine.toolcase.question-options.default")),
    answer: z.string().min(1, _t("common.form.placeholder.enter") + _t("mine.toolcase.form-label.answer"))
      .max(50, _t("mine.security-settings.group-account.password.answer-max")),
  }).superRefine((data, ctx) => {
    const max = detailData?.bank_points;
    if (max !== undefined && data.amount > max) {
      ctx.addIssue({
        path: ["amount"],
        message: _t('shop.form-amount-verify-max'),
        code: "custom",
      });
    }
  });
  type FormValues = z.infer<typeof schema>;
  const defaultValues: Partial<FormValues> = {
    commission: 0,
  };
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: {isSubmitting, errors},
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onSubmit",
  });
  // 提交表单
  const onSubmit = handleSubmit(async (values) => {
    if (!detailData?.is_allowed_exchange) {
      toast.info(_t('shop.verify-is-allowed-exchange', {text: detailData?.gid_name}))
      return;
    }
    const result = await cardExchange({
      amount: values.amount,
      commission: 0,
      safe_ask: values.safe_ask,
      answer: values.answer,
      verify_code: 0,
    });
    const {code, message} = result;
    if (code !== 200) {
      toast.error(message);
    } else {
      toast.success(message);
      void await fetchData(false);
      reset();
      setFormKey((k) => k + 1);
    }
  })

  return (
    <div className="flex min-h-screen justify-center bg-[#eef3f8]">
      {/* 中间内容区域，控制最大宽度模拟手机界面 */}
      <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
        <PageHeader title={'商城'} isShowBack={false}/>

        {/* tabs */}
        <div className="grid grid-cols-2 gap-2 px-3 pt-3">
          <Link href={`/${locale}/shop/record`}
                className="flex justify-center items-center px-3 py-3 bg-white rounded-lg">
            <div className="text-black flex items-center">{_t('shop.tab-1')}<ChevronRight/></div>
          </Link>

          <Link href={`/${locale}/mine/toolcase`}
                className="flex justify-center items-center px-3 py-3 bg-white rounded-lg">
            <div className="text-black flex items-center">{_t('shop.tab-2')}<ChevronRight/></div>
          </Link>
        </div>

        {/* 余额 */}
        <div className="w-full bg-gray-100 px-3 py-4">
          <div className="bg-white rounded-lg mb-3 overflow-hidden">
            {/* 银行余额 */}
            <div className="grid grid-cols-2 gap-2 items-center px-3 pt-3 bg-white border-b rounded-lg">
              <div className=''>
                <div className="flex items-center gap-1 text-red-500 font-semibold">
                  <div className="text-muted-foreground">{_t('shop.items-1')}</div>
                  {format.number(detailData?.bank_points || 0)}
                  <Image
                    alt="coin"
                    className="inline-block w-[13px] h-[13px]"
                    src="/ranking/coin.png"
                    width={13}
                    height={13}
                  />
                </div>
                <Link href={`/${locale}/mine/customer-transfer`}
                      className={'flex text-xs text-amber-600'}>
                  {_t('shop.items-2')}
                  <ChevronRight className='h-4 w-4'/>
                </Link>
              </div>
              {/* 折合 */}
              <div className="flex items-center gap-1 text-red-500 font-semibold">
                <div className="text-muted-foreground">{_t('shop.items-3')}</div>
                {format.number(detailData?.bank_points_convert || 0, {style: 'currency', currency: currency})}
              </div>
            </div>
            {/* 金豆余额 */}
            <div className="grid grid-cols-2 gap-2 items-center px-3 py-3 bg-white rounded-lg">
              <div className=''>
                <div className="flex items-center gap-1 text-red-500 font-semibold">
                  <div className="text-muted-foreground">{_t('shop.items-4')}</div>
                  {format.number(detailData?.points || 0)}
                  <Image
                    alt="coin"
                    className="inline-block w-[13px] h-[13px]"
                    src="/ranking/coin.png"
                    width={13}
                    height={13}
                  />
                </div>
              </div>
              {/* 7日流水 */}
              <div className="flex items-center gap-1 text-red-500 font-semibold">
                <div className="text-muted-foreground">{_t('shop.items-5')}</div>
                {format.number(detailData?.week_water || 0)}
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
        </div>

        <form onSubmit={onSubmit} key={formKey} className="w-full bg-gray-100 px-3 pb-8">
          <div className="bg-white rounded-lg mb-3 overflow-hidden">
            {/* 金额 */}
            <div className="flex items-center px-4 py-3">
              <label className="w-2/7 text-gray-700" htmlFor="amount">{_t('shop.form-label-1')}</label>
              <input type="text" id="amount"
                     pattern="[0-9]*"
                     inputMode="numeric"
                     {...register("amount", {
                       valueAsNumber: true,
                     })}
                     placeholder={_t('shop.form-placeholder-1')}
                     className="text-gray-600 w-5/7 placeholder-gray-400 focus:outline-none h-10"
                     onChange={(e) => {
                       // 只保留数字
                       const _v = Number(e.target.value.replace(/[^\d]/g, ""));
                       setValue("amount", _v);

                       const commission = (_v - exemptCommissionBankPoints) * free;
                       console.log(Math.max(0, commission))
                       setValue("commission", Math.max(0, commission));
                     }}
                     autoComplete="off"
                     autoCorrect="off"
                     spellCheck={false}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
            )}

            {/* 手续费 */}
            <div className="flex items-center px-4 py-3">
              <label className="w-2/7 text-gray-700" htmlFor="commission">{_t('shop.form-label-2')}</label>
              <input type="text" id="commission"
                     pattern="[0-9]*"
                     inputMode="numeric"
                     disabled={true}
                     {...register("commission")}
                     className="text-gray-600 w-5/7 placeholder-gray-400 focus:outline-none h-10"
              />
            </div>

            {/* 密保问题 */}
            <div className="flex items-center px-4 py-3">
              <label className="w-2/7 text-gray-700" htmlFor="amount">{_t("mine.toolcase.form-label.question")}</label>
              <select {...register("safe_ask")}
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

            {/* 答案 */}
            <div className="flex items-center px-4 py-3">
              <label className="w-2/7 text-gray-700" htmlFor="amount">{_t("mine.toolcase.form-label.answer")}</label>
              <input
                type="text"
                placeholder={_t("common.form.placeholder.enter") + _t("mine.toolcase.form-label.answer")}
                {...register("answer")}
                className="text-gray-600 w-5/7 placeholder-gray-400 focus:outline-none h-10"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            {errors.answer && (
              <p className="mt-1 text-xs text-red-500">{errors.answer.message}</p>
            )}
          </div>

          <div className="rounded-lg mb-3 overflow-hidden">
            <div className="flex items-center text-gray-600 px-4 py-3 pb-0">
              <span className="w-1 h-4 bg-red-600 rounded mr-2"></span>
              {_t("mine.security-settings.group-account.password.tip")}
            </div>

            {/* 异步加载温馨提示 */}
            {loading ? (
              <TextSkeleton lines={8}/>
            ) : (
              <div
                className="px-4 py-1 text-gray-600"
                dangerouslySetInnerHTML={{__html: tipContent!}}
              />
            )}
          </div>

          {/* 确认按钮 */}
          <button
            disabled={isSubmitting || isSubmit}
            className={`h-12 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white
                  font-medium tracking-wide transition transform active:scale-95
                  ${(isSubmitting || isSubmit) ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`
            }
          >
            {isSubmitting ? _t("common.form.button.submitting") : _t("common.form.button.submit")}
          </button>
        </form>

        {/* 底部占位（给 TabBar 留空间） */}
        <div className="h-14"/>
      </div>
    </div>
  );
}
