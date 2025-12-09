import {MetadataRoute} from 'next';
import {getTranslations} from 'next-intl/server';
import {routing} from '@/i18n/routing';

/**
 * 网站准备用来做 手机端 WebApp、添加到桌面时设置 app 名字和主题
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations({
    locale: routing.defaultLocale,
    namespace: 'WebApp'
  });

  return {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    name: t('name'),
    start_url: '/',
    theme_color: '#101E33',
    display: "standalone",
    background_color: "#ffffff",
    orientation: "portrait-primary"
  };
}
