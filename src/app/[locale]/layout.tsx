import React from "react";
import type {Metadata, Viewport} from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {NextIntlClientProvider, hasLocale} from "next-intl";
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import TabBar from "@/components/tab-bar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// SEO 配置核心
export const metadata: Metadata = {
  title: "Ding Feng 28",
  description: "鼎丰28-幸运28领头羊,打造28行业信誉平台.",
};

// 页面如何适配移动设备、缩放、颜色模式
export const viewport: Viewport = {
  width: "device-width",
  // 页面初始缩放比例 = 1（不放大、不缩小）
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  // 让页面延伸到 iPhone 刘海区域
  viewportFit: "cover",
  // 控制手机浏览器顶部导航条的颜色
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" }
  ],
  // 主题模式（色彩方案）为 dark 模式。
  colorScheme: "dark"
}

type Props = {
    children: React.ReactNode;
    params: Promise<{locale: string}>;
};

// 项目布局入口文件
export default async function RootLayout({
  children,
  params
}: Readonly<Props>) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
      notFound();
  }
  return (
    <html lang={locale} className='h-full'>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased touch-manipulation`}>
      <NextIntlClientProvider>
        {children}

        {/* 底部菜单 */}
        <TabBar locale={locale} />
      </NextIntlClientProvider>
      </body>
    </html>
  );
}
