import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};
const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: [
      './messages/zh.json',
      './messages/en.json',
    ]
  }
});
// const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

export default withNextIntl(nextConfig);
