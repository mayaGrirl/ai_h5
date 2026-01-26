<script setup lang="ts">
/**
 * WhatsApp 风格聊天页面
 */
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useIMStore } from '@/stores/im'
import { useFriendStore } from '@/stores/friend'
import { useAuthStore } from '@/stores/auth'
import { useVoiceCall } from '@/composables/useVoiceCall'
import {
  ArrowLeft,
  Send,
  Paperclip,
  Camera,
  Image as ImageIcon,
  FileText,
  MapPin,
  Mic,
  X,
  ChevronDown,
  MoreVertical,
  Phone,
  Play,
  Download,
  Check,
  CheckCheck,
  Edit3,
  Trash2,
  Pin,
  RefreshCw,
  BellOff,
  Headphones,
  Settings,
  Users,
  Gift,
} from 'lucide-vue-next'
import type { Message, MessageAttachment } from '@/types/im.type'
import type { SendPackResponse } from '@/types/group.type'
import { MessageType } from '@/types/im.type'
import { uploadFile } from '@/api/common'
import { API_SUCCESS_CODE } from '@/types/http.type'
import GroupPackMessage from '@/components/im/GroupPackMessage.vue'
import GroupPackGrab from '@/components/im/GroupPackGrab.vue'
import GroupPackDetail from '@/components/im/GroupPackDetail.vue'
import GroupPackSend from '@/components/im/GroupPackSend.vue'
import { formatMessageTime, formatDateSeparator, parseTime } from '@/utils/time'

const route = useRoute()
const router = useRouter()
const imStore = useIMStore()
const friendStore = useFriendStore()
const authStore = useAuthStore()
const voiceCall = useVoiceCall()

// 路由参数
const conversationId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})
const friendIdFromRoute = computed(() => {
  if (route.path.includes('/im/friend/')) {
    return Number(route.params.id)
  }
  return null
})
const isCustomerService = computed(() => route.path.includes('/im/customer-service'))

// 获取好友的 member_id（从路由或会话 target 中获取）
const friendId = computed(() => {
  // 优先从路由获取
  if (friendIdFromRoute.value) {
    return friendIdFromRoute.value
  }
  // 从当前会话的 target 获取
  if (imStore.currentConversation?.target?.id) {
    return imStore.currentConversation.target.id
  }
  return null
})

// 状态
const inputMessage = ref('')
const containerRef = ref<HTMLDivElement | null>(null)
const messageListRef = ref<HTMLDivElement | null>(null)
const inputRef = ref<HTMLTextAreaElement | null>(null)
const inputAreaRef = ref<HTMLDivElement | null>(null)
const isLoadingMore = ref(false)
const showScrollToBottom = ref(false)
const showAttachmentMenu = ref(false)
const showEmojiPicker = ref(false)
const selectedImage = ref<string | null>(null)
const keyboardHeight = ref(0)
const isKeyboardVisible = ref(false)

// 更多菜单相关状态
const showMoreMenu = ref(false)
const showRemarkModal = ref(false)
const remarkInput = ref('')
const isSettingRemark = ref(false)
const showDeleteConfirm = ref(false)
const isDeleting = ref(false)

// 群红包相关状态
const showPackSendDialog = ref(false)
const showPackGrabDialog = ref(false)
const showPackDetailDialog = ref(false)
const currentPackId = ref<number | null>(null)
const groupMemberCount = ref(0)

// 摄像头相关状态
const showCameraModal = ref(false)
const cameraVideoRef = ref<HTMLVideoElement | null>(null)
const cameraStream = ref<MediaStream | null>(null)
const isCameraReady = ref(false)
const cameraError = ref<string | null>(null)
const useFrontCamera = ref(false)

// 语音录制相关状态
const isRecording = ref(false)
const recordingDuration = ref(0)
const mediaRecorder = ref<MediaRecorder | null>(null)
const audioChunks = ref<Blob[]>([])
const recordingTimer = ref<ReturnType<typeof setInterval> | null>(null)
const audioStream = ref<MediaStream | null>(null)
const MAX_RECORDING_DURATION = 60 // 最长录制60秒

// 语音播放相关状态
const currentPlayingAudio = ref<HTMLAudioElement | null>(null)
const currentPlayingMessageId = ref<number | null>(null)
const audioPlayProgress = ref(0) // 0-100

// 表情列表
const emojiCategories = [
  {
    name: '常用',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥']
  },
  {
    name: '手势',
    emojis: ['👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '💪', '🦾', '🙈', '🙉', '🙊', '💋', '💯', '💢', '💥', '💫', '💦', '💨']
  },
  {
    name: '心情',
    emojis: ['😢', '😭', '😤', '😠', '😡', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🫠', '🥹', '🥺', '😮‍💨', '😵‍💫', '🤯', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟']
  },
  {
    name: '物品',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '🎁', '🎉', '🎊', '🎈', '🔥', '⭐', '🌟', '✨', '💫', '🌈', '☀️', '🌙', '⚡', '❄️', '🌸', '🌺', '🌻', '🌹', '🍀', '🎄', '🎃']
  },
  {
    name: '食物',
    emojis: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍔', '🍟', '🍕', '🌭', '🍿', '🧂', '🥤', '🧋', '☕', '🍵', '🍺', '🍻', '🥂', '🍷', '🍸', '🍹', '🧁', '🍰', '🎂', '🍩', '🍪', '🍫', '🍬']
  }
]
const activeEmojiCategory = ref(0)

// 聊天对象信息
const chatTarget = ref<{
  id: number | string
  name: string
  avatar: string
  isOnline?: boolean
  type: 'friend' | 'customer_service' | 'system' | 'conversation'
} | null>(null)

// 当前用户ID
const currentUserId = computed(() => authStore.currentCustomer?.id || 0)

// 消息列表
const messages = computed(() => imStore.currentMessages)

// 当前会话
const conversation = computed(() => imStore.currentConversation)

// 是否为群聊
const isGroupChat = computed(() => conversation.value?.type === 2)

// 聊天显示名称（从好友列表获取最新的备注）
const chatDisplayName = computed(() => {
  // 如果有 friendId，从好友列表获取名称
  if (friendId.value) {
    const friend = friendStore.contacts.friends.find(f => f.id === friendId.value)
    if (friend) {
      return friend.name || friend.nickname || chatTarget.value?.name || '聊天'
    }
  }
  // 否则使用 chatTarget 或 conversation 的名称
  return chatTarget.value?.name || conversation.value?.name || conversation.value?.target?.nickname || '聊天'
})

// 附件菜单选项
const attachmentOptions = computed(() => {
  const options = [
    { icon: ImageIcon, label: '图片', color: 'bg-purple-500', action: 'gallery' },
    { icon: Camera, label: '拍照', color: 'bg-pink-500', action: 'camera' },
    { icon: FileText, label: '文档', color: 'bg-blue-500', action: 'document' },
    { icon: MapPin, label: '位置', color: 'bg-green-500', action: 'location' },
  ]

  // 群聊添加红包选项
  if (isGroupChat.value) {
    options.push({ icon: Gift, label: '红包', color: 'bg-red-500', action: 'redpack' })
  }

  return options
})

// 是否显示日期分隔
function shouldShowDateSeparator(index: number): boolean {
  if (index === 0) return true

  const currentMsg = messages.value[index]
  const prevMsg = messages.value[index - 1]

  const currentDate = parseTime(currentMsg.created_at).format('YYYY-MM-DD')
  const prevDate = parseTime(prevMsg.created_at).format('YYYY-MM-DD')

  return currentDate !== prevDate
}

// 是否是自己发送的消息
function isOwnMessage(msg: Message): boolean {
  return msg.sender_id === currentUserId.value
}

// 获取消息状态图标
function getMessageStatusIcon(msg: Message) {
  if (msg.status === 0) return null
  if (msg.status === -1) return null
  if (msg.status === 3) return CheckCheck
  return Check
}

