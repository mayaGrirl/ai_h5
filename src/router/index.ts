import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { NOT_LOGIN_WHITELIST } from '@/constants'

// 布局组件
const MainLayout = () => import('@/layouts/MainLayout.vue')
const AuthLayout = () => import('@/layouts/AuthLayout.vue')
const GamesLayout = () => import('@/layouts/GamesLayout.vue')

// 路由配置
const routes: RouteRecordRaw[] = [
  // 有底部导航的页面（MainLayout）
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/home/index.vue'),
        meta: { title: 'home', requiresAuth: false }
      },
      {
        path: 'index/announce',
        name: 'Announcements',
        component: () => import('@/views/index/announce/index.vue'),
        meta: { title: 'announce', requiresAuth: false }
      },
      {
        path: 'index/announce/:id',
        name: 'AnnouncementDetail',
        component: () => import('@/views/index/announce/detail.vue'),
        meta: { title: 'announce-detail', requiresAuth: false }
      },
      {
        path: 'index/activities',
        name: 'Activities',
        component: () => import('@/views/index/activities/index.vue'),
        meta: { title: 'activities', requiresAuth: false }
      },
      {
        path: 'index/activities/:id',
        name: 'ActivityDetail',
        component: () => import('@/views/index/activities/detail.vue'),
        meta: { title: 'activity-detail', requiresAuth: false }
      },
      {
        path: 'index/partners',
        name: 'Partners',
        component: () => import('@/views/index/partners/index.vue'),
        meta: { title: 'partners', requiresAuth: false }
      },
      // 排行榜
      {
        path: 'ranking',
        name: 'Ranking',
        component: () => import('@/views/ranking/index.vue'),
        meta: { title: 'ranking', requiresAuth: true }
      },
      {
        path: 'ranking/today',
        name: 'RankingToday',
        component: () => import('@/views/ranking/today.vue'),
        meta: { title: 'ranking-today', requiresAuth: true }
      },
      {
        path: 'ranking/yesterday',
        name: 'RankingYesterday',
        component: () => import('@/views/ranking/yesterday.vue'),
        meta: { title: 'ranking-yesterday', requiresAuth: true }
      },
      {
        path: 'ranking/last-week',
        name: 'RankingLastWeek',
        component: () => import('@/views/ranking/last-week.vue'),
        meta: { title: 'ranking-last-week', requiresAuth: true }
      },
      {
        path: 'ranking/activity',
        name: 'RankingActivity',
        component: () => import('@/views/ranking/activity/index.vue'),
        meta: { title: 'ranking-activity', requiresAuth: true }
      },
      // 商城
      {
        path: 'shop',
        name: 'Shop',
        component: () => import('@/views/shop/index.vue'),
        meta: { title: 'shop', requiresAuth: true }
      },
      {
        path: 'shop/record',
        name: 'ShopRecord',
        component: () => import('@/views/shop/record.vue'),
        meta: { title: 'shop-record', requiresAuth: true }
      },
      // 我的
      {
        path: 'mine',
        name: 'Mine',
        component: () => import('@/views/mine/index.vue'),
        meta: { title: 'mine', requiresAuth: true }
      },
      {
        path: 'mine/profile',
        name: 'Profile',
        component: () => import('@/views/mine/profile/index.vue'),
        meta: { title: 'profile', requiresAuth: true }
      },
      {
        path: 'mine/edit-nickname',
        name: 'EditNickname',
        component: () => import('@/views/mine/profile/edit-nickname.vue'),
        meta: { title: 'edit-nickname', requiresAuth: true }
      },
      {
        path: 'mine/bind-email',
        name: 'BindEmail',
        component: () => import('@/views/mine/profile/bind-email.vue'),
        meta: { title: 'bind-email', requiresAuth: true }
      },
      {
        path: 'mine/security-settings',
        name: 'SecuritySettings',
        component: () => import('@/views/mine/security/index.vue'),
        meta: { title: 'security-settings', requiresAuth: true }
      },
      {
        path: 'mine/security-settings/login-password',
        name: 'LoginPassword',
        component: () => import('@/views/mine/security/login-password.vue'),
        meta: { title: 'login-password', requiresAuth: true }
      },
      {
        path: 'mine/security-settings/pay-password',
        name: 'PayPassword',
        component: () => import('@/views/mine/security/pay-password.vue'),
        meta: { title: 'pay-password', requiresAuth: true }
      },
      {
        path: 'mine/salary',
        name: 'Salary',
        component: () => import('@/views/mine/salary/index.vue'),
        meta: { title: 'salary', requiresAuth: true }
      },
      {
        path: 'mine/sign',
        name: 'SignIn',
        component: () => import('@/views/mine/sign/index.vue'),
        meta: { title: 'sign', requiresAuth: true }
      },
      {
        path: 'mine/spread',
        name: 'Spread',
        component: () => import('@/views/mine/spread/index.vue'),
        meta: { title: 'spread', requiresAuth: true }
      },
      {
        path: 'mine/rebate',
        name: 'Rebate',
        component: () => import('@/views/mine/rebate/index.vue'),
        meta: { title: 'rebate', requiresAuth: true }
      },
      {
        path: 'mine/relief',
        name: 'Relief',
        component: () => import('@/views/mine/relief/index.vue'),
        meta: { title: 'relief', requiresAuth: true }
      },
      {
        path: 'mine/toolcase',
        name: 'Toolcase',
        component: () => import('@/views/mine/toolcase/index.vue'),
        meta: { title: 'toolcase', requiresAuth: true }
      },
      {
        path: 'mine/gift',
        name: 'Gift',
        component: () => import('@/views/mine/gift/index.vue'),
        meta: { title: 'gift', requiresAuth: true }
      },
      {
        path: 'mine/transfer',
        name: 'Transfer',
        component: () => import('@/views/mine/transfer/index.vue'),
        meta: { title: 'transfer', requiresAuth: true }
      },
      {
        path: 'mine/capital-record',
        name: 'CapitalRecord',
        component: () => import('@/views/mine/capital-record/index.vue'),
        meta: { title: 'capital-record', requiresAuth: true }
      },
      {
        path: 'mine/message',
        name: 'Message',
        component: () => import('@/views/mine/message/index.vue'),
        meta: { title: 'message', requiresAuth: true }
      },
      {
        path: 'mine/challenge',
        name: 'Challenge',
        component: () => import('@/views/mine/challenge/index.vue'),
        meta: { title: 'challenge', requiresAuth: true }
      },
      {
        path: 'mine/customer-transfer',
        name: 'CustomerTransfer',
        component: () => import('@/views/mine/customer-transfer/index.vue'),
        meta: { title: 'customer-transfer', requiresAuth: true }
      },
      {
        path: 'mine/hand-coins',
        name: 'HandCoins',
        component: () => import('@/views/mine/hand-coins/index.vue'),
        meta: { title: 'hand-coins', requiresAuth: true }
      },
      {
        path: 'mine/message-circle-more',
        name: 'MessageCircleMore',
        component: () => import('@/views/mine/message-circle-more/index.vue'),
        meta: { title: 'message-circle-more', requiresAuth: true }
      },
      {
        path: 'mine/repeat',
        name: 'Repeat',
        component: () => import('@/views/mine/repeat/index.vue'),
        meta: { title: 'repeat', requiresAuth: true }
      },
      {
        path: 'mine/rebate/loss',
        name: 'RebateLoss',
        component: () => import('@/views/mine/rebate/loss/index.vue'),
        meta: { title: 'rebate-loss', requiresAuth: true }
      },
      {
        path: 'mine/rebate/recharge',
        name: 'RebateRecharge',
        component: () => import('@/views/mine/rebate/recharge/index.vue'),
        meta: { title: 'rebate-recharge', requiresAuth: true }
      },
      {
        path: 'mine/receipt-text',
        name: 'ReceiptText',
        component: () => import('@/views/mine/receipt-text/index.vue'),
        meta: { title: 'receipt-text', requiresAuth: true }
      },
      {
        path: 'mine/salary/intro',
        name: 'SalaryIntro',
        component: () => import('@/views/mine/salary/intro/index.vue'),
        meta: { title: 'salary-intro', requiresAuth: true }
      },
      {
        path: 'mine/salary/receive',
        name: 'SalaryReceive',
        component: () => import('@/views/mine/salary/receive/index.vue'),
        meta: { title: 'salary-receive', requiresAuth: true }
      },
      {
        path: 'mine/salary/record',
        name: 'SalaryRecord',
        component: () => import('@/views/mine/salary/record/index.vue'),
        meta: { title: 'salary-record', requiresAuth: true }
      },
      {
        path: 'mine/security-settings/card',
        name: 'SecurityCard',
        component: () => import('@/views/mine/security-settings/card/index.vue'),
        meta: { title: 'security-card', requiresAuth: true }
      },
      {
        path: 'mine/security-settings/login-address',
        name: 'SecurityLoginAddress',
        component: () => import('@/views/mine/security-settings/login-address/index.vue'),
        meta: { title: 'security-login-address', requiresAuth: true }
      },
      {
        path: 'mine/security-settings/login-sms',
        name: 'SecurityLoginSms',
        component: () => import('@/views/mine/security-settings/login-sms/index.vue'),
        meta: { title: 'security-login-sms', requiresAuth: true }
      },
      {
        path: 'mine/security-settings/question',
        name: 'SecurityQuestion',
        component: () => import('@/views/mine/security-settings/question/index.vue'),
        meta: { title: 'security-question', requiresAuth: true }
      },
      {
        path: 'mine/security-settings/redeem',
        name: 'SecurityRedeem',
        component: () => import('@/views/mine/security-settings/redeem/index.vue'),
        meta: { title: 'security-redeem', requiresAuth: true }
      },
      {
        path: 'mine/sign/in',
        name: 'SignInPage',
        component: () => import('@/views/mine/sign/in/index.vue'),
        meta: { title: 'sign-in', requiresAuth: true }
      },
      {
        path: 'mine/sign/intro',
        name: 'SignIntro',
        component: () => import('@/views/mine/sign/intro/index.vue'),
        meta: { title: 'sign-intro', requiresAuth: true }
      },
      {
        path: 'mine/sign/record',
        name: 'SignRecord',
        component: () => import('@/views/mine/sign/record/index.vue'),
        meta: { title: 'sign-record', requiresAuth: true }
      },
      {
        path: 'mine/spread/intro',
        name: 'SpreadIntro',
        component: () => import('@/views/mine/spread/intro/index.vue'),
        meta: { title: 'spread-intro', requiresAuth: true }
      },
      {
        path: 'mine/spread/promotion',
        name: 'SpreadPromotion',
        component: () => import('@/views/mine/spread/promotion/index.vue'),
        meta: { title: 'spread-promotion', requiresAuth: true }
      },
      {
        path: 'mine/spread/record',
        name: 'SpreadRecord',
        component: () => import('@/views/mine/spread/record/index.vue'),
        meta: { title: 'spread-record', requiresAuth: true }
      },
      {
        path: 'mine/toolcase/record',
        name: 'ToolcaseRecord',
        component: () => import('@/views/mine/toolcase/record/index.vue'),
        meta: { title: 'toolcase-record', requiresAuth: true }
      },
      // 代理
      {
        path: 'agent',
        name: 'Agent',
        component: () => import('@/views/agent/index.vue'),
        meta: { title: 'agent', requiresAuth: true }
      },
      {
        path: 'agent/profile',
        name: 'AgentProfile',
        component: () => import('@/views/agent/profile.vue'),
        meta: { title: 'agent-profile', requiresAuth: true }
      },
      {
        path: 'agent/recharge',
        name: 'AgentRecharge',
        component: () => import('@/views/agent/recharge.vue'),
        meta: { title: 'agent-recharge', requiresAuth: true }
      },
      {
        path: 'agent/recycle',
        name: 'AgentRecycle',
        component: () => import('@/views/agent/recycle.vue'),
        meta: { title: 'agent-recycle', requiresAuth: true }
      },
      {
        path: 'agent/conversion',
        name: 'AgentConversion',
        component: () => import('@/views/agent/conversion.vue'),
        meta: { title: 'agent-conversion', requiresAuth: true }
      },
      {
        path: 'agent/log',
        name: 'AgentLog',
        component: () => import('@/views/agent/log.vue'),
        meta: { title: 'agent-log', requiresAuth: true }
      },
      {
        path: 'agent/stat',
        name: 'AgentStat',
        component: () => import('@/views/agent/stat.vue'),
        meta: { title: 'agent-stat', requiresAuth: true }
      },
      {
        path: 'agent/recharge/record',
        name: 'AgentRechargeRecord',
        component: () => import('@/views/agent/recharge/record/index.vue'),
        meta: { title: 'agent-recharge-record', requiresAuth: true }
      },
      {
        path: 'agent/recycle/record',
        name: 'AgentRecycleRecord',
        component: () => import('@/views/agent/recycle/record/index.vue'),
        meta: { title: 'agent-recycle-record', requiresAuth: true }
      }
    ]
  },
  // 游戏页面（使用 GamesLayout）
  {
    path: '/games',
    component: GamesLayout,
    children: [
      {
        path: '',
        name: 'Games',
        component: () => import('@/views/games/index.vue'),
        meta: { title: 'games', requiresAuth: true }
      },
      {
        path: 'play',
        name: 'GamePlay',
        component: () => import('@/views/games/play.vue'),
        meta: { title: 'game-play', requiresAuth: true }
      },
      {
        path: 'open',
        name: 'GameOpen',
        component: () => import('@/views/games/open.vue'),
        meta: { title: 'game-open', requiresAuth: true }
      },
      {
        path: 'record',
        name: 'GameRecord',
        component: () => import('@/views/games/record.vue'),
        meta: { title: 'game-record', requiresAuth: true }
      },
      {
        path: 'rules',
        name: 'GameRules',
        component: () => import('@/views/games/rules.vue'),
        meta: { title: 'game-rules', requiresAuth: true }
      },
      {
        path: 'trend',
        name: 'GameTrend',
        component: () => import('@/views/games/trend.vue'),
        meta: { title: 'game-trend', requiresAuth: true }
      },
      {
        path: 'stat',
        name: 'GameStat',
        component: () => import('@/views/games/stat.vue'),
        meta: { title: 'game-stat', requiresAuth: true }
      },
      {
        path: 'mode',
        name: 'GameMode',
        component: () => import('@/views/games/mode.vue'),
        meta: { title: 'game-mode', requiresAuth: true }
      },
      {
        path: 'mode/edit',
        name: 'GameModeEdit',
        component: () => import('@/views/games/mode/edit.vue'),
        meta: { title: 'game-mode-edit', requiresAuth: true }
      },
      {
        path: 'auto',
        name: 'GameAuto',
        component: () => import('@/views/games/auto.vue'),
        meta: { title: 'game-auto', requiresAuth: true }
      }
    ]
  },
  // 认证页面（无底部导航）
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/auth/login.vue'),
        meta: { title: 'login', requiresAuth: false }
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/views/auth/register.vue'),
        meta: { title: 'register', requiresAuth: false }
      },
      {
        path: 'forgot-password',
        name: 'ForgotPassword',
        component: () => import('@/views/auth/forgot-password.vue'),
        meta: { title: 'forgot-password', requiresAuth: false }
      }
    ]
  },
  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  // 检查是否需要登录
  const requiresAuth = to.meta.requiresAuth !== false
  const isWhitelisted = NOT_LOGIN_WHITELIST.some(path => to.path.includes(path))

  if (requiresAuth && !isWhitelisted && !authStore.isLogin) {
    // 未登录，重定向到登录页
    next({
      path: '/auth/login',
      query: { redirect: to.fullPath }
    })
  } else {
    next()
  }
})

export default router
