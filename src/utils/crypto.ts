import { ed25519 } from '@noble/curves/ed25519.js'
import { toByteArray } from 'base64-js'
import { SignatureGenerate } from './sign'

interface SignedData {
  signature: string
  timestamp: number
  nonce: string
}

export class CryptoUtils {
  /**
   * 使用私钥签名数据
   */
  private static async signData(privateKey: string, data: string): Promise<string> {
    try {
      // 从 PEM 私钥提取原始 32 字节私钥
      const privateKeyRaw = this.extractPrivateKeyFromPem(privateKey)

      // 签名数据
      const signature = ed25519.sign(
        new TextEncoder().encode(data),
        privateKeyRaw
      )

      // 返回 Base64 编码的签名
      return btoa(String.fromCharCode(...signature))
    } catch (error) {
      console.error('签名失败:', error)
      throw new Error('签名失败')
    }
  }

  private static extractPrivateKeyFromPem(pem: string): Uint8Array {
    // 移除 PEM 头尾和换行符
    const base64 = pem
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\n/g, '')

    // 解码 DER 格式
    const der = toByteArray(base64)

    // PKCS#8 结构解析
    if (der.length < 48 || der[0] !== 0x30 || der[1] !== 0x2e) {
      throw new Error('无效的 PKCS#8 私钥格式')
    }

    // 提取最后 32 字节（Ed25519 的原始私钥）
    return der.slice(der.length - 32)
  }

  /**
   * 生成带签名的请求数据
   */
  static async createSignedRequest(data: {
    method: string
    path: string
    privateKey: string
    body: Record<string, unknown>
  }): Promise<SignedData> {
    const { method, path, privateKey, body } = data
    const timestamp = Math.floor(Date.now() / 1000)
    const nonce = CryptoUtils.generateNonce()

    // 扁平化参数
    let str1 = ''
    if (Object.keys(body).length) {
      str1 = SignatureGenerate.jsonToQueryString(body, true, true)
    }
    const rawData = method + path + str1 + timestamp + nonce

    // 签名数据
    const signature = await this.signData(privateKey, rawData)

    return {
      signature,
      timestamp,
      nonce
    }
  }

  /**
   * 生成随机nonce
   */
  private static generateNonce(): string {
    return 'uuid' + Math.random().toString(36).substring(2, 10)
  }
}
