<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Home, Gamepad2, Trophy, ShoppingBag, User } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

// 点击反馈
const activeIndex = ref<number | null>(null)

// 导航项
const tabs = computed(() => [
  { name: t('tab.home'), href: '', icon: Home, auth: false },
  { name: t('tab.shop'), href: 'shop', icon: ShoppingBag, auth: true },
  { name: t('tab.games'), href: 'games', icon: Gamepad2, auth: true },
  { name: t('tab.ranking'), href: 'ranking', icon: Trophy, auth: true },
  { name: t('tab.mine'), href: 'mine', icon: User, auth: true }
])

// 判断是否激活
const isActive = (href: string) => {
  const path = route.path
  if (href === '') return path === '/' || path === ''
  return path.startsWith(`/${href}`)
}

// 获取当前激活的索引
const currentActiveIndex = computed(() => {
  return tabs.value.findIndex(tab => isActive(tab.href))
})

// 导航处理
const handleNavigate = (tab: { href: string; auth: boolean }, index: number) => {
  // 触发点击动画
  activeIndex.value = index
  setTimeout(() => {
    activeIndex.value = null
  }, 150)

  let path = `/${tab.href}`
  if (tab.auth && !authStore.isLogin) {
    path = '/auth/login'
  }
  router.push(path)
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg shadow-[0_-2px_20px_rgba(0,0,0,0.08)] tab-bar-nav">
    <!-- 滑动指示器 -->
    <div
      class="absolute top-0 h-0.5 bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] transition-all duration-300 ease-out rounded-full"
      :style="{
        width: `${100 / tabs.length}%`,
        left: `${(currentActiveIndex * 100) / tabs.length}%`
      }"
    />

    <ul class="flex h-14 items-center justify-around relative">
      <li
        v-for="(tab, index) in tabs"
        :key="tab.href"
        class="flex-1"
      >
        <button
          @click="handleNavigate(tab, index)"
          :class="[
            'relative flex w-full flex-col items-center justify-center py-1 transition-all duration-200',
            activeIndex === index ? 'scale-90' : 'scale-100'
          ]"
        >
          <!-- 背景高亮 -->
          <div
            :class="[
              'absolute inset-x-2 inset-y-0 rounded-xl transition-all duration-300',
              isActive(tab.href) ? 'bg-red-50' : 'bg-transparent'
            ]"
          />

          <!-- 图标 -->
          <div class="relative z-10">
            <component
              :is="tab.icon"
              :class="[
                'h-5 w-5 transition-all duration-300',
                isActive(tab.href)
                  ? 'text-red-600 scale-110'
                  : 'text-gray-400'
              ]"
            />
            <!-- 激活时的光晕效果 -->
            <div
              v-if="isActive(tab.href)"
              class="absolute -inset-1 bg-red-500/20 rounded-full blur-md -z-10"
            />
          </div>

          <!-- 文字 -->
          <span
            :class="[
              'relative z-10 text-[10px] mt-1 font-medium transition-all duration-300',
              isActive(tab.href)
                ? 'text-red-600'
                : 'text-gray-400'
            ]"
          >
            {{ tab.name }}
          </span>
        </button>
      </li>
    </ul>
  </nav>
</template>
