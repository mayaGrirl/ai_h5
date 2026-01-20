<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { ChevronRight } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'

const { t } = useI18n()
const authStore = useAuthStore()

// 菜单项
const accountItems = [
  { labelKey: 'mine.security-settings.group-account.login', path: '/mine/security-settings/login-password' },
  { labelKey: 'mine.security-settings.group-account.address', path: '/mine/security-settings/login-address' },
  { labelKey: 'mine.security-settings.group-account.sms', path: '/mine/security-settings/login-sms' }
]

const payItems = [
  { labelKey: 'mine.security-settings.group-pay.pay', path: '/mine/security-settings/pay-password' },
  { labelKey: 'mine.security-settings.group-pay.security', path: '/mine/security-settings/question', showIf: () => !authStore.currentCustomer?.securitypass }
]

const otherItems = [
  { labelKey: 'mine.security-settings.group-other.redeem', path: '/mine/security-settings/redeem' },
  { labelKey: 'mine.security-settings.group-other.card', path: '/mine/security-settings/card' }
]
</script>

<template>
  <div class="flex min-h-screen justify-center bg-[#eef3f8]">
    <div class="w-full max-w-xl bg-[#f5f7fb] shadow-sm">
      <PageHeader :title="t('mine.setting.security-settings')" />

      <div class="min-h-screen bg-gray-100">
        <main class="px-4 pt-4 space-y-6">
          <!-- 账户安全 -->
          <section>
            <div class="flex items-center text-sm text-gray-600 mb-2">
              <span class="w-1 h-4 bg-red-600 rounded mr-2"></span>
              {{ t('mine.security-settings.group-account.title') }}
            </div>
            <div class="space-y-3">
              <router-link
                v-for="item in accountItems"
                :key="item.path"
                :to="item.path"
                class="flex items-center justify-between bg-white rounded-xl px-4 py-4 shadow-sm cursor-pointer"
              >
                <span class="text-gray-800 text-sm">{{ t(item.labelKey) }}</span>
                <span class="text-red-600 text-lg"><ChevronRight /></span>
              </router-link>
            </div>
          </section>

          <!-- 支付安全 -->
          <section>
            <div class="flex items-center text-sm text-gray-600 mb-2">
              <span class="w-1 h-4 bg-red-600 rounded mr-2"></span>
              {{ t('mine.security-settings.group-pay.title') }}
            </div>
            <div class="space-y-3">
              <template v-for="item in payItems" :key="item.path">
                <router-link
                  v-if="!item.showIf || item.showIf()"
                  :to="item.path"
                  class="flex items-center justify-between bg-white rounded-xl px-4 py-4 shadow-sm cursor-pointer"
                >
                  <span class="text-gray-800 text-sm">{{ t(item.labelKey) }}</span>
                  <span class="text-red-600 text-lg"><ChevronRight /></span>
                </router-link>
              </template>
            </div>
          </section>

          <!-- 其他权限验证 -->
          <section>
            <div class="flex items-center text-sm text-gray-600 mb-2">
              <span class="w-1 h-4 bg-red-600 rounded mr-2"></span>
              {{ t('mine.security-settings.group-other.title') }}
            </div>
            <div class="space-y-3">
              <router-link
                v-for="item in otherItems"
                :key="item.path"
                :to="item.path"
                class="flex items-center justify-between bg-white rounded-xl px-4 py-4 shadow-sm cursor-pointer"
              >
                <span class="text-gray-800 text-sm">{{ t(item.labelKey) }}</span>
                <span class="text-red-600 text-lg"><ChevronRight /></span>
              </router-link>
            </div>
          </section>
        </main>
      </div>

      <div class="h-14"></div>
    </div>
  </div>
</template>
