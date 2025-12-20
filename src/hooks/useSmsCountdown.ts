import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type props = {
  duration?: number; // 倒计时秒数
  onSend: () => Promise<unknown>;
};

export function useSmsCountdown({duration = 60, onSend}: props) {
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(async () => {
    if (countdown > 0) return;

    try {
      await onSend();

      setCountdown(duration);
    } catch (err) {
      console.error(err);
    }
  }, [countdown, duration, onSend]);

  useEffect(() => {
    if (countdown <= 0) return;

    timerRef.current = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [countdown]);

  return {
    countdown,
    start,
    disabled: countdown > 0,
  };
}
