<script setup lang="ts">
import { ref } from 'vue'
import emblaCarouselVue from 'embla-carousel-vue'
import Autoplay from 'embla-carousel-autoplay'
import { useLocalized } from '@/composables/useLocalized'
import type { IndexDataItem } from '@/types/index.type'

interface Props {
  banners: IndexDataItem[]
  imageBaseUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  imageBaseUrl: ''
})

const { localize } = useLocalized()

const [emblaRef] = emblaCarouselVue(
  { loop: true },
  [Autoplay({ delay: 3000, stopOnInteraction: false })]
)

const currentIndex = ref(0)

const getImageUrl = (url: string) => {
  if (!url) return ''
  if (url.startsWith('http')) return url
  return `${props.imageBaseUrl}${url}`
}
</script>

<template>
  <div v-if="banners.length > 0" class="relative">
    <div ref="emblaRef" class="overflow-hidden">
      <div class="flex">
        <div
          v-for="(banner, index) in banners"
          :key="banner.id || index"
          class="relative min-w-0 flex-[0_0_100%]"
        >
          <img
            :src="getImageUrl(banner.pic || '')"
            :alt="localize(banner.lang_title as Record<string, string> | null, banner.title)"
            class="h-40 w-full object-cover"
            @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'"
          />
        </div>
      </div>
    </div>

    <!-- 指示器 -->
    <div v-if="banners.length > 1" class="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
      <span
        v-for="(_, index) in banners"
        :key="index"
        class="h-1.5 w-1.5 rounded-full transition-colors"
        :class="index === currentIndex ? 'bg-white' : 'bg-white/50'"
      />
    </div>
  </div>

  <!-- 无图片占位 -->
  <div v-else class="flex h-40 items-center justify-center bg-gradient-to-r from-red-500 to-red-600">
    <span class="text-lg font-bold text-white">顶峰28</span>
  </div>
</template>
