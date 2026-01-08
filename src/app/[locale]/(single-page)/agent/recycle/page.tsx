"use client";

import {useRequireLogin} from "@/hooks/useRequireLogin";
import {PageHeader} from "@/components/page-header";
import * as React from "react";
import {useFormatter, useLocale, useTranslations} from "use-intl";
import {useEffect, useState} from "react";
import {AgentField} from "@/types/agent.type";
import {agentProfile, agentRecycle} from "@/api/agent";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {toast} from "sonner";
import {Textarea} from "@/components/ui/textarea";
import Link from "next/link";
import {ChevronRight} from "lucide-react";
import {Drawer} from "vaul";
import {CardRecordField} from "@/types/shop.type";
import {maskString} from "@/utils/utils";

export default function AgentConversionPage() {
  // 页面需要登陆Hook
  useRequireLogin();
  const _t = useTranslations();
  const locale = useLocale();

  // 格式化金额
  const format = useFormatter();

  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [checkData, setCheckData] = useState<CardRecordField[]>()

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

  // 表单Key
  const [formKey, setFormKey] = useState(0);
  // 表单验证
  const schema = z.object({
    cards: z.string().min(1, _t('agent.recycle.form-card-placeholder')),
  });
  type FormValues = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: {isSubmitting, errors},
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
  });
  // 检测
  const onCheck = handleSubmit(async (values) => {
    const result = await agentRecycle({
      type: 'check',
      cards: values.cards,
    });
    const {code, message, data} = result;

    if (code !== 200) {
      toast.error(message);
    } else {
      toast.success(message);
      setCheckData(data)
      setIsOpen(true);
    }
  })

  // 提交回收
  const [loading, setLoading] = useState(false)
  const onSubmit = async () => {
    setLoading(true);
    const values = getValues();
    const {code, message} = await agentRecycle({
      type: 'submit',
      cards: values.cards,
    });

    if (code !== 200) {
      toast.error(message);
    } else {
      toast.success(message);
      reset();
      setFormKey((k) => k + 1);
      setIsOpen(false);
    }
    setLoading(false);
  }

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t("agent.quick-menu-3")}/>

          <main className="px-2">
            {/* 折扣 */}
            <div className="w-full bg-gray-100 mt-2">
              <div className="bg-white rounded-lg mb-3 overflow-hidden">
                <div className="flex items-center px-3 py-3 bg-white rounded-lg">
                  <div className="w-1/4">{_t('agent.recycle.head-rate')}</div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-red-500 font-semibold">
                      {(profile?.reccard_rate || 0) * 10}{_t('agent.recharge.head-rate-unit')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 表单*/}
            <form onSubmit={onCheck} key={formKey} className="w-full bg-gray-100 pb-3">
              <div className="bg-white rounded-lg mb-3 overflow-hidden">
                {/* 金额 */}
                <div className=" px-4 pt-3 text-gray-700">{_t('agent.recycle.form-card-label')}</div>
                <div className="flex items-center px-4 py-3">
                  <Textarea id="cards"
                            {...register("cards")}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            rows={10}
                  />
                </div>
                {errors.cards && (
                  <p className="mt-1 text-xs text-red-500">{errors.cards.message}</p>
                )}
              </div>

              {/* 确认按钮 */}
              <button
                disabled={isSubmitting}
                className={`h-12 w-full rounded-full bg-gradient-to-r from-[#1E9FFF] to-[#1E9FFF] text-white
                  font-medium tracking-wide mt-3
                  ${(isSubmitting) ? "opacity-60 cursor-not-allowed" : "cursor-pointer transition transform active:scale-95"}`
                }
              >
                {isSubmitting ? _t("common.form.button.submitting") : _t('agent.recycle.form-btn-1')}
              </button>
            </form>

            <Link href={`/${locale}/agent/recycle/record`}
                  className="flex justify-center items-center text-[rgb(0,0,238)]">
              <span className="flex justify-center items-center border-b border-[rgb(0,0,238)]">
                {_t('agent.recycle.form-btn-2')}<ChevronRight className="h-5 w-5"/>
              </span>
            </Link>
          </main>

          {/* 检测结果 */}
          <Drawer.Root dismissible={false} open={isOpen}>
            <Drawer.Portal>
              {/* 遮罩层 */}
              <Drawer.Overlay className="fixed inset-0 bg-black/40"/>
              <Drawer.Content
                className="fixed bottom-0 left-1/2 -translate-x-[50%] w-full max-w-xl z-[100] bg-white
                rounded-t-[10px] outline-none pb-[env(safe-area-inset-bottom)] max-h-[90vh] min-h-[50vh] flex flex-col"
              >
                <div className="py-3 rounded-t-[10px]">
                  <div className="relative flex items-center justify-center h-8">
                    <Drawer.Close
                      onClick={() => {
                        setCheckData([])
                        setIsOpen(false);
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 hover:text-gray-800
                      h-8 w-1/6 rounded-2xl bg-gradient-to-r from-[rgb(0,0,238)] to-[rgb(0,0,238)] text-white font-medium
                      tracking-wide cursor-pointer transition transform active:scale-95"
                    >
                      {_t('agent.recycle.form-btn-4')}
                    </Drawer.Close>
                    <Drawer.Title className="text-base font-medium text-gray-900">{_t('agent.recycle.check-result-title')}</Drawer.Title>
                    <Drawer.Description className="sr-only"></Drawer.Description>
                    <Drawer.Close
                      onClick={onSubmit}
                      className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-gray-800
                      h-8 w-1/4 rounded-2xl bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white font-medium
                      tracking-wide cursor-pointer transition transform active:scale-95"
                    >
                      {loading ? _t("common.form.button.submitting") : _t('agent.recycle.form-btn-3')}
                    </Drawer.Close>
                  </div>

                  <div className="grid grid-cols-[0.5fr_1fr_1fr_1fr] px-1 py-2 text-xs text-muted-foreground border-b bg-white">
                    <div>{_t('agent.recycle.result-grid-1')}</div>
                    <div className="text-center">{_t('agent.recycle.result-grid-2')}</div>
                    <div className="text-center">{_t('agent.recycle.result-grid-3')}</div>
                    <div className="text-right">{_t('agent.recycle.result-grid-4')}</div>
                  </div>

                  <div className="flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] max-h-[70vh]">
                    {checkData && checkData.map((item, index) => (
                      <div
                        key={`key-${index}`}
                        className="grid grid-cols-[0.5fr_1fr_1fr_1fr] px-1 py-1 border-b  items-center"
                      >
                        {/* 卡号 */}
                        <div className="flex justify-start items-center gap-1 font-medium">
                          {maskString(item?.no || '')}
                        </div>

                        {/* 金豆 */}
                        <div className="text-center font-medium ">
                          {format.number(item?.points || 0)}
                        </div>

                        {/* 状态 */}
                        <div className="text-center font-medium ">
                          {item?.state_label}
                        </div>

                        {/* 所属用户 */}
                        <div className="flex flex-col items-end font-medium ">
                          <div>{item?.nickname}</div>
                          <div>({item?.uid})</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  )
}
