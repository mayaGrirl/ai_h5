import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'

// 扩展插件（只执行一次）
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)

const tz = 'Asia/Shanghai';// Intl.DateTimeFormat().resolvedOptions().timeZone
// 设置默认时区
dayjs.tz.setDefault(tz);

export default dayjs
