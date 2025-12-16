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

const schema = z.object({
  realname: z.string().trim().refine(
    (v) => v === "" || v.length <= 50,
    {message: "真实姓名不能超过50字符"}
  ),
  qq: z.string().trim().refine(
    (v) => v === "" || /^\d{5,12}$/.test(v),
    {message: "QQ号格式不正确"}
  ),
  alipay: z.string().trim().refine(
    (v) => v === "" || v.length <= 50,
    {message: "支付宝账号必须是邮箱"}
  ),
  wchat: z.string().trim().refine(
    (v) => v === "" || v.length <= 50,
    {message: "支付宝账号必须是邮箱"}
  ),
  address: z.string().trim().refine(
    (v) => v === "" || v.length <= 150,
    {message: "地址不能超过150字符"}
  ),
  signature: z.string().trim().refine(
    (v) => v === "" || v.length <= 200,
    {message: "签名不能超过200字符"}
  ),
});
type FormValues = z.infer<typeof schema>;

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

  const [profile, setProfile] = React.useState<MemberField>();

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
          <PageHeader title="我的资料"/>

          {/* 提示 */}
          <main className="px-3 pb-20 pt-3">
            <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
              <div className="flex justify-center items-center ">
                <div className="flex w-3/5">
                  <div className="w-4/9 text-gray-500">昵称</div>
                  <div className="w-6/7 text-gray-700">我就改个昵称</div>
                </div>
                <Link className="flex justify-end w-2/5 cursor-pointer text-red-700" href={`/${locale}/mine/edit-nickname`}>
                  修改昵称<ChevronRight/>
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
              <div className="flex justify-center items-center">
                {profile?.email ?
                  <>
                    <div className="w-1/5 text-gray-500">邮箱</div>
                    <div className="flex items-center ml-1 w-4/5 text-[#c8c9cc] placeholder-gray-400 focus:outline-none">{profile?.email}</div>
                  </>
                  :
                  <>
                    <div className="w-3/5 text-gray-500">邮箱</div>
                    <Link className="flex justify-end ml-1 w-2/5 text-red-700" href={`/${locale}/mine/bind-email`}>
                      绑定邮箱<ChevronRight/>
                    </Link>
                  </>
                }
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
              <div className="flex justify-center items-center">
                <div className="w-1/5 text-gray-500">手机号码</div>
                <div className="flex ml-1 w-4/5 text-[#c8c9cc]">{profile?.mobile}</div>
              </div>
            </div>

            {/* 提交表单 */}
            <form onSubmit={onSubmit} className="mt-5">
              <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
                <div className="flex justify-center items-center ">
                  <label className="w-1/5 text-gray-500">QQ</label>
                  {profile?.qq ?
                    <div className="flex items-center ml-1 w-4/5 text-[#c8c9cc] placeholder-gray-400 focus:outline-none h-10">{profile?.qq}</div>
                    :
                    <input
                      type="text"
                      placeholder="请输入QQ"
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
                  <label className="w-1/5 text-gray-500">支付宝账号</label>
                  {profile?.alipay ?
                    <div className="flex items-center ml-1 w-4/5 text-[#c8c9cc] placeholder-gray-400 focus:outline-none h-10">{profile?.alipay}</div>
                    :
                    <input
                      type="text"
                      placeholder="请输入支付宝账号"
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
                  <label className="w-1/5 text-gray-500">微信账号</label>
                  {profile?.wchat ?
                    <div className="flex items-center ml-1 w-4/5 text-[#c8c9cc] placeholder-gray-400 focus:outline-none h-10">{profile?.wchat}</div>
                    :
                    <input
                      type="text"
                      placeholder="请输入微信账号"
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
                  <label className="w-1/5 text-gray-500">真实姓名</label>
                  {profile?.realname ?
                    <div className="flex items-center ml-1 w-4/5 text-[#c8c9cc] placeholder-gray-400 focus:outline-none h-10">{profile?.realname}</div>
                    : <input
                      type="text"
                      placeholder="请输入真实姓名"
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
                  <label className="w-1/5 text-gray-500">收货地址</label>
                  {profile?.address ?
                    <div className="flex items-center ml-1 w-4/5 text-[#c8c9cc] placeholder-gray-400 focus:outline-none h-10">{profile?.address}</div>
                    :
                    <input
                      type="text"
                      placeholder="请输入收货地址"
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
                  <AlertTitle>以上内容填写后不可修改，请认真填写</AlertTitle>
                </div>
              </Alert>
              <div className="bg-white rounded-xl shadow-sm p-2 mt-2">
                <div className="flex justify-center items-center ">
                  <label className="w-1/5 text-gray-500">签名</label>
                  <textarea
                    placeholder="请输入签名"
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
                {isSubmitting ? "提交中..." : "提交"}
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
