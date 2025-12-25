"use client"

import {useEffect, useRef, useState} from "react";
import {recommendLink} from "@/api/customer";
import {toast} from "sonner";
import {useTranslations} from "use-intl";
import {useParams} from "next/navigation";

export default function PromotionPage() {
  const _t = useTranslations();

  const { locale } = useParams<{ locale: string }>();
  const domain = typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : "";

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [copiedText, setCopiedText] = useState<string>(_t("common.loading"));
  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const {code, data, message} = await recommendLink();
      if (code == 200) {
        const link = `${domain}/${locale}/auth/register?t=${data.key}`;
        setCopiedText(_t('recommend.copied-text', {link: link}))
        setLoading(false);
      } else {
        toast.error(message);
      }
    };

    void fetchContent();
  }, [_t, domain, locale]);

  const handleCopy = async () => {
    try {
      // 现代浏览器
      await navigator.clipboard.writeText(copiedText);
      setCopied(true);
    } catch {
      // 兼容旧浏览器
      const textarea = document.createElement("textarea");
      textarea.value = copiedText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return success;
    }
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="px-4 py-4 bg-white rounded-lg">
      {/* 标题 */}
      <h2 className="mb-2 text-lg font-bold text-gray-800">{_t("recommend.promotion-title")}</h2>

      {/* 说明 */}
      <p className="mb-3 text-sm text-gray-600">{_t("recommend.promotion-desc")}</p>

      {/* 文本框 */}
      <textarea
        ref={textareaRef}
        rows={5}
        readOnly
        className="w-full resize-none rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-700 leading-relaxed focus:outline-none"
        value={copiedText}
      />

      {/* 按钮 */}
      <button
        type="button"
        onClick={handleCopy}
        disabled={loading}
        className={`mt-4 h-12 w-full rounded-md text-base font-medium text-white transition active:scale-95
            ${loading ? "bg-[#cccccc]" : copied ? "bg-green-500" : "bg-[#ff5a1f]"}`}
      >
        {copied ? _t("recommend.promotion-btn-1") : _t("recommend.promotion-btn-2")}
      </button>
    </div>
  )
}
