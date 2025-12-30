import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// 从环境变量读取配置
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const IMAGE_PROTOCOL = process.env.NEXT_PUBLIC_IMAGE_PROTOCOL as "http" | "https";
const IMAGE_HOSTNAME = process.env.NEXT_PUBLIC_IMAGE_HOSTNAME;
const IMAGE_PATHNAME = process.env.NEXT_PUBLIC_IMAGE_PATHNAME;

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: IMAGE_PROTOCOL,
        hostname: IMAGE_HOSTNAME || "",
        pathname: IMAGE_PATHNAME,
      },
    ],
  },
  // 配置代理解决跨域问题
  async rewrites() {
    return [
      // 匹配不带语言前缀的路径: /api/xxx
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
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
