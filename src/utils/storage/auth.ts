import { create } from "zustand";
import { accessToken } from "@/utils/storage/token";

type AuthState = {
  token: string | null;
  isLogin: boolean;

  setToken: (token?: string, tokenType?: string, expiresAt?: number) => void;
  logout: () => void;
  initFromStorage: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isLogin: false,

  // 登录成功后调用
  setToken: (token,tokenType, expiresAt) => {
    accessToken.setToken(token, tokenType, expiresAt);
    set({
      token,
      isLogin: true,
    });
  },

  // 退出登录
  logout: () => {
    accessToken.remove();
    set({
      token: null,
      isLogin: false,
    });
  },

  // 应用初始化时调用（非常重要）
  initFromStorage: () => {
    const token = accessToken.getToken();
    if (token) {
      set({
        token: token,
        isLogin: true,
      });
    }
  },
}));
