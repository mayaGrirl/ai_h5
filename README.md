## 项目介绍

### 环境准备
- node >= 20

运行开发服务器：
```bash
npm install
```
```bash
npm run dev
```

### 技术栈
* React
* NextJs 16 + App Router
* Tailwind CSS
* shadcn/ui
* Next-Intl
* TypeScript


### 文档
* NextJS: https://nextjscn.org/docs
* Tailwind CSS: https://tailwindcss.com/docs
* Shadcn/ui: https://ui.shadcn.com/docs
* Icon: https://lucide.dev/icons/categories
* 国际化: https://next-intl.dev/docs

### 项目结构
```
├── message 翻译文件
├── public 静态文件。图片等
├── src 项目代码
├── src 项目代码
├──── app
├──────── [locale]
├──────────── *** 具体的代码逻辑
├──── components 公共组件
├──── i18n 国际化配置
├──── utils 工具
├── next.config.ts Next配置
├── package.json 包管理
└── README.md
└── tailwind.config.js
```