// 格式化文件大小
function formatFileSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

// HTML 转义，防止 XSS
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// 将文本中的 URL 转换为可点击链接
function linkifyText(text: string): string {
  if (!text) return ''
  // URL 正则表达式
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi
  // 先转义 HTML，再替换 URL
  const escaped = escapeHtml(text)
  return escaped.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline break-all" onclick="event.stopPropagation()">${url}</a>`
  })
}

// 获取消息附件（兼容 msg.attachment 和 msg.extra.attachment 两种格式）
function getMessageAttachment(msg: Message): MessageAttachment | undefined {
  return msg.attachment || (msg.extra?.attachment as MessageAttachment | undefined)
}

// 发起语音通话
async function handleVoiceCall() {
  // 检查是否有聊天对象
  if (!chatTarget.value?.id) {
    alert('无法获取通话对象')
    return
  }

  // 检查对方是否在线（可选）
  // if (!chatTarget.value.isOnline) {
  //   alert('对方当前不在线')
  //   return
  // }

  const targetId = typeof chatTarget.value.id === 'string'
    ? parseInt(chatTarget.value.id, 10)
    : chatTarget.value.id

  if (isNaN(targetId)) {
    alert('无效的通话对象')
    return
  }

  const success = await voiceCall.makeCall(targetId)
  if (!success && voiceCall.errorMessage.value) {
    alert(voiceCall.errorMessage.value)
  }
}

// 发送消息
async function handleSend() {
  const content = inputMessage.value.trim()
  if (!content) return

  // 确保会话已创建
  if (!imStore.currentConversation) {
    console.error('[Chat] Cannot send: no conversation')
    return
  }

  inputMessage.value = ''

  // 重置 textarea 高度
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }

  const success = await imStore.sendMessage(content)
  if (!success) {
    console.error('[Chat] Send message failed')
  }

  await nextTick()
  scrollToBottom()
}

// 处理输入框键盘事件
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

// 自动调整 textarea 高度
function autoResizeTextarea() {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
    const scrollHeight = inputRef.value.scrollHeight
    inputRef.value.style.height = Math.min(scrollHeight, 120) + 'px'
  }
}

// 滚动到底部
function scrollToBottom(smooth = true) {
  if (messageListRef.value) {
    messageListRef.value.scrollTo({
      top: messageListRef.value.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    })
  }
}

// 加载更多消息
async function loadMoreMessages() {
  if (isLoadingMore.value || !imStore.hasMoreMessages) return

  isLoadingMore.value = true
  const scrollHeight = messageListRef.value?.scrollHeight || 0

  try {
    await imStore.loadMoreMessages()

    await nextTick()
    if (messageListRef.value) {
      const newScrollHeight = messageListRef.value.scrollHeight
      messageListRef.value.scrollTop = newScrollHeight - scrollHeight
    }
  } finally {
    isLoadingMore.value = false
  }
}

// 处理滚动事件
function handleScroll() {
  if (!messageListRef.value) return

  const { scrollTop, scrollHeight, clientHeight } = messageListRef.value

  showScrollToBottom.value = scrollHeight - scrollTop - clientHeight > 200

  if (scrollTop < 50) {
    loadMoreMessages()
  }
}

// 切换附件菜单
function toggleAttachmentMenu() {
  showAttachmentMenu.value = !showAttachmentMenu.value
  if (showAttachmentMenu.value) {
    showEmojiPicker.value = false
  }
}

// 切换表情面板
function toggleEmojiPicker() {
  showEmojiPicker.value = !showEmojiPicker.value
  if (showEmojiPicker.value) {
    showAttachmentMenu.value = false
    // 收起键盘
    inputRef.value?.blur()
  }
}

// 选择表情
function selectEmoji(emoji: string) {
  inputMessage.value += emoji
}

// 处理附件选择
async function handleAttachmentAction(action: string) {
  showAttachmentMenu.value = false

  switch (action) {
    case 'gallery':
      selectImage()
      break
    case 'camera':
      openCamera()
      break
    case 'document':
      selectDocument()
      break
    case 'location':
      sendLocation()
      break
    case 'redpack':
      openPackSendDialog()
      break
  }
}

// 选择图片
function selectImage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true
  input.onchange = async (e) => {
    const files = (e.target as HTMLInputElement).files
    if (files && files.length > 0) {
      for (const file of Array.from(files)) {
        await uploadAndSendFile(file, MessageType.IMAGE)
      }
    }
  }
  input.click()
}

// 打开相机
async function openCamera() {
  // 检测是否为移动设备
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  if (isMobile) {
    // 移动端：使用 input capture 属性
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.setAttribute('capture', 'environment')
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        await uploadAndSendFile(file, MessageType.IMAGE)
      }
    }
    input.click()
  } else {
    // PC端：使用 getUserMedia API 打开摄像头
    showCameraModal.value = true
    cameraError.value = null
    isCameraReady.value = false
    await startCamera()
  }
}

// 启动摄像头
async function startCamera() {
  try {
    // 先停止之前的流
    if (cameraStream.value) {
      cameraStream.value.getTracks().forEach(track => track.stop())
      cameraStream.value = null
    }

    cameraError.value = null
    isCameraReady.value = false

    let stream: MediaStream | null = null

    // PC 上通常只有前置摄像头，先尝试不指定 facingMode
    const constraintsList: MediaStreamConstraints[] = [
      // 1. 先尝试不指定 facingMode（让浏览器自动选择）
      {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      },
      // 2. 尝试 user（前置）
      {
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      },
      // 3. 最简单的约束
      {
        video: true,
        audio: false
      }
    ]

    for (const constraints of constraintsList) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
        console.log('[Camera] 成功获取摄像头流:', constraints)
        break
      } catch (e) {
        console.warn('[Camera] 尝试约束失败:', constraints, e)
        continue
      }
    }

    if (!stream) {
      throw new Error('NotFoundError')
    }

    cameraStream.value = stream

    // 等待 DOM 更新
    await nextTick()

    if (cameraVideoRef.value) {
      cameraVideoRef.value.srcObject = stream
      cameraVideoRef.value.onloadedmetadata = () => {
        cameraVideoRef.value?.play()
        isCameraReady.value = true
      }
    }
  } catch (error: any) {
    console.error('摄像头访问失败:', error)
    if (error.name === 'NotAllowedError' || error.message?.includes('Permission')) {
      cameraError.value = '请允许访问摄像头权限'
    } else if (error.name === 'NotFoundError' || error.message === 'NotFoundError') {
      cameraError.value = '未检测到摄像头设备'
    } else if (error.name === 'NotReadableError') {
      cameraError.value = '摄像头被其他程序占用'
    } else if (error.name === 'OverconstrainedError') {
      cameraError.value = '摄像头不支持请求的分辨率'
    } else {
      cameraError.value = '无法访问摄像头: ' + (error.message || error.name || '未知错误')
    }
  }
}

// 切换前后摄像头（主要用于移动设备，PC通常只有一个摄像头）
async function switchCamera() {
  useFrontCamera.value = !useFrontCamera.value

  // 先停止当前流
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach(track => track.stop())
    cameraStream.value = null
  }

  isCameraReady.value = false
  cameraError.value = null

  try {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: useFrontCamera.value ? 'user' : 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints)
    cameraStream.value = stream

    await nextTick()

    if (cameraVideoRef.value) {
      cameraVideoRef.value.srcObject = stream
      cameraVideoRef.value.onloadedmetadata = () => {
        cameraVideoRef.value?.play()
        isCameraReady.value = true
      }
    }
  } catch (error) {
    console.warn('[Camera] 切换摄像头失败，可能只有一个摄像头:', error)
    // 切换失败，恢复原来的设置并重新启动
    useFrontCamera.value = !useFrontCamera.value
    await startCamera()
  }
}

