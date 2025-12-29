// 接口返回的类型
export interface HttpRes<T> {
  code: number;
  message: string;
  data: T;
  request_id: string;
  [key: string]: unknown;
}

// 分页响应
export interface HttpTotalRes<T> extends HttpRes<T> {
  pagination: {
    page: number;
    page_size: number;
    total: number;
  };
}

// 分页请求
export interface PageRequest {
  search?: unknown;
  pagination: {
    page: number;
    size: number;
  };
}

// SSE 推送
export interface SSEStreamRes<T> {
  data?: T;
  event?: string;
  ts?: string;
}
