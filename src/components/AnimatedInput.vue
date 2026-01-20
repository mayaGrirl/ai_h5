<script setup lang="ts">
import { ref, computed } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'

interface Props {
  modelValue: string
  type?: 'text' | 'password' | 'email' | 'number' | 'tel'
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  required?: boolean
  showPasswordToggle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  required: false,
  showPasswordToggle: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'focus'): void
  (e: 'blur'): void
}>()

const isFocused = ref(false)
const showPassword = ref(false)

const inputType = computed(() => {
  if (props.type === 'password' && showPassword.value) {
    return 'text'
  }
  return props.type
})

const hasValue = computed(() => props.modelValue && props.modelValue.length > 0)

const handleInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

const handleFocus = () => {
  isFocused.value = true
  emit('focus')
}

const handleBlur = () => {
  isFocused.value = false
  emit('blur')
}
</script>

<template>
  <div class="animated-input-wrapper">
    <div
      :class="[
        'relative rounded-lg border-2 transition-all duration-200',
        isFocused
          ? 'border-red-500 shadow-lg shadow-red-500/10'
          : error
            ? 'border-red-300'
            : 'border-gray-200 hover:border-gray-300',
        disabled ? 'bg-gray-50 opacity-60' : 'bg-white'
      ]"
    >
      <!-- 浮动标签 -->
      <label
        v-if="label"
        :class="[
          'absolute left-3 transition-all duration-200 pointer-events-none',
          (isFocused || hasValue)
            ? 'top-1 text-xs'
            : 'top-1/2 -translate-y-1/2 text-sm',
          isFocused
            ? 'text-red-500'
            : error
              ? 'text-red-400'
              : 'text-gray-400'
        ]"
      >
        {{ label }}
        <span v-if="required" class="text-red-500">*</span>
      </label>

      <!-- 输入框 -->
      <input
        :type="inputType"
        :value="modelValue"
        :placeholder="isFocused || !label ? placeholder : ''"
        :disabled="disabled"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        :class="[
          'w-full bg-transparent outline-none transition-all duration-200',
          'text-gray-800 placeholder-gray-400',
          label ? 'pt-5 pb-2 px-3' : 'py-3 px-3',
          (type === 'password' && showPasswordToggle) ? 'pr-10' : ''
        ]"
      />

      <!-- 密码显示切换 -->
      <button
        v-if="type === 'password' && showPasswordToggle"
        type="button"
        tabindex="-1"
        @click="showPassword = !showPassword"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Eye v-if="showPassword" :size="18" />
        <EyeOff v-else :size="18" />
      </button>

      <!-- 聚焦时的底部高亮线 -->
      <div
        :class="[
          'absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-red-500 transition-all duration-300 rounded-full',
          isFocused ? 'w-full opacity-100' : 'w-0 opacity-0'
        ]"
      />
    </div>

    <!-- 错误提示 -->
    <Transition name="slide-up">
      <p v-if="error" class="mt-1 text-xs text-red-500 flex items-center gap-1">
        <span class="inline-block w-1 h-1 rounded-full bg-red-500" />
        {{ error }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
