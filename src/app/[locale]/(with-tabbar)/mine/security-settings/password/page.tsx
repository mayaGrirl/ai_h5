"use client";

import * as React from "react";
import {useRequireLogin} from "@/hooks/useRequireLogin";
import {PageHeader} from "@/components/page-header";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import {updateLoginPassword} from "@/api/customer";
import {toast} from "sonner";
import {useParams, useRouter} from "next/navigation";
import {useTranslations} from "use-intl";
import {accessToken} from "@/utils/storage/token";
import {SAFE_QUESTION_OPTIONS} from "@/constants/constants";
import {useEffect, useState} from "react";
import {getBlockByIdentifier} from "@/api/common";
import TextSkeleton from "@/components/text-skeleton";
import {Eye, EyeOff} from "lucide-react";

export default function UpdateLoginPasswordPage() {
  // 页面需要登陆Hook
  useRequireLogin();

  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const _t = useTranslations();

  const [loading, setLoading] = useState<boolean>(true);
  const [tipContent, setTipContent] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  const entryAnswerHit = _t("common.form.placeholder.enter") + _t("mine.toolcase.form-label.answer")
  // 表单验证
  const schema = z.object({
    safe_ask: z.string().min(1, _t("mine.toolcase.question-options.default")),
    answer: z.string().min(1, entryAnswerHit).max(50, _t("mine.security-settings.group-account.password.answer-max")),
    password: z.string().min(8, _t("mine.security-settings.group-account.password.login-password-min")),
    confirm_password: z.string(),
  }).refine(
    (data) => data.password === data.confirm_password,
    {
      path: ["confirm_password"],
      message: _t("mine.security-settings.group-account.password.confirm-password-eq"),
    }
  );

  type FormValues = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    formState: {errors, isSubmitting},
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
  });

  // 提交表单
  const onSubmit = handleSubmit(async (values) => {
    const result = await updateLoginPassword({
      safe_ask: values.safe_ask,
      answer: values.answer,
      password: values.password,
      confirm_password: values.confirm_password,
    });
    const {code, message} = result;
    if (code !== 200) {
      toast.error(message);
    } else {
      toast.success(message);

      // 清理前端状态
      accessToken.remove();

      // 跳转登录页
      router.replace(`/${locale}/auth/login`);
    }
  })

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const {data} = await getBlockByIdentifier('customer_reset_login_password_tips');
      setTipContent(data?.content || '');
      setLoading(false);
    };

    void fetchContent();
  }, []);

  return (
    <>
      <div className="flex min-h-screen justify-center bg-[#eef3f8]">
        {/* 中间内容区域，控制最大宽度模拟手机界面 */}
        <div className="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
          <PageHeader title={_t("mine.setting.edit-password")}/>

          <div className="bg-gray-100 flex justify-center">
            <form onSubmit={onSubmit} className="w-full bg-gray-100 px-3 py-4">
              {/* 修改登录密码 */}
              <div className="bg-white rounded-lg mb-3 overflow-hidden">
                <div className="flex items-center text-gray-600 px-4 py-3 pb-0">
                  <span className="w-1 h-4 bg-red-600 rounded mr-2"></span>
                  {_t("mine.security-settings.group-account.password.login-password")}

                </div>
                <div className="flex items-center px-4 py-3 border-b">
                  <label className="w-2/7 text-gray-700" htmlFor="password">{_t("mine.security-settings.group-account.password.login-password")}</label>
                  <div className="w-5/7 relative">
                    <input id="password"
                           type={show ? "text" : 'password'}
                           {...register("password")}
                           placeholder={_t("mine.security-settings.group-account.password.login-password-placeholder")}
                           className="text-gray-600 placeholder-gray-400 focus:outline-none h-10"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShow(!show)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      {show ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                )}
                <div className="flex items-center px-4 py-3">
                  <label className="w-2/7 text-gray-700" htmlFor="confirm_password">
                    {_t("mine.security-settings.group-account.password.confirm-password")}
                  </label>
                  <div className="w-5/7 relative">
                    <input id="confirm_password"
                           type={show ? "text" : 'password'}
                           {...register("confirm_password")}
                           placeholder={_t("mine.security-settings.group-account.password.confirm-password-placeholder")}
                           className="text-gray-600 placeholder-gray-400 focus:outline-none h-10"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShow(!show)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      {show ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>
                {errors.confirm_password && (
                  <p className="mt-1 text-xs text-red-500">{errors.confirm_password.message}</p>
                )}
              </div>

              {/* 安全问题 */}
              <div className="bg-white rounded-lg mb-3 overflow-hidden">
                <div className="flex items-center text-gray-600 px-4 py-3 pb-0">
                  <span className="w-1 h-4 bg-red-600 rounded mr-2"></span>
                  {_t("mine.security-settings.group-account.password.safe-ask-valid")}
                </div>
                <div className="flex items-center px-4 py-3 border-b">
                  <label className="w-2/7 text-gray-700"
                         htmlFor="safe_ask">{_t("mine.toolcase.form-label.question")}</label>
                  <select id="safe_ask" {...register("safe_ask")}
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
                <div className="flex items-center px-4 py-3">
                  <label className="w-2/7 text-gray-700"
                         htmlFor="answer">{_t("mine.toolcase.form-label.answer")}</label>
                  <input type="text" id="answer"
                         {...register("answer")}
                         placeholder={entryAnswerHit}
                         className="text-gray-600 w-5/7 placeholder-gray-400 focus:outline-none h-10"
                  />
                </div>
                {errors.answer && (
                  <p className="mt-1 text-xs text-red-500">{errors.answer.message}</p>
                )}
              </div>

              <div className="rounded-lg mb-3 overflow-hidden">
                <div className="flex items-center text-gray-600 px-4 py-3  pb-0">
                  <span className="w-1 h-4 bg-red-600 rounded mr-2"></span>
                  {_t("mine.security-settings.group-account.password.tip")}
                </div>

                {/* 异步加载温馨提示 */}
                {loading ? (
                  <TextSkeleton lines={3}/>
                ) : (
                  <div
                    className="px-4 py-3 text-gray-600"
                    dangerouslySetInnerHTML={{__html: tipContent!}}
                  />
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
          </div>

          {/* 底部占位（给 TabBar 留空间） */}
          <div className="h-14"/>
        </div>
      </div>
    </>
  );
}
