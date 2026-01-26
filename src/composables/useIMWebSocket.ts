/**
 * IM WebSocket 连接管理 composable
 * 支持 Laravel Reverb (Pusher 协议兼容)
 */
import { ref, onUnmounted, computed } from 'vue'
import { wsConnect, wsDisconnect, wsHeartbeat, getConnectionConfig, authChannel } from '@/api/im'
import { WSConnectionState, type WSConnectionStateType, type WSConnectionConfig } from '@/types/im.type'
import { API_SUCCESS_CODE } from '@/types/http.type'

// 全局 WebSocket 实例（单例模式）
let globalSocket: WebSocket | null = null
let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 10  // 增加重连次数
const RECONNECT_DELAY = 2000       // 缩短重连延迟
const HEARTBEAT_INTERVAL = 25000   // 25秒心跳，确保在服务器3分钟超时前保持连接

// 全局状态
const connectionState = ref<WSConnectionStateType>(WSConnectionState.DISCONNECTED)
const socketId = ref<string | null>(null)
const config = ref<WSConnectionConfig | null>(null)

// 事件监听器
type EventCallback = (data: unknown) => void
const eventListeners: Map<string, Set<EventCallback>> = new Map()

/**
 * 构建 WebSocket URL (Pusher 协议)
 */
function buildWebSocketUrl(cfg: WSConnectionConfig): string {
  const { scheme, host, port, app_key } = cfg.reverb
  const protocol = scheme === 'https' ? 'wss' : 'ws'
  return `${protocol}://${host}:${port}/app/${app_key}?protocol=7&client=js&version=8.4.0&flash=false`
}

/**
 * 启动心跳
 */
function startHeartbeat() {
  stopHeartbeat()
  heartbeatTimer = setInterval(async () => {
    if (socketId.value && connectionState.value === WSConnectionState.CONNECTED) {
      try {
        await wsHeartbeat(socketId.value)
      } catch (error) {
        console.warn('[IM WebSocket] Heartbeat failed:', error)
      }
    }
  }, HEARTBEAT_INTERVAL)
}

/**
 * 停止心跳
 */
function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

/**
 * 清理重连定时器
 */
function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

/**
 * 触发事件
 */
function emit(event: string, data: unknown) {
  const listeners = eventListeners.get(event)
  if (listeners) {
    listeners.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error(`[IM WebSocket] Event listener error for ${event}:`, error)
      }
    })
  }
}

/**
 * 处理 WebSocket 消息
 */
function handleMessage(event: MessageEvent) {
  try {
    const data = JSON.parse(event.data)

    // Pusher 协议消息处理
    if (data.event) {
      // 连接成功事件
      if (data.event === 'pusher:connection_established') {
        const payload = JSON.parse(data.data)
        socketId.value = payload.socket_id
        connectionState.value = WSConnectionState.CONNECTED
        reconnectAttempts = 0  // 重置重连计数

        console.log('[IM WebSocket] Connection established, socket_id:', socketId.value)

        // 通知后端连接已建立
        registerConnection()
        startHeartbeat()
        emit('connected', { socket_id: socketId.value })
        return
      }

      // 订阅成功
      if (data.event === 'pusher_internal:subscription_succeeded') {
        emit('subscribed', { channel: data.channel })
        return
      }

      // 错误事件
      if (data.event === 'pusher:error') {
        console.error('[IM WebSocket] Pusher error:', data.data)
        emit('error', data.data)
        return
      }

      // 业务消息
      const eventData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data
      console.log('[IM WebSocket] Business event received:', data.event, 'channel:', data.channel)
      if (data.event === 'voice.call.signal') {
        console.log('[IM WebSocket] ========== VOICE CALL SIGNAL ==========')
        console.log('[IM WebSocket] - signal_type:', eventData?.signal_type)
        console.log('[IM WebSocket] - call_id:', eventData?.data?.call_id)
        console.log('[IM WebSocket] - from_id:', eventData?.data?.from_id)
        console.log('[IM WebSocket] - has signal_data:', !!eventData?.data?.signal_data)
        if (eventData?.data?.signal_data) {
          console.log('[IM WebSocket] - signal_data.type:', eventData?.data?.signal_data?.type)
          console.log('[IM WebSocket] - signal_data has sdp:', !!eventData?.data?.signal_data?.sdp)
          console.log('[IM WebSocket] - signal_data has candidate:', !!eventData?.data?.signal_data?.candidate)
        }
        console.log('[IM WebSocket] - full data (truncated):', JSON.stringify(eventData).substring(0, 500))
        console.log('[IM WebSocket] ==========================================')
      }
      emit(data.event, eventData)

      // 同时触发通用消息事件
      emit('message', { event: data.event, data: eventData, channel: data.channel })
    }
  } catch (error) {
    console.error('[IM WebSocket] Failed to parse message:', error)
  }
}

