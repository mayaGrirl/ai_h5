"use client";

import { useEffect, useState } from "react";
import {toast} from "sonner";
import {SSEStreamRes} from "@/types/http.type";

export default function SseDemo() {
  const [messages, setMessages] = useState<SSEStreamRes<unknown>[]>([]);

  useEffect(() => {

    /**
     * 用普通接口换 SSE key
     * 在需要连接SSE接口的页面通过开奖记录列表返回SSE Key，保存缓存获取用户信息
     */
    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
    const es = new EventSource(BASE_URL + "/api/app/v1/sse/lottery?sse_key=" + '');

    // 开奖
    es.addEventListener('lottery', (e) => {
      const data = JSON.parse(e.data);
      // 更新开奖结果
      setMessages((prev) => [...prev, data]);
      // 可选：更新 UI 显示“在线”
    });

    // 心跳
    es.addEventListener('heartbeat', (e) => {
      const data = JSON.parse(e.data);
      // 更新开奖结果
      setMessages((prev) => [...prev, data]);
      // 可选：更新 UI 显示“在线”
    });

    es.onerror = (err) => {
      console.error("SSE error", err);

      toast.warning('SSE 链接失败')
      // EventSource 会自动重连
      // 你可以在这里做 UI 提示，比如“重连中…”

      es.close();
    };

    return () => {
      es.close();
    };
  }, []);

  return (
    <div>
      <h2>SSE 消息</h2>
      {messages.map((m, i) => (
        <div key={i}>
          {m?.event} - {new Date(m?.ts || 0).toLocaleTimeString()}
        </div>
      ))}
    </div>
  );
}