// 拍照
async function capturePhoto() {
  if (!cameraVideoRef.value || !isCameraReady.value) return

  const video = cameraVideoRef.value
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.drawImage(video, 0, 0)

  // 转换为 Blob
  canvas.toBlob(async (blob) => {
    if (blob) {
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
      closeCameraModal()
      await uploadAndSendFile(file, MessageType.IMAGE)
    }
  }, 'image/jpeg', 0.9)
}

// 关闭摄像头弹窗
function closeCameraModal() {
  showCameraModal.value = false
  isCameraReady.value = false
  cameraError.value = null

  // 停止摄像头流
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach(track => track.stop())
    cameraStream.value = null
  }
}

// ==================== 语音录制 ====================

// 开始录音
async function startRecording() {
  try {
    // 请求麦克风权限
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        sampleRate: 44100
      }
    })

    audioStream.value = stream
    audioChunks.value = []
    recordingDuration.value = 0

    // 检测支持的音频格式
    let mimeType = 'audio/webm'
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus'
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4'
    } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
      mimeType = 'audio/ogg'
    }

    const recorder = new MediaRecorder(stream, { mimeType })

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.value.push(event.data)
      }
    }

    recorder.onstop = async () => {
      // 停止所有音轨
      stream.getTracks().forEach(track => track.stop())

      if (audioChunks.value.length > 0 && recordingDuration.value >= 1) {
        // 创建音频文件
        const audioBlob = new Blob(audioChunks.value, { type: mimeType })
        const extension = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm'
        const file = new File([audioBlob], `voice_${Date.now()}.${extension}`, { type: mimeType })

        console.log('[Voice] 录音完成:', {
          duration: recordingDuration.value,
          size: audioBlob.size,
          type: mimeType
        })

        // 上传并发送语音消息
        await uploadAndSendFile(file, MessageType.VOICE)
      } else if (recordingDuration.value < 1) {
        console.log('[Voice] 录音时间太短，已取消')
      }

      // 重置状态
      audioChunks.value = []
      audioStream.value = null
    }

    mediaRecorder.value = recorder
    recorder.start(100) // 每100ms收集一次数据
    isRecording.value = true

    // 开始计时
    recordingTimer.value = setInterval(() => {
      recordingDuration.value++
      // 达到最大时长自动停止
      if (recordingDuration.value >= MAX_RECORDING_DURATION) {
        stopRecording()
      }
    }, 1000)

    console.log('[Voice] 开始录音')
  } catch (error: any) {
    console.error('[Voice] 录音失败:', error)
    if (error.name === 'NotAllowedError') {
      alert('请允许访问麦克风权限')
    } else if (error.name === 'NotFoundError') {
      alert('未检测到麦克风设备')
    } else {
      alert('无法启动录音: ' + error.message)
    }
  }
}

// 停止录音
function stopRecording() {
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
    recordingTimer.value = null
  }

  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop()
  }

  isRecording.value = false
  console.log('[Voice] 停止录音, 时长:', recordingDuration.value, '秒')
}

// 取消录音
function cancelRecording() {
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
    recordingTimer.value = null
  }

  // 强制重置，不触发 onstop 中的上传逻辑
  recordingDuration.value = 0
  audioChunks.value = []

  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop()
  }

  if (audioStream.value) {
    audioStream.value.getTracks().forEach(track => track.stop())
    audioStream.value = null
  }

  isRecording.value = false
  console.log('[Voice] 取消录音')
}

// 格式化录音时长
function formatRecordingDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ==================== 语音播放 ====================

// 播放/暂停语音
function toggleAudioPlay(messageId: number, audioUrl: string) {
  // 如果点击的是正在播放的音频，则暂停
  if (currentPlayingMessageId.value === messageId && currentPlayingAudio.value) {
    if (currentPlayingAudio.value.paused) {
      currentPlayingAudio.value.play()
    } else {
      currentPlayingAudio.value.pause()
    }
    return
  }

  // 停止之前的音频
  stopAudioPlay()

  // 创建新的音频实例
  const audio = new Audio(audioUrl)
  currentPlayingAudio.value = audio
  currentPlayingMessageId.value = messageId
  audioPlayProgress.value = 0

  // 监听播放进度
  audio.ontimeupdate = () => {
    if (audio.duration) {
      audioPlayProgress.value = (audio.currentTime / audio.duration) * 100
    }
  }

  // 播放结束
  audio.onended = () => {
    stopAudioPlay()
  }

  // 播放错误
  audio.onerror = (e) => {
    console.error('[Voice] 播放失败:', e)
    stopAudioPlay()
    alert('语音播放失败')
  }

  // 开始播放
  audio.play().catch(err => {
    console.error('[Voice] 播放失败:', err)
    stopAudioPlay()
  })
}

// 停止播放
function stopAudioPlay() {
  if (currentPlayingAudio.value) {
    currentPlayingAudio.value.pause()
    currentPlayingAudio.value.currentTime = 0
    currentPlayingAudio.value = null
  }
  currentPlayingMessageId.value = null
  audioPlayProgress.value = 0
}

// 检查是否正在播放某条消息
function isAudioPlaying(messageId: number): boolean {
  return currentPlayingMessageId.value === messageId &&
         currentPlayingAudio.value !== null &&
         !currentPlayingAudio.value.paused
}

// 选择文档
function selectDocument() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      await uploadAndSendFile(file, MessageType.FILE)
    }
  }
  input.click()
}

// 发送位置
async function sendLocation() {
  if (!navigator.geolocation) {
    alert('您的浏览器不支持定位功能')
    return
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      })
    })

    const { latitude, longitude } = position.coords
    const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`

    await imStore.sendMessage(`[位置] ${address}`, undefined)
  } catch (error) {
    console.error('获取位置失败:', error)
    alert('获取位置失败，请检查定位权限')
  }
}

// 上传并发送文件
async function uploadAndSendFile(file: File, messageType: number) {
  console.log('上传文件:', file.name, messageType)

  try {
    // 先上传文件
    const uploadRes = await uploadFile(file)
    console.log('文件上传结果:', uploadRes)

    if (uploadRes.code !== API_SUCCESS_CODE || !uploadRes.data) {
      alert('文件上传失败')
      return
    }

    const { file_uri, file_url, file_size, file_mime, image_width, image_height } = uploadRes.data

    // 构建附件信息
    // 附件类型：1=图片, 2=语音, 3=视频, 4=文件
    const attachmentType = messageType === MessageType.IMAGE ? 1 :
                          messageType === MessageType.VOICE ? 2 :
                          messageType === MessageType.VIDEO ? 3 : 4

    const attachment = {
      type: attachmentType,
      name: file.name,
      path: file_uri,
      url: file_url,
      mime_type: file_mime,
      size: file_size * 1024, // 转回字节
      width: image_width,
      height: image_height,
    }

    // 发送带附件的消息，传入消息类型
    await imStore.sendMessage('', undefined, attachment, messageType)

  } catch (error) {
    console.error('文件上传失败:', error)
    alert('文件上传失败，请重试')
  }
}

// 撤回消息
async function handleRecall(msg: Message) {
  if (confirm('确定要撤回这条消息吗？')) {
    const result = await imStore.recallMessage(msg.id)
    if (!result.success && result.error) {
      alert(result.error)
    }
  }
}

// 检查消息是否可以撤回（自己发送的且在2分钟内）
function canRecallMessage(msg: Message): boolean {
  // 只能撤回自己发送的消息
  if (msg.sender_id !== authStore.currentCustomer?.id) {
    return false
  }
  // 已撤回的消息不能再撤回
  if (msg.is_recalled) {
    return false
  }
  // 发送失败的消息不能撤回
  if (msg.status === -1) {
    return false
  }
  // 检查时间窗口（2分钟）
  const createdAt = new Date(msg.created_at).getTime()
  const now = Date.now()
  const twoMinutes = 2 * 60 * 1000
  return now - createdAt <= twoMinutes
}

// 重新发送失败的消息
async function handleResend(msg: Message) {
  if (!msg.local_id) {
    console.error('[Chat] Cannot resend: message has no local_id')
    return
  }

  console.log('[Chat] Resending failed message:', msg.local_id)
  const success = await imStore.resendMessage(msg.local_id)
  if (!success) {
    console.error('[Chat] Resend failed')
  } else {
    await nextTick()
    scrollToBottom()
  }
}

// 打开图片预览
function openImagePreview(url: string) {
  selectedImage.value = url
}

// 关闭图片预览
function closeImagePreview() {
  selectedImage.value = null
}

// 打开地图
function openLocation(attachment: MessageAttachment) {
  if (attachment.latitude && attachment.longitude) {
    const url = `https://www.google.com/maps?q=${attachment.latitude},${attachment.longitude}`
    window.open(url, '_blank')
  }
}

