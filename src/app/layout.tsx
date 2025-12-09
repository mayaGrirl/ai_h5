import {ReactNode} from 'react';
import "./globals.css";

type Props = {
  children: ReactNode;
};

// 由于我们在根目录下有一个 not-found.tsx 页面，这个布局文件
// 是必需的，即使只是让子页面通过。
export default function RootLayout({children}: Props) {
  return children;
}
