"use client";

import * as React from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {PageHeader} from "@/components/page-header";
import {useForm, useWatch} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {settingLoginAddress} from "@/api/customer";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {useTranslations} from "use-intl";
import {AlertCircleIcon} from "lucide-react";
import {Alert, AlertTitle} from "@/components/ui/alert";
import {useAuthStore} from "@/utils/storage/auth";
import {useEffect} from "react";

export default function LoginAddressPage() {
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
    enabled: z.boolean(),
    address1: z.string().trim().max(20, _t("mine.security-settings.group-account.login-location.address1-max")).optional(),
    address2: z.string().trim().max(20, _t("mine.security-settings.group-account.login-location.address1-max")).optional(),
  }).refine(
    (data) => {
      if (!data.enabled) return true;
      return !!data.address1 || !!data.address2;
    },
    {
      message: _t("mine.security-settings.group-account.login-location.address1-empty"),
      path: ["address1"],
    }
  );
  type FormValues = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: {errors, isSubmitting},
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      enabled: false,
      address1: "",
      address2: "",
    },
    mode: "onSubmit",
  });
  const enabled = useWatch({
    control,
    name: "enabled",
  });

  // 提交表单
  const onSubmit = handleSubmit(async (values) => {
    const result = await settingLoginAddress({
      enabled: values.enabled ? 1 : 0,
      address1: values.address1,
      address2: values.address2,
    });
    const {code, message} = result;
    if (code !== 200) {
      toast.error(message);
    } else {
      toast.success(message);

      if (currentCustomer) {
        setCurrentCustomer({
          ...currentCustomer,
          isLogin: values.enabled ? 1 : 0,
          address1: values.address1 ?? currentCustomer.address1,
          address2: values.address2 ?? currentCustomer.address2,
        });
      }

      // 跳转登录页
      router.back();
    }
  })

  useEffect(() => {
    if (!hydrated) return;

    const init = async () => {
      if (currentCustomer) {
        setValue("enabled", !!currentCustomer?.isLogin)
        setValue("address1", currentCustomer?.address1 ?? '')
        setValue("address2", currentCustomer?.address2 ?? '')
      }
    };

    void init();
  }, [setValue, hydrated, currentCustomer]);

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t("mine.security-settings.group-account.login-location.title")}/>

          <form onSubmit={onSubmit} className="w-full bg-gray-100 px-3 py-4">
            {/* 修改二级密码 */}
            <div className="bg-white rounded-lg mb-3 overflow-hidden">
              <div className="flex items-center px-4 py-3 border-b">
                <label className="w-2/7 text-gray-700" htmlFor="enabled">{_t("mine.security-settings.group-account.login-location.enabled-label")}</label>

                <button
                  id={"enabled"}
                  type="button"
                  onClick={() => setValue("enabled", !enabled)}
                  className={`relative inline-flex h-6 w-11 items-center cursor-pointer rounded-full transition ${enabled ? "bg-red-500" : "bg-gray-300"}`}
                >
                  <span
                    className={`inline-block h-6 w-6 rounded-full bg-white transition
                      ${enabled ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>
              <div className="flex items-center px-4 py-3 border-b">
                <label className="w-2/7 text-gray-700" htmlFor="address1">{_t("mine.security-settings.group-account.login-location.address1-label")}</label>
                <input type="text" id="address1"
                       {...register("address1")}
                       placeholder={_t("common.form.placeholder.enter") + _t("mine.security-settings.group-account.login-location.address2-label")}
                       className="text-gray-600 w-5/7 placeholder-gray-400 focus:outline-none h-10"
                />
              </div>
              {errors.address1 && (
                <p className="mt-1 text-xs text-red-500">{errors.address1.message}</p>
              )}
              <div className="flex items-center px-4 py-3">
                <label className="w-2/7 text-gray-700" htmlFor="address2">{_t("mine.security-settings.group-account.login-location.address2-label")}</label>
                <input type="text" id="address2"
                       {...register("address2")}
                       placeholder={_t("common.form.placeholder.enter") + _t("mine.security-settings.group-account.login-location.address2-label")}
                       className="text-gray-600 w-5/7 placeholder-gray-400 focus:outline-none h-10"
                />
              </div>
              {errors.address2 && (
                <p className="mt-1 text-xs text-red-500">{errors.address2.message}</p>
              )}
            </div>

            <Alert variant="warning">
              <div className="flex items-center gap-2">
                <AlertCircleIcon/>
                <AlertTitle>
                  {_t("mine.security-settings.group-account.login-location.alert-1")}<br/>
                  {_t("mine.security-settings.group-account.login-location.alert-2")}
                </AlertTitle>
              </div>
            </Alert>

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
