import sodium from 'libsodium-wrappers';

export default class SodiumEncryptor {
  /**
   * 使用 sodium sealed box 公钥加密
   */
  static async encrypt(
    plainText: string,
    publicKeyBase64: string
  ): Promise<string> {
    if (!plainText) {
      throw new Error('明文不能为空');
    }
    if (!publicKeyBase64) {
      throw new Error('公钥不能为空');
    }

    // 等待 wasm 初始化
    await sodium.ready;

    const publicKey = sodium.from_base64(
      publicKeyBase64,
      sodium.base64_variants.ORIGINAL
    );

    const message = sodium.from_string(plainText);

    const cipher = sodium.crypto_box_seal(message, publicKey);

    // 返回 base64
    return sodium.to_base64(cipher);
  }
}
