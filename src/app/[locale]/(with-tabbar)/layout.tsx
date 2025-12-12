import React from "react";
import TabBar from "@/components/tab-bar";


type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};
// 带底部导航的布局文件
export default async function RootLayout({
 children,
 params
}: Readonly<Props>) {
  const {locale} = await params;
  return (
    <>
      {children}

      {/* 底部菜单 */}
      <TabBar locale={locale} />
    </>
  );
}
