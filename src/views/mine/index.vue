<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Settings,
  User,
  Flag,
  CalendarCheck,
  ChevronRight,
  MapPin,
  X,
  Mail,
  ReceiptText,
  Box,
  Gift,
  Landmark,
  Repeat,
  Banknote,
  HandCoins,
  ShieldPlus,
  PencilLine
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { customerProfile, vipReceiveState, vipReceiveWelfare } from '@/api/customer'
import { logout } from '@/api/auth'
import { toast } from '@/composables/useToast'
import type { CustomerProfile } from '@/types/customer.type'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const authStore = useAuthStore()

const loading = ref(true)
const profile = ref<CustomerProfile | null>(null)
const isReceivingWelfare = ref(false)
const memberVipReceiveState = ref(0) // 0: 没有领取资格, 1: 可以领取, 2: 已领取

// 设置抽屉状态
const showSettingDrawer = ref(false)
const isLoggingOut = ref(false)

// 6个快捷入口
const quickAccess = [
  { i18nKey: 'mine.quick.mail', href: '/mine/message' },
  { i18nKey: 'mine.setting.toolcase', href: '/mine/toolcase' },
  { i18nKey: 'mine.quick.challenge', href: '/mine/challenge' },
  { i18nKey: 'mine.quick.relief', href: '/mine/relief' },
  { i18nKey: 'mine.quick.salary', href: '/mine/salary' },
  { i18nKey: 'mine.quick.commission', href: '/mine/spread' }
]

// 设置菜单项
const settingItems = [
  { labelKey: 'mine.setting.mail', href: '/mine/message', icon: Mail },
  { labelKey: 'mine.setting.receipt-text', href: '/mine/receipt-text?from=drawer', icon: ReceiptText },
  { labelKey: 'mine.setting.profile', href: '/mine/profile', icon: User },
  { labelKey: 'mine.setting.toolcase', href: '/mine/toolcase', icon: Box },
  { labelKey: 'mine.setting.gift', href: '/mine/gift', icon: Gift },
  { labelKey: 'mine.setting.landmark', href: '/mine/customer-transfer', icon: Landmark },
  { labelKey: 'mine.setting.repeat', href: '/shop/record', icon: Repeat },
  { labelKey: 'mine.setting.salary', href: '/mine/salary', icon: Banknote },
  { labelKey: 'mine.setting.hand-coins', href: '/mine/hand-coins', icon: HandCoins },
  { labelKey: 'mine.setting.security-settings', href: '/mine/security-settings', icon: ShieldPlus },
  { labelKey: 'mine.setting.edit-nickname', href: '/mine/edit-nickname', icon: PencilLine },
  { labelKey: 'mine.setting.x', href: '', icon: X }
]

// 加载用户资料
const loadProfile = async () => {
  try {
    loading.value = true

    // 获取 VIP 领取状态
    const stateRes = await vipReceiveState()
    if (stateRes.code === 200) {
      memberVipReceiveState.value = stateRes.data.vip_receive_state
    }

    // 获取用户资料
    const res = await customerProfile()
    if (res.code === 200) {
      profile.value = res.data
    }
  } catch (error) {
    console.error('加载用户资料失败:', error)
  } finally {
    loading.value = false
  }
}

// VIP领取福利
const handleReceiveWelfare = async () => {
  if (isReceivingWelfare.value) return

  isReceivingWelfare.value = true
  try {
    const res = await vipReceiveWelfare()
    if (res.code === 200) {
      memberVipReceiveState.value = 2 // 标记已领取
      toast.success(res.message || '领取成功')
    } else {
      toast.error(res.message || '领取失败')
    }
  } catch (error) {
    toast.error('领取失败')
  } finally {
    isReceivingWelfare.value = false
  }
}

// 打开设置抽屉
const openSettingDrawer = () => {
  showSettingDrawer.value = true
  router.replace({ query: { ...route.query, drawer: 'setting' } })
}

// 关闭设置抽屉
const closeSettingDrawer = () => {
  showSettingDrawer.value = false
  const query = { ...route.query }
  delete query.drawer
  router.replace({ query })
}

// 处理设置菜单点击
const handleSettingClick = async (href: string) => {
  if (href === '') {
    // 退出登录
    await handleLogout()
  } else {
    closeSettingDrawer()
    router.push(href)
  }
}

// 退出登录
const handleLogout = async () => {
  if (isLoggingOut.value) return

  isLoggingOut.value = true
  try {
    await logout()
  } catch (e) {
    console.error('logout error', e)
  } finally {
    authStore.logout()
    closeSettingDrawer()
    router.replace('/auth/login')
  }
}

// 格式化数字
const formatNumber = (num: number | undefined) => {
  if (num === undefined) return '0'
  return new Intl.NumberFormat('zh-CN').format(num)
}