/**
 * 注册连接到后端
 */
async function registerConnection() {
  if (!socketId.value || !config.value) return

  try {
    await wsConnect(socketId.value, config.value.channels.user)
    console.log('[IM WebSocket] Connection registered')
  } catch (error) {
    console.error('[IM WebSocket] Failed to register connection:', error)
  }
}

/**
 * 订阅频道
 */
async function subscribeChannel(channel: string) {
  if (!globalSocket || connectionState.value !== WSConnectionState.CONNECTED) {
    console.warn('[IM WebSocket] Cannot subscribe, not connected')
    return
  }

  // 私有频道和存在频道需要认证
  const needsAuth = channel.startsWith('private-') || channel.startsWith('presence-')

  if (needsAuth && socketId.value) {
    console.log('[IM WebSocket] Authenticating channel:', channel, 'socketId:', socketId.value)
    try {
      const res = await authChannel(socketId.value, channel)
      console.log('[IM WebSocket] Auth response:', res)
      if (res.code === API_SUCCESS_CODE && res.data?.auth) {
        const subscribeData: Record<string, string> = {
          channel,
          auth: res.data.auth
        }

        // Presence 频道需要额外的 channel_data
        if (channel.startsWith('presence-') && res.data.channel_data) {
          subscribeData.channel_data = res.data.channel_data
        }

        const message = JSON.stringify({
          event: 'pusher:subscribe',
          data: subscribeData
        })
        console.log('[IM WebSocket] Sending subscribe with auth:', message)
        globalSocket.send(message)
        return
      } else {
        console.error('[IM WebSocket] Channel auth failed:', res.message)
        return
      }
    } catch (error) {
      console.error('[IM WebSocket] Channel auth error:', error)
      return
    }
  }

  // 公共频道直接订阅
  const message = JSON.stringify({
    event: 'pusher:subscribe',
    data: { channel }
  })
  globalSocket.send(message)
}

/**
 * 取消订阅频道
 */
function unsubscribeChannel(channel: string) {
  if (!globalSocket || connectionState.value !== WSConnectionState.CONNECTED) return

  const message = JSON.stringify({
    event: 'pusher:unsubscribe',
    data: { channel }
  })
  globalSocket.send(message)
}

/**
 * IM WebSocket Composable
 */
