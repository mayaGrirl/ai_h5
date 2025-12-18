"use client";

import * as React from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {AlertCircleIcon} from "lucide-react";
import {z} from "zod";
import {PageHeader} from "@/components/page-header";
import {Alert, AlertTitle} from "@/components/ui/alert";
import {bindEmail} from "@/api/customer";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {useEffect} from "react";
import {CustomerField} from "@/types/customer.type";
import {useTranslations} from "use-intl";
import {useAuthStore} from "@/utils/storage/auth";

const schema = z.object({
  email: z.string().min(1).max(50).regex(/^[\w\-\.]+@[\w\-]+(\.\w+)+$/, "邮箱格式不正确"),
});
type FormValues = z.infer<typeof schema>;

/**
 * 绑定邮箱
 * @constructor
 */
export default function Mine() {
  // 页面需要登陆Hook
  useRequireLogin();
  const router = useRouter();
  const _t = useTranslations();

  const [profile, setProfile] = React.useState<CustomerField>();

  const currentCustomer = useAuthStore((s) => s.currentCustomer);
  const {hydrated} = useAuthStore();

  const {
    register,
    handleSubmit,
    setValue,
    formState: {errors, isSubmitting},
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  useEffect(() => {
    if (!hydrated) return;

    const init = async () => {
      if (currentCustomer) {
        setProfile(currentCustomer)
        setValue("email", currentCustomer?.email)
      }
    };

    void init();
  }, [setValue, hydrated, currentCustomer]);

  const onSubmit = handleSubmit(async (values) => {
    const result = await bindEmail({
      email: values.email,
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
          <PageHeader title={_t("mine.bind-email.title")}/>
          {/* 提示 */}
          <main className="px-3 pb-20 pt-3">
            <Alert variant="destructive">
              <div className="flex items-center gap-2">
                <AlertCircleIcon/>
                <AlertTitle>{_t("mine.bind-email.alert")}</AlertTitle>
              </div>
            </Alert>

            {/* 提交表单 */}
            <form onSubmit={onSubmit} className="mt-5">
              <div className="bg-white rounded-xl shadow-sm p-2">
                {/* 手机号 */}
                <div className="flex justify-center items-center ">
                  <label className="w-1/7 text-gray-700">{_t("mine.profile.form-label.email")}</label>
                  <input
                    type="text"
                    placeholder={_t("common.form.placeholder.enter") + _t("mine.profile.form-label.email")}
                    {...register("email")}
                    disabled={!!profile?.email}
                    className="w-6/7 text-gray-800 placeholder-gray-400 focus:outline-none h-12"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              {!profile?.email && (
                <button
                  disabled={isSubmitting}
                  className={`mt-10 h-12 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white
                  font-medium tracking-wide transition transform active:scale-95
                  ${isSubmitting ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`
                  }
                >
                  {isSubmitting ? _t("common.form.button.submitting") : _t("common.form.button.submit")}
                </button>
              )}
            </form>
          </main>

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  );
}
