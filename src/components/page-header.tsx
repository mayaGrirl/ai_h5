"use client";

import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type HeaderProps = {
  title: string;
  className?: string;
  /** 指定返回地址，不传则返回上一页 */
  cBack?: string;
};

export function PageHeader({ title, className, cBack }: HeaderProps) {
  const router = useRouter();
  const handleBack = () => {
    if (cBack) {
      router.replace(cBack);
    } else {
      router.back();
    }
  };
  return (
    <header
      className={cn(
        "relative flex h-11 items-center bg-red-600 text-white",
        className
      )}
    >
      {/* 左侧返回 */}
      <button
        onClick={handleBack}
        className="absolute left-2 flex items-center gap-1 text-white hover:bg-white/10 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm">返回</span>
      </button>

      {/* 中间标题（真正居中） */}
      <h1 className="mx-auto font-medium">
        {title}
      </h1>
    </header>
  );
}
