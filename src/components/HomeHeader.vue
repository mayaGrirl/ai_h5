<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { Globe, Bell } from 'lucide-vue-next'
import { LOCALES, type Locale } from '@/i18n'

const router = useRouter()
const { locale: currentLocale } = useI18n()
const authStore = useAuthStore()

// 语言名称映射
const localeNames: Record<Locale, string> = {
  zh: '中文',
  en: 'EN',
  fr: 'FR'
}

// 切换语言
const switchLanguage = () => {
  const currentIndex = LOCALES.indexOf(currentLocale.value as Locale)
  const nextIndex = (currentIndex + 1) % LOCALES.length
  const nextLocale = LOCALES[nextIndex]

  // 更新 i18n locale
  currentLocale.value = nextLocale
}

// 跳转消息页
const goToMessages = () => {
  if (authStore.isLogin) {
    router.push('/mine/message')
  } else {
    router.push('/auth/login')
  }
}
</script>

<template>
  <header class="sticky top-0 z-40 flex h-12 items-center justify-between bg-gradient-to-r from-red-600 to-red-500 px-4">
    <!-- Logo & 名称 -->
    <div class="flex items-center gap-2">
      <img src="/login-logo.png" alt="Logo" class="h-8 w-8 rounded-lg" />
      <span class="font-bold text-white">顶峰28</span>
    </div>

    <!-- 右侧操作 -->
    <div class="flex items-center gap-3">
      <!-- 语言切换 -->
      <button
        @click="switchLanguage"
        class="flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-xs text-white"
      >
        <Globe class="h-3.5 w-3.5" />
        <span>{{ localeNames[currentLocale as Locale] }}</span>
      </button>

      <!-- 消息 -->
      <button @click="goToMessages" class="relative text-white">
        <Bell class="h-5 w-5" />
      </button>
    </div>
  </header>
</template>
