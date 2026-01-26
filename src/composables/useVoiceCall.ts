/**
 * 语音通话 Composable
 * 基于 WebRTC 实现点对点语音通话
 */
import { ref, computed, onUnmounted } from 'vue'
import * as voiceCallApi from '@/api/voiceCall'
import { useIMWebSocket } from './useIMWebSocket'
import { API_SUCCESS_CODE } from '@/types/http.type'

// 通话状态
export enum CallState {
  IDLE = 'idle',                    // 空闲
  CALLING = 'calling',              // 呼叫中（等待对方接听）
  INCOMING = 'incoming',            // 来电中（等待接听）
  CONNECTING = 'connecting',        // 连接中（WebRTC 建立连接）
  CONNECTED = 'connected',          // 通话中
  ENDED = 'ended',                  // 已结束
}

// 通话信息
export interface CallInfo {
  callId: string
  peerId: number
  peerName: string
  peerAvatar: string
  isCaller: boolean
  startTime?: number
  duration?: number
}

// WebRTC 配置 - 使用多个 STUN/TURN 服务器以提高连接成功率
const rtcConfig: RTCConfiguration = {
  iceServers: [
    // 公共 STUN 服务器
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // 备用 STUN 服务器
    { urls: 'stun:stun.stunprotocol.org:3478' },
    { urls: 'stun:stun.voip.eutelia.it:3478' },
    // 公共免费 TURN 服务器（用于 NAT 穿透失败时的中继）
    // 注意：生产环境建议使用自建或付费的 TURN 服务器
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    // 备用 TURN 服务器
    {
      urls: 'turn:relay.metered.ca:80',
      username: 'e8dd65b92c62d3e36cafb807',
      credential: 'uWdWNmkhvyqTmFrk',
    },
    {
      urls: 'turn:relay.metered.ca:443',
      username: 'e8dd65b92c62d3e36cafb807',
      credential: 'uWdWNmkhvyqTmFrk',
    },
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all', // 允许所有类型的ICE候选（包括relay）
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
}

// 全局状态（单例）
const callState = ref<CallState>(CallState.IDLE)
const callInfo = ref<CallInfo | null>(null)
const isMuted = ref(false)
const isSpeakerOn = ref(true)
const callDuration = ref(0)
const errorMessage = ref<string | null>(null)

// WebRTC 相关
let peerConnection: RTCPeerConnection | null = null
let localStream: MediaStream | null = null
let remoteAudio: HTMLAudioElement | null = null
let durationTimer: ReturnType<typeof setInterval> | null = null
let ringAudio: HTMLAudioElement | null = null
let callingTimeoutTimer: ReturnType<typeof setTimeout> | null = null

// ICE 候选队列（用于在远程描述设置前缓存候选）
let pendingIceCandidates: RTCIceCandidateInit[] = []
let hasRemoteDescription = false

// 本地 ICE 候选队列（用于在 offer/answer 发送后才发送）
let localIceCandidates: RTCIceCandidate[] = []
let canSendIceCandidates = false

// 待处理的 offer（如果 offer 在 peerConnection 准备好之前到达）
let pendingOffer: any = null

// 铃声相关
let ringAudioContext: AudioContext | null = null
let ringOscillator: OscillatorNode | null = null
let ringIntervalId: ReturnType<typeof setInterval> | null = null

// 连接超时定时器
let connectionTimeoutTimer: ReturnType<typeof setTimeout> | null = null
const CONNECTION_TIMEOUT = 30000 // 30秒连接超时（增加时间以适应慢速网络）

// ICE 重启相关
let iceRestartCount = 0
const MAX_ICE_RESTARTS = 2

// 事件回调
type CallEventCallback = (data?: any) => void
const eventCallbacks: Map<string, CallEventCallback[]> = new Map()

// 信号处理器引用
let signalHandler: ((data: any) => void) | null = null

// 初始化标记
let isInitialized = false

/**
 * 语音通话 Composable
 */
export function useVoiceCall() {
  const ws = useIMWebSocket()

  /**
   * 初始化 - 监听 WebSocket 信令
   */
  function init() {
    // 防止重复初始化
    if (isInitialized && signalHandler) {
      console.log('[VoiceCall] Already initialized, skipping')
      return
    }

    // 如果已经有处理器，先移除
    if (signalHandler) {
      console.log('[VoiceCall] Removing old signal handler')
      ws.off('voice.call.signal', signalHandler)
      signalHandler = null
    }

    console.log('[VoiceCall] Initializing voice call listener...')

    // 创建新的处理器
    signalHandler = handleSignal
    ws.on('voice.call.signal', signalHandler)
    isInitialized = true
    console.log('[VoiceCall] Listener registered for voice.call.signal')
  }

  /**
   * 重置初始化状态（用于退出登录等场景）
   */
  function resetInit() {
    if (signalHandler) {
      ws.off('voice.call.signal', signalHandler)
      signalHandler = null
    }
    isInitialized = false
    endCallInternal()
    console.log('[VoiceCall] Reset complete')
  }

  /**
   * 处理信令
   */
  function handleSignal(data: any) {
    console.log('[VoiceCall] ==========================================')
    console.log('[VoiceCall] handleSignal called')
    console.log('[VoiceCall] Raw data received:', JSON.stringify(data).substring(0, 500))
    const { signal_type, data: signalData } = data
    console.log('[VoiceCall] Parsed - signal_type:', signal_type)
    console.log('[VoiceCall] Parsed - signalData keys:', signalData ? Object.keys(signalData) : 'null')
    console.log('[VoiceCall] Current state:', callState.value)
    console.log('[VoiceCall] Current callId:', callInfo.value?.callId)
    console.log('[VoiceCall] peerConnection exists:', !!peerConnection)
    console.log('[VoiceCall] ==========================================')


    // 对于非 invite 信号，验证 call_id 是否匹配当前通话
    if (signal_type !== 'call.invite' && signalData?.call_id) {
      if (!callInfo.value || callInfo.value.callId !== signalData.call_id) {
        console.warn('[VoiceCall] Ignoring signal for different call:', signalData.call_id, 'current:', callInfo.value?.callId)
        return
      }
    }

    switch (signal_type) {
      case 'call.invite':
        handleIncomingCall(signalData)
        break
      case 'call.accept':
        handleCallAccepted(signalData)
        break
      case 'call.reject':
        handleCallRejected(signalData)
        break
      case 'call.cancel':
        handleCallCancelled(signalData)
        break
      case 'call.end':
        handleCallEnded(signalData)
        break
      case 'call.busy':
        handleCallBusy(signalData)
        break
      case 'webrtc.offer':
        handleWebRTCOffer(signalData)
        break
      case 'webrtc.answer':
        handleWebRTCAnswer(signalData)
        break
      case 'webrtc.ice':
        handleICECandidate(signalData)
        break
      default:
        console.warn('[VoiceCall] Unknown signal type:', signal_type)
    }
  }

  /**
   * 发起通话
   */
  async function makeCall(targetId: number): Promise<boolean> {
    if (callState.value !== CallState.IDLE) {
      console.warn('[VoiceCall] Already in a call')
      return false
    }

    try {
      callState.value = CallState.CALLING
      errorMessage.value = null

      const res = await voiceCallApi.initiateCall(targetId)
      if (res.code !== API_SUCCESS_CODE || !res.data) {
        callState.value = CallState.IDLE
        errorMessage.value = res.message || '发起通话失败'
        return false
      }

      callInfo.value = {
        callId: res.data.call_id,
        peerId: res.data.target_id,
        peerName: res.data.target_name,
        peerAvatar: res.data.target_avatar,
        isCaller: true,
      }

      // 播放呼叫等待音
      playRingSound('calling')

      // 设置呼叫超时（30秒）
      callingTimeoutTimer = setTimeout(() => {
        if (callState.value === CallState.CALLING) {
          cancelCall()
          errorMessage.value = '对方无应答'
        }
      }, 30000)

      emit('outgoing', callInfo.value)
      return true
    } catch (error: any) {
      console.error('[VoiceCall] Make call failed:', error)
      callState.value = CallState.IDLE
      errorMessage.value = error.message || '发起通话失败'
      return false
    }
  }

  /**
   * 处理来电
   */
  function handleIncomingCall(data: any) {
    console.log('[VoiceCall] handleIncomingCall called with data:', data)
    console.log('[VoiceCall] Current call state:', callState.value)

    if (callState.value !== CallState.IDLE) {
      // 忙线，拒绝
      console.log('[VoiceCall] User is busy, rejecting call')
      voiceCallApi.rejectCall(data.call_id, data.caller_id, 'busy')
      return
    }

    console.log('[VoiceCall] Setting state to INCOMING')
    callState.value = CallState.INCOMING
    callInfo.value = {
      callId: data.call_id,
      peerId: data.caller_id,
      peerName: data.caller_name,
      peerAvatar: data.caller_avatar,
      isCaller: false,
    }
    console.log('[VoiceCall] Call info set:', callInfo.value)

    // 播放来电铃声
    playRingSound('incoming')

    emit('incoming', callInfo.value)
  }

  /**
   * 接听电话
   */
  async function answerCall(): Promise<boolean> {
    if (callState.value !== CallState.INCOMING || !callInfo.value) {
      return false
    }

    try {
      stopRingSound()
      callState.value = CallState.CONNECTING
      setConnectionTimeout() // 设置连接超时
      console.log('[VoiceCall] Answering call...')

      // 获取本地音频流
      console.log('[VoiceCall] Getting local stream for answer...')
      await getLocalStream()
      console.log('[VoiceCall] Local stream obtained')

      // 先创建 PeerConnection，这样收到 offer 时可以立即处理
      console.log('[VoiceCall] Setting up PeerConnection before accepting...')
      await setupPeerConnection()
      console.log('[VoiceCall] PeerConnection ready')

      // 先通知对方已接听，让对方尽快发送 offer
      console.log('[VoiceCall] Sending accept signal...')
      await voiceCallApi.acceptCall(callInfo.value.callId, callInfo.value.peerId)
      console.log('[VoiceCall] Accept signal sent')

      // 然后检查是否有待处理的 offer（可能在我们准备过程中就到达了）
      if (pendingOffer) {
        console.log('[VoiceCall] Found pending offer, processing now...')
        await processPendingOffer()
      } else {
        console.log('[VoiceCall] No pending offer yet, waiting for offer from caller...')
      }

      return true
    } catch (error: any) {
      console.error('[VoiceCall] Answer call failed:', error)
      endCallInternal()
      errorMessage.value = error.message || '接听失败'
      return false
    }
  }

  /**
   * 拒绝来电
   */
  async function rejectCall(): Promise<void> {
    if (callState.value !== CallState.INCOMING || !callInfo.value) {
      return
    }

    stopRingSound()
    await voiceCallApi.rejectCall(callInfo.value.callId, callInfo.value.peerId)
    endCallInternal()
  }

  /**
   * 取消呼叫
   */
  async function cancelCall(): Promise<void> {
    if (callState.value !== CallState.CALLING || !callInfo.value) {
      return
    }

    stopRingSound()
    clearCallingTimeout()
    await voiceCallApi.cancelCall(callInfo.value.callId, callInfo.value.peerId)
    endCallInternal()
  }

  /**
   * 结束通话
   */
  async function endCall(): Promise<void> {
    if (!callInfo.value) {
      endCallInternal()
      return
    }

    if (callState.value === CallState.CALLING) {
      await cancelCall()
    } else if (callState.value === CallState.INCOMING) {
      await rejectCall()
    } else {
      await voiceCallApi.endCall(callInfo.value.callId, callInfo.value.peerId)
      endCallInternal()
    }
  }

  /**
   * 处理对方接听
   */
  async function handleCallAccepted(_data: any) {
    console.log('[VoiceCall] handleCallAccepted called, current state:', callState.value)
    if (callState.value !== CallState.CALLING || !callInfo.value) {
      console.log('[VoiceCall] Ignoring accept - wrong state or no callInfo')
      return
    }

    stopRingSound()
    clearCallingTimeout()
    callState.value = CallState.CONNECTING
    setConnectionTimeout() // 设置连接超时
    console.log('[VoiceCall] State changed to CONNECTING')

    try {
      // 获取本地音频流
      console.log('[VoiceCall] Getting local stream...')
      await getLocalStream()
      console.log('[VoiceCall] Local stream obtained')

      // 创建 PeerConnection
      console.log('[VoiceCall] Setting up PeerConnection...')
      await setupPeerConnection()
      console.log('[VoiceCall] PeerConnection created')

      // 作为呼叫者，创建并发送 offer
      console.log('[VoiceCall] Creating and sending offer...')
      await createAndSendOffer()
      console.log('[VoiceCall] Offer sent')
    } catch (error: any) {
      console.error('[VoiceCall] Handle accept failed:', error)
      endCallInternal()
      errorMessage.value = error.message || '连接失败'
    }
  }

  /**
   * 处理对方拒绝
   */
  function handleCallRejected(data: any) {
    if (callState.value !== CallState.CALLING) {
      return
    }

    stopRingSound()
    clearCallingTimeout()
    errorMessage.value = '对方已拒绝'
    endCallInternal()
    emit('rejected', data)
  }

  /**
   * 处理对方取消
   */
  function handleCallCancelled(data: any) {
    console.log('[VoiceCall] handleCallCancelled, current state:', callState.value)
    // 处理 INCOMING 和 CONNECTING 状态（被叫方可能已经点了接听但还在连接中）
    if (callState.value !== CallState.INCOMING && callState.value !== CallState.CONNECTING) {
      return
    }

    stopRingSound()
    errorMessage.value = '对方已取消'
    endCallInternal()
    emit('cancelled', data)
  }

  /**
   * 处理通话结束
   */
  function handleCallEnded(data: any) {
    console.log('[VoiceCall] handleCallEnded, current state:', callState.value)
    // 任何非空闲状态都应该结束
    if (callState.value === CallState.IDLE) {
      return
    }
    stopRingSound()
    endCallInternal()
    emit('ended', data)
  }

  /**
   * 处理忙线
   */
  function handleCallBusy(data: any) {
    if (callState.value !== CallState.CALLING) {
      return
    }

    stopRingSound()
    clearCallingTimeout()
    errorMessage.value = '对方正忙'
    endCallInternal()
    emit('busy', data)
  }

  // ==================== WebRTC 相关 ====================

  /**
   * 检查是否在安全上下文中（HTTPS 或 localhost）
   */
  function isSecureContext(): boolean {
    if (typeof window === 'undefined') {
      return false
    }
    // 使用浏览器原生的 isSecureContext 属性
    if (window.isSecureContext !== undefined) {
      return window.isSecureContext
    }
    // 降级检查
    const { protocol, hostname } = window.location
    return protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1'
  }

  /**
   * 获取本地音频流
   */
  async function getLocalStream(): Promise<void> {
    if (localStream) {
      console.log('[VoiceCall] Local stream already exists')
      return
    }

    // 检查安全上下文
    if (!isSecureContext()) {
      console.error('[VoiceCall] Not in secure context, mediaDevices API unavailable')
      throw new Error('语音通话需要 HTTPS 连接。请使用 https:// 协议访问，或通过 localhost 访问')
    }

    // 检查 mediaDevices API 是否可用
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('[VoiceCall] mediaDevices API not available')
      throw new Error('当前浏览器不支持语音通话功能，请使用最新版 Chrome、Firefox 或 Safari')
    }

    try {
      console.log('[VoiceCall] Requesting microphone access...')
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      })
      console.log('[VoiceCall] Microphone access granted, tracks:', localStream.getAudioTracks().length)
    } catch (error: any) {
      console.error('[VoiceCall] Failed to get microphone access:', error)
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('麦克风权限被拒绝，请在浏览器设置中允许访问麦克风')
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('未找到麦克风设备')
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        throw new Error('麦克风被其他应用占用')
      } else {
        throw new Error('无法访问麦克风: ' + error.message)
      }
    }
  }

  /**
   * 设置 PeerConnection
   */
  async function setupPeerConnection(): Promise<void> {
    console.log('[VoiceCall] Creating RTCPeerConnection with config:', rtcConfig)
    peerConnection = new RTCPeerConnection(rtcConfig)

    // 添加本地音频轨道
    if (localStream) {
      console.log('[VoiceCall] Adding local tracks to PeerConnection')
      localStream.getTracks().forEach(track => {
        console.log('[VoiceCall] Adding track:', track.kind, track.id)
        peerConnection!.addTrack(track, localStream!)
      })
    }

    // 监听远程音频
    peerConnection.ontrack = (event) => {
      console.log('[VoiceCall] Remote track received:', event.track.kind, 'streams:', event.streams.length)
      if (event.track.kind !== 'audio') {
        console.log('[VoiceCall] Ignoring non-audio track')
        return
      }

      if (!remoteAudio) {
        remoteAudio = new Audio()
        remoteAudio.autoplay = true
        // 设置音频属性以确保在移动设备上正常播放
        remoteAudio.setAttribute('playsinline', 'true')
      }

      if (event.streams && event.streams[0]) {
        console.log('[VoiceCall] Setting remote audio stream')
        remoteAudio.srcObject = event.streams[0]
      } else {
        console.log('[VoiceCall] Creating MediaStream from track')
        const stream = new MediaStream([event.track])
        remoteAudio.srcObject = stream
      }

      // 尝试播放
      remoteAudio.play()
        .then(() => console.log('[VoiceCall] Remote audio playing'))
        .catch(e => {
          console.warn('[VoiceCall] Audio play failed:', e)
          // 尝试在用户交互后播放
          if (e.name === 'NotAllowedError') {
            console.log('[VoiceCall] Audio autoplay blocked, will retry on user interaction')
          }
        })
    }

    // 监听 ICE 候选 - 先缓存，等 offer/answer 发送后再发送
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && callInfo.value) {
        if (canSendIceCandidates) {
          // 可以发送了，直接发送
          console.log('[VoiceCall] Sending ICE candidate:', event.candidate.candidate?.substring(0, 50))
          voiceCallApi.sendSignal(
            callInfo.value.peerId,
            callInfo.value.callId,
            'ice',
            event.candidate.toJSON()
          )
        } else {
          // 还不能发送，先缓存
          console.log('[VoiceCall] Queuing local ICE candidate')
          localIceCandidates.push(event.candidate)
        }
      } else if (!event.candidate) {
        console.log('[VoiceCall] ICE gathering complete')
      }
    }

    // 监听 ICE 连接状态
    peerConnection.oniceconnectionstatechange = () => {
      const state = peerConnection?.iceConnectionState
      console.log('[VoiceCall] ICE connection state changed to:', state)
      console.log('[VoiceCall] Current call state:', callState.value)
      console.log('[VoiceCall] Has remote description:', hasRemoteDescription)

      if (state === 'connected' || state === 'completed') {
        // ICE 连接成功
        clearConnectionTimeout()
        iceRestartCount = 0 // 重置重试计数
        if (callState.value === CallState.CONNECTING) {
          console.log('[VoiceCall] ICE connected, call established!')
          callState.value = CallState.CONNECTED
          startDurationTimer()
          emit('connected', callInfo.value)
        }
      } else if (state === 'failed') {
        console.error('[VoiceCall] ICE connection failed!')
        console.error('[VoiceCall] - restart count:', iceRestartCount)
        console.error('[VoiceCall] - is caller:', callInfo.value?.isCaller)
        console.error('[VoiceCall] - has remote description:', hasRemoteDescription)
        // 尝试 ICE 重启
        if (iceRestartCount < MAX_ICE_RESTARTS && callInfo.value?.isCaller) {
          iceRestartCount++
          console.log('[VoiceCall] Attempting ICE restart #' + iceRestartCount)
          performIceRestart()
        } else {
          clearConnectionTimeout()
          errorMessage.value = '连接失败，请检查网络或稍后重试'
          endCallInternal()
        }
      } else if (state === 'checking') {
        console.log('[VoiceCall] ICE checking - negotiating connection...')
      } else if (state === 'disconnected') {
        console.log('[VoiceCall] ICE disconnected - may recover automatically')
        // 短暂断开，给10秒时间自动恢复
        setTimeout(() => {
          if (peerConnection?.iceConnectionState === 'disconnected') {
            console.log('[VoiceCall] ICE still disconnected after 10s, attempting restart')
            if (callInfo.value?.isCaller && iceRestartCount < MAX_ICE_RESTARTS) {
              iceRestartCount++
              performIceRestart()
            }
          }
        }, 10000)
      } else if (state === 'new') {
        console.log('[VoiceCall] ICE state: new - waiting for candidates')
      }
    }

    // 监听 ICE 收集状态
    peerConnection.onicegatheringstatechange = () => {
      console.log('[VoiceCall] ICE gathering state:', peerConnection?.iceGatheringState)
      if (peerConnection?.iceGatheringState === 'complete') {
        console.log('[VoiceCall] ICE gathering completed')
        // 如果收集完成但还没有远程描述，可能是对端还没准备好
        if (!hasRemoteDescription) {
          console.log('[VoiceCall] Note: ICE gathering complete but no remote description yet')
        }
      }
    }

    // 监听连接状态
    peerConnection.onconnectionstatechange = () => {
      console.log('[VoiceCall] Connection state:', peerConnection?.connectionState)
      if (peerConnection?.connectionState === 'connected') {
        clearConnectionTimeout()
        iceRestartCount = 0
        if (callState.value === CallState.CONNECTING) {
          callState.value = CallState.CONNECTED
          startDurationTimer()
          emit('connected', callInfo.value)
        }
      } else if (peerConnection?.connectionState === 'failed') {
        // 连接失败，ICE 状态处理器会尝试重启
        console.error('[VoiceCall] Connection failed')
      } else if (peerConnection?.connectionState === 'disconnected') {
        // 短暂断开，可能会自动恢复
        console.log('[VoiceCall] Connection disconnected, waiting for recovery...')
      }
    }

    // 监听信令状态
    peerConnection.onsignalingstatechange = () => {
      console.log('[VoiceCall] Signaling state:', peerConnection?.signalingState)
    }
  }

  /**
   * 创建并发送 Offer
   */
  async function createAndSendOffer(): Promise<void> {
    console.log('[VoiceCall] ========== createAndSendOffer START ==========')
    if (!peerConnection || !callInfo.value) {
      console.error('[VoiceCall] Cannot create offer - missing peerConnection or callInfo')
      return
    }

    // 重置 ICE 发送状态
    canSendIceCandidates = false
    localIceCandidates = []

    console.log('[VoiceCall] Creating offer...')
    const offer = await peerConnection.createOffer()
    console.log('[VoiceCall] Offer created, type:', offer.type, 'sdp length:', offer.sdp?.length)

    console.log('[VoiceCall] Setting local description...')
    await peerConnection.setLocalDescription(offer)
    console.log('[VoiceCall] Local description set')

    // 先发送 offer
    console.log('[VoiceCall] Sending offer to peer:', callInfo.value.peerId)
    await voiceCallApi.sendSignal(
      callInfo.value.peerId,
      callInfo.value.callId,
      'offer',
      { type: offer.type, sdp: offer.sdp }
    )
    console.log('[VoiceCall] Offer sent successfully')

    // 现在可以发送 ICE 候选了
    canSendIceCandidates = true
    console.log('[VoiceCall] ICE sending enabled, queued candidates:', localIceCandidates.length)

    // 发送缓存的 ICE 候选
    await flushLocalIceCandidates()
    console.log('[VoiceCall] ========== createAndSendOffer END ==========')
  }

  /**
   * 执行 ICE 重启
   */
  async function performIceRestart(): Promise<void> {
    console.log('[VoiceCall] ========== performIceRestart START ==========')
    if (!peerConnection || !callInfo.value) {
      console.error('[VoiceCall] Cannot restart ICE - missing peerConnection or callInfo')
      return
    }

    try {
      // 重置 ICE 发送状态
      canSendIceCandidates = false
      localIceCandidates = []
      hasRemoteDescription = false
      pendingIceCandidates = []

      console.log('[VoiceCall] Creating offer with ICE restart...')
      const offer = await peerConnection.createOffer({ iceRestart: true })
      console.log('[VoiceCall] ICE restart offer created')

      await peerConnection.setLocalDescription(offer)
      console.log('[VoiceCall] Local description set for ICE restart')

      // 发送新的 offer
      await voiceCallApi.sendSignal(
        callInfo.value.peerId,
        callInfo.value.callId,
        'offer',
        { type: offer.type, sdp: offer.sdp }
      )
      console.log('[VoiceCall] ICE restart offer sent')

      // 现在可以发送 ICE 候选了
      canSendIceCandidates = true
      await flushLocalIceCandidates()
      console.log('[VoiceCall] ========== performIceRestart END ==========')
    } catch (error) {
      console.error('[VoiceCall] ICE restart failed:', error)
    }
  }

  /**
   * 发送缓存的本地 ICE 候选
   */
  async function flushLocalIceCandidates(): Promise<void> {
    if (localIceCandidates.length === 0 || !callInfo.value) return

    console.log(`[VoiceCall] Flushing ${localIceCandidates.length} queued local ICE candidates`)
    const candidates = [...localIceCandidates]
    localIceCandidates = []

    for (const candidate of candidates) {
      try {
        await voiceCallApi.sendSignal(
          callInfo.value.peerId,
          callInfo.value.callId,
          'ice',
          candidate.toJSON()
        )
      } catch (error) {
        console.error('[VoiceCall] Failed to send queued ICE candidate:', error)
      }
    }
    console.log('[VoiceCall] All queued ICE candidates sent')
  }

  /**
   * 处理收到的 Offer
   */
  async function handleWebRTCOffer(data: any): Promise<void> {
    console.log('[VoiceCall] ========== handleWebRTCOffer START ==========')
    console.log('[VoiceCall] peerConnection exists:', !!peerConnection)
    console.log('[VoiceCall] callInfo exists:', !!callInfo.value)
    console.log('[VoiceCall] callState:', callState.value)
    console.log('[VoiceCall] Received data:', JSON.stringify(data).substring(0, 200))

    // 如果 peerConnection 还没准备好，先缓存 offer
    if (!peerConnection || !callInfo.value) {
      console.warn('[VoiceCall] peerConnection not ready, queuing offer for later processing')
      pendingOffer = data
      return
    }

    // 提取 signal_data - 兼容不同的数据格式
    let signalData = data.signal_data || data
    if (!signalData || !signalData.sdp) {
      console.error('[VoiceCall] Invalid offer - missing signal_data or sdp')
      console.error('[VoiceCall] Received data:', data)
      console.error('[VoiceCall] Data keys:', Object.keys(data || {}))
      return
    }

    try {
      // 重置本地 ICE 发送状态
      canSendIceCandidates = false
      localIceCandidates = []

      console.log('[VoiceCall] Setting remote description (offer)...')
      console.log('[VoiceCall] Offer SDP type:', signalData.type)
      console.log('[VoiceCall] Offer SDP length:', signalData.sdp?.length)

      // 直接使用原始 SDP，不做修改（移除可能导致问题的 SDP 修改）
      const sdp = signalData.sdp

      const offerDesc = new RTCSessionDescription({
        type: signalData.type || 'offer',
        sdp: sdp
      })
      await peerConnection.setRemoteDescription(offerDesc)
      hasRemoteDescription = true
      console.log('[VoiceCall] Remote description set successfully')

      // 处理等待中的远程 ICE 候选
      console.log('[VoiceCall] Processing pending ICE candidates, count:', pendingIceCandidates.length)
      await processPendingIceCandidates()

      console.log('[VoiceCall] Creating answer...')
      const answer = await peerConnection.createAnswer()
      console.log('[VoiceCall] Answer created, type:', answer.type, 'sdp length:', answer.sdp?.length)

      console.log('[VoiceCall] Setting local description (answer)...')
      await peerConnection.setLocalDescription(answer)
      console.log('[VoiceCall] Local description set')

      // 先发送 answer
      console.log('[VoiceCall] Sending answer to peer:', callInfo.value.peerId)
      await voiceCallApi.sendSignal(
        callInfo.value.peerId,
        callInfo.value.callId,
        'answer',
        { type: answer.type, sdp: answer.sdp }
      )
      console.log('[VoiceCall] Answer sent successfully')

      // 现在可以发送 ICE 候选了
      canSendIceCandidates = true

      // 发送缓存的本地 ICE 候选
      await flushLocalIceCandidates()
      console.log('[VoiceCall] ========== handleWebRTCOffer END ==========')
    } catch (error) {
      console.error('[VoiceCall] handleWebRTCOffer failed:', error)
      // 如果设置 offer 失败，尝试结束通话
      if (callInfo.value) {
        errorMessage.value = '连接失败，请重试'
      }
    }
  }

  /**
   * 处理待处理的 offer（在 peerConnection 准备好后调用）
   */
  async function processPendingOffer(): Promise<void> {
    if (pendingOffer) {
      console.log('[VoiceCall] Processing pending offer...')
      const offer = pendingOffer
      pendingOffer = null
      await handleWebRTCOffer(offer)
    }
  }

  /**
   * 处理收到的 Answer
   */
  async function handleWebRTCAnswer(data: any): Promise<void> {
    console.log('[VoiceCall] ========== handleWebRTCAnswer START ==========')
    console.log('[VoiceCall] peerConnection exists:', !!peerConnection)
    console.log('[VoiceCall] callState:', callState.value)
    console.log('[VoiceCall] Received data:', JSON.stringify(data).substring(0, 200))

    if (!peerConnection) {
      console.error('[VoiceCall] Cannot handle answer - no peerConnection')
      return
    }

    // 提取 signal_data - 兼容不同的数据格式
    let signalData = data.signal_data || data
    if (!signalData || !signalData.sdp) {
      console.error('[VoiceCall] Invalid answer - missing signal_data or sdp')
      console.error('[VoiceCall] Received data:', data)
      console.error('[VoiceCall] Data keys:', Object.keys(data || {}))
      return
    }

    try {
      console.log('[VoiceCall] Setting remote description (answer)...')
      console.log('[VoiceCall] Answer SDP type:', signalData.type)
      console.log('[VoiceCall] Answer SDP length:', signalData.sdp?.length)

      // 直接使用原始 SDP，不做修改
      const sdp = signalData.sdp

      const answerDesc = new RTCSessionDescription({
        type: signalData.type || 'answer',
        sdp: sdp
      })
      await peerConnection.setRemoteDescription(answerDesc)
      hasRemoteDescription = true
      console.log('[VoiceCall] Remote description set successfully')

      // 处理等待中的 ICE 候选
      console.log('[VoiceCall] Processing pending ICE candidates, count:', pendingIceCandidates.length)
      await processPendingIceCandidates()
      console.log('[VoiceCall] ICE candidates processed, waiting for ICE connection...')
      console.log('[VoiceCall] Current ICE state:', peerConnection.iceConnectionState)
      console.log('[VoiceCall] Current connection state:', peerConnection.connectionState)
      console.log('[VoiceCall] ========== handleWebRTCAnswer END ==========')
    } catch (error) {
      console.error('[VoiceCall] handleWebRTCAnswer failed:', error)
      // 如果设置 answer 失败，通知用户
      if (callInfo.value) {
        errorMessage.value = '连接失败，请重试'
      }
    }
  }

  /**
   * 处理等待中的 ICE 候选
   */
  async function processPendingIceCandidates(): Promise<void> {
    if (pendingIceCandidates.length === 0 || !peerConnection) return

    console.log(`[VoiceCall] Processing ${pendingIceCandidates.length} pending ICE candidates`)
    const candidates = [...pendingIceCandidates]
    pendingIceCandidates = []

    for (const candidateData of candidates) {
      // 跳过空的候选
      if (!candidateData || !candidateData.candidate) {
        console.log('[VoiceCall] Skipping empty pending ICE candidate')
        continue
      }
      try {
        const candidate = new RTCIceCandidate(candidateData)
        await peerConnection.addIceCandidate(candidate)
        console.log('[VoiceCall] Pending ICE candidate added')
      } catch (error) {
        // 非致命错误，继续处理其他候选
        console.warn('[VoiceCall] Failed to add pending ICE candidate (non-fatal):', error)
      }
    }
  }

  /**
   * 处理 ICE 候选
   */
  async function handleICECandidate(data: any): Promise<void> {
    // 提取 signal_data - 兼容不同的数据格式
    const candidateData = data.signal_data || data
    const candidateInfo = candidateData?.candidate?.substring(0, 50) || 'unknown'
    console.log('[VoiceCall] handleICECandidate:', candidateInfo)
    console.log('[VoiceCall] State - peerConnection:', !!peerConnection, 'hasRemoteDescription:', hasRemoteDescription, 'pendingCount:', pendingIceCandidates.length)

    // 如果没有 peerConnection 或远程描述还没设置，先缓存原始数据
    if (!peerConnection || !hasRemoteDescription) {
      console.log('[VoiceCall] Queuing ICE candidate for later processing (total queued:', pendingIceCandidates.length + 1, ')')
      pendingIceCandidates.push(candidateData)
      return
    }

    // 忽略空的 ICE 候选（表示收集完成）
    if (!candidateData || !candidateData.candidate) {
      console.log('[VoiceCall] Received empty ICE candidate (gathering complete signal)')
      return
    }

    try {
      const candidate = new RTCIceCandidate(candidateData)
      await peerConnection.addIceCandidate(candidate)
      console.log('[VoiceCall] ICE candidate added successfully, current ICE state:', peerConnection.iceConnectionState)
    } catch (error) {
      // 某些 ICE 候选可能因为格式问题添加失败，这不是致命错误
      console.warn('[VoiceCall] Add ICE candidate failed (non-fatal):', error)
    }
  }

  // ==================== 通话控制 ====================

  /**
   * 静音/取消静音
   */
  function toggleMute(): void {
    if (!localStream) return

    isMuted.value = !isMuted.value
    localStream.getAudioTracks().forEach(track => {
      track.enabled = !isMuted.value
    })
  }

  /**
   * 扬声器/听筒切换
   */
  function toggleSpeaker(): void {
    isSpeakerOn.value = !isSpeakerOn.value
    // 在 Web 上，扬声器控制有限，主要用于移动端
    // 这里只是更新状态，实际控制需要 native 支持
  }

  // ==================== 辅助函数 ====================

  /**
   * 播放铃声
   */
  function playRingSound(type: 'incoming' | 'calling'): void {
    stopRingSound()
    console.log('[VoiceCall] Playing ring sound:', type)

    try {
      ringAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const gainNode = ringAudioContext.createGain()
      gainNode.connect(ringAudioContext.destination)
      gainNode.gain.value = 0

      ringOscillator = ringAudioContext.createOscillator()
      ringOscillator.connect(gainNode)
      ringOscillator.type = 'sine'
      ringOscillator.frequency.value = type === 'incoming' ? 440 : 480
      ringOscillator.start()

      // 使用 setInterval 控制铃声节奏
      let isOn = true
      const toggleRing = () => {
        if (!ringAudioContext || !gainNode) return
        try {
          gainNode.gain.setValueAtTime(isOn ? 0.3 : 0, ringAudioContext.currentTime)
          isOn = !isOn
        } catch (e) {
          // 忽略
        }
      }
      toggleRing() // 立即开始
      ringIntervalId = setInterval(toggleRing, 500)
    } catch (error) {
      console.warn('[VoiceCall] Audio playback not supported:', error)
    }
  }

  /**
   * 停止铃声
   */
  function stopRingSound(): void {
    console.log('[VoiceCall] Stopping ring sound')

    if (ringIntervalId) {
      clearInterval(ringIntervalId)
      ringIntervalId = null
    }

    if (ringOscillator) {
      try {
        ringOscillator.stop()
      } catch (e) {
        // 忽略
      }
      ringOscillator = null
    }

    if (ringAudioContext) {
      try {
        ringAudioContext.close()
      } catch (e) {
        // 忽略
      }
      ringAudioContext = null
    }

    // 兼容旧的 ringAudio
    if (ringAudio) {
      try {
        if (typeof (ringAudio as any).stop === 'function') {
          (ringAudio as any).stop()
        } else if (typeof ringAudio.pause === 'function') {
          ringAudio.pause()
        }
      } catch (e) {
        // 忽略
      }
      ringAudio = null
    }
  }

  /**
   * 清除呼叫超时
   */
  function clearCallingTimeout(): void {
    if (callingTimeoutTimer) {
      clearTimeout(callingTimeoutTimer)
      callingTimeoutTimer = null
    }
  }

  /**
   * 设置连接超时
   */
  function setConnectionTimeout(): void {
    clearConnectionTimeout()
    connectionTimeoutTimer = setTimeout(() => {
      if (callState.value === CallState.CONNECTING) {
        console.error('[VoiceCall] Connection timeout after', CONNECTION_TIMEOUT / 1000, 'seconds')
        errorMessage.value = '连接超时，请检查网络'
        endCallInternal()
      }
    }, CONNECTION_TIMEOUT)
  }

  /**
   * 清除连接超时
   */
  function clearConnectionTimeout(): void {
    if (connectionTimeoutTimer) {
      clearTimeout(connectionTimeoutTimer)
      connectionTimeoutTimer = null
    }
  }

  /**
   * 开始计时
   */
  function startDurationTimer(): void {
    callInfo.value!.startTime = Date.now()
    callDuration.value = 0

    durationTimer = setInterval(() => {
      callDuration.value++
    }, 1000)
  }

  /**
   * 停止计时
   */
  function stopDurationTimer(): void {
    if (durationTimer) {
      clearInterval(durationTimer)
      durationTimer = null
    }
  }

  /**
   * 内部结束通话
   */
  function endCallInternal(): void {
    console.log('[VoiceCall] endCallInternal called, current state:', callState.value)

    stopRingSound()
    stopDurationTimer()
    clearCallingTimeout()
    clearConnectionTimeout()

    // 关闭 PeerConnection
    if (peerConnection) {
      try {
        peerConnection.close()
      } catch (e) {
        console.warn('[VoiceCall] Error closing peerConnection:', e)
      }
      peerConnection = null
    }

    // 停止本地流
    if (localStream) {
      try {
        localStream.getTracks().forEach(track => track.stop())
      } catch (e) {
        console.warn('[VoiceCall] Error stopping local stream:', e)
      }
      localStream = null
    }

    // 停止远程音频
    if (remoteAudio) {
      try {
        remoteAudio.pause()
        remoteAudio.srcObject = null
      } catch (e) {
        console.warn('[VoiceCall] Error stopping remote audio:', e)
      }
      remoteAudio = null
    }

    // 重置 ICE 相关状态
    pendingIceCandidates = []
    hasRemoteDescription = false
    localIceCandidates = []
    canSendIceCandidates = false
    pendingOffer = null
    iceRestartCount = 0

    // 重置状态
    callState.value = CallState.IDLE
    callInfo.value = null
    isMuted.value = false
    callDuration.value = 0
    errorMessage.value = null

    console.log('[VoiceCall] Call ended and state reset')
  }

  /**
   * 格式化通话时长
   */
  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // ==================== 事件系统 ====================

  function on(event: string, callback: CallEventCallback): () => void {
    if (!eventCallbacks.has(event)) {
      eventCallbacks.set(event, [])
    }
    eventCallbacks.get(event)!.push(callback)

    return () => off(event, callback)
  }

  function off(event: string, callback: CallEventCallback): void {
    const callbacks = eventCallbacks.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index !== -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  function emit(event: string, data?: any): void {
    const callbacks = eventCallbacks.get(event)
    if (callbacks) {
      callbacks.forEach(cb => cb(data))
    }
  }

  // 组件卸载时清理
  onUnmounted(() => {
    // 如果正在通话，结束通话
    if (callState.value !== CallState.IDLE) {
      endCall()
    }
  })

  return {
    // 状态
    callState: computed(() => callState.value),
    callInfo: computed(() => callInfo.value),
    isMuted: computed(() => isMuted.value),
    isSpeakerOn: computed(() => isSpeakerOn.value),
    callDuration: computed(() => callDuration.value),
    errorMessage: computed(() => errorMessage.value),

    // 计算属性
    isIdle: computed(() => callState.value === CallState.IDLE),
    isCalling: computed(() => callState.value === CallState.CALLING),
    isIncoming: computed(() => callState.value === CallState.INCOMING),
    isConnecting: computed(() => callState.value === CallState.CONNECTING),
    isConnected: computed(() => callState.value === CallState.CONNECTED),
    formattedDuration: computed(() => formatDuration(callDuration.value)),

    // 方法
    init,
    resetInit,
    makeCall,
    answerCall,
    rejectCall,
    cancelCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    formatDuration,
    on,
    off,
  }
}
