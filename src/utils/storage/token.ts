export const TokenKey = 'access_token'
export const TokenTypeKey = 'token_type'
export const ExpiresAtKey = 'expires_at'
export const DefaultTokenType = 'Bearer'
export const AuthStore = 'auth-store'

// Token 工具
export const accessToken = {
  setToken(token?: string, tokenType?: string, expiresAt?: number) {
    if (typeof window === 'undefined') return

    if (token) {
      localStorage.setItem(TokenKey, token)
    }
    if (tokenType) {
      localStorage.setItem(TokenTypeKey, tokenType)
    }
    if (expiresAt) {
      localStorage.setItem(ExpiresAtKey, expiresAt.toString())
    }
  },

  getToken() {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TokenKey) || ''
  },

  getTokenType() {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TokenTypeKey) || DefaultTokenType
  },

  getExpiresAt() {
    if (typeof window === 'undefined') return null
    const exp = localStorage.getItem(ExpiresAtKey) || '0'
    return parseInt(exp)
  },

  remove() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(TokenKey)
    localStorage.removeItem(TokenTypeKey)
    localStorage.removeItem(ExpiresAtKey)
    localStorage.removeItem(AuthStore)
  }
}
