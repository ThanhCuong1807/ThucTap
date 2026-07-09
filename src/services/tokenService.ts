import Cookies from 'js-cookie';
import { refreshTokens } from './cognitoService';

// Cookie configuration
const TOKEN_COOKIE_OPTIONS = {
  expires: 7, // 7 days
  secure: true,
  sameSite: 'strict' as const,
  path: '/',
};

const ACCESS_TOKEN_KEY = 'accessToken';
const ID_TOKEN_KEY = 'idToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

/**
 * TokenManager - Quản lý token và session an toàn
 */
class TokenManager {
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly TOKEN_CHECK_INTERVAL = 5 * 60 * 1000; // 5 phút
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.startTokenValidation();
  }

  /**
   * Lưu tokens vào cả sessionStorage và cookies
   */
  setTokens(data: { idToken: string; accessToken: string; refreshToken: string }) {
    // Lưu vào sessionStorage
    sessionStorage.setItem('idToken', data.idToken);
    sessionStorage.setItem('accessToken', data.accessToken);
    sessionStorage.setItem('refreshToken', data.refreshToken);

    // Lưu vào cookies (với httpOnly=false vì đây là client-side)
    Cookies.set(ID_TOKEN_KEY, data.idToken, TOKEN_COOKIE_OPTIONS);
    Cookies.set(ACCESS_TOKEN_KEY, data.accessToken, TOKEN_COOKIE_OPTIONS);

    // Schedule token refresh
    this.scheduleTokenRefresh(data.idToken);
    this.notifyListeners();
  }

  /**
   * Lấy access token
   */
  getAccessToken(): string | null {
    return sessionStorage.getItem('accessToken') || Cookies.get(ACCESS_TOKEN_KEY) || null;
  }

  /**
   * Lấy ID token
   */
  getIdToken(): string | null {
    return sessionStorage.getItem('idToken') || Cookies.get(ID_TOKEN_KEY) || null;
  }

  /**
   * Kiểm tra token còn hạn
   */
  checkTokenValidity(): boolean {
    const idToken = this.getIdToken();
    if (!idToken) return false;

    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      return Date.now() < expirationTime;
    } catch {
      return false;
    }
  }

  /**
   * Lấy thời gian hết hạn của token
   */
  getTokenExpiration(): Date | null {
    const idToken = this.getIdToken();
    if (!idToken) return null;

    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch {
      return null;
    }
  }

  /**
   * Lấy user info từ token
   */
  getUserFromToken(): { email?: string; name?: string; sub?: string } | null {
    const idToken = this.getIdToken();
    if (!idToken) return null;

    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      return {
        email: payload.email,
        name: payload.name,
        sub: payload.sub,
      };
    } catch {
      return null;
    }
  }

  /**
   * Lên lịch refresh token trước khi hết hạn
   */
  private scheduleTokenRefresh(idToken: string) {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      const expirationTime = payload.exp * 1000;
      const refreshTime = expirationTime - 5 * 60 * 1000; // Refresh 5 phút trước
      const now = Date.now();

      if (refreshTime > now) {
        const delay = refreshTime - now;
        this.refreshTimer = setTimeout(async () => {
          await this.attemptRefresh();
        }, delay);
      }
    } catch (error) {
      console.error('Error scheduling token refresh:', error);
    }
  }

  /**
   * Thử refresh token
   */
  private async attemptRefresh(): Promise<boolean> {
    try {
      const success = await refreshTokens();
      if (success) {
        console.log('Token refreshed successfully');
        this.notifyListeners();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Bắt đầu kiểm tra token định kỳ
   */
  private startTokenValidation() {
    setInterval(async () => {
      if (!this.checkTokenValidity()) {
        const refreshed = await this.attemptRefresh();
        if (!refreshed) {
          this.clearAllTokens();
          this.notifyListeners();
        }
      }
    }, this.TOKEN_CHECK_INTERVAL);
  }

  /**
   * Xóa tất cả tokens
   */
  clearAllTokens() {
    // Xóa sessionStorage
    sessionStorage.removeItem('idToken');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');

    // Xóa cookies
    Cookies.remove(ID_TOKEN_KEY);
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);

    // Xóa refresh timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.notifyListeners();
  }

  /**
   * Subscribe to token changes
   */
  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners() {
    this.listeners.forEach(callback => callback());
  }

  /**
   * Kiểm tra user đã đăng nhập chưa
   */
  isAuthenticated(): boolean {
    return this.checkTokenValidity() && !!this.getAccessToken();
  }

  /**
   * Lấy Authorization header
   */
  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getAccessToken();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();

// Export functions for convenience
export const setTokens = (data: { idToken: string; accessToken: string; refreshToken: string }) => 
  tokenManager.setTokens(data);

export const clearTokens = () => tokenManager.clearAllTokens();

export const getAccessToken = () => tokenManager.getAccessToken();

export const getIdToken = () => tokenManager.getIdToken();

export const isAuthenticated = () => tokenManager.isAuthenticated();

export const getAuthHeader = () => tokenManager.getAuthHeader();
