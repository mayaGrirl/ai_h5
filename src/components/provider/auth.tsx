"use client";

import React, {useEffect} from "react";
import {currentCustomer} from "@/api/auth";
import {useAuthStore} from "@/utils/storage/auth";
import {usePathname} from "next/navigation";
import {routing} from "@/i18n/routing";
import {NOT_LOGIN_WHITELIST} from "@/constants/constants";

/**
 * 全局所有页面默认引用该组件
 * @param children
 * @constructor
 */
export default function AuthProvider({children}: { children: React.ReactNode }) {
  const setCurrentCustomer = useAuthStore((s) => s.setCurrentCustomer);

  const locales = routing.locales;
  const localePattern = new RegExp(`^/(${locales.join("|")})(/|$)`);
  const pathname = usePathname().replace(localePattern, "/")

  useEffect(() => {
    const initAuth = async () => {
      try {
        const {data} = await currentCustomer();
        setCurrentCustomer(data);
      } catch (error) {
        console.info('Get Current Customer Error: ', error);
      }
    };

    // 无需登录的页面路由
    if (!NOT_LOGIN_WHITELIST.includes(pathname)) {
      void initAuth();
    }
  }, [pathname, setCurrentCustomer]);

  return children;
}
