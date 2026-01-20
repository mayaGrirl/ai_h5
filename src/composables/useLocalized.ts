import { useI18n } from 'vue-i18n'
import { getLocalizedValue, type LangField } from '@/utils'

/**
 * 多语言字段处理 composable
 * 用于处理后台接口返回的 lang_ 开头的多语言字段
 *
 * @example
 * ```vue
 * <script setup>
 * import { useLocalized } from '@/composables/useLocalized'
 *
 * const { localize } = useLocalized()
 *
 * // 在模板或计算属性中使用
 * const title = computed(() => localize(item.lang_title, item.title))
 * </script>
 *
 * <template>
 *   <div>{{ localize(item.lang_name, item.name) }}</div>
 * </template>
 * ```
 */
export function useLocalized() {
  const { locale } = useI18n()

  /**
   * 获取多语言字段的本地化值
   * 优先使用 lang_ 字段中当前语言的值，如果没有则使用默认值
   *
   * @param langField - 多语言字段值 (如 lang_title, lang_name)
   * @param fallback - 默认值 (如 title, name)
   * @returns 本地化后的字符串
   */
  const localize = (langField: LangField, fallback: string): string => {
    return getLocalizedValue(langField, fallback, locale.value)
  }

  return {
    localize,
    locale
  }
}
