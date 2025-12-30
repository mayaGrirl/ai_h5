"use client";

import { useEffect } from "react";
import {useParams, usePathname, useRouter} from "next/navigation";
import { useAuthStore } from "@/utils/storage/auth";
import {accessToken} from "@/utils/storage/token";

type Options = {
  loginPath?: string;
};

/**
 * 需要登陆的页面引入Hook
 * 用法：useRequireLogin()
 * @param options
 */
export function useRequireLogin(options?: Options) {
  const router = useRouter();
  const pathname = usePathname();
  const token = accessToken.getToken();
  const params = useParams();
  const locale = params.locale as string;

  const { isLogin, hydrated } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;

    if (!isLogin || !token) {
      const loginPath = options?.loginPath ?? `/${locale}/auth/login`;
      const redirectUrl = `${loginPath}?redirect=${encodeURIComponent(
        pathname
      )}`;

      router.replace(redirectUrl);
    }
  }, [hydrated, isLogin, pathname, router, options?.loginPath, token, locale]);
}
