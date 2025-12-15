export const TokenKey = "access_token";
export const TokenTypeKey = 'token_type';
export const ExpiresAtKey = 'expires_at';
export const DefaultTokenType = 'Bearer';
export const AuthStore = 'auth-store';


// Token 工具
export const accessToken = {
  setToken(token?: string, tokenType?: string, expiresAt?: number) {
    if (typeof window === "undefined") return;

    if (token) {
      localStorage.setItem(TokenKey, token);
    }
    if (tokenType) {
      localStorage.setItem(TokenTypeKey, tokenType);
    }
    if (expiresAt) {
      localStorage.setItem(ExpiresAtKey, expiresAt.toString());
    }
  },

  /**
   * This function retrieves a token from the session storage or returns an empty string if it doesn't
   * exist.
   */
  getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TokenKey) || '';
  },

  /**
   * This function retrieves the token type from session storage or returns a default value.
   */
  getTokenType() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TokenTypeKey) || DefaultTokenType;
  },

  /**
   * This function retrieves the expiration time from the session storage.
   */
  getExpiresAt() {
    if (typeof window === "undefined") return null;
    const exp = localStorage.getItem(ExpiresAtKey) || '0';
    return parseInt(exp);
  },

  remove() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TokenKey);
    localStorage.removeItem(TokenTypeKey);
    localStorage.removeItem(ExpiresAtKey);
    localStorage.removeItem(AuthStore);
  },
};
