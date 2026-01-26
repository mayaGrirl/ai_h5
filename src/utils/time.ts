/**
 * 时间处理工具
 * 优先使用浏览器本地时间显示，如果获取不到则显示服务器时间
 */
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'

// 配置 dayjs
dayjs.locale('zh-cn')
dayjs.extend(relativeTime)

/**
 * 解析时间字符串为 dayjs 对象
 * 支持多种格式：ISO 8601、MySQL datetime、时间戳等
 * @param dateStr - 时间字符串、Date 对象或时间戳
 * @returns dayjs 对象
 */
export function parseTime(dateStr: string | Date | number): dayjs.Dayjs {
  if (!dateStr) {
    return dayjs()
  }

  // 如果是数字（时间戳）
  if (typeof dateStr === 'number') {
    // 判断是秒级还是毫秒级时间戳
    return dayjs(dateStr < 1e12 ? dateStr * 1000 : dateStr)
  }

  // 如果是 Date 对象
  if (dateStr instanceof Date) {
    return dayjs(dateStr)
  }

  // 字符串处理
  let normalized = dateStr.trim()

  // 处理 MySQL datetime 格式 "2024-01-25 10:30:00"
  // 如果没有时区信息，假设为服务器时区（UTC+8）
  if (normalized.includes(' ') && !normalized.includes('T')) {
    normalized = normalized.replace(' ', 'T')
  }

  // 如果没有时区信息，添加 +08:00
  if (!normalized.includes('Z') && !normalized.includes('+') && !/\d{2}:\d{2}:\d{2}-\d{2}/.test(normalized)) {
    // 检查是否已经有时区偏移（如 -05:00）
    if (!/[+-]\d{2}:\d{2}$/.test(normalized)) {
      normalized += '+08:00'
    }
  }

  return dayjs(normalized)
}

/**
 * 检查是否可以获取浏览器本地时间
 */
function canGetLocalTime(): boolean {
  try {
    const now = new Date()
    return !isNaN(now.getTime())
  } catch {
    return false
  }
}

/**
 * 格式化时间
 * @param dateStr - 时间字符串
 * @param format - 格式类型或自定义格式字符串
 * @returns 格式化后的时间字符串
 */
export function formatTime(
  dateStr: string | Date | number,
  format: 'time' | 'date' | 'datetime' | 'relative' | string = 'datetime'
): string {
  if (!dateStr) return ''

  try {
    const date = parseTime(dateStr)

    if (!date.isValid()) {
      return typeof dateStr === 'string' ? dateStr : ''
    }

    if (!canGetLocalTime()) {
      return typeof dateStr === 'string' ? dateStr : date.toISOString()
    }

    switch (format) {
      case 'time':
        return date.format('HH:mm')

      case 'date':
        return date.format('YYYY-MM-DD')

      case 'datetime':
        return date.format('YYYY-MM-DD HH:mm')

      case 'relative':
        return formatRelativeTime(date)

      default:
        // 自定义格式
        return date.format(format)
    }
  } catch {
    return typeof dateStr === 'string' ? dateStr : ''
  }
}

/**
 * 格式化消息时间（仅时:分）
 * @param dateStr - 时间字符串
 * @returns 格式化后的时间字符串
 */
export function formatMessageTime(dateStr: string | Date | number): string {
  return formatTime(dateStr, 'time')
}

/**
 * 格式化日期（年-月-日）
 * @param dateStr - 时间字符串
 * @returns 格式化后的日期字符串
 */
export function formatDate(dateStr: string | Date | number): string {
  return formatTime(dateStr, 'date')
}

/**
 * 格式化完整日期时间
 * @param dateStr - 时间字符串
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(dateStr: string | Date | number): string {
  return formatTime(dateStr, 'datetime')
}

/**
 * 格式化完整日期时间（含秒）
 * @param dateStr - 时间字符串
 * @returns 格式化后的日期时间字符串
 */
export function formatFullDateTime(dateStr: string | Date | number): string {
  return formatTime(dateStr, 'YYYY-MM-DD HH:mm:ss')
}

/**
 * 格式化相对时间（刚刚、5分钟前、昨天等）
 * @param date - dayjs 对象
 * @returns 相对时间字符串
 */
export function formatRelativeTime(date: dayjs.Dayjs): string {
  const now = dayjs()
  const diffSeconds = now.diff(date, 'second')
  const diffMinutes = now.diff(date, 'minute')
  const diffHours = now.diff(date, 'hour')
  const diffDays = now.diff(date, 'day')

  if (diffSeconds < 60) {
    return '刚刚'
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`
  }

  if (diffHours < 24) {
    return `${diffHours}小时前`
  }

  // 检查是否是昨天
  if (date.isSame(now.subtract(1, 'day'), 'day')) {
    return '昨天'
  }

  if (diffDays < 7) {
    return `${diffDays}天前`
  }

  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks}周前`
  }

  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months}个月前`
  }

  const years = Math.floor(diffDays / 365)
  return `${years}年前`
}

/**
 * 格式化日期分隔符（今天、昨天、X月X日）
 * @param dateStr - 时间字符串
 * @returns 格式化后的日期分隔符
 */
export function formatDateSeparator(dateStr: string | Date | number): string {
  if (!dateStr) return ''

  try {
    const date = parseTime(dateStr)

    if (!date.isValid()) {
      return typeof dateStr === 'string' ? dateStr : ''
    }

    if (!canGetLocalTime()) {
      return typeof dateStr === 'string' ? dateStr : date.format('YYYY-MM-DD')
    }

    const now = dayjs()

    // 今天
    if (date.isSame(now, 'day')) {
      return '今天'
    }

    // 昨天
    if (date.isSame(now.subtract(1, 'day'), 'day')) {
      return '昨天'
    }

    // 是否同一年
    if (date.isSame(now, 'year')) {
      return date.format('M月D日')
    }

    // 不同年份
    return date.format('YYYY年M月D日')
  } catch {
    return typeof dateStr === 'string' ? dateStr : ''
  }
}

/**
 * 格式化会话列表时间
 * - 今天：显示 HH:mm
 * - 昨天：显示 昨天
 * - 本周内：显示 周X
 * - 更早：显示 MM/DD
 * @param dateStr - 时间字符串
 * @returns 格式化后的时间
 */
export function formatConversationTime(dateStr: string | Date | number): string {
  if (!dateStr) return ''

  try {
    const date = parseTime(dateStr)

    if (!date.isValid()) {
      return ''
    }

    if (!canGetLocalTime()) {
      return typeof dateStr === 'string' ? dateStr : ''
    }

    const now = dayjs()

    // 今天：显示时间
    if (date.isSame(now, 'day')) {
      return date.format('HH:mm')
    }

    // 昨天
    if (date.isSame(now.subtract(1, 'day'), 'day')) {
      return '昨天'
    }

    // 本周内：显示周几
    const weekStart = now.startOf('week')
    if (date.isAfter(weekStart)) {
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return weekDays[date.day()]
    }

    // 同一年：显示月/日
    if (date.isSame(now, 'year')) {
      return date.format('MM/DD')
    }

    // 不同年份：显示年/月/日
    return date.format('YYYY/MM/DD')
  } catch {
    return ''
  }
}

/**
 * 从时间戳格式化（兼容旧代码）
 * @param timestamp - Unix 时间戳（秒）
 * @param format - 格式字符串
 * @returns 格式化后的时间字符串
 */
export function formatTimestamp(timestamp: number | undefined, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!timestamp) return ''
  return dayjs.unix(timestamp).format(format)
}

// 导出 dayjs 实例，方便其他地方使用
export { dayjs }
