# 顶峰28 (DingFeng28)

> 一个基于 Vue 3 + TypeScript + Vite 构建的现代化移动端 H5 应用

## 技术栈

### 核心框架
| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.5.26 | 渐进式 JavaScript 框架 |
| TypeScript | 5.9.3 | JavaScript 的超集，提供类型安全 |
| Vite | 6.2.6 | 下一代前端构建工具 |

### 状态管理 & 路由
| 技术 | 版本 | 说明 |
|------|------|------|
| Pinia | 3.0.4 | Vue 官方状态管理库 |
| Vue Router | 4.6.4 | Vue 官方路由管理器 |
| pinia-plugin-persistedstate | 4.3.0 | Pinia 持久化插件 |

### UI & 样式
| 技术 | 版本 | 说明 |
|------|------|------|
| Tailwind CSS | 3.4.17 | 原子化 CSS 框架 |
| Lucide Vue Next | 0.511.0 | 精美的图标库 |
| PostCSS | 8.5.4 | CSS 后处理器 |
| Autoprefixer | 10.4.21 | CSS 自动添加浏览器前缀 |

### 网络请求 & 国际化
| 技术 | 版本 | 说明 |
|------|------|------|
| Axios | 1.10.0 | HTTP 请求库 |
| Vue I18n | 11.1.9 | 国际化解决方案 |

### 开发工具
| 技术 | 版本 | 说明 |
|------|------|------|
| vue-tsc | 2.2.10 | Vue TypeScript 类型检查 |
| @vitejs/plugin-vue | 5.2.4 | Vite Vue 插件 |

## 项目架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Application                           │
├─────────────────────────────────────────────────────────────┤
│  Views (页面视图)                                            │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐         │
│  │Home │Games│Shop │Agent│Mine │Auth │Rank │Error│         │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘         │
├─────────────────────────────────────────────────────────────┤
│  Components (组件层)                                         │
│  ┌──────────────┬──────────────┬──────────────────┐         │
│  │ UI Components│ Business     │ Layout Components│         │
│  │ (通用UI组件) │ Components   │ (布局组件)       │         │
│  │              │ (业务组件)   │                  │         │
│  └──────────────┴──────────────┴──────────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  Composables (组合式函数)                                    │
│  ┌──────────┬──────────┬──────────┬──────────────┐          │
│  │useAuth   │useToast  │useLoading│useLocalized  │          │
│  └──────────┴──────────┴──────────┴──────────────┘          │
├─────────────────────────────────────────────────────────────┤
│  Store (Pinia 状态管理)                                      │
│  ┌──────────┬──────────┬──────────┬──────────────┐          │
│  │userStore │gameStore │shopStore │ ...          │          │
│  └──────────┴──────────┴──────────┴──────────────┘          │
├─────────────────────────────────────────────────────────────┤
│  API Layer (接口层)                                          │
│  ┌──────────────────────────────────────────────┐           │
│  │ Axios Instance + Request/Response Interceptor│           │
│  └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## 目录结构

