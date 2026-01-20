<script setup lang="ts">
interface Props {
  hoverable?: boolean
  clickable?: boolean
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

withDefaults(defineProps<Props>(), {
  hoverable: true,
  clickable: false,
  shadow: 'sm',
  padding: 'md',
  rounded: 'lg'
})

const emit = defineEmits<{
  (e: 'click'): void
}>()

const shadowClasses = {
  none: '',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg'
}

const paddingClasses = {
  none: '',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6'
}

const roundedClasses = {
  none: '',
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl'
}
</script>

<template>
  <div
    @click="clickable && emit('click')"
    :class="[
      'bg-white transition-all duration-200',
      shadowClasses[shadow],
      paddingClasses[padding],
      roundedClasses[rounded],
      hoverable && 'hover:shadow-lg hover:-translate-y-0.5',
      clickable && 'cursor-pointer active:scale-[0.98] active:shadow-sm'
    ]"
  >
    <slot />
  </div>
</template>
