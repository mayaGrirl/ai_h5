import { create } from "zustand";
import { persist } from "zustand/middleware";
import { accessToken } from "@/utils/storage/token";
import {CustomerField} from "@/types/customer.type";

type AuthState = {
  token: string | null;
  isLogin: boolean;
  hydrated: boolean,
  currentCustomer: CustomerField | null;

  setToken: (token?: string, tokenType?: string, expiresAt?: number) => void;
  logout: () => void;
  setCurrentCustomer: (customer: CustomerField | null) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentCustomer: null,
      token: null,
      isLogin: false,
      hydrated: false,

      setCurrentCustomer: (customer: CustomerField | null) => {
        set({
          currentCustomer: customer,
          isLogin: !!customer,
        })
      },

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
          currentCustomer: null,
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
