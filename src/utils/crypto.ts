// src/utils/cryptoUtils.ts
// import 'react-native-get-random-values';
import { ed25519 } from "@noble/curves/ed25519.js";

import {fromByteArray, toByteArray} from 'base64-js';

import {Buffer} from 'buffer';
import {SignatureGenerate} from './sign';

interface KeyPair {
  publicKey: string;
  privateKey: string;
}

interface SignedData {
  signature: string;
  timestamp: number;
  nonce: string;
}

export class CryptoUtils {
  /**
   * 生成ED25519密钥对
   * @returns 包含base64编码的公私钥对象
   */
  static async generateKeyPair(): Promise<KeyPair> {
    try {
      // 1. 生成原始 32 字节私钥
      const privateKeyRaw = ed25519.utils.randomSecretKey();

      // 2. 构建 PKCS#8 DER 编码的私钥 (OpenSSL 兼容)
      const pkcs8Header = new Uint8Array([
        0x30,
        0x2e, // SEQUENCE (48 bytes)
        0x02,
        0x01,
        0x00, // INTEGER (version 0)
        0x30,
        0x05, // SEQUENCE (5 bytes, algorithm identifier)
        0x06,
        0x03,
        0x2b,
        0x65,
        0x70, // OID 1.3.101.110 (Ed25519)
        0x04,
        0x22, // OCTET STRING (34 bytes, private key)
        0x04,
        0x20, // OCTET STRING (32 bytes, actual key)
      ]);
      const pkcs8PrivateKey = new Uint8Array([
        ...pkcs8Header,
        ...privateKeyRaw,
      ]);

      // 3. 转换为 PEM 格式
      const pemPrivateKey = `${fromByteArray(pkcs8PrivateKey)
        .match(/.{1,64}/g)
        ?.join('\n')}`;

      // 4. 生成 SPKI 格式的公钥 (PEM)
      const publicKey = ed25519.getPublicKey(privateKeyRaw);
      const spkiHeader = new Uint8Array([
        0x30,
        0x2a, // SEQUENCE (42 bytes)
        0x30,
        0x05, // SEQUENCE (5 bytes, algorithm identifier)
        0x06,
        0x03,
        0x2b,
        0x65,
        0x70, // OID 1.3.101.110 (Ed25519)
        0x03,
        0x21, // BIT STRING (33 bytes)
        0x00, // 未使用的位数
      ]);
      const spkiPublicKey = new Uint8Array([...spkiHeader, ...publicKey]);
      const pemPublicKey = `${fromByteArray(spkiPublicKey)
        .match(/.{1,64}/g)
        ?.join('\n')}`;

      return {privateKey: pemPrivateKey, publicKey: pemPublicKey};
    } catch (error) {
      console.error('密钥对生成失败:', error);
      throw new Error('密钥对生成失败');
    }
  }

  /**
   * 使用私钥签名数据
   * @param privateKey base64编码的私钥
   * @param data 要签名的数据
   * @returns base64编码的签名
   */
  private static async signData(
    privateKey: string,
    data: string,
  ): Promise<string> {
    try {
      // 1. 从 PEM 私钥提取原始 32 字节私钥
      const privateKeyRaw = this.extractPrivateKeyFromPem(privateKey);

      // 2. 签名数据
      const signature = ed25519.sign(
        new TextEncoder().encode(data),
        privateKeyRaw,
      );

      // 3. 返回 Base64 编码的签名
      return Buffer.from(signature).toString('base64');
    } catch (error) {
      console.error('签名失败:', error);
      throw new Error('签名失败');
    }
  }

  private static extractPrivateKeyFromPem(pem: string): Uint8Array {
    // 移除 PEM 头尾和换行符
    const base64 = pem
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\n/g, '');

    // 解码 DER 格式
    const der = toByteArray(base64);

    // PKCS#8 结构解析：
    // SEQUENCE(48) -> VERSION(1) + ALGORITHM(5) + OCTET STRING(34) -> 实际私钥(32)
    if (der.length < 48 || der[0] !== 0x30 || der[1] !== 0x2e) {
      throw new Error('无效的 PKCS#8 私钥格式');
    }

    // 提取最后 32 字节（Ed25519 的原始私钥）
    return der.slice(der.length - 32);
  }

  /**
   * 生成带签名的请求数据
   * @returns 包含签名和元数据的对象
   * @param data
   */
  static async createSignedRequest(data: {
    method: string;
    path: string;
    privateKey: string;
    body: Record<string, unknown>;
  }): Promise<SignedData> {
    const {method, path, privateKey, body} = data;
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = CryptoUtils.generateNonce();
    let str1 = '';
    if (Object.keys(body).length) {
      str1 = SignatureGenerate.jsonToQueryString(body, true, true);
    }
    const rawData = method + path + str1 + timestamp + nonce;

    // todo 1. 签名数据
    const signature = 'Sign';// await this.signData(privateKey, rawData);
    return {
      signature,
      timestamp,
      nonce,
    };
  }

  /**
   * 生成随机nonce
   * @returns 随机字符串
   */
  private static generateNonce(): string {
    return 'uuid' + Math.random().toString(36).substring(2, 10);
  }
}
