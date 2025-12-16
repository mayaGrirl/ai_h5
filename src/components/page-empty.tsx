"use client"

import * as React from "react";
import { cn } from "@/lib/utils";
import {useTranslations} from "use-intl";

type PageEmptyProps = {
  /** 是否显示 */
  empty?: boolean;
  description?: string;
  className?: string;
};

export function PageEmpty({empty = false, description = '', className}: PageEmptyProps) {
  const _t = useTranslations();

  if (!empty) return null;

  if (!description) {
    description = _t("common.empty-description");
  }
  return (
    <div className={cn("flex items-center justify-center h-[70%]", className)}>{description}</div>
  );
}