export function useIMWebSocket() {
  /**
   * 连接 WebSocket
   */
  async function connect() {
    if (connectionState.value === WSConnectionState.CONNECTED ||
        connectionState.value === WSConnectionState.CONNECTING) {
      return
    }

    connectionState.value = WSConnectionState.CONNECTING

    try {
      // 获取连接配置
      const res = await getConnectionConfig()
      if (res.code !== API_SUCCESS_CODE || !res.data) {
        throw new Error(res.message || 'Failed to get connection config')
      }
      config.value = res.data

      // 关闭旧连接
      if (globalSocket) {
        globalSocket.close()
        globalSocket = null
      }

      // 创建 WebSocket 连接
      const url = buildWebSocketUrl(config.value!)
      globalSocket = new WebSocket(url)

      globalSocket.onopen = () => {
        console.log('[IM WebSocket] Connection opened')
        // 等待 pusher:connection_established 事件
      }

      globalSocket.onmessage = handleMessage

      globalSocket.onerror = (error) => {
        console.error('[IM WebSocket] Error:', error)
        emit('error', error)
      }

      globalSocket.onclose = (event) => {
        console.log('[IM WebSocket] Connection closed:', event.code, event.reason)
        connectionState.value = WSConnectionState.DISCONNECTED
        stopHeartbeat()

        // 通知后端断开连接
        if (socketId.value) {
          wsDisconnect(socketId.value).catch(() => {})
          socketId.value = null
        }

        emit('disconnected', { code: event.code, reason: event.reason })

        // 自动重连（非主动关闭）
        if (event.code !== 1000 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          scheduleReconnect()
        }
      }
    } catch (error) {
      console.error('[IM WebSocket] Failed to connect:', error)
      connectionState.value = WSConnectionState.DISCONNECTED
      emit('error', error)

      // 尝试重连
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        scheduleReconnect()
      }
    }
  }

  /**
   * 断开连接
   */
  function disconnect() {
    clearReconnectTimer()
    stopHeartbeat()
    reconnectAttempts = MAX_RECONNECT_ATTEMPTS // 阻止自动重连

    if (globalSocket) {
      globalSocket.close(1000, 'User disconnect')
      globalSocket = null
    }

    if (socketId.value) {
      wsDisconnect(socketId.value).catch(() => {})
      socketId.value = null
    }

    connectionState.value = WSConnectionState.DISCONNECTED
  }

  /**
   * 计划重连
   */
  function scheduleReconnect() {
    clearReconnectTimer()
    reconnectAttempts++
    connectionState.value = WSConnectionState.RECONNECTING

    // 使用指数退避，但最大不超过30秒
    const delay = Math.min(RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts - 1), 30000)
    console.log(`[IM WebSocket] Scheduling reconnect in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`)

    reconnectTimer = setTimeout(() => {
      connect()
    }, delay)
  }

  /**
   * 重置重连计数（连接成功后调用）
   */
  function resetReconnectAttempts() {
    reconnectAttempts = 0
  }

  /**
   * 订阅事件
   */
  function on(event: string, callback: EventCallback) {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set())
    }
    eventListeners.get(event)!.add(callback)

    // 返回取消订阅函数
    return () => off(event, callback)
  }

  /**
   * 取消订阅事件
   */
  function off(event: string, callback: EventCallback) {
    const listeners = eventListeners.get(event)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  /**
   * 订阅私有频道
   */
  async function subscribePrivate() {
    if (config.value) {
      await subscribeChannel(`private-${config.value.channels.user}`)
    }
  }

  /**
   * 订阅系统通知频道
   */
  async function subscribeSystem() {
    if (config.value) {
      await subscribeChannel(config.value.channels.system)
    }
  }

  // 组件卸载时清理
  onUnmounted(() => {
    // 不断开全局连接，只清理当前组件的监听器
  })

  return {
    // 状态
    connectionState: computed(() => connectionState.value),
    socketId: computed(() => socketId.value),
    isConnected: computed(() => connectionState.value === WSConnectionState.CONNECTED),
    isConnecting: computed(() => connectionState.value === WSConnectionState.CONNECTING),

    // 方法
    connect,
    disconnect,
    on,
    off,
    subscribeChannel,
    unsubscribeChannel,
    subscribePrivate,
    subscribeSystem,
    resetReconnectAttempts,
  }
}

/**
 * 清理所有事件监听器（用于退出登录时）
 */
export function clearAllIMListeners() {
  eventListeners.clear()
}

/**
 * 强制断开并重置（用于退出登录时）
 */
export function resetIMConnection() {
  clearAllIMListeners()
  clearReconnectTimer()
  stopHeartbeat()
  reconnectAttempts = 0

  if (globalSocket) {
    globalSocket.close(1000, 'Reset')
    globalSocket = null
  }

  socketId.value = null
  connectionState.value = WSConnectionState.DISCONNECTED
  config.value = null
}

/**
 * 设置页面关闭监听（通知服务器断开连接）
 * 这有助于服务器及时清理连接状态
 */
export function setupBeforeUnloadListener() {
  if (typeof window === 'undefined') return

  window.addEventListener('beforeunload', () => {
    // 使用 sendBeacon 发送断开连接通知（更可靠）
    if (socketId.value) {
      const data = JSON.stringify({ socket_id: socketId.value })
      // 尝试使用 sendBeacon（更可靠，不会被页面关闭阻断）
      if (navigator.sendBeacon) {
        // token 备用，sendBeacon 不支持自定义 headers
        const _token = localStorage.getItem('token')
        void _token // 避免未使用警告
        const blob = new Blob([data], { type: 'application/json' })
        // 注意：sendBeacon 不支持自定义 headers，需要在 URL 中传递 token 或使用其他方式
        // 这里只是尽力通知，服务器的心跳超时机制会作为兜底
        navigator.sendBeacon('/api/app/v1/im/ws/disconnect-beacon', blob)
      }
    }
    // 关闭 WebSocket
    if (globalSocket) {
      globalSocket.close(1000, 'Page unload')
    }
  })

  // 监听页面隐藏（移动端切换应用时）
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // 页面隐藏时发送心跳，确保连接不会被清理
      if (socketId.value && connectionState.value === WSConnectionState.CONNECTED) {
        wsHeartbeat(socketId.value).catch(() => {})
      }
    }
  })
}
