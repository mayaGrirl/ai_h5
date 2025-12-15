"use client";

import Link from "next/link";
import {useTranslations} from "next-intl";
import {
  Home,
  Gamepad2,
  Trophy,
  ShoppingBag,
  User
} from "lucide-react";
import {usePathname} from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/utils/storage/auth";


type Props = {
  locale: string;
};

// 去掉 /zh 或 /en 等语言前缀
function stripLocale(path: string) {
  return path.replace(/^\/(zh|en|fr)(?=\/|$)/, "");
}

/**
 * 底部导航
 * @param locale
 * @constructor
 */
export default function TabBar({locale}: Props) {
  const isLogin = useAuthStore((s) => s.isLogin);
  const t = useTranslations("tab");
  const pathname = usePathname();
  const cleanPath = stripLocale(pathname);

  const tabs = [
    { name: t("home"), href: "/", icon: Home, auth: false },
    { name: t("games"), href: "/games", icon: Gamepad2, auth: true },
    { name: t("ranking"), href: "/ranking", icon: Trophy, auth: true },
    { name: t("shop"), href: "/shop", icon: ShoppingBag, auth: true },
    { name: t("mine"), href: "/mine", icon: User, auth: true }
  ];

  const isActive = (href: string) => {
    if (href === "/") return cleanPath === "/" || cleanPath === "";
    return cleanPath.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-sm tab-bar-nav">
      <ul className="flex h-14 items-center justify-around">
        {tabs.map(({name, href, icon: Icon, auth}) => {
          const active = isActive(href);
          let _href = `/${locale}/${href}`;
          if (auth && !isLogin) {
            // _href = `/${locale}/auth/login`;
          }

          return (
            <li key={href} className="flex-1">
              <Link
                href={_href}
                className="flex flex-col items-center justify-center"
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    active ? "text-red-600" : "text-gray-500"
                  )}
                />
                <span
                  className={cn(
                    "text-xs mt-0.5",
                    active ? "text-red-600" : "text-gray-500"
                  )}
                >
                  {name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