// 下载文件（通过后端接口强制下载）
function downloadFile(attachment: MessageAttachment) {
  const filePath = attachment.path
  const fileName = attachment.name || 'download'

  if (!filePath) {
    console.error('文件路径为空')
    return
  }

  // 获取认证 token
  const token = localStorage.getItem('access_token') || ''

  // 构建后端下载 URL（包含 token）
  const apiUrl = import.meta.env.VITE_API_URL || ''
  const downloadUrl = `${apiUrl}/api/app/v1/download?path=${encodeURIComponent(filePath)}&filename=${encodeURIComponent(fileName)}&token=${encodeURIComponent(token)}`

  console.log('[Download] URL:', downloadUrl)

  // 直接打开下载链接
  window.open(downloadUrl, '_blank')
}

// 返回
function goBack() {
  imStore.clearCurrentConversation()
  router.back()
}

// 切换更多菜单
function toggleMoreMenu() {
  showMoreMenu.value = !showMoreMenu.value
}

// 关闭更多菜单
function closeMoreMenu() {
  showMoreMenu.value = false
}

// 跳转到群设置页面
function goToGroupSettings() {
  closeMoreMenu()
  if (conversation.value?.id) {
    router.push(`/im/group/${conversation.value.id}/settings`)
  }
}

// 跳转到群成员页面
function goToGroupMembers() {
  closeMoreMenu()
  if (conversation.value?.id) {
    router.push(`/im/group/${conversation.value.id}/members`)
  }
}

// 打开设置备注弹窗
function openRemarkModal() {
  closeMoreMenu()
  // 获取当前备注
  if (friendId.value) {
    const friend = friendStore.contacts.friends.find(f => f.id === friendId.value)
    remarkInput.value = friend?.remark || ''
  } else {
    remarkInput.value = ''
  }
  showRemarkModal.value = true
}

// 关闭设置备注弹窗
function closeRemarkModal() {
  showRemarkModal.value = false
  remarkInput.value = ''
}

// 保存备注
async function saveRemark() {
  if (!friendId.value) {
    console.error('[Chat] Cannot save remark: friendId is null')
    return
  }

  const newRemark = remarkInput.value.trim()
  const targetFriendId = friendId.value

  isSettingRemark.value = true
  try {
    console.log('[Chat] Saving remark for friendId:', targetFriendId, 'remark:', newRemark)
    const success = await friendStore.setFriendRemark(targetFriendId, newRemark)
    if (success) {
      // 获取好友信息以确定显示名称
      const friend = friendStore.contacts.friends.find(f => f.id === targetFriendId)
      const displayName = newRemark || friend?.nickname || chatTarget.value?.name || '用户'

      // 更新聊天页面标题显示的名称
      if (chatTarget.value) {
        chatTarget.value.name = displayName
      }

      // 更新当前会话的名称（确保响应式）
      if (imStore.currentConversation) {
        imStore.currentConversation.name = displayName
      }

      // 更新会话列表中的会话名称
      const convIndex = imStore.conversations.findIndex(c => c.target?.id === targetFriendId)
      if (convIndex !== -1) {
        imStore.conversations[convIndex].name = displayName
        console.log('[Chat] Updated conversation name at index:', convIndex)
      }

      closeRemarkModal()
    }
  } finally {
    isSettingRemark.value = false
  }
}

// 设置置顶
async function handleSetTop() {
  if (!friendId.value) return
  closeMoreMenu()

  const friend = friendStore.contacts.friends.find(f => f.id === friendId.value)
  const currentIsTop = friend?.is_top || false
  await friendStore.setFriendTop(friendId.value, !currentIsTop)
}

// 删除好友
async function handleDeleteFriend() {
  if (!friendId.value) return
  closeMoreMenu()

  if (confirm('确定要删除该好友吗？删除后将清除聊天记录。')) {
    const success = await friendStore.deleteFriend(friendId.value)
    if (success) {
      router.replace('/im')
    }
  }
}

// 打开删除聊天确认弹窗
function openDeleteConfirm() {
  closeMoreMenu()
  showDeleteConfirm.value = true
}

// 关闭删除聊天确认弹窗
function closeDeleteConfirm() {
  showDeleteConfirm.value = false
}

// 确认删除聊天
async function confirmDeleteChat() {
  if (!imStore.currentConversation) return

  isDeleting.value = true
  try {
    const success = await imStore.deleteChat(imStore.currentConversation.id)
    if (success) {
      closeDeleteConfirm()
      router.replace('/im')
    }
  } finally {
    isDeleting.value = false
  }
}

// ==================== 群红包相关 ====================

// 打开发红包弹窗
function openPackSendDialog() {
  showAttachmentMenu.value = false
  // 获取群成员数量（使用会话的成员数或默认值）
  groupMemberCount.value = conversation.value?.member_count || 100
  showPackSendDialog.value = true
}

// 关闭发红包弹窗
function closePackSendDialog() {
  showPackSendDialog.value = false
}

// 红包发送成功
function onPackSent(data: SendPackResponse) {
  console.log('[Chat] Pack sent:', data)
  closePackSendDialog()

  // 红包消息需要手动添加到本地（发送者不会收到 WebSocket 广播）
  if (data.message && conversationId.value) {
    const convMessages = imStore.messages.get(conversationId.value) || []

    // 检查消息是否已存在（避免重复）
    const messageIdStr = String(data.message.id)
    if (!convMessages.some(m => String(m.id) === messageIdStr)) {
      // 构建消息对象
      const newMessage: Message = {
        id: typeof data.message.id === 'string' ? parseInt(data.message.id) || 0 : data.message.id,
        conversation_id: data.message.conversation_id,
        sender_id: data.message.sender_id,
        sender: {
          ...data.message.sender,
          avatar: data.message.sender.avatar || '',
        },
        type: data.message.type,
        content: data.message.content,
        extra: data.message.extra,
        is_recalled: false,
        created_at: data.message.created_at,
      }

      convMessages.push(newMessage)
      imStore.messages.set(conversationId.value, [...convMessages])

      console.log('[Chat] Pack message added locally')
    }
  }

  nextTick(() => scrollToBottom())
}

// 点击红包消息
function handlePackClick(packId: number) {
  currentPackId.value = packId
  showPackGrabDialog.value = true
}

// 关闭抢红包弹窗
function closePackGrabDialog() {
  showPackGrabDialog.value = false
  currentPackId.value = null
}

// 红包抢成功
function onPackGrabbed(amount: number) {
  console.log('[Chat] Pack grabbed, amount:', amount)
  // 可以在这里显示一个 toast 或刷新余额
}

// 打开红包详情
function openPackDetail(packId: number) {
  closePackGrabDialog()
  currentPackId.value = packId
  showPackDetailDialog.value = true
}

