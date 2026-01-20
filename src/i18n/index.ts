import { createI18n } from 'vue-i18n'
import zh from '../../messages/zh.json'
import en from '../../messages/en.json'
import fr from '../../messages/fr.json'

export type MessageSchema = typeof zh

// 支持的语言（中文、英语、法语）
export const LOCALES = ['zh', 'en', 'fr'] as const
export type Locale = (typeof LOCALES)[number]

// 默认语言
export const DEFAULT_LOCALE: Locale = 'zh'

// 语言与货币映射
export const LOCALE_CURRENCY_MAP: Record<Locale, string> = {
  zh: 'CNY',
  en: 'USD',
  fr: 'EUR'
}

// 语言标准化（用于 Accept-Language header）
export function normalizeLocale(locale: string): string {
  switch (locale) {
    case 'en':
      return 'en-US'
    case 'fr':
      return 'fr-FR'
    default:
      return 'zh-CN'
  }
}

// 从URL解析语言
export function getLocaleFromUrl(url: string): Locale {
  if (!url) return DEFAULT_LOCALE
  const match = url.match(/^\/(zh|en|fr)(\/|$)/)
  return (match?.[1] as Locale) ?? DEFAULT_LOCALE
}

// 获取当前语言（标准化格式）
export function getLocale(url: string): string {
  return normalizeLocale(getLocaleFromUrl(url))
}

const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: DEFAULT_LOCALE,
  messages: {
    zh,
    en,
    fr
  }
} as Parameters<typeof createI18n>[0])

export default i18n
