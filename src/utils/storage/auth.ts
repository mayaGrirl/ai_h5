import { create } from "zustand";
import { persist } from "zustand/middleware";
import { accessToken } from "@/utils/storage/token";

type AuthState = {
  token: string | null;
  isLogin: boolean;
  hydrated: boolean,

  setToken: (token?: string, tokenType?: string, expiresAt?: number) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      isLogin: false,
      hydrated: false,

      setToken: (token, tokenType, expiresAt) => {
        accessToken.setToken(token, tokenType, expiresAt);

        set({
          token: token ?? null,
          isLogin: !!token,
          hydrated: true,
        });
      },

      logout: () => {
        accessToken.remove();
        set({
          token: null,
          isLogin: false,
          hydrated: false,
        });
      },
    }),
    {
      name: "auth-store", // localStorage key
      onRehydrateStorage: () => (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        state?.hydrated === false && (state.hydrated = true);
      },
      partialize: (state) => ({
        token: state.token,
        isLogin: state.isLogin,
      }),
    }
  )
);
