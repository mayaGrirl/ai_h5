import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: [
    /**
     * 匹配所有「页面路由」
     * 排除：
     * - /api（接口）
     * - /_next（Next 内部）
     * - /_vercel（Vercel 内部）
     * - 静态文件（.png .css .js 等）
     * - SEO 文件
     */
    '/((?!api|_next|_vercel|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'
  ]
};
