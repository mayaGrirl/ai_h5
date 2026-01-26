# 顶峰28 (DingFeng28)

> 一个基于 Vue 3 + TypeScript + Vite 构建的现代化移动端 H5 应用

---

# 文档目录

## 第一部分：项目基础
- [技术栈](#技术栈)
- [项目架构](#项目架构)
- [目录结构](#目录结构)
- [功能模块](#功能模块)
- [核心特性](#核心特性)
- [开发指南](#开发指南)
- [环境配置](#环境配置)
- [部署指南](#部署指南)
- [API 接口规范](#api-接口规范)
- [代码规范](#代码规范)

## 第二部分：IM 即时通讯模块
- [一、系统架构概览](#一系统架构概览)
- [二、目录结构](#二目录结构)
- [三、核心组件说明](#三核心组件说明)
- [四、WebSocket 管理](#四websocket-管理-useimwebsocketts)
- [五、状态管理](#五状态管理-pinia)
- [六、API 接口说明](#六api-接口说明)
- [七、类型定义](#七类型定义)
- [八、路由配置](#八路由配置)
- [九、WebSocket 消息推送接收](#九websocket-消息推送接收)
- [十、注意事项](#十注意事项)

---

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
- Node.js >= 24
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

### Nginx 配置示例 (宝塔面板)

在宝塔面板中，进入 **网站 → 对应站点 → 设置 → 配置文件**，添加以下配置：

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name m.your-domain.com;

    # SSL 证书 (宝塔自动生成，无需修改)
    # ssl_certificate /www/server/panel/vhost/cert/...
    # ssl_certificate_key /www/server/panel/vhost/cert/...

    # 网站根目录
    root /www/wwwroot/m.your-domain.com/dist;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;

    # ============================================
    # API 代理转发 (重要：必须放在 location / 之前)
    # ============================================
    location /api/ {
        # 后端 API 地址，根据实际情况修改
        proxy_pass https://api.your-domain.com;

        proxy_http_version 1.1;
        proxy_set_header Host $host; #$host 替换自己的域名
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由支持 (放在最后)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
    }
}
```

### 宝塔面板配置步骤

1. **创建网站**
   - 进入宝塔面板 → 网站 → 添加站点
   - 填写域名：`m.your-domain.com`
   - 选择纯静态

2. **上传文件**
   - 本地执行：`npm run build`
   - 将 `dist` 目录内容上传至网站根目录

3. **配置反向代理**
   - 方式一：在 **设置 → 配置文件** 中直接编辑（推荐，参考上方配置）
   - 方式二：使用宝塔的 **反向代理** 功能：
     - 点击 **设置 → 反向代理 → 添加反向代理**
     - 代理名称：`api`
     - 代理目录：`/api`
     - 目标URL：`https://api.your-domain.com`（你的后端 API 地址）
     - 勾选 **发送域名**

4. **配置 SSL 证书**
   - 点击 **设置 → SSL**
   - 选择 Let's Encrypt 或上传证书
   - 开启 **强制 HTTPS**

5. **重载配置**
   ```bash
   nginx -t          # 测试配置
   nginx -s reload   # 重载配置
   ```

### 常见问题

#### API 请求返回 404
- 检查 `location /api/` 是否在 `location /` 之前
- 检查 `proxy_pass` 地址是否正确

#### API 请求返回 405 Method Not Allowed
- 确保 `location /api/` 配置正确，不要被 `try_files` 拦截
- 添加 `proxy_http_version 1.1;`

#### 页面刷新后 404
- 确保 `location /` 中有 `try_files $uri $uri/ /index.html;`

### 部署步骤总结
1. 执行生产构建：`npm run build`
2. 将 `dist` 目录内容上传至服务器网站根目录
3. 在宝塔面板配置 Nginx（参考上方配置）
4. 配置 SSL 证书（可选但推荐）
5. 重载 Nginx：`nginx -s reload`

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

---

# 即时通讯 (IM) 模块技术文档

## 一、系统架构概览

```
┌─────────────────────────────────────────────────────────────────────┐
│                           视图层 (Views)                             │
│  ┌──────────────┬──────────────┬──────────────┬──────────────────┐  │
│  │ index.vue    │ chat.vue     │ group/*.vue  │ friend-requests  │  │
│  │ (会话列表)    │ (聊天界面)    │ (群聊管理)    │ (好友申请)        │  │
│  └──────────────┴──────────────┴──────────────┴──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────┐
│                          组件层 (Components)                         │
│  ┌─────────────────┬─────────────────┬─────────────────────────┐    │
│  │GroupPackSend    │GroupPackGrab    │GroupPackDetail          │    │
│  │(发红包弹窗)      │(抢红包弹窗)      │(红包详情)                │    │
│  ├─────────────────┼─────────────────┼─────────────────────────┤    │
│  │GroupPackMessage │VoiceCallOverlay │MessageItem              │    │
│  │(红包消息气泡)    │(语音通话界面)    │(消息项)                  │    │
│  └─────────────────┴─────────────────┴─────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────┐
│                        组合式函数 (Composables)                      │
│  ┌────────────────────────┬─────────────────────────────────────┐   │
│  │ useIMWebSocket         │ useVoiceCall                        │   │
│  │ (WebSocket连接管理)     │ (WebRTC语音通话)                     │   │
│  └────────────────────────┴─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────┐
│                        状态管理 (Pinia Store)                        │
│  ┌────────────────────────┬─────────────────────────────────────┐   │
│  │ im.ts                  │ friend.ts                           │   │
│  │ (会话/消息状态)         │ (好友状态)                           │   │
│  └────────────────────────┴─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────┐
│                          API 层 (API)                               │
│  ┌──────────┬──────────┬──────────┬──────────────────────────────┐  │
│  │ im.ts    │ friend.ts│ group.ts │ voiceCall.ts                 │  │
│  │ (会话/消息)│ (好友)   │ (群组)   │ (语音通话)                    │  │
│  └──────────┴──────────┴──────────┴──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 二、目录结构

```
src/
├── views/im/                        # IM 页面
│   ├── index.vue                    # 会话列表页
│   ├── chat.vue                     # 聊天界面(私聊/群聊/客服)
│   ├── friend-requests.vue          # 好友申请列表
│   ├── system-messages.vue          # 系统消息
│   └── group/                       # 群聊相关页面
│       ├── create.vue               # 创建群
│       ├── search.vue               # 搜索群
│       ├── join.vue                 # 加入群
│       ├── info.vue                 # 群信息
│       ├── settings.vue             # 群设置
│       ├── members.vue              # 成员列表
│       └── applications.vue         # 入群申请
│
├── components/im/                   # IM 组件
│   ├── GroupPackSend.vue            # 发红包弹窗
│   ├── GroupPackGrab.vue            # 抢红包弹窗
│   ├── GroupPackDetail.vue          # 红包详情
│   └── GroupPackMessage.vue         # 红包消息气泡
│
├── composables/                     # 组合式函数
│   ├── useIMWebSocket.ts            # WebSocket 连接管理
│   └── useVoiceCall.ts              # 语音通话 (WebRTC)
│
├── stores/                          # Pinia 状态管理
│   ├── im.ts                        # IM 状态(会话/消息)
│   └── friend.ts                    # 好友状态
│
├── api/                             # API 接口
│   ├── im.ts                        # 会话/消息接口
│   ├── friend.ts                    # 好友接口
│   ├── group.ts                     # 群组接口
│   └── voiceCall.ts                 # 语音通话接口
│
└── types/                           # TypeScript 类型
    ├── im.type.ts                   # IM 类型定义
    └── group.type.ts                # 群组类型定义
```

---

## 三、核心组件说明

### 3.1 会话列表页 (index.vue)

**功能**：
- 显示所有会话列表（私聊、群聊、系统会话）
- 未读消息数显示
- 会话置顶、免打扰标识
- 左滑删除/置顶操作
- 创建群聊入口

**关键代码**：
```typescript
// 加载会话列表
const { conversations, loadConversations } = useIMStore()

// WebSocket 监听新消息
ws.on('message.sent', (data) => {
  updateConversation(data.conversation)
})
```

### 3.2 聊天界面 (chat.vue)

**功能**：
- 消息列表展示（文本、图片、文件、红包、通话记录）
- 发送消息（文本、图片、文件）
- 消息撤回（2分钟内）
- 链接自动识别并可点击
- 语音通话入口（私聊）
- 群设置入口（群聊）
- 禁言状态处理

**消息类型**：
| 类型 | type值 | 说明 |
|------|--------|------|
| 文本 | 1 | 普通文本消息，支持链接识别 |
| 图片 | 2 | 显示图片，点击预览 |
| 语音 | 3 | 语音消息（暂不支持群聊） |
| 文件 | 4 | 文件消息，点击下载 |
| 系统 | 5 | 系统提示消息 |
| 红包 | 6 | 群红包消息 |
| 通话 | 7 | 通话记录 |

**关键代码**：
```typescript
// 发送消息
async function sendMessage() {
  const res = await imApi.sendMessage({
    conversation_id: conversationId,
    type: 1,
    content: messageText.value
  })
}

// 链接识别
function linkifyText(text: string): string {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi
  return escapeHtml(text).replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank">${url}</a>`
  })
}
```

### 3.3 语音通话 (useVoiceCall.ts)

**通话状态**：
```typescript
enum CallState {
  IDLE = 'idle',           // 空闲
  CALLING = 'calling',     // 呼叫中
  INCOMING = 'incoming',   // 来电中
  CONNECTING = 'connecting', // 连接中
  CONNECTED = 'connected', // 通话中
  ENDED = 'ended',         // 已结束
}
```

**WebRTC 配置**：
```typescript
const rtcConfig: RTCConfiguration = {
  iceServers: [
    // STUN 服务器
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // TURN 服务器（NAT穿透失败时的中继）
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceTransportPolicy: 'all',
}
```

**使用方式**：
```typescript
const {
  callState,
  callInfo,
  callDuration,
  makeCall,      // 发起通话
  answerCall,    // 接听
  rejectCall,    // 拒绝
  endCall,       // 结束
  toggleMute,    // 静音
} = useVoiceCall()

// 发起通话
await makeCall(targetUserId)

// 监听来电
voiceCall.on('incoming', (info) => {
  showIncomingCallUI(info)
})
```

---

## 四、WebSocket 管理 (useIMWebSocket.ts)

### 4.1 连接流程

```typescript
// 1. 获取连接配置
const config = await getConnectionConfig()

// 2. 建立 WebSocket 连接 (Pusher 协议)
const url = `wss://${host}:${port}/app/${appKey}?protocol=7`
const socket = new WebSocket(url)

// 3. 连接成功后注册
socket.onmessage = (event) => {
  if (event.data.event === 'pusher:connection_established') {
    socketId = JSON.parse(event.data.data).socket_id
    registerConnection(socketId)
  }
}

// 4. 订阅私有频道
await subscribeChannel(`private-im.user.${userId}`)

// 5. 启动心跳 (25秒间隔)
setInterval(() => wsHeartbeat(socketId), 25000)
```

### 4.2 事件监听

```typescript
const ws = useIMWebSocket()

// 监听新消息
ws.on('message.sent', (data) => {
  // 更新会话列表
  // 如果在当前聊天，添加消息
})

// 监听消息撤回
ws.on('message.recalled', (data) => {
  // 更新消息状态
})

// 监听语音通话信令
ws.on('voice.call.signal', (data) => {
  handleVoiceCallSignal(data)
})

// 监听系统通知
ws.on('system.notification', (data) => {
  showNotification(data)
})
```

---

## 五、状态管理 (Pinia)

### 5.1 IM Store (im.ts)

```typescript
export const useIMStore = defineStore('im', {
  state: () => ({
    conversations: [],           // 会话列表
    currentConversation: null,   // 当前会话
    messages: {},                // 消息缓存 {conversationId: Message[]}
    unreadTotal: 0,              // 总未读数
  }),

  actions: {
    // 加载会话列表
    async loadConversations() { ... },

    // 加载消息
    async loadMessages(conversationId) { ... },

    // 发送消息
    async sendMessage(params) { ... },

    // 更新未读数
    updateUnreadCount(conversationId, count) { ... },
  },
})
```

### 5.2 Friend Store (friend.ts)

```typescript
export const useFriendStore = defineStore('friend', {
  state: () => ({
    contacts: {
      system: [],    // 系统联系人
      friends: [],   // 好友列表
    },
    friendRequests: [],      // 好友申请
    pendingRequestCount: 0,  // 待处理申请数
  }),

  actions: {
    async loadContacts() { ... },
    async sendFriendRequest(toId, message) { ... },
    async acceptRequest(requestId) { ... },
  },
})
```

---

## 六、API 接口说明

### 6.1 会话接口 (im.ts)

```typescript
// 获取会话列表
getConversations(): Promise<HttpRes<Conversation[]>>

// 创建/获取会话
createConversation(params: {
  type: 1 | 2,      // 1=私聊, 2=群聊
  target_id?: number,
  member_ids?: number[]
}): Promise<HttpRes<Conversation>>

// 获取消息列表
getMessages(conversationId: number, params?: {
  before_id?: number,
  limit?: number
}): Promise<HttpRes<{messages: Message[]}>>

// 发送消息
sendMessage(params: {
  conversation_id: number,
  type: number,
  content: string,
  extra?: object
}): Promise<HttpRes<Message>>

// 撤回消息
recallMessage(messageId: number): Promise<HttpRes>

// 上传文件
uploadFile(file: File): Promise<HttpRes<{url: string, ...}>>
```

### 6.2 好友接口 (friend.ts)

```typescript
// 获取通讯录
getContacts(): Promise<HttpRes<{system: [], friends: []}>>

// 搜索用户
searchUsers(keyword: string): Promise<HttpRes<User[]>>

// 发送好友申请
sendFriendRequest(toId: number, message?: string): Promise<HttpRes>

// 获取好友申请列表
getFriendRequests(): Promise<HttpRes<FriendRequest[]>>

// 处理好友申请
acceptFriendRequest(requestId: number): Promise<HttpRes>
rejectFriendRequest(requestId: number): Promise<HttpRes>

// 删除好友
deleteFriend(friendId: number): Promise<HttpRes>
```

### 6.3 群组接口 (group.ts)

```typescript
// 创建群
createGroup(params: {
  name: string,
  member_ids: number[]
}): Promise<HttpRes<Conversation>>

// 搜索群
searchGroups(keyword: string): Promise<HttpRes<Group[]>>

// 申请入群
joinGroup(groupId: number, message?: string): Promise<HttpRes>

// 获取入群申请
getGroupApplications(groupId: number): Promise<HttpRes<Application[]>>

// 处理入群申请
handleApplication(appId: number, action: 'approve' | 'reject'): Promise<HttpRes>

// 获取群成员
getGroupMembers(groupId: number): Promise<HttpRes<Member[]>>

// 更新群设置
updateGroupSettings(groupId: number, settings: {
  name?: string,
  avatar?: string,
  is_muted?: boolean,
  allow_add_friend?: boolean,
  join_mode?: 1 | 2 | 3
}): Promise<HttpRes>

// 群红包相关
sendGroupPack(groupId: number, params: {...}): Promise<HttpRes>
grabGroupPack(packId: number): Promise<HttpRes>
getPackDetail(packId: number): Promise<HttpRes>
```

---

## 七、类型定义

### 7.1 会话类型 (im.type.ts)

```typescript
interface Conversation {
  id: number
  type: 1 | 2 | 3           // 1=私聊, 2=群聊, 3=系统
  name: string
  avatar: string
  last_message?: Message
  unread_count: number
  is_top: boolean
  is_mute: boolean
  // 群聊特有
  owner_id?: number
  is_muted?: boolean        // 全员禁言
  member_count?: number
}

interface Message {
  id: number
  uuid: string
  conversation_id: number
  sender_id: number
  sender: {
    id: number
    nickname: string
    avatar: string
  }
  type: 1 | 2 | 3 | 4 | 5 | 6 | 7
  content: string
  extra?: {
    attachment?: MessageAttachment
  }
  is_recalled: boolean
  created_at: string
}

interface MessageAttachment {
  id: number
  url: string
  type: number      // 1=图片, 2=音频, 3=文件
  name: string
  size?: number
  width?: number
  height?: number
}
```

### 7.2 群组类型 (group.type.ts)

```typescript
interface Group {
  id: number
  name: string
  avatar: string
  group_number: string
  owner_id: number
  member_count: number
  is_muted: boolean
  allow_add_friend: boolean
  join_mode: 1 | 2 | 3
}

interface GroupMember {
  id: number
  member_id: number
  nickname: string
  avatar: string
  role: 0 | 1 | 2    // 0=成员, 1=管理员, 2=群主
  is_muted: boolean
}

interface GroupPack {
  id: number
  type: 1 | 2        // 1=拼手气, 2=普通
  total_amount: number
  total_count: number
  received_count: number
  greeting: string
  status: 1 | 2 | 3  // 1=进行中, 2=已领完, 3=已过期
  is_grabbed: boolean
  my_amount?: number
}
```

---

## 八、路由配置

```typescript
// router/index.ts
{
  path: '/im',
  name: 'IM',
  component: () => import('@/views/im/index.vue'),
  meta: { requiresAuth: true }
},
{
  path: '/im/chat/:id',
  name: 'IMChat',
  component: () => import('@/views/im/chat.vue'),
  meta: { requiresAuth: true }
},
{
  path: '/im/friend-requests',
  name: 'FriendRequests',
  component: () => import('@/views/im/friend-requests.vue'),
},
{
  path: '/im/group/create',
  name: 'GroupCreate',
  component: () => import('@/views/im/group/create.vue'),
},
{
  path: '/im/group/search',
  name: 'GroupSearch',
  component: () => import('@/views/im/group/search.vue'),
},
{
  path: '/im/group/:id/settings',
  name: 'GroupSettings',
  component: () => import('@/views/im/group/settings.vue'),
},
{
  path: '/im/group/:id/members',
  name: 'GroupMembers',
  component: () => import('@/views/im/group/members.vue'),
},
```

---

## 九、WebSocket 消息推送接收

### 9.1 频道类型与订阅

系统支持三种频道类型：

| 频道类型 | 格式 | 认证要求 | 使用场景 |
|---------|------|---------|---------|
| 公共频道 | `channel-name` | 无 | 开奖结果、系统公告 |
| 私有频道 | `private-channel-name` | 需认证 | 用户个人消息、投注结果 |
| 在线状态频道 | `presence-channel-name` | 需认证 | 群聊在线成员 |

### 9.2 连接与认证流程

```typescript
// useIMWebSocket.ts 核心连接流程

// 1. 获取 WebSocket 配置
const config = await imApi.getWebSocketConfig()
// config: { host, port, app_key, scheme }

// 2. 建立 WebSocket 连接 (Pusher 协议)
const wsUrl = `${config.scheme === 'https' ? 'wss' : 'ws'}://${config.host}:${config.port}/app/${config.app_key}?protocol=7`
socket = new WebSocket(wsUrl)

// 3. 连接成功后获取 socket_id
socket.onmessage = (event) => {
  const data = JSON.parse(event.data)
  if (data.event === 'pusher:connection_established') {
    const { socket_id } = JSON.parse(data.data)
    socketId.value = socket_id

    // 4. 向服务端注册连接
    await imApi.wsConnect({ socket_id })

    // 5. 订阅用户私有频道
    await subscribePrivateChannel(`private-im.user.${userId}`)
  }
}

// 6. 启动心跳保活 (25秒间隔)
heartbeatTimer = setInterval(() => {
  imApi.wsHeartbeat({ socket_id: socketId.value })
}, 25000)
```

### 9.3 频道订阅

```typescript
// 订阅公共频道（无需认证）
function subscribePublicChannel(channelName: string) {
  socket.send(JSON.stringify({
    event: 'pusher:subscribe',
    data: { channel: channelName }
  }))
}

// 订阅私有频道（需要认证）
async function subscribePrivateChannel(channelName: string) {
  // 向服务端获取授权签名
  const { data } = await imApi.channelAuth({
    socket_id: socketId.value,
    channel_name: channelName
  })

  socket.send(JSON.stringify({
    event: 'pusher:subscribe',
    data: {
      channel: channelName,
      auth: data.auth  // 服务端返回的签名
    }
  }))
}

// 取消订阅
function unsubscribeChannel(channelName: string) {
  socket.send(JSON.stringify({
    event: 'pusher:unsubscribe',
    data: { channel: channelName }
  }))
}
```

### 9.4 事件监听

```typescript
// 事件监听器注册
const eventHandlers = new Map<string, Set<Function>>()

function on(event: string, handler: Function) {
  if (!eventHandlers.has(event)) {
    eventHandlers.set(event, new Set())
  }
  eventHandlers.get(event)!.add(handler)
}

function off(event: string, handler: Function) {
  eventHandlers.get(event)?.delete(handler)
}

// 处理接收到的消息
socket.onmessage = (event) => {
  const data = JSON.parse(event.data)

  // Pusher 协议事件名带 . 前缀
  const eventName = data.event?.replace(/^\./, '') || data.event
  const payload = data.data ? JSON.parse(data.data) : data.data

  // 触发对应事件处理器
  const handlers = eventHandlers.get(eventName)
  handlers?.forEach(handler => handler(payload))
}
```

### 9.5 接收服务端推送消息

#### 9.5.1 接收开奖结果（公共频道）

```typescript
// 订阅开奖结果公共频道
subscribePublicChannel('lottery.results')

// 监听开奖事件
ws.on('game.opened', (data) => {
  console.log('收到开奖结果:', data)
  // {
  //   expect_no: '20260125001',
  //   lottery_id: 1,
  //   result: { nums: [3, 5, 7], sum: 15 },
  //   timestamp: '2026-01-25 10:00:00'
  // }

  // 更新当前游戏开奖状态
  gameStore.updateLotteryResult(data)

  // 显示开奖动画
  showLotteryAnimation(data.result)
})
```

#### 9.5.2 接收系统公告（公共频道）

```typescript
// 订阅系统通知公共频道
subscribePublicChannel('system.notifications')

// 监听系统公告
ws.on('system.notification', (data) => {
  console.log('收到系统公告:', data)
  // {
  //   id: 123,
  //   member_id: 0,  // 0 表示全体用户
  //   type: 'announcement',
  //   title: '系统维护通知',
  //   content: '系统将于22:00进行维护',
  //   extra: { start_time: '22:00' },
  //   timestamp: '2026-01-25 10:00:00'
  // }

  // 显示公告弹窗
  showAnnouncementDialog(data)
})
```

#### 9.5.3 接收个人系统消息（私有频道）

```typescript
// 登录后自动订阅用户私有频道
// private-im.user.{userId}

// 监听系统消息
ws.on('system.message', (data) => {
  console.log('收到系统消息:', data)
  // {
  //   message: {
  //     id: 456,
  //     type: 'winning',
  //     type_label: '中奖通知',
  //     title: '恭喜中奖！',
  //     content: '您在幸运28第20260125001期中奖1000金豆',
  //     extra: { bet_id: 789, amount: 1000 },
  //     is_read: false,
  //     created_at: '2026-01-25 10:00:00'
  //   }
  // }

  // 更新未读消息数
  imStore.incrementUnreadCount()

  // 显示通知
  showNotification(data.message)
})

// 监听个人通知（如中奖、充值成功等）
ws.on('system.notification', (data) => {
  // 当 member_id > 0 时，是个人专属通知
  if (data.member_id > 0) {
    handlePersonalNotification(data)
  }
})
```

#### 9.5.4 接收投注结果（私有频道）

```typescript
// 订阅投注结果频道
subscribePrivateChannel(`private-user.bet.${userId}`)

// 监听投注结果
ws.on('BetResult', (data) => {
  console.log('收到投注结果:', data)
  // 成功示例:
  // {
  //   status: 'success',
  //   request_id: 'uuid-xxx',
  //   data: {
  //     lottery_id: 1,
  //     expect_no: '20260125001',
  //     total_gold: 100,
  //     bet_time: '2026-01-25 10:00:00'
  //   },
  //   timestamp: '2026-01-25T10:00:00+08:00'
  // }

  // 失败示例:
  // {
  //   status: 'failed',
  //   request_id: 'uuid-xxx',
  //   error_code: '3023',
  //   error_message: '余额不足',
  //   timestamp: '2026-01-25T10:00:00+08:00'
  // }

  if (data.status === 'success') {
    toast.success('投注成功')
    // 刷新余额
    userStore.refreshBalance()
    // 更新投注记录
    gameStore.addBetRecord(data.data)
  } else {
    toast.error(data.error_message || '投注失败')
  }
})
```

#### 9.5.5 接收聊天消息（私有频道）

```typescript
// 监听新消息
ws.on('message.sent', (data) => {
  console.log('收到新消息:', data)
  // {
  //   conversation_id: 123,
  //   message: {
  //     id: 789,
  //     uuid: 'msg-uuid',
  //     sender_id: 456,
  //     sender: { id: 456, nickname: '张三', avatar: '...' },
  //     type: 1,
  //     content: '你好！',
  //     created_at: '2026-01-25 10:00:00'
  //   }
  // }

  // 更新会话列表
  imStore.updateConversationLastMessage(data.conversation_id, data.message)

  // 如果当前在该会话页面，直接添加消息
  if (currentConversationId === data.conversation_id) {
    imStore.addMessage(data.message)
  } else {
    // 增加未读数
    imStore.incrementConversationUnread(data.conversation_id)
  }
})

// 监听消息撤回
ws.on('message.recalled', (data) => {
  console.log('消息被撤回:', data)
  // { message_id: 789, conversation_id: 123 }

  imStore.markMessageRecalled(data.message_id)
})
```

#### 9.5.6 接收语音通话信令（私有频道）

```typescript
// 监听语音通话信令
ws.on('voice.call.signal', (data) => {
  console.log('收到通话信令:', data)
  // {
  //   type: 'offer' | 'answer' | 'candidate' | 'end' | 'reject' | 'busy',
  //   call_id: 'call-uuid',
  //   from_user_id: 123,
  //   to_user_id: 456,
  //   sdp?: '...',      // offer/answer 时
  //   candidate?: '...' // candidate 时
  // }

  switch (data.type) {
    case 'offer':
      // 收到来电
      voiceCall.handleIncomingCall(data)
      break
    case 'answer':
      // 对方接听
      voiceCall.handleAnswer(data)
      break
    case 'candidate':
      // ICE 候选
      voiceCall.handleCandidate(data)
      break
    case 'end':
      // 通话结束
      voiceCall.handleEnd(data)
      break
    case 'reject':
      // 对方拒接
      voiceCall.handleReject(data)
      break
    case 'busy':
      // 对方忙线
      voiceCall.handleBusy(data)
      break
  }
})
```

#### 9.5.7 接收群聊红包事件

```typescript
// 监听红包发送
ws.on('group.pack.sent', (data) => {
  console.log('收到群红包:', data)
  // {
  //   conversation_id: 123,
  //   pack: { id: 789, type: 1, greeting: '恭喜发财', total_count: 10 },
  //   message: { ... }
  // }

  // 显示红包消息
  imStore.addMessage(data.message)
})

// 监听红包被领取
ws.on('group.pack.grabbed', (data) => {
  console.log('红包被领取:', data)
  // {
  //   pack_id: 789,
  //   member_id: 456,
  //   nickname: '张三',
  //   amount: 10.5,
  //   is_best: true  // 手气最佳
  // }

  // 更新红包状态
  if (data.pack_id === currentViewingPackId) {
    refreshPackDetail(data.pack_id)
  }
})
```

### 9.6 完整使用示例

```typescript
// 在 App.vue 或主布局组件中初始化
import { onMounted, onUnmounted } from 'vue'
import { useIMWebSocket } from '@/composables/useIMWebSocket'
import { useAuthStore } from '@/stores/auth'
import { useIMStore } from '@/stores/im'
import { useGameStore } from '@/stores/game'

const authStore = useAuthStore()
const imStore = useIMStore()
const gameStore = useGameStore()
const ws = useIMWebSocket()

onMounted(async () => {
  if (authStore.isLoggedIn) {
    // 1. 建立 WebSocket 连接
    await ws.connect()

    // 2. 订阅公共频道
    ws.subscribePublicChannel('lottery.results')
    ws.subscribePublicChannel('system.notifications')

    // 3. 订阅私有频道（用户个人消息）
    await ws.subscribePrivateChannel(`private-im.user.${authStore.userId}`)
    await ws.subscribePrivateChannel(`private-user.bet.${authStore.userId}`)

    // 4. 注册事件监听器
    setupEventListeners()
  }
})

function setupEventListeners() {
  // 开奖结果
  ws.on('game.opened', (data) => {
    gameStore.updateLotteryResult(data)
  })

  // 系统公告
  ws.on('system.notification', (data) => {
    if (data.member_id === 0) {
      showAnnouncementDialog(data)
    } else {
      handlePersonalNotification(data)
    }
  })

  // 系统消息
  ws.on('system.message', (data) => {
    imStore.addSystemMessage(data.message)
    showNotification(data.message)
  })

  // 投注结果
  ws.on('BetResult', handleBetResult)

  // 聊天消息
  ws.on('message.sent', handleNewMessage)
  ws.on('message.recalled', handleMessageRecalled)

  // 语音通话
  ws.on('voice.call.signal', handleVoiceCallSignal)

  // 群红包
  ws.on('group.pack.sent', handlePackSent)
  ws.on('group.pack.grabbed', handlePackGrabbed)
}

onUnmounted(() => {
  // 清理所有监听器
  ws.removeAllListeners()
  // 断开连接
  ws.disconnect()
})
```

### 9.7 事件类型汇总

| 事件名 | 频道类型 | 说明 | 数据结构 |
|-------|---------|------|---------|
| `game.opened` | 公共 | 开奖结果 | `{expect_no, lottery_id, result, timestamp}` |
| `system.notification` | 公共/私有 | 系统通知 | `{id, member_id, type, title, content, extra}` |
| `system.message` | 私有 | 系统消息 | `{message: {...}}` |
| `BetResult` | 私有 | 投注结果 | `{status, request_id, data/error_*}` |
| `message.sent` | 私有 | 新聊天消息 | `{conversation_id, message}` |
| `message.recalled` | 私有 | 消息撤回 | `{message_id, conversation_id}` |
| `voice.call.signal` | 私有 | 语音通话信令 | `{type, call_id, from_user_id, ...}` |
| `group.pack.sent` | 私有 | 群红包发送 | `{conversation_id, pack, message}` |
| `group.pack.grabbed` | 私有 | 红包被抢 | `{pack_id, member_id, amount, is_best}` |
| `user.online` | 私有 | 用户上线 | `{user_id}` |
| `user.offline` | 私有 | 用户离线 | `{user_id}` |

---

## 十、注意事项

### 10.1 WebSocket 连接管理

- 使用单例模式，全局共享一个连接
- 页面隐藏时发送心跳保活
- 断线自动重连（最多10次，指数退避）
- 退出登录时清理所有监听器

```typescript
// 断线重连逻辑
let reconnectAttempts = 0
const maxReconnectAttempts = 10

function handleDisconnect() {
  if (reconnectAttempts < maxReconnectAttempts) {
    // 指数退避：1s, 2s, 4s, 8s...
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
    setTimeout(() => {
      reconnectAttempts++
      connect()
    }, delay)
  } else {
    console.error('WebSocket 重连失败，已达最大重试次数')
    showReconnectButton()
  }
}

// 连接成功后重置计数器
function handleConnected() {
  reconnectAttempts = 0
}
```

### 10.2 语音通话

#### 基本说明

- 仅支持私聊，群聊和客服会话隐藏通话按钮
- 需要 HTTPS 环境（getUserMedia 要求安全上下文）
- 使用 TURN 服务器作为后备中继
- 30秒无应答自动取消
- 30秒连接超时自动结束
- 支持 ICE 重启（最多2次）

#### 核心文件

| 文件 | 说明 |
|------|------|
| `src/composables/useVoiceCall.ts` | WebRTC 语音通话 Composable |
| `src/components/VoiceCallModal.vue` | 语音通话 UI 组件 |
| `src/api/voiceCall.ts` | 语音通话 API 接口 |

#### WebRTC 配置

```typescript
// 推荐的 ICE 服务器配置（已内置于 useVoiceCall.ts）
const rtcConfig: RTCConfiguration = {
  iceServers: [
    // 公共 STUN 服务器
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.stunprotocol.org:3478' },

    // TURN 服务器（中继，当 STUN 失败时使用）
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:relay.metered.ca:443',
      username: 'e8dd65b92c62d3e36cafb807',
      credential: 'uWdWNmkhvyqTmFrk',
    },
  ],
  iceTransportPolicy: 'all',
  iceCandidatePoolSize: 10,
}
```

#### 使用方法

```typescript
import { useVoiceCall, CallState } from '@/composables/useVoiceCall'

const voiceCall = useVoiceCall()

// 初始化监听器（在 IM 连接成功后调用）
voiceCall.init()

// 发起通话
await voiceCall.makeCall(targetUserId)

// 接听来电
await voiceCall.answerCall()

// 拒绝来电
await voiceCall.rejectCall()

// 结束通话
await voiceCall.endCall()

// 静音切换
voiceCall.toggleMute()

// 监听事件
voiceCall.on('incoming', (callInfo) => {
  console.log('来电:', callInfo.peerName)
})

voiceCall.on('connected', (callInfo) => {
  console.log('通话已建立')
})

voiceCall.on('ended', () => {
  console.log('通话结束')
})
```

#### 通话状态

```typescript
enum CallState {
  IDLE = 'idle',           // 空闲
  CALLING = 'calling',     // 呼叫中（等待对方接听）
  INCOMING = 'incoming',   // 来电中（等待接听）
  CONNECTING = 'connecting', // 连接中（WebRTC 建立连接）
  CONNECTED = 'connected', // 通话中
  ENDED = 'ended',         // 已结束
}
```

#### 信令流程

```
呼叫方(A)                  服务器                    被叫方(B)
   |                        |                        |
   | makeCall()             |                        |
   |--initiateCall-------->|                        |
   |                        |--call.invite--------->| handleIncomingCall()
   |                        |                        | (显示来电界面)
   |                        |                        |
   |                        |<--acceptCall----------| answerCall()
   | handleCallAccepted()   |                        | setupPeerConnection()
   |<--call.accept---------|                        |
   | setupPeerConnection()  |                        |
   | createAndSendOffer()   |                        |
   |--webrtc.offer-------->|--webrtc.offer-------->| handleWebRTCOffer()
   |                        |                        | createAnswer()
   |<--webrtc.answer-------|<--webrtc.answer-------| sendAnswer()
   | handleWebRTCAnswer()   |                        |
   |                        |                        |
   |<--webrtc.ice----------|<--webrtc.ice----------|
   |--webrtc.ice---------->|--webrtc.ice---------->|
   |                        |                        |
   |<================ P2P 音频流 (RTP) =============>|
```

### 10.3 性能优化

- 消息列表使用虚拟滚动
- 图片懒加载
- 消息本地缓存
- 会话列表增量更新

```typescript
// 消息虚拟滚动配置
const virtualListConfig = {
  itemHeight: 80,        // 预估消息高度
  buffer: 5,             // 上下缓冲区消息数
  threshold: 300,        // 触发加载更多的阈值
}

// 图片懒加载
const lazyLoadImage = (el: HTMLImageElement, src: string) => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        el.src = src
        observer.unobserve(el)
      }
    })
  })
  observer.observe(el)
}
```

### 10.4 错误处理

```typescript
// 统一错误处理
ws.on('error', (error) => {
  console.error('WebSocket error:', error)

  // 根据错误类型处理
  if (error.code === 'AUTH_FAILED') {
    // Token 过期，重新登录
    authStore.logout()
    router.push('/login')
  } else if (error.code === 'CONNECTION_LOST') {
    // 连接断开，尝试重连
    handleDisconnect()
  }
})

// API 请求错误处理
const handleApiError = (error: any) => {
  if (error.response?.status === 401) {
    // 未授权
    authStore.logout()
  } else if (error.response?.status === 429) {
    // 请求频率限制
    toast.error('操作过于频繁，请稍后再试')
  } else {
    toast.error(error.message || '网络错误')
  }
}
```

### 10.5 移动端适配

```typescript
// 处理软键盘弹出
const handleKeyboardShow = () => {
  // 滚动到输入框可见
  inputRef.value?.scrollIntoView({ behavior: 'smooth' })
}

// 处理页面可见性变化
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // 页面可见时，检查 WebSocket 连接状态
    if (!ws.isConnected) {
      ws.reconnect()
    }
    // 刷新未读消息数
    imStore.refreshUnreadCount()
  }
})

// 处理返回按钮（Android）
window.addEventListener('popstate', (event) => {
  // 如果有弹窗打开，关闭弹窗而不是返回页面
  if (hasOpenModal()) {
    event.preventDefault()
    closeModal()
  }
})
```

---

## 十一、环境变量配置

### 11.1 开发环境 (.env.development)

```env
# API 地址
VITE_API_BASE_URL=http://localhost:8080/api

# WebSocket 配置
VITE_WS_HOST=localhost
VITE_WS_PORT=8080
VITE_WS_SCHEME=http

# 应用配置
VITE_APP_TITLE=顶峰28
VITE_APP_DEBUG=true
```

### 11.2 生产环境 (.env.production)

```env
# API 地址
VITE_API_BASE_URL=https://api.your-domain.com/api

# WebSocket 配置（通过 Nginx 代理）
VITE_WS_HOST=api.your-domain.com
VITE_WS_PORT=443
VITE_WS_SCHEME=https

# 应用配置
VITE_APP_TITLE=顶峰28
VITE_APP_DEBUG=false
```

### 11.3 在代码中使用

```typescript
// 获取环境变量
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
const wsHost = import.meta.env.VITE_WS_HOST
const wsPort = import.meta.env.VITE_WS_PORT
const wsScheme = import.meta.env.VITE_WS_SCHEME

// 构建 WebSocket URL
const wsUrl = `${wsScheme === 'https' ? 'wss' : 'ws'}://${wsHost}:${wsPort}/app/${appKey}`
```

---

## 十二、常见问题排查

### 12.1 WebSocket 连接失败

```bash
# 检查网络连接
ping api.your-domain.com

# 检查 WebSocket 端口是否开放
# 浏览器控制台测试
new WebSocket('wss://api.your-domain.com/app/your-app-key?protocol=7')
```

**常见原因：**
- HTTPS 页面不能连接 WS (需要 WSS)
- Nginx 未正确代理 WebSocket
- 防火墙阻止端口

### 12.2 消息收不到

```typescript
// 检查频道是否订阅成功
console.log('已订阅频道:', ws.subscribedChannels)

// 检查事件监听器
console.log('已注册事件:', ws.registeredEvents)

// 开启调试模式
ws.enableDebug()  // 打印所有收发消息
```

### 12.3 语音通话连接不上

#### 排查步骤

**1. 检查浏览器控制台日志**

查找以下关键日志：

```
[VoiceCall] Initializing voice call listener...
[IM WebSocket] ========== VOICE CALL SIGNAL ==========
[VoiceCall] ICE connection state changed to: ...
```

**2. 检查麦克风权限**

```typescript
// 检查麦克风权限
navigator.mediaDevices.getUserMedia({ audio: true })
  .then((stream) => {
    console.log('麦克风权限已授权')
    stream.getTracks().forEach(track => track.stop())
  })
  .catch(err => {
    console.error('麦克风权限被拒绝:', err.name, err.message)
    // NotAllowedError - 用户拒绝
    // NotFoundError - 无麦克风设备
    // NotReadableError - 设备被占用
  })
```

**3. 检查 WebSocket 连接和频道订阅**

```typescript
// 确认 WebSocket 已连接
console.log('WebSocket 连接状态:', imStore.isConnected)

// 确认已订阅私有频道
// 查看控制台日志：[IM WebSocket] Authenticating channel: private-im.user.xxx
```

**4. 检查 ICE 候选收集**

```typescript
// 在 useVoiceCall.ts 中已有详细日志
// 查看控制台：
// [VoiceCall] ICE candidate: candidate:xxx
// [VoiceCall] ICE gathering state: complete
```

**5. 检查连接状态变化**

```typescript
// 正常的 ICE 状态变化流程：
// new -> checking -> connected/completed

// 如果卡在 checking 或变为 failed，说明 NAT 穿透失败
// 可能需要 TURN 服务器中继
```

#### 常见错误及解决方案

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| 麦克风权限被拒绝 | 用户拒绝或浏览器设置 | 引导用户在浏览器设置中允许麦克风 |
| ICE 连接失败 | 防火墙或 NAT 问题 | 确保 TURN 服务器可用 |
| 信令无法到达 | WebSocket 未连接或频道未订阅 | 检查 IM 连接状态 |
| 30秒超时 | 对方未接听或网络问题 | 检查双方网络连接 |
| 听不到声音 | 音频播放被浏览器阻止 | 需要用户交互后才能播放音频 |

#### 调试模式

```typescript
// 开启详细日志查看完整的信令和 ICE 流程
// 所有日志都带有 [VoiceCall] 或 [IM WebSocket] 前缀

// 检查信令数据格式
ws.on('voice.call.signal', (data) => {
  console.log('原始信令数据:', JSON.stringify(data, null, 2))
})
```

#### 强制使用 TURN 中继测试

```typescript
// 如果怀疑是 STUN 穿透问题，可以临时修改配置测试：
const rtcConfig: RTCConfiguration = {
  iceServers: [...],
  iceTransportPolicy: 'relay',  // 强制使用 TURN 中继
}
```

### 12.4 页面白屏

```bash
# 检查构建产物
ls -la dist/

# 检查 index.html 资源路径
cat dist/index.html | grep -E "(src|href)="

# 确保 base 配置正确
# vite.config.ts
export default defineConfig({
  base: '/',  // 或 '/your-subpath/'
})
```

---

## 文档变更记录

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-01-25 | v1.3 | 完善语音通话文档（10.2节），新增详细的 WebRTC 配置、使用方法、信令流程说明；扩展语音通话故障排查（12.3节） |
| 2026-01-25 | v1.2 | 新增 WebSocket 消息推送接收文档（第九章），完善环境变量和问题排查 |
| 2026-01-24 | v1.1 | 新增 IM 即时通讯模块技术文档 |
| 2026-01-20 | v1.0 | 初始版本，包含项目基础文档 |

---

*文档更新时间: 2026-01-25*

## 相关文档

- Vue 3: https://cn.vuejs.org/
- Vite: https://cn.vite.dev/
- Pinia: https://pinia.vuejs.org/zh/
- Vue Router: https://router.vuejs.org/zh/
- Vue I18n: https://vue-i18n.intlify.dev/
- Tailwind CSS: https://tailwindcss.com/docs
- Lucide Icons: https://lucide.dev/icons
- Axios: https://axios-http.com/
- Laravel Reverb: https://reverb.laravel.com/

## License

Private - All Rights Reserved