```
ai_h5/
├── public/                          # 静态资源目录
│   └── favicon.ico                  # 网站图标
│
├── src/                             # 源代码目录
│   ├── api/                         # API 接口层
│   │   ├── index.ts                 # API 统一导出
│   │   ├── request.ts               # Axios 实例及拦截器配置
│   │   └── modules/                 # API 模块
│   │       ├── agent.ts             # 代理相关接口
│   │       ├── auth.ts              # 认证相关接口
│   │       ├── game.ts              # 游戏相关接口
│   │       ├── home.ts              # 首页相关接口
│   │       ├── ranking.ts           # 排行榜相关接口
│   │       ├── shop.ts              # 商城相关接口
│   │       └── user.ts              # 用户相关接口
│   │
│   ├── assets/                      # 资源文件
│   │   └── styles/                  # 样式文件
│   │       └── main.css             # 全局样式 (含动画定义)
│   │
│   ├── components/                  # 公共组件
│   │   ├── AnimatedInput.vue        # 动画输入框
│   │   ├── AnimatedList.vue         # 动画列表
│   │   ├── Badge.vue                # 徽章组件
│   │   ├── BottomSheet.vue          # 底部弹出层
│   │   ├── Card.vue                 # 卡片组件
│   │   ├── EmptyState.vue           # 空状态组件
│   │   ├── FloatingActionButton.vue # 悬浮按钮
│   │   ├── PageEmpty.vue            # 页面空状态
│   │   ├── PageHeader.vue           # 页面头部
│   │   ├── PageLoading.vue          # 页面加载
│   │   ├── PullRefresh.vue          # 下拉刷新
│   │   ├── RippleButton.vue         # 涟漪按钮
│   │   ├── Skeleton.vue             # 骨架屏
│   │   ├── TabBar.vue               # 底部导航栏
│   │   └── Toast.vue                # 轻提示
│   │
│   ├── composables/                 # 组合式函数
│   │   ├── index.ts                 # 统一导出
│   │   ├── useAuth.ts               # 认证相关逻辑
│   │   ├── useLoading.ts            # 加载状态管理
│   │   ├── useLocalized.ts          # 国际化字段处理
│   │   └── useToast.ts              # 轻提示管理
│   │
│   ├── constants/                   # 常量定义
│   │   └── index.ts                 # 常量统一导出
│   │
│   ├── i18n/                        # 国际化配置
│   │   ├── index.ts                 # i18n 实例配置
│   │   └── locales/                 # 语言包
│   │       ├── en.ts                # 英文
│   │       ├── fr.ts                # 法文
│   │       └── zh.ts                # 中文
│   │
│   ├── layouts/                     # 布局组件
│   │   └── DefaultLayout.vue        # 默认布局
│   │
│   ├── router/                      # 路由配置
│   │   └── index.ts                 # 路由定义及守卫
│   │
│   ├── stores/                      # Pinia 状态管理
│   │   ├── index.ts                 # Store 统一导出
│   │   ├── agent.ts                 # 代理状态
│   │   ├── auth.ts                  # 认证状态
│   │   ├── game.ts                  # 游戏状态
│   │   ├── ranking.ts               # 排行榜状态
│   │   ├── shop.ts                  # 商城状态
│   │   └── user.ts                  # 用户状态
│   │
│   ├── types/                       # TypeScript 类型定义
│   │   ├── index.ts                 # 类型统一导出
│   │   ├── agent.ts                 # 代理相关类型
│   │   ├── api.ts                   # API 响应类型
│   │   ├── auth.ts                  # 认证相关类型
│   │   ├── game.ts                  # 游戏相关类型
│   │   ├── ranking.ts               # 排行榜相关类型
│   │   ├── shop.ts                  # 商城相关类型
│   │   └── user.ts                  # 用户相关类型
│   │
│   ├── utils/                       # 工具函数
│   │   └── index.ts                 # 工具函数集合
│   │
│   ├── views/                       # 页面视图
│   │   ├── agent/                   # 代理模块
│   │   │   ├── index.vue            # 代理首页
│   │   │   ├── commission.vue       # 佣金页面
│   │   │   ├── invite.vue           # 邀请页面
│   │   │   ├── promotion.vue        # 推广页面
│   │   │   └── team.vue             # 团队页面
│   │   │
│   │   ├── auth/                    # 认证模块
│   │   │   ├── login.vue            # 登录页面
│   │   │   └── register.vue         # 注册页面
│   │   │
│   │   ├── error/                   # 错误页面
│   │   │   └── 404.vue              # 404 页面
│   │   │
│   │   ├── games/                   # 游戏模块
│   │   │   ├── index.vue            # 游戏列表
│   │   │   ├── bet.vue              # 投注页面
│   │   │   ├── history.vue          # 历史记录
│   │   │   ├── modes/               # 游戏模式
│   │   │   │   ├── index.vue        # 模式列表
│   │   │   │   ├── create.vue       # 创建模式
│   │   │   │   └── edit.vue         # 编辑模式
│   │   │   └── components/          # 游戏组件
│   │   │       ├── BetPanel.vue     # 投注面板
│   │   │       ├── GameCard.vue     # 游戏卡片
│   │   │       ├── GameHeader.vue   # 游戏头部
│   │   │       ├── GameResult.vue   # 游戏结果
│   │   │       ├── HistoryItem.vue  # 历史项
│   │   │       ├── ModeCard.vue     # 模式卡片
│   │   │       ├── ModeSelector.vue # 模式选择器
│   │   │       └── OddsDisplay.vue  # 赔率显示
│   │   │
│   │   ├── home/                    # 首页模块
│   │   │   ├── index.vue            # 首页
│   │   │   └── components/          # 首页组件
│   │   │       ├── AnnouncementBar.vue  # 公告栏
│   │   │       ├── GameSection.vue      # 游戏区块
│   │   │       ├── HomeHeader.vue       # 首页头部
│   │   │       ├── QuickActions.vue     # 快捷操作
│   │   │       └── WinnerMarquee.vue    # 中奖轮播
│   │   │
│   │   ├── index/                   # 引导页模块
│   │   │   └── index.vue            # 引导页
│   │   │
│   │   ├── mine/                    # 我的模块
│   │   │   ├── index.vue            # 我的首页
│   │   │   ├── balance.vue          # 余额页面
│   │   │   ├── deposit.vue          # 充值页面
│   │   │   ├── profile.vue          # 个人资料
│   │   │   ├── records.vue          # 记录页面
│   │   │   ├── security.vue         # 安全设置
│   │   │   ├── settings.vue         # 设置页面
│   │   │   ├── transactions.vue     # 交易记录
│   │   │   ├── vip.vue              # VIP 页面
│   │   │   ├── withdraw.vue         # 提现页面
│   │   │   └── components/          # 我的组件
│   │   │       ├── BalanceCard.vue      # 余额卡片
│   │   │       ├── MenuList.vue         # 菜单列表
│   │   │       ├── ProfileHeader.vue    # 资料头部
│   │   │       ├── RecordItem.vue       # 记录项
│   │   │       ├── SecurityItem.vue     # 安全项
│   │   │       ├── SettingsItem.vue     # 设置项
│   │   │       ├── TransactionItem.vue  # 交易项
│   │   │       └── VipCard.vue          # VIP 卡片
│   │   │
│   │   ├── ranking/                 # 排行榜模块
│   │   │   ├── index.vue            # 排行榜页面
│   │   │   └── components/          # 排行榜组件
│   │   │       ├── RankingHeader.vue    # 排行榜头部
│   │   │       ├── RankingItem.vue      # 排行项
│   │   │       ├── RankingList.vue      # 排行列表
│   │   │       ├── RankingTabs.vue      # 排行标签
│   │   │       └── TopThree.vue         # 前三名
│   │   │
│   │   └── shop/                    # 商城模块
│   │       ├── index.vue            # 商城首页
│   │       ├── category.vue         # 分类页面
│   │       ├── detail.vue           # 商品详情
│   │       ├── exchange.vue         # 兑换页面
│   │       ├── orders.vue           # 订单页面
│   │       └── components/          # 商城组件
│   │           ├── CategoryNav.vue      # 分类导航
│   │           ├── ExchangeForm.vue     # 兑换表单
│   │           ├── OrderItem.vue        # 订单项
│   │           ├── ProductCard.vue      # 商品卡片
│   │           ├── ProductGrid.vue      # 商品网格
│   │           └── ShopHeader.vue       # 商城头部
│   │
│   ├── App.vue                      # 根组件
│   ├── main.ts                      # 应用入口
│   └── vite-env.d.ts                # Vite 类型声明
│
├── .env                             # 环境变量 (开发)
├── .env.production                  # 环境变量 (生产)
├── .gitignore                       # Git 忽略配置
├── index.html                       # HTML 入口
├── package.json                     # 项目依赖配置
├── postcss.config.js                # PostCSS 配置
├── tailwind.config.js               # Tailwind CSS 配置
├── tsconfig.json                    # TypeScript 配置
├── tsconfig.node.json               # Node TypeScript 配置
└── vite.config.ts                   # Vite 配置
```

