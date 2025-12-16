"use client";

import * as React from "react";
import {PageHeader} from "@/components/page-header";
import {useParams, useRouter} from "next/navigation";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {toast} from "sonner";
import {z} from "zod";
import {getProfile, updateProfile} from "@/api/customer";
import {AlertCircleIcon, ChevronRight} from "lucide-react";
import {Alert, AlertTitle} from "@/components/ui/alert";
import Link from "next/link";
import {useEffect} from "react";
import {MemberField} from "@/types/customer.type";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {useTranslations} from "use-intl";

/**
 * 我的资料
 * @constructor
 */
export default function ProfilePage() {
  // 页面需要登陆Hook
  useRequireLogin();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const _t = useTranslations();

  const [profile, setProfile] = React.useState<MemberField>();

  const schema = z.object({
    realname: z.string().trim().refine(
      (v) => v === "" || v.length <= 50,
      {message: _t("mine.profile.validation.realname")}
    ),
    qq: z.string().trim().refine(
      (v) => v === "" || /^\d{5,12}$/.test(v),
      {message: _t("mine.profile.validation.qq")}
    ),
    alipay: z.string().trim().refine(
      (v) => v === "" || v.length <= 50,
      {message: _t("mine.profile.validation.alipay")}
    ),
    wchat: z.string().trim().refine(
      (v) => v === "" || v.length <= 50,
      {message: _t("mine.profile.validation.wchat")}
    ),
    address: z.string().trim().refine(
      (v) => v === "" || v.length <= 150,
      {message: _t("mine.profile.validation.address")}
    ),
    signature: z.string().trim().refine(
      (v) => v === "" || v.length <= 200,
      {message: _t("mine.profile.validation.signature")}
    ),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    setValue,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const {code, data} = await getProfile();
      if (code === 200) {
        setProfile(data)
        if (data?.signature) {
          setValue("signature", data.signature)
        }
      }
    };

    void fetchProfile();
  }, [setValue]);

  /**
   * 提交数据
   */
  const onSubmit = handleSubmit(async (values) => {
    const hasAnyValue = Object.values(values).some(
      (v) => {
        return v && v.trim() !== ""
      }
    );
    if (!hasAnyValue) {
      toast.warning("你未填写任何数据，无需提交");
      return;
    }
    const result = await updateProfile({
      qq: values.qq,
      wchat: values.wchat,
      alipay: values.alipay,
      realname: values.realname,
      address: values.address,
      signature: values.signature,
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
          <PageHeader title={_t("mine.setting.profile")} />

          {/* 提示 */}
          <main className="px-3 pb-20 pt-3">
            <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
              <div className="flex justify-center items-center ">
                <div className="flex w-3/5">
                  <div className="w-4/9 text-gray-500">{_t("mine.profile.form-label.nickname")}</div>
                  <div className="w-6/7 text-gray-700">{profile?.nickname}</div>
                </div>
                <Link className="flex justify-end w-2/5 cursor-pointer text-red-700" href={`/${locale}/mine/edit-nickname`}>
                  {_t("mine.profile.edit-nickname")}<ChevronRight/>
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
              <div className="flex justify-center items-center">
                {profile?.email ?
                  <>
                    <div className="w-1/5 text-gray-500">{_t("mine.profile.form-label.email")}</div>
                    <div className="flex items-center ml-1 w-4/5 text-[#c8c9cc] placeholder-gray-400 focus:outline-none">{profile?.email}</div>
                  </>
                  :
                  <>
                    <div className="w-3/5 text-gray-500">{_t("mine.profile.form-label.email")}</div>
                    <Link className="flex justify-end ml-1 w-2/5 text-red-700" href={`/${locale}/mine/bind-email`}>
                      {_t("mine.bind-email.title")}<ChevronRight/>
                    </Link>
                  </>
                }
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
              <div className="flex justify-center items-center">
                <div className="w-1/5 text-gray-500">{_t("mine.profile.form-label.mobile")}</div>
                <div className="flex ml-1 w-4/5 text-[#c8c9cc]">{profile?.mobile}</div>
              </div>
            </div>

            {/* 提交表单 */}
            <form onSubmit={onSubmit} className="mt-5">
              <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
                <div className="flex justify-center items-center ">
                  <label className="w-1/5 text-gray-500">{_t("mine.profile.form-label.qq")}</label>
                  {profile?.qq ?
                    <div className="flex items-center ml-1 w-4/5 text-[#c8c9cc] placeholder-gray-400 focus:outline-none h-10">{profile?.qq}</div>
                    :
                    <input
                      type="text"
                      placeholder={_t("common.form.placeholder.enter") + _t("mine.profile.form-label.qq")}
                      {...register("qq")}
                      disabled={!!profile?.qq}
                      className="ml-1 w-4/5 text-gray-800 placeholder-gray-400 focus:outline-none h-10"
                    />
                  }
                </div>
                {errors.qq && (
                  <p className="mt-1 text-xs text-red-500">{errors.qq.message}</p>
                )}
              </div>
              <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
                <div className="flex justify-center items-center ">
                  <label className="w-1/5 text-gray-500">{_t("mine.profile.form-label.alipay")}</label>
                  {profile?.alipay ?
                    <div className="flex items-center ml-1 w-4/5 text-[#c8c9cc] placeholder-gray-400 focus:outline-none h-10">{profile?.alipay}</div>
                    :
                    <input
                      type="text"
                      placeholder={_t("common.form.placeholder.enter") + _t("mine.profile.form-label.alipay")}
                      {...register("alipay")}
                      disabled={!!profile?.alipay}
                      className="ml-1 w-4/5 text-gray-800 placeholder-gray-400 focus:outline-none h-10"
                    />
                  }
                </div>
                {errors.alipay && (
                  <p className="mt-1 text-xs text-red-500">{errors.alipay.message}</p>
                )}
              </div>
              <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
                <div className="flex justify-center items-center ">
                  <label className="w-1/5 text-gray-500">{_t("mine.profile.form-label.wchat")}</label>
                  {profile?.wchat ?
                    <div className="flex items-center ml-1 w-4/5 text-[#c8c9cc] placeholder-gray-400 focus:outline-none h-10">{profile?.wchat}</div>
                    :
                    <input
                      type="text"
                      placeholder={_t("common.form.placeholder.enter") + _t("mine.profile.form-label.wchat")}
                      {...register("wchat")}
                      disabled={!!profile?.wchat}
                      className="ml-1 w-4/5 text-gray-800 placeholder-gray-400 focus:outline-none h-10"
                    />
                  }
                </div>
                {errors.wchat && (
                  <p className="mt-1 text-xs text-red-500">{errors.wchat.message}</p>
                )}
              </div>
              <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
                <div className="flex justify-center items-center ">
                  <label className="w-1/5 text-gray-500">{_t("mine.profile.form-label.realname")}</label>
                  {profile?.realname ?
                    <div className="flex items-center ml-1 w-4/5 text-[#c8c9cc] placeholder-gray-400 focus:outline-none h-10">{profile?.realname}</div>
                    : <input
                      type="text"
                      placeholder={_t("common.form.placeholder.enter") + _t("mine.profile.form-label.realname")}
                      {...register("realname")}
                      disabled={!!profile?.realname}
                      className="ml-1 w-4/5 text-gray-800 placeholder-gray-400 focus:outline-none h-10"
                    />
                  }
                </div>
                {errors.realname && (
                  <p className="mt-1 text-xs text-red-500">{errors.realname.message}</p>
                )}
              </div>
              <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
                <div className="flex justify-center items-center ">
                  <label className="w-1/5 text-gray-500">{_t("mine.profile.form-label.address")}</label>
                  {profile?.address ?
                    <div className="flex items-center ml-1 w-4/5 text-[#c8c9cc] placeholder-gray-400 focus:outline-none h-10">{profile?.address}</div>
                    :
                    <input
                      type="text"
                      placeholder={_t("common.form.placeholder.enter") + _t("mine.profile.form-label.address")}
                      {...register("address")}
                      disabled={!!profile?.address}
                      className="ml-1 w-4/5 text-gray-800 placeholder-gray-400 focus:outline-none h-10"
                    />
                  }
                </div>
                {errors.address && (
                  <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>
                )}
              </div>
              <Alert variant="destructive" className="mt-2 ">
                <div className="flex items-center gap-2">
                  <AlertCircleIcon/>
                  <AlertTitle>{_t("mine.profile.alert")}</AlertTitle>
                </div>
              </Alert>
              <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
                <div className="flex justify-center items-center ">
                  <label className="w-1/5 text-gray-500">{_t("mine.profile.form-label.signature")}</label>
                  <textarea
                    placeholder={_t("common.form.placeholder.enter") + _t("mine.profile.form-label.signature")}
                    {...register("signature")}
                    className="ml-1 w-4/5 text-gray-800 placeholder-gray-400 focus:outline-none h-20"
                  />
                </div>
                {errors.signature && (
                  <p className="mt-1 text-xs text-red-500">{errors.signature.message}</p>
                )}
              </div>

              <button
                disabled={isSubmitting && !!profile?.aid}
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
