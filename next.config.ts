import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.kaixin28.com",
        pathname: "/images/**",
      },
    ],
  },
  // 配置代理解决跨域问题
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.kaixin28.com";
    return [
      // 匹配带语言前缀的路径: /zh/api/xxx, /en/api/xxx
      {
        source: "/:locale(zh|en)/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
      // 匹配不带语言前缀的路径: /api/xxx
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};
const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: [
      './messages/zh.json',
      './messages/en.json',
    ]
  }
});

export default withNextIntl(nextConfig);