// 关闭红包详情
function closePackDetailDialog() {
  showPackDetailDialog.value = false
  currentPackId.value = null
}

// 获取红包消息的额外数据
function getPackMessageData(msg: Message): { packId: number; greeting: string; totalCount: number; status?: number; hasGrabbed?: boolean } | null {
  if (msg.type !== MessageType.PACK) return null

  const extra = msg.extra as {
    pack_id?: number
    greeting?: string
    total_count?: number
    status?: number
    has_grabbed?: boolean
  } | undefined

  if (!extra?.pack_id) return null

  return {
    packId: extra.pack_id,
    greeting: extra.greeting || '恭喜发财',
    totalCount: extra.total_count || 1,
    status: extra.status,
    hasGrabbed: extra.has_grabbed,
  }
}

// 处理键盘显示/隐藏
function handleViewportResize() {
  if (!window.visualViewport) return

  const viewport = window.visualViewport
  const windowHeight = window.innerHeight
  const viewportHeight = viewport.height

  // 计算键盘高度
  const kbHeight = windowHeight - viewportHeight

  if (kbHeight > 100) {
    // 键盘弹出
    keyboardHeight.value = kbHeight
    isKeyboardVisible.value = true
    showAttachmentMenu.value = false
    showEmojiPicker.value = false

    // 滚动到底部
    nextTick(() => {
      scrollToBottom(false)
    })
  } else {
    // 键盘收起
    keyboardHeight.value = 0
    isKeyboardVisible.value = false
  }
}

// 输入框获得焦点
function handleInputFocus() {
  // 关闭表情面板
  showEmojiPicker.value = false
  showAttachmentMenu.value = false
  // 确保滚动到底部
  setTimeout(() => {
    scrollToBottom(false)
  }, 300)
}

// 初始化聊天目标
async function initChatTarget() {
  console.log('[Chat] initChatTarget start', {
    isCustomerService: isCustomerService.value,
    friendId: friendId.value,
    conversationId: conversationId.value
  })

  if (isCustomerService.value) {
    // 创建或获取与客服的会话
    console.log('[Chat] Creating customer service conversation...')
    const result = await imStore.getOrCreateSystemContactConversation('customer_service')

    if (result.conversationId && result.systemContact) {
      // 使用系统联系人的名称，和通讯录保持一致（显示"在线客服"）
      chatTarget.value = {
        id: result.systemContact.id,
        name: result.systemContact.name,
        avatar: result.systemContact.avatar || '/images/system/customer_service.png',
        type: 'customer_service',
      }

      await imStore.setCurrentConversation(result.conversationId)
      console.log('[Chat] Customer service conversation set:', result.conversationId)

      // 订阅会话频道以接收新消息
      await imStore.subscribeToConversation(result.conversationId)
    } else {
      console.error('[Chat] Failed to create customer service conversation')
      // 显示默认客服信息，但无法发送消息
      chatTarget.value = {
        id: 'customer_service',
        name: '在线客服',
        avatar: '/images/system/customer_service.png',
        type: 'customer_service',
      }
    }
  } else if (friendId.value) {
    // 确保好友列表已加载
    if (friendStore.contacts.friends.length === 0) {
      console.log('[Chat] Loading contacts...')
      await friendStore.loadContacts()
    }

    const friend = friendStore.contacts.friends.find(f => f.id === friendId.value)
    console.log('[Chat] Found friend:', friend)

    if (friend) {
      chatTarget.value = {
        id: friend.id,
        name: friend.name,
        avatar: friend.avatar,
        type: 'friend',
      }

      // 创建或获取会话
      console.log('[Chat] Creating/getting conversation for friend:', friend.id)
      const convId = await imStore.getOrCreatePrivateConversation(Number(friend.id))
      console.log('[Chat] Got conversation ID:', convId)

      if (convId) {
        await imStore.setCurrentConversation(convId)
        console.log('[Chat] Current conversation set:', imStore.currentConversation)

        // 订阅会话频道以接收新消息
        await imStore.subscribeToConversation(convId)
      } else {
        console.error('[Chat] Failed to create/get conversation')
      }
    } else {
      console.error('[Chat] Friend not found:', friendId.value)
    }
  } else if (conversationId.value) {
    // 确保好友列表已加载（用于判断会话对象是否是好友）
    if (friendStore.contacts.friends.length === 0) {
      console.log('[Chat] Loading contacts for chat route...')
      await friendStore.loadContacts()
    }

    await imStore.setCurrentConversation(conversationId.value)
    if (conversation.value) {
      // 检查是否是系统联系人（如在线客服），如果是则使用系统联系人的名称和头像
      const isSystemContact = conversation.value.target?.is_system_contact

      if (isSystemContact) {
        // 系统联系人会话，使用系统联系人的信息（和通讯录保持一致）
        chatTarget.value = {
          id: conversation.value.id,
          name: conversation.value.name || '在线客服',
          avatar: conversation.value.avatar || '',
          type: 'customer_service',
        }
      } else {
        // 普通私聊会话 - 检查是否是好友
        const targetMemberId = conversation.value.target?.id
        console.log('[Chat] Checking if target is friend, targetMemberId:', targetMemberId)

        const isFriend = targetMemberId
          ? friendStore.contacts.friends.some(f => f.id === targetMemberId)
          : false

        // 如果是好友，从好友列表获取最新的名称（包含备注）
        const friend = isFriend
          ? friendStore.contacts.friends.find(f => f.id === targetMemberId)
          : null

        console.log('[Chat] isFriend:', isFriend, 'friend:', friend)

        chatTarget.value = {
          id: targetMemberId || conversation.value.id,
          name: friend?.name || conversation.value.name || conversation.value.target?.nickname || '聊天',
          avatar: conversation.value.avatar || conversation.value.target?.avatar || '',
          isOnline: conversation.value.target?.is_online,
          type: isFriend ? 'friend' : 'conversation',
        }
      }

      // 订阅会话频道
      await imStore.subscribeToConversation(conversationId.value)
    }
  }
}

// 初始化
onMounted(async () => {
  // 确保 IM store 已初始化（包括 WebSocket 连接）
  // 这对于直接刷新聊天页面的情况很重要
  if (!imStore.isConnected) {
    console.log('[Chat] IM not connected, initializing...')
    await imStore.init()
  }

  await initChatTarget()

  await nextTick()
  scrollToBottom(false)

  // 监听 visualViewport 变化（处理键盘弹出）
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportResize)
  }
})

// 监听新消息
watch(
  () => messages.value.length,
  async (newLen, oldLen) => {
    if (newLen > oldLen) {
      await nextTick()
      if (!showScrollToBottom.value) {
        scrollToBottom()
      }
    }
  }
)

// 监听输入内容变化，自动调整高度
watch(inputMessage, () => {
  nextTick(autoResizeTextarea)
})

// 清理
onUnmounted(() => {
  // 取消订阅会话频道
  if (imStore.currentConversation) {
    imStore.unsubscribeFromConversation(imStore.currentConversation.id)
  }

  imStore.clearCurrentConversation()

  if (window.visualViewport) {
    window.visualViewport.removeEventListener('resize', handleViewportResize)
  }

  // 清理录音状态
  if (isRecording.value) {
    cancelRecording()
  }

  // 清理摄像头
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach(track => track.stop())
  }

  // 停止语音播放
  stopAudioPlay()
})
</script>

