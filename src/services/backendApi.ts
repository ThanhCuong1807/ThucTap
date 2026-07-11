import { backendBaseUrl } from '../config/aws';
import { getAccessToken } from '../services/tokenService';

export interface UploadInitResponse {
  message: string;
  fileId: string;
  uploadUrl: string;
  expiresIn: number;
}

export interface HistoryItem {
  id: string;
  fileId?: string;
  fileName: string;
  status: 'pending' | 'scanning' | 'completed' | 'malware';
  uploadTime: string;
  threatLevel?: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  threatType?: string;
  fileSize?: number;
}

export interface HistoryResponse {
  items: HistoryItem[];
  count: number;
}

export interface ApiError {
  message?: string;
  error?: string;
}

const getAuthHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  return headers;
};

export const backendApi = {
  async createUpload(fileName: string, fileSize: number): Promise<UploadInitResponse> {
    const response = await fetch(`${backendBaseUrl}/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ fileName, fileSize }),
    });

    const data = (await response.json()) as UploadInitResponse | ApiError;
    if (!response.ok) {
      throw new Error((data as ApiError).message || (data as ApiError).error || 'Khởi tạo upload thất bại');
    }
    return data as UploadInitResponse;
  },

  async getResult(fileId: string): Promise<HistoryItem> {
    const response = await fetch(`${backendBaseUrl}/get-result/${encodeURIComponent(fileId)}`, {
      headers: getAuthHeaders(),
    });

    const data = (await response.json()) as HistoryItem | ApiError;
    if (!response.ok) {
      throw new Error((data as ApiError).message || (data as ApiError).error || 'Không lấy được kết quả phân tích');
    }
    return data as HistoryItem;
  },

  async getHistory(): Promise<HistoryResponse> {
    const response = await fetch(`${backendBaseUrl}/history`, {
      headers: getAuthHeaders(),
    });

    const data = (await response.json()) as HistoryResponse | ApiError;
    if (!response.ok) {
      throw new Error((data as ApiError).message || (data as ApiError).error || 'Không lấy được lịch sử phân tích');
    }
    return data as HistoryResponse;
  },
};