## 功能模块

### 1. 首页模块 (Home)
- 公告栏滚动展示
- 游戏快捷入口
- 中奖信息轮播
- 快捷操作按钮

### 2. 游戏模块 (Games)
- 游戏列表展示
- 投注功能
- 游戏模式管理 (创建/编辑/删除)
- 历史记录查询
- 赔率实时显示

### 3. 商城模块 (Shop)
- 商品分类浏览
- 商品详情展示
- 积分兑换功能
- 订单管理

### 4. 代理模块 (Agent)
- 邀请推广
- 团队管理
- 佣金统计
- 推广链接

### 5. 我的模块 (Mine)
- 个人资料管理
- 余额查询
- 充值/提现
- 交易记录
- VIP 等级
- 安全设置
- 系统设置

### 6. 排行榜模块 (Ranking)
- 多维度排行
- 前三名特殊展示
- 分页加载

### 7. 认证模块 (Auth)
- 用户登录
- 用户注册
- Token 管理

## 核心特性

### 国际化支持
项目支持三种语言：
- 中文 (zh)
- 英文 (en)
- 法文 (fr)

使用 `useLocalized` composable 处理后端返回的多语言字段：
```typescript
import { useLocalized } from '@/composables'

const { getLocalizedField } = useLocalized()
const title = getLocalizedField(item, 'title') // 自动获取当前语言的标题
```

