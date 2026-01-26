import { HttpRes } from '@/types/http.type'
import http from '@/utils/request'

/**
 * 发起通话响应
 */
export interface InitiateCallResponse {
  call_id: string
  target_id: number
  target_name: string
  target_avatar: string
}

/**
 * 发起通话
 */
export const initiateCall = (targetId: number): Promise<HttpRes<InitiateCallResponse>> => {
  return http.post('/api/app/v1/voice-call/initiate', { target_id: targetId })
}

/**
 * 接受通话
 */
export const acceptCall = (callId: string, callerId: number): Promise<HttpRes<{ accepted: boolean }>> => {
  return http.post('/api/app/v1/voice-call/accept', { call_id: callId, caller_id: callerId })
}

/**
 * 拒绝通话
 */
export const rejectCall = (callId: string, callerId: number, reason?: string): Promise<HttpRes<{ rejected: boolean }>> => {
  return http.post('/api/app/v1/voice-call/reject', { call_id: callId, caller_id: callerId, reason })
}

/**
 * 取消呼叫
 */
export const cancelCall = (callId: string, targetId: number): Promise<HttpRes<{ cancelled: boolean }>> => {
  return http.post('/api/app/v1/voice-call/cancel', { call_id: callId, target_id: targetId })
}

/**
 * 结束通话
 */
export const endCall = (callId: string, peerId: number): Promise<HttpRes<{ ended: boolean }>> => {
  return http.post('/api/app/v1/voice-call/end', { call_id: callId, peer_id: peerId })
}

/**
 * 发送 WebRTC 信令
 */
export const sendSignal = (
  targetId: number,
  callId: string,
  signalType: 'offer' | 'answer' | 'ice',
  signalData: any
): Promise<HttpRes<{ sent: boolean }>> => {
  return http.post('/api/app/v1/voice-call/signal', {
    target_id: targetId,
    call_id: callId,
    signal_type: signalType,
    signal_data: signalData,
  })
}
