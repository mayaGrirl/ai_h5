import * as React from "react";
import {cn} from "@/lib/utils";
import {Loader2} from "lucide-react";

type PageLoadingProps = {
  /** 是否显示加载中 */
  loading?: boolean;
  /** 文案 */
  text?: string;
  /** 容器 class */
  className?: string;
  /** spinner class */
  spinnerClassName?: string;
};

export function PageLoading({loading = false, text = '加载中', className, spinnerClassName}: PageLoadingProps) {
  if (!loading) return null;
  return (
    <div className={cn("flex items-center justify-center gap-2 text-gray-500 mt-5", className)}>
      <Loader2 className={cn("h-4 w-4 animate-spin", spinnerClassName)}/>
      {text ? <span className="text-sm">{text}</span> : null}
    </div>
  );
}