### 状态持久化
使用 `pinia-plugin-persistedstate` 实现关键状态的本地持久化：
- 用户认证信息
- 用户偏好设置
- 语言选择

### 页面过渡动画
- 前进/后退页面切换动画
- 列表元素交错进入动画
- 骨架屏加载效果
- 按钮涟漪点击效果

### 组件设计
- 基于组合式 API (Composition API)
- TypeScript 类型安全
- 响应式设计适配移动端
- 组件化开发，高度复用

## 开发指南

### 环境要求
- Node.js >= 18
- npm >= 9 或 pnpm >= 8

### 安装依赖
```bash
npm install
# 或
pnpm install
```

### 本地开发
```bash
npm run dev
```

### 类型检查
```bash
npm run type-check
```

### 生产构建
```bash
npm run build
```

### 构建预览
```bash
npm run preview
```

## 环境配置

### 开发环境 (.env)
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_TITLE=顶峰28
```

### 生产环境 (.env.production)
```env
VITE_API_BASE_URL=https://api.example.com
VITE_APP_TITLE=顶峰28
```

## 部署指南

### Nginx 配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/ai_h5/dist;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript;

    # 静态资源缓存
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理 (如需要)
    location /api {
        proxy_pass http://backend-server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 部署步骤
1. 执行生产构建：`npm run build`
2. 将 `dist` 目录上传至服务器
3. 配置 Nginx 指向 `dist` 目录
4. 重启 Nginx：`nginx -s reload`

## API 接口规范

### 请求格式
```typescript
interface ApiResponse<T> {
  code: number      // 状态码: 0 成功, 其他失败
  message: string   // 提示信息
  data: T          // 响应数据
}
```

### 请求拦截器
- 自动添加 Authorization Token
- 自动添加语言标识 (Accept-Language)

### 响应拦截器
- 统一错误处理
- Token 过期自动跳转登录
- 网络异常提示

## 代码规范

### 命名规范
- 组件文件：PascalCase (如 `UserProfile.vue`)
- 组合式函数：camelCase + use 前缀 (如 `useAuth.ts`)
- 工具函数：camelCase (如 `formatDate`)
- 常量：UPPER_SNAKE_CASE (如 `API_BASE_URL`)
- 类型/接口：PascalCase (如 `UserInfo`)

### 目录规范
- 页面组件放置于 `views/` 对应模块目录
- 页面私有组件放置于页面目录下的 `components/`
- 公共组件放置于 `src/components/`
- 类型定义放置于 `types/` 对应模块文件

## 相关文档

- Vue 3: https://cn.vuejs.org/
- Vite: https://cn.vite.dev/
- Pinia: https://pinia.vuejs.org/zh/
- Vue Router: https://router.vuejs.org/zh/
- Vue I18n: https://vue-i18n.intlify.dev/
- Tailwind CSS: https://tailwindcss.com/docs
- Lucide Icons: https://lucide.dev/icons
- Axios: https://axios-http.com/

## 版本信息

- **版本**: 0.1.0
- **Vue**: 3.5.26
- **TypeScript**: 5.9.3
- **Vite**: 6.2.6

## License

Private - All Rights Reserved
