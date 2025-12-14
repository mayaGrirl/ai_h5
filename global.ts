import {routing} from '@/i18n/routing';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import messages from './messages/zh.json'

declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
