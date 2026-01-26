/**
 * 图片 URL 处理工具
 */

// 获取图片基础 URL
const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || ''

/**
 * 获取完整的图片 URL
 * @param url 图片路径（可能是相对路径或完整 URL）
 * @param defaultImage 默认图片路径
 * @returns 完整的图片 URL
 */
export function getImageUrl(url: string | null | undefined, defaultImage = '/default-avatar.png'): string {
  if (!url) return defaultImage

  // 已经是完整 URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url
  }

  // 本地资源路径，直接返回
  if (url.startsWith('/')) {
    // 如果是存储路径，拼接图片域名
    if (url.startsWith('/storage/') || url.startsWith('/uploads/')) {
      return `${IMAGE_BASE_URL}${url}`
    }
    // 否则是本地静态资源
    return url
  }

  // 相对路径，拼接图片基础 URL
  return `${IMAGE_BASE_URL}/${url}`
}

/**
 * 获取头像 URL
 * @param avatar 头像路径
 * @returns 完整的头像 URL
 */
export function getAvatarUrl(avatar: string | null | undefined): string {
  return getImageUrl(avatar, '/default-avatar.png')
}

/**
 * 获取群头像 URL
 * @param avatar 群头像路径
 * @returns 完整的群头像 URL
 */
export function getGroupAvatarUrl(avatar: string | null | undefined): string {
  return getImageUrl(avatar, '/default-group.png')
}

/**
 * 获取图片基础 URL
 * @returns 图片基础 URL
 */
export function getImageBaseUrl(): string {
  return IMAGE_BASE_URL
}
