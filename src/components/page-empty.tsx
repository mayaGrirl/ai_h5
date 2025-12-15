import * as React from "react";
import { cn } from "@/lib/utils";

type PageEmptyProps = {
  /** 是否显示 */
  empty?: boolean;
  description?: string;
  className?: string;
};

export function PageEmpty({empty = false, description = "暂无数据", className}: PageEmptyProps) {
  if (!empty) return null;
  return (
    <div className={cn("flex items-center justify-center h-[70%]", className)}>{description}</div>
  );
}