// 格式化时间
const formatTime = (timestamp: number | undefined) => {
  if (!timestamp) return ''
  return dayjs.unix(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  loadProfile()
  // 检查是否需要打开设置抽屉
  if (route.query.drawer === 'setting') {
    showSettingDrawer.value = true
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#f5f7fb] pb-16">
    <!-- 顶部账号栏 -->
    <header class="bg-red-600 px-3 text-white">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center space-x-2">
          <!-- 头像 -->
          <div class="h-10 w-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
            <template v-if="loading">
              <div class="h-full w-full bg-gray-200 animate-pulse"></div>
            </template>
            <template v-else-if="authStore.currentCustomer?.avatar_url">
              <img
                :src="authStore.currentCustomer.avatar_url"
                alt="avatar"
                class="h-full w-full object-cover"
              />
            </template>
            <template v-else>
              <User class="h-5 w-5 text-gray-400" />
            </template>
          </div>
          <!-- 昵称 & ID -->
          <div class="leading-tight font-medium">
            <div class="text-xs flex items-center">
              ID{{ authStore.currentCustomer?.id }}（{{ profile?.member_field?.nickname || '用户' }}）
              <img
                :src="`/mine/level/${authStore.currentCustomer?.level || 0}.png`"
                alt="level"
                class="w-[15px] h-[15px] ml-1"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
            </div>
            <div class="min-w-12 mt-1 inline-flex h-4 items-center rounded-full text-[10px] px-1 bg-[rgb(64,63,63)]">
              {{ profile?.customer?.gid_label || '' }}
            </div>
          </div>
        </div>

        <!-- 右上角设置图标 -->
        <div class="flex items-center space-x-3 text-xl cursor-pointer" @click="openSettingDrawer">
          <Settings class="w-6 h-6" />
        </div>
      </div>
    </header>

    <!-- 大 Banner -->
    <section class="mb-3">
      <div class="relative w-full h-32 overflow-hidden">
        <img
          src="/mine/slide/01.jpeg"
          alt="banner"
          class="w-full h-full object-cover"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
      </div>
    </section>

    <!-- 新人任务 / 签到 -->
    <section class="mt-2 grid grid-cols-2 gap-2 px-3">
      <button
        class="flex justify-center items-center h-10 rounded-md bg-[#ff3a00] font-medium text-white"
        @click="toast.info('新人任务即将上线')"
      >
        <span class="flex items-center gap-1 leading-none">
          <Flag :size="17" />
          {{ t('mine.btn-tasks') }}
        </span>
      </button>
      <router-link
        to="/mine/sign?tab=in"
        class="flex justify-center items-center h-10 rounded-md bg-[#ff3a00] font-medium text-white"
      >
        <span class="flex items-center gap-1 leading-none">
          <CalendarCheck :size="17" />
          {{ t('mine.btn-sign_in') }}
        </span>
      </router-link>
    </section>

    <!-- 六个功能入口 -->
    <section class="mt-2 grid grid-cols-3 gap-2 px-3">
      <router-link
        v-for="(item, index) in quickAccess"
        :key="index"
        :to="item.href"
        class="rounded-md bg-white py-3 text-center shadow-sm text-sm"
      >
        {{ t(item.i18nKey) }}
      </router-link>
    </section>

    <!-- 会员卡区域 -->
    <section class="mt-3 px-3">
      <div class="rounded-t-md border-b border-[#ff3a00] bg-white py-1 text-center text-[#ff3a00]">
        {{ t('mine.vip_title') }}
      </div>
      <div class="flex items-center justify-evenly rounded-b-md bg-gradient-to-r from-[#ff8e4a] to-[#ff3a00] px-4 py-3 text-center text-white min-h-20">
        <template v-if="loading">
          <div class="min-h-6 font-semibold">{{ t('common.loading') }}</div>
        </template>
        <template v-else>
          <div class="min-h-6 font-semibold">
            {{ (profile?.customer && profile.customer.vip > 0) ? profile.customer.vip_label : t('mine.vip_not_found') }}
          </div>
          <!-- 可以领取 -->
          <div v-if="memberVipReceiveState === 1" class="w-xs">
            <button
              :class="[
                'w-full h-11 rounded-full bg-white text-orange-500 font-medium shadow-md active:scale-95 transition px-4',
                isReceivingWelfare ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              ]"
              @click="handleReceiveWelfare"
              :disabled="isReceivingWelfare"
            >
              {{ isReceivingWelfare ? t('common.form.button.submitting') : t('mine.vip-btn-receive') }}
            </button>
          </div>
          <!-- 已领取 -->
          <div v-if="memberVipReceiveState === 2" class="w-xs">
            <button
              class="w-full h-11 rounded-full bg-white text-orange-500 font-medium shadow-md transition px-4 opacity-60 cursor-not-allowed"
              disabled
            >
              {{ t('mine.vip-btn-received') }}
            </button>
          </div>
        </template>
      </div>
    </section>

    <!-- 登陆时间和地点 -->
    <section class="mt-3 px-3">
      <div class="w-full rounded-lg border border-[#c7e6ff] bg-[#f4fbff] px-3 py-2 text-[12px] text-[#4b84b6] flex items-center min-h-9">
        <MapPin class="w-3 h-3 mr-1 text-[#4b84b6]" />
        <template v-if="loading">
          <span>{{ t('common.loading') }}</span>
        </template>
        <template v-else>
          <span v-if="authStore.currentCustomer">
            {{ t('mine.last-login-msg-1') }}
            {{ authStore.currentCustomer.last_login_address }}
            ({{ formatTime(authStore.currentCustomer.last_login_time) }})
            {{ t('mine.last-login-msg-2') }}
          </span>
        </template>
      </div>
    </section>

    <!-- 账户信息：金币 / 存款 / 生态值 -->
    <section class="mt-3 px-3">
      <div class="grid grid-cols-3 rounded-md bg-white py-2 text-center border border-gray-200">
        <router-link to="/mine/receipt-text" class="flex flex-col cursor-pointer">
          <div class="text-gray-500 text-sm">{{ t('mine.account-points') }}</div>
          <div class="flex items-center justify-center mt-1 text-[13px] font-semibold text-[#ff3a00]">
            <span>{{ formatNumber(profile?.member_capital?.points) }}</span>
            <img
              src="/ranking/coin.png"
              alt="gold"
              class="inline-block ml-1 w-[13px] h-[13px]"
            />
          </div>
        </router-link>
        <router-link to="/mine/customer-transfer" class="flex flex-col border-x border-gray-200 cursor-pointer">
          <div class="text-gray-500 text-sm">{{ t('mine.account-bank-points') }}</div>
          <div class="flex items-center justify-center mt-1 text-[13px] font-semibold text-[#ff3a00]">
            <span>{{ formatNumber(profile?.member_capital?.bankpoints) }}</span>
            <img
              src="/ranking/coin.png"
              alt="gold"
              class="inline-block ml-1 w-[13px] h-[13px]"
            />
          </div>
        </router-link>
        <div class="flex flex-col">
          <div class="text-gray-500 text-sm">{{ t('mine.account-experience') }}</div>
          <div class="mt-1 text-[13px] font-semibold text-gray-800">
            {{ profile?.member_capital?.experience || 0 }}
          </div>
        </div>
      </div>
    </section>

    <!-- 昨日亏损 + 今日首充返利 -->
    <section class="mt-3">
      <!-- 昨日亏损 -->
      <router-link
        to="/mine/rebate?tab=loss"
        class="mt-1 flex items-center justify-between bg-[#ff3a00] px-3 py-2 text-white cursor-pointer"
      >
        <span>{{ t('mine.yesterday_loss') }}</span>
        <span class="flex justify-center items-center text-sm">
          {{ t('mine.yesterday_loss_btn') }}
          <ChevronRight class="w-5 h-5" />
        </span>
      </router-link>

      <!-- 今日首充返利 -->
      <router-link
        to="/mine/rebate?tab=recharge"
        class="mt-2 flex items-center justify-between bg-[#ff3a00] px-3 py-2 text-white cursor-pointer"
      >
        <span>{{ t('mine.recharge_rebate') }}</span>
        <span class="flex justify-center items-center text-sm">
          {{ t('mine.recharge_rebate_btn') }}
          <ChevronRight class="w-5 h-5" />
        </span>
      </router-link>
    </section>
  </div>

  <!-- 设置抽屉 -->
  <Teleport to="body">
    <div
      v-if="showSettingDrawer"
      class="fixed inset-0 z-50"
    >
      <!-- 遮罩层 -->
      <div class="absolute inset-0 bg-black/40" @click="closeSettingDrawer"></div>

      <!-- 抽屉内容 -->
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-xl bg-white rounded-t-[10px] pb-[env(safe-area-inset-bottom)]">
        <div class="p-4 rounded-t-[10px]">
          <!-- Header -->
          <div class="relative flex items-center justify-center h-8">
            <span class="text-base font-medium text-gray-900">{{ t('mine.setting.title') }}</span>
            <button
              @click="closeSettingDrawer"
              class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
            >
              <X class="h-7 w-7" />
            </button>
          </div>

          <!-- Menu -->
          <div class="p-4">
            <div class="grid grid-cols-4 gap-2 text-center">
              <button
                v-for="item in settingItems"
                :key="item.labelKey"
                @click="handleSettingClick(item.href)"
                class="flex flex-col items-center justify-center gap-2 aspect-square rounded-lg border border-[#ebedf0] cursor-pointer bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div class="flex h-8 w-8 items-center justify-center text-gray-700">
                  <component :is="item.icon" class="h-7 w-7" />
                </div>
                <span class="text-xs text-gray-700 text-center leading-tight">
                  {{ t(item.labelKey) }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
