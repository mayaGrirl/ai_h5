"use client";

import React, {useEffect} from "react";
import {currentCustomer} from "@/api/auth";
import {useAuthStore} from "@/utils/storage/auth";

export default function AuthProvider({children}: { children: React.ReactNode }) {
  const setCurrentCustomer = useAuthStore((s) => s.setCurrentCustomer);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const {data} = await currentCustomer();
        setCurrentCustomer(data);
      } catch (error) {
        console.info('Get Current Customer Error: ', error);
      }
    };

    void initAuth();
  }, [setCurrentCustomer]);

  return children;
}
