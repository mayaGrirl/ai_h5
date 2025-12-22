import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'zh'],

  // Used when no locale matches
  defaultLocale: 'zh',

  /**
   * URL 国际化
   * 适合需要 SEO 国际化的网站
   */
  // pathnames: {
  //   '/': '/',
  //   '/pathnames': {
  //     zh: '/pfadnamen'
  //   }
  // }
});

/**
 * 导出获取当前语言
 * @param url
 */
export function getLocale(url: string): string {
  return normalizeLocale(getLocaleFromUrl(url))
}

/**
 * 从URL解析语言code
 * @param url
 */
function getLocaleFromUrl(url: string): string {
  if (!url) return routing.defaultLocale;

  const match = url.match(/^\/(zh|en|fr)(\/|$)/);
  return match?.[1] ?? routing.defaultLocale;
}

/**
 * 转换成标准语言码
 * @param locale
 */
function normalizeLocale(locale: string) {
  switch (locale) {
    case "en":
      return "en-US";
    case "fr":
      return "fr-FR";
    default:
      return "zh-CN";
  }
}
