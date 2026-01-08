/**
 * 设置Key
 * @param token
 * @param expireSeconds
 */
export function setSecureToken(token: string, expireSeconds = 300) {
  const data = {
    token,
    expire: Date.now() + expireSeconds * 1000
  }
  localStorage.setItem('secure_verify_token', JSON.stringify(data))
}

/**
 * 获取验证拿到的Key
 */
export function getSecureToken() {
  const str = localStorage.getItem('secure_verify_token')
  if (!str) return null

  const data = JSON.parse(str)
  if (Date.now() > data.expire) {
    localStorage.removeItem('secure_verify_token')
    return null
  }

  return data.token
}

/**
 * 删除验证token
 */
export function clearSecureToken() {
  localStorage.removeItem('secure_verify_token')
}
