import {HttpRes} from "@/types/http.type";
import {BlockField} from "@/types/customer.type";
import http from "@/utils/request";
import {CustomerLevelField, RKey} from "@/types/common.type";

/**
 * 获取Block数据
 */
export const getBlockByIdentifier = (identifier:string): Promise<HttpRes<BlockField>> => {
  return http.get(`/api/app/v1/block/identifier/${identifier}`, {});
};

/**
 * 获取Block数据
 */
export const getPasswordTip = (): Promise<HttpRes<BlockField>> => {
  return http.get(`/api/app/v1/password/tip`, {});
};

/**
 * 获取会员等级选项
 */
export const getCustomerLevelOptions = (): Promise<HttpRes<CustomerLevelField[]>> => {
  return http.get(`/api/app/v1/customer-level/options`, {});
};

/**
 * 获取公钥key
 */
export const httpConfigRKey = (): Promise<HttpRes<RKey>> => {
  return http.get(`/api/app/v1/r-key`, {});
};

/**
 * 上传文件响应类型
 */
export interface UploadFileResponse {
  file_name: string
  file_uri: string
  file_url: string
  file_size: number
  file_mime: string
  image_width?: number
  image_height?: number
}

/**
 * 上传文件
 */
export const uploadFile = (file: File): Promise<HttpRes<UploadFileResponse>> => {
  const formData = new FormData()
  formData.append('file', file)
  // 不要手动设置 Content-Type，axios 会自动设置正确的 multipart/form-data 及 boundary
  return http.post(`/api/app/v1/only-upload`, formData)
};
