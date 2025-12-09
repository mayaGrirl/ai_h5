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