<template>
  <div
    ref="containerRef"
    class="fixed inset-0 flex flex-col bg-[#ece5dd]"
    :style="{ height: isKeyboardVisible ? `calc(100% - ${keyboardHeight}px)` : '100%' }"
  >
    <!-- 头部 -->
    <header class="flex h-14 flex-shrink-0 items-center bg-[#075e54] px-2 text-white safe-area-top">
      <button @click="goBack" class="flex h-10 w-10 items-center justify-center rounded-full active:bg-white/20">
        <ArrowLeft class="h-6 w-6" />
      </button>

      <div class="ml-1 flex flex-1 items-center">
        <div class="relative h-10 w-10">
          <!-- 系统联系人（如在线客服）使用与通讯录一致的显示方式 -->
          <template v-if="chatTarget?.type === 'customer_service'">
            <!-- 底层：默认图标 -->
            <div class="absolute inset-0 flex items-center justify-center rounded-full bg-green-500">
              <Headphones class="h-5 w-5 text-white" />
            </div>
            <!-- 顶层：头像图片（如果有且加载成功则覆盖图标） -->
            <img
              v-if="chatTarget?.avatar"
              :src="chatTarget.avatar"
              class="absolute inset-0 h-10 w-10 rounded-full object-cover"
              @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'"
            />
          </template>
          <!-- 普通会话头像 -->
          <template v-else>
            <img
              :src="chatTarget?.avatar || conversation?.avatar || conversation?.target?.avatar || '/default-avatar.png'"
              class="h-10 w-10 rounded-full object-cover"
              @error="(e: Event) => (e.target as HTMLImageElement).src = '/default-avatar.png'"
            />
          </template>
          <div
            v-if="chatTarget?.isOnline"
            class="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#075e54] bg-green-400"
          ></div>
        </div>
        <div class="ml-3 flex-1 overflow-hidden">
          <h1 class="truncate text-base font-medium">
            {{ chatDisplayName }}
          </h1>
          <p v-if="chatTarget?.isOnline" class="text-xs text-green-200">在线</p>
          <p v-else-if="!imStore.isConnected" class="text-xs text-yellow-200">连接中...</p>
        </div>
      </div>

      <div class="flex items-center">
        <!-- 视频通话按钮（暂未实现）
        <button class="flex h-10 w-10 items-center justify-center rounded-full active:bg-white/20">
          <Video class="h-5 w-5" />
        </button>
        -->
        <!-- 语音通话按钮 - 仅私聊显示，群聊和客服不显示 -->
        <button
          v-if="!isGroupChat && !isCustomerService"
          @click="handleVoiceCall"
          class="flex h-10 w-10 items-center justify-center rounded-full active:bg-white/20"
          title="语音通话"
        >
          <Phone class="h-5 w-5" />
        </button>
        <div class="relative">
          <button
            @click="toggleMoreMenu"
            class="flex h-10 w-10 items-center justify-center rounded-full active:bg-white/20"
          >
            <MoreVertical class="h-5 w-5" />
          </button>

          <!-- 更多菜单下拉 -->
          <Transition name="fade">
            <div
              v-if="showMoreMenu"
              class="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-lg bg-white shadow-lg"
            >
              <!-- 群聊选项 -->
              <template v-if="isGroupChat">
                <button
                  @click="goToGroupSettings"
                  class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 active:bg-gray-100"
                >
                  <Settings class="h-4 w-4 text-gray-500" />
                  <span>群设置</span>
                </button>
                <button
                  @click="goToGroupMembers"
                  class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 active:bg-gray-100"
                >
                  <Users class="h-4 w-4 text-gray-500" />
                  <span>群成员</span>
                </button>
              </template>
              <!-- 仅好友会话显示这些选项 -->
              <template v-if="chatTarget?.type === 'friend'">
                <button
                  @click="openRemarkModal"
                  class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 active:bg-gray-100"
                >
                  <Edit3 class="h-4 w-4 text-gray-500" />
                  <span>设置备注</span>
                </button>
                <button
                  @click="handleSetTop"
                  class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 active:bg-gray-100"
                >
                  <Pin class="h-4 w-4 text-gray-500" />
                  <span>{{ friendStore.contacts.friends.find(f => f.id === friendId)?.is_top ? '取消置顶' : '置顶好友' }}</span>
                </button>
                <button
                  @click="handleDeleteFriend"
                  class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-500 active:bg-gray-100"
                >
                  <Trash2 class="h-4 w-4" />
                  <span>删除好友</span>
                </button>
              </template>
              <!-- 通用选项 -->
              <button
                class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 active:bg-gray-100"
              >
                <BellOff class="h-4 w-4 text-gray-500" />
                <span>消息免打扰</span>
              </button>
              <button
                @click="openDeleteConfirm"
                class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-500 active:bg-gray-100"
              >
                <Trash2 class="h-4 w-4" />
                <span>删除聊天</span>
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </header>

    <!-- 遮罩层 - 点击关闭菜单 -->
    <div
      v-if="showMoreMenu"
      class="fixed inset-0 z-10"
      @click="closeMoreMenu"
    ></div>

    <!-- 消息列表 -->
    <div
      ref="messageListRef"
      @scroll="handleScroll"
      class="flex-1 overflow-y-auto overscroll-contain px-3 py-2"
    >
      <!-- 加载更多 -->
      <div v-if="isLoadingMore" class="flex items-center justify-center py-2">
        <div class="h-5 w-5 animate-spin rounded-full border-2 border-[#075e54] border-t-transparent"></div>
      </div>

      <div v-if="!imStore.hasMoreMessages && messages.length > 0" class="py-2 text-center">
        <span class="rounded-full bg-white/80 px-3 py-1 text-xs text-gray-500 shadow-sm">没有更多消息</span>
      </div>

      <div v-if="messages.length === 0 && !imStore.isLoading" class="flex h-full items-center justify-center">
        <div class="rounded-lg bg-white/80 px-4 py-2 shadow-sm">
          <p class="text-sm text-gray-500">开始聊天吧</p>
        </div>
      </div>

      <!-- 消息 -->
      <div v-for="(msg, index) in messages" :key="msg.id || msg.local_id" class="mb-1">
        <!-- 日期分隔 -->
        <div v-if="shouldShowDateSeparator(index)" class="my-3 flex items-center justify-center">
          <span class="rounded-lg bg-[#e1f3fb] px-3 py-1 text-xs text-gray-600 shadow-sm">
            {{ formatDateSeparator(msg.created_at) }}
          </span>
        </div>

        <!-- 消息气泡 -->
        <div :class="['flex', isOwnMessage(msg) ? 'justify-end' : 'justify-start']">
          <div
            :class="[
              'relative max-w-[80%] rounded-lg px-3 py-1.5 shadow',
              isOwnMessage(msg)
                ? 'bg-[#dcf8c6]'
                : 'bg-white',
              msg.is_recalled ? 'italic opacity-70' : ''
            ]"
            @longpress="canRecallMessage(msg) && handleRecall(msg)"
          >
            <template v-if="msg.is_recalled">
              <p class="text-xs text-gray-500">消息已撤回</p>
            </template>

            <template v-else>
              <!-- 文本消息 -->
              <template v-if="msg.type === MessageType.TEXT || !msg.type">
                <p class="whitespace-pre-wrap break-words text-[15px] leading-5 text-gray-800" v-html="linkifyText(msg.content || '')"></p>
              </template>

              <!-- 图片消息 -->
              <template v-else-if="msg.type === MessageType.IMAGE">
                <img
                  :src="getMessageAttachment(msg)?.url || getMessageAttachment(msg)?.path"
                  class="max-h-60 max-w-full cursor-pointer rounded"
                  @click="openImagePreview(getMessageAttachment(msg)?.url || getMessageAttachment(msg)?.path || '')"
                  @error="(e: Event) => (e.target as HTMLImageElement).src = '/image-error.png'"
                />
              </template>

              <!-- 语音消息 - 点击播放 -->
              <template v-else-if="msg.type === MessageType.VOICE">
                <div
                  class="flex cursor-pointer items-center gap-2 py-1 min-w-[140px]"
                  @click="toggleAudioPlay(msg.id, getMessageAttachment(msg)?.url || getMessageAttachment(msg)?.path || '')"
                >
                  <!-- 播放/暂停按钮 -->
                  <div
                    :class="[
                      'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white transition-colors',
                      isAudioPlaying(msg.id) ? 'bg-red-500' : 'bg-[#075e54]'
                    ]"
                  >
                    <div v-if="isAudioPlaying(msg.id)" class="flex items-center gap-0.5">
                      <div class="h-3 w-1 rounded-sm bg-white"></div>
                      <div class="h-3 w-1 rounded-sm bg-white"></div>
                    </div>
                    <Play v-else class="h-4 w-4 ml-0.5" />
                  </div>

                  <!-- 波形/进度条 -->
                  <div class="flex-1">
                    <div class="relative h-1 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        class="absolute left-0 top-0 h-full bg-[#075e54] transition-all duration-100"
                        :style="{ width: currentPlayingMessageId === msg.id ? audioPlayProgress + '%' : '0%' }"
                      ></div>
                    </div>
                    <span class="text-xs text-gray-500 mt-1 block">
                      {{ getMessageAttachment(msg)?.duration || 0 }}''
                    </span>
                  </div>
                </div>
              </template>

              <!-- 视频消息 - 点击下载 -->
              <template v-else-if="msg.type === MessageType.VIDEO">
                <div class="relative cursor-pointer" @click="getMessageAttachment(msg) && downloadFile(getMessageAttachment(msg)!)">
                  <img :src="getMessageAttachment(msg)?.thumbnail || '/video-placeholder.png'" class="max-h-48 max-w-full rounded" />
                  <div class="absolute inset-0 flex items-center justify-center">
                    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-black/50">
                      <Download class="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <p class="mt-1 text-xs text-gray-500">点击下载视频</p>
                </div>
              </template>

              <!-- 文件消息 -->
              <template v-else-if="msg.type === MessageType.FILE">
                <div class="flex cursor-pointer items-center gap-3 py-1" @click="getMessageAttachment(msg) && downloadFile(getMessageAttachment(msg)!)">
                  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white">
                    <FileText class="h-5 w-5" />
                  </div>
                  <div class="flex-1 overflow-hidden">
                    <p class="truncate text-sm font-medium text-gray-800">{{ getMessageAttachment(msg)?.name }}</p>
                    <p class="text-xs text-gray-500">{{ formatFileSize(getMessageAttachment(msg)?.size) }}</p>
                  </div>
                  <Download class="h-5 w-5 text-gray-400" />
                </div>
              </template>

              <!-- 位置消息 -->
              <template v-else-if="msg.type === MessageType.LOCATION">
                <div class="cursor-pointer overflow-hidden rounded" @click="getMessageAttachment(msg) && openLocation(getMessageAttachment(msg)!)">
                  <div class="flex h-24 w-40 items-center justify-center bg-gray-200">
                    <MapPin class="h-8 w-8 text-red-500" />
                  </div>
                  <p class="mt-1 text-xs text-gray-600">{{ getMessageAttachment(msg)?.address || '位置' }}</p>
                </div>
              </template>

              <!-- 红包消息 -->
              <template v-else-if="msg.type === MessageType.PACK && getPackMessageData(msg)">
                <GroupPackMessage
                  :pack-id="getPackMessageData(msg)!.packId"
                  :greeting="getPackMessageData(msg)!.greeting"
                  :total-count="getPackMessageData(msg)!.totalCount"
                  :is-self="isOwnMessage(msg)"
                  :status="getPackMessageData(msg)!.status"
                  :has-grabbed="getPackMessageData(msg)!.hasGrabbed"
                  @click="handlePackClick(getPackMessageData(msg)!.packId)"
                />
              </template>

              <!-- 时间和状态 -->
              <div class="mt-0.5 flex items-center justify-end gap-1">
                <span class="text-[11px] text-gray-500">{{ formatMessageTime(msg.created_at) }}</span>
                <template v-if="isOwnMessage(msg)">
                  <div v-if="msg.status === 0" class="h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-transparent"></div>
                  <button
                    v-else-if="msg.status === -1"
                    @click="handleResend(msg)"
                    class="flex items-center gap-0.5 text-red-500 active:opacity-70"
                    title="点击重新发送"
                  >
                    <span class="text-[11px]">发送失败</span>
                    <span class="text-sm font-bold">!</span>
                  </button>
                  <component
                    v-else
                    :is="getMessageStatusIcon(msg)"
                    :class="['h-4 w-4', msg.status === 3 ? 'text-blue-500' : 'text-gray-400']"
                  />
                </template>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 底部填充，确保最后一条消息不被遮挡 -->
      <div class="h-2"></div>
    </div>

    <!-- 滚动到底部按钮 -->
    <button
      v-if="showScrollToBottom"
      @click="scrollToBottom()"
      class="absolute bottom-24 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg"
    >
      <ChevronDown class="h-5 w-5 text-gray-600" />
    </button>

    <!-- 表情面板 -->
    <div v-if="showEmojiPicker" class="flex-shrink-0 border-t border-gray-200 bg-white">
      <!-- 表情分类 Tab -->
      <div class="flex border-b border-gray-100">
        <button
          v-for="(cat, index) in emojiCategories"
          :key="cat.name"
          @click="activeEmojiCategory = index"
          :class="[
            'flex-1 py-2 text-xs transition-colors',
            activeEmojiCategory === index
              ? 'border-b-2 border-[#00a884] text-[#00a884]'
              : 'text-gray-500'
          ]"
        >
          {{ cat.name }}
        </button>
      </div>
      <!-- 表情列表 -->
      <div class="h-48 overflow-y-auto p-2">
        <div class="grid grid-cols-8 gap-1">
          <button
            v-for="emoji in emojiCategories[activeEmojiCategory].emojis"
            :key="emoji"
            @click="selectEmoji(emoji)"
            class="flex h-10 w-10 items-center justify-center rounded-lg text-2xl active:bg-gray-100"
          >
            {{ emoji }}
          </button>
        </div>
      </div>
    </div>

    <!-- 附件菜单 -->
    <div v-if="showAttachmentMenu" class="flex-shrink-0 border-t border-gray-200 bg-[#f0f0f0] px-4 py-4">
      <div class="grid grid-cols-4 gap-4">
        <button
          v-for="option in attachmentOptions"
          :key="option.action"
          @click="handleAttachmentAction(option.action)"
          class="flex flex-col items-center gap-2"
        >
          <div :class="['flex h-14 w-14 items-center justify-center rounded-full text-white', option.color]">
            <component :is="option.icon" class="h-6 w-6" />
          </div>
          <span class="text-xs text-gray-600">{{ option.label }}</span>
        </button>
      </div>
    </div>

    <!-- 输入区域 -->
    <div
      ref="inputAreaRef"
      class="flex-shrink-0 bg-[#f0f0f0] px-2 py-2 safe-area-bottom"
    >
      <!-- 录音中的 UI -->
      <div v-if="isRecording" class="flex items-center gap-3 rounded-full bg-white px-4 py-3">
        <!-- 录音指示器 -->
        <div class="flex h-3 w-3 animate-pulse rounded-full bg-red-500"></div>

        <!-- 录音时长 -->
        <span class="flex-1 text-center text-lg font-medium text-gray-700">
          {{ formatRecordingDuration(recordingDuration) }}
        </span>

        <!-- 取消按钮 -->
        <button
          @click="cancelRecording"
          class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600"
        >
          <X class="h-5 w-5" />
        </button>

        <!-- 发送按钮 -->
        <button
          @click="stopRecording"
          class="flex h-10 w-10 items-center justify-center rounded-full bg-[#00a884] text-white"
        >
          <Send class="h-5 w-5" />
        </button>
      </div>

      <!-- 正常输入 UI -->
      <div v-else class="flex items-end gap-2">
        <!-- 表情按钮 -->
        <button
          @click="toggleEmojiPicker"
          :class="[
            'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-colors',
            showEmojiPicker ? 'bg-gray-200' : ''
          ]"
        >
          <span class="text-2xl">{{ showEmojiPicker ? '⌨️' : '😊' }}</span>
        </button>

        <!-- 输入框容器 -->
        <div class="flex min-h-[44px] flex-1 items-end rounded-[22px] bg-white px-3 py-2">
          <!-- 附件按钮 -->
          <button
            @click="toggleAttachmentMenu"
            class="mb-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center text-gray-500"
          >
            <Paperclip class="h-5 w-5 transition-transform" :class="{ 'rotate-45': showAttachmentMenu }" />
          </button>

          <!-- 输入框 -->
          <textarea
            ref="inputRef"
            v-model="inputMessage"
            @keydown="handleKeydown"
            @focus="handleInputFocus"
            placeholder="输入消息"
            rows="1"
            class="mx-2 max-h-[120px] flex-1 resize-none bg-transparent text-[16px] leading-5 outline-none"
            style="min-height: 24px"
          ></textarea>

          <!-- 相机按钮 -->
          <button
            @click="openCamera"
            class="mb-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center text-gray-500"
          >
            <Camera class="h-5 w-5" />
          </button>
        </div>

        <!-- 发送/语音按钮 -->
        <button
          v-if="inputMessage.trim()"
          @click="handleSend"
          class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white"
        >
          <Send class="h-5 w-5" />
        </button>
        <!-- 录音按钮 -->
        <button
          v-else
          @click="isRecording ? stopRecording() : startRecording()"
          :class="[
            'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-white transition-all',
            isRecording ? 'bg-red-500 animate-pulse' : 'bg-[#00a884]'
          ]"
        >
          <Mic class="h-5 w-5" />
        </button>
      </div>
    </div>

    <!-- 图片预览 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="selectedImage"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black"
          @click="closeImagePreview"
        >
          <button
            class="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/20"
            @click.stop="closeImagePreview"
          >
            <X class="h-6 w-6 text-white" />
          </button>
          <img :src="selectedImage" class="max-h-full max-w-full object-contain" />
        </div>
      </Transition>
    </Teleport>

    <!-- 摄像头弹窗 (PC端) -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showCameraModal"
          class="fixed inset-0 z-[100] flex flex-col bg-black"
        >
          <!-- 顶部工具栏 -->
          <div class="flex items-center justify-between px-4 py-3">
            <button
              @click="closeCameraModal"
              class="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white"
            >
              <X class="h-6 w-6" />
            </button>
            <span class="text-sm text-white">拍照</span>
            <button
              @click="switchCamera"
              class="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white"
              title="切换摄像头"
            >
              <RefreshCw class="h-5 w-5" />
            </button>
          </div>

          <!-- 摄像头画面 -->
          <div class="relative flex flex-1 items-center justify-center">
            <!-- 视频预览 -->
            <video
              ref="cameraVideoRef"
              autoplay
              playsinline
              muted
              class="max-h-full max-w-full object-contain"
            />

            <!-- 加载中 -->
            <div
              v-if="!isCameraReady && !cameraError"
              class="absolute inset-0 flex items-center justify-center"
            >
              <div class="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
            </div>

            <!-- 错误提示 -->
            <div
              v-if="cameraError"
              class="absolute inset-0 flex flex-col items-center justify-center px-8"
            >
              <Camera class="h-16 w-16 text-white/50" />
              <p class="mt-4 text-center text-white">{{ cameraError }}</p>
              <button
                @click="startCamera"
                class="mt-4 rounded-full bg-white/20 px-6 py-2 text-sm text-white"
              >
                重试
              </button>
            </div>
          </div>

          <!-- 底部拍照按钮 -->
          <div class="flex items-center justify-center py-8">
            <button
              @click="capturePhoto"
              :disabled="!isCameraReady"
              class="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-transparent transition-all active:scale-95 disabled:opacity-50"
            >
              <div class="h-14 w-14 rounded-full bg-white"></div>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 设置备注弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showRemarkModal"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-8"
          @click.self="closeRemarkModal"
        >
          <div class="w-full max-w-sm overflow-hidden rounded-xl bg-white">
            <!-- 标题 -->
            <div class="border-b border-gray-100 px-4 py-3">
              <h3 class="text-center text-base font-medium text-gray-900">设置备注</h3>
            </div>

            <!-- 输入框 -->
            <div class="p-4">
              <input
                v-model="remarkInput"
                type="text"
                placeholder="输入备注名称"
                maxlength="20"
                class="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                @keyup.enter="saveRemark"
              />
              <p class="mt-2 text-xs text-gray-400">备注仅自己可见，最多20个字符</p>
            </div>

            <!-- 按钮 -->
            <div class="flex border-t border-gray-100">
              <button
                @click="closeRemarkModal"
                class="flex-1 py-3 text-sm text-gray-500 active:bg-gray-50"
              >
                取消
              </button>
              <button
                @click="saveRemark"
                :disabled="isSettingRemark"
                class="flex-1 border-l border-gray-100 py-3 text-sm font-medium text-blue-500 active:bg-gray-50 disabled:opacity-50"
              >
                {{ isSettingRemark ? '保存中...' : '保存' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 删除聊天确认弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showDeleteConfirm"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-8"
          @click.self="closeDeleteConfirm"
        >
          <div class="w-full max-w-sm overflow-hidden rounded-xl bg-white">
            <!-- 标题 -->
            <div class="border-b border-gray-100 px-4 py-3">
              <h3 class="text-center text-base font-medium text-gray-900">删除聊天</h3>
            </div>

            <!-- 提示内容 -->
            <div class="p-4">
              <p class="text-center text-sm text-gray-600">
                确定要删除该聊天吗？<br/>
                删除后将从聊天列表移除并清除本地聊天记录。
              </p>
            </div>

            <!-- 按钮 -->
            <div class="flex border-t border-gray-100">
              <button
                @click="closeDeleteConfirm"
                class="flex-1 py-3 text-sm text-gray-500 active:bg-gray-50"
              >
                取消
              </button>
              <button
                @click="confirmDeleteChat"
                :disabled="isDeleting"
                class="flex-1 border-l border-gray-100 py-3 text-sm font-medium text-red-500 active:bg-gray-50 disabled:opacity-50"
              >
                {{ isDeleting ? '删除中...' : '删除' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 发红包弹窗 -->
    <Teleport to="body">
      <GroupPackSend
        v-if="showPackSendDialog && conversation?.id"
        :group-id="conversation.id"
        :member-count="groupMemberCount"
        @close="closePackSendDialog"
        @sent="onPackSent"
      />
    </Teleport>

    <!-- 抢红包弹窗 -->
    <Teleport to="body">
      <GroupPackGrab
        v-if="showPackGrabDialog && currentPackId"
        :pack-id="currentPackId"
        @close="closePackGrabDialog"
        @grabbed="onPackGrabbed"
        @view-detail="openPackDetail(currentPackId!)"
      />
    </Teleport>

    <!-- 红包详情弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showPackDetailDialog && currentPackId"
          class="fixed inset-0 z-[100] bg-white"
        >
          <GroupPackDetail
            :pack-id="currentPackId"
            @close="closePackDetailDialog"
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* iOS 安全区域适配 */
.safe-area-top {
  padding-top: env(safe-area-inset-top, 0);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}

/* 隐藏滚动条但保持滚动功能 */
.overflow-y-auto {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.overflow-y-auto::-webkit-scrollbar {
  display: none;
}

/* 禁止过度滚动效果 */
.overscroll-contain {
  overscroll-behavior: contain;
}
</style>
