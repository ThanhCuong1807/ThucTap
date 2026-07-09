import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  GetUserCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ResendConfirmationCodeCommand,
  GlobalSignOutCommand,
  InitiateAuthCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import { awsConfig } from '../config/aws';

// Khởi tạo Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
  region: awsConfig.region,
});

export interface SignUpData {
  email: string;
  password: string;
  name: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthUser {
  email: string;
  name: string;
  sub: string;
  emailVerified: boolean;
}

/**
 * Đăng ký tài khoản mới
 */
export async function signUp(data: SignUpData): Promise<{ userSub: string }> {
  try {
    const command = new SignUpCommand({
      ClientId: awsConfig.userPoolWebClientId,
      Username: data.email,
      Password: data.password,
      UserAttributes: [
        { Name: 'email', Value: data.email },
        { Name: 'name', Value: data.name },
      ],
    });

    const response = await cognitoClient.send(command);
    return { userSub: response.UserSub || '' };
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw new Error(error.message || 'Đăng ký thất bại');
  }
}

/**
 * Xác nhận email sau khi đăng ký
 */
export async function confirmSignUp(email: string, code: string): Promise<void> {
  try {
    const command = new ConfirmSignUpCommand({
      ClientId: awsConfig.userPoolWebClientId,
      Username: email,
      ConfirmationCode: code,
    });

    await cognitoClient.send(command);
  } catch (error: any) {
    console.error('Confirm sign up error:', error);
    throw new Error(error.message || 'Xác nhận thất bại');
  }
}

/**
 * Đăng nhập - sử dụng USER_PASSWORD_AUTH flow
 */
export async function signIn(data: SignInData): Promise<{
  idToken: string;
  accessToken: string;
  refreshToken: string;
}> {
  try {
    // Thử USER_PASSWORD_AUTH trước
    const command = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
      ClientId: awsConfig.userPoolWebClientId,
      AuthParameters: {
        USERNAME: data.email,
        PASSWORD: data.password,
      },
    });

    const response = await cognitoClient.send(command);
    
    if (!response.AuthenticationResult) {
      throw new Error('Đăng nhập thất bại');
    }

    return {
      idToken: response.AuthenticationResult.IdToken || '',
      accessToken: response.AuthenticationResult.AccessToken || '',
      refreshToken: response.AuthenticationResult.RefreshToken || '',
    };
  } catch (error: any) {
    console.error('Sign in error:', error);
    
    if (error.name === 'NotAuthorizedException') {
      throw new Error('Email hoặc mật khẩu không đúng');
    }
    if (error.name === 'UserNotConfirmedException') {
      throw new Error('Tài khoản chưa được xác nhận. Vui lòng kiểm tra email.');
    }
    if (error.name === 'UnknownEndpoint') {
      throw new Error('Không thể kết nối đến AWS. Vui lòng kiểm tra kết nối mạng.');
    }
    
    throw new Error(error.message || 'Đăng nhập thất bại');
  }
}

/**
 * Đăng xuất
 */
export async function signOut(): Promise<void> {
  try {
    const accessToken = sessionStorage.getItem('accessToken');
    
    if (accessToken) {
      const command = new GlobalSignOutCommand({
        AccessToken: accessToken,
      });
      await cognitoClient.send(command);
    }
    
    // Xóa tất cả tokens
    sessionStorage.removeItem('idToken');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    
    // Xóa cookie
    document.cookie = 'idToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  } catch (error: any) {
    console.error('Sign out error:', error);
    // Vẫn xóa local data dù có lỗi
    sessionStorage.removeItem('idToken');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
  }
}

/**
 * Lấy thông tin user hiện tại
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) {
      return null;
    }

    const command = new GetUserCommand({
      AccessToken: accessToken,
    });

    const response = await cognitoClient.send(command);
    
    const userAttr = response.UserAttributes || [];
    const getAttr = (name: string) => userAttr.find(attr => attr.Name === name)?.Value || '';
    
    return {
      email: getAttr('email'),
      name: getAttr('name'),
      sub: response.Username || '',
      emailVerified: getAttr('email_verified') === 'true',
    };
  } catch (error: any) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Gửi lại mã xác nhận
 */
export async function resendConfirmationCode(email: string): Promise<void> {
  try {
    const command = new ResendConfirmationCodeCommand({
      ClientId: awsConfig.userPoolWebClientId,
      Username: email,
    });

    await cognitoClient.send(command);
  } catch (error: any) {
    console.error('Resend confirmation code error:', error);
    throw new Error(error.message || 'Gửi lại mã thất bại');
  }
}

/**
 * Quên mật khẩu - gửi yêu cầu reset
 */
export async function forgotPassword(email: string): Promise<void> {
  try {
    const command = new ForgotPasswordCommand({
      ClientId: awsConfig.userPoolWebClientId,
      Username: email,
    });

    await cognitoClient.send(command);
  } catch (error: any) {
    console.error('Forgot password error:', error);
    throw new Error(error.message || 'Yêu cầu reset mật khẩu thất bại');
  }
}

/**
 * Xác nhận reset mật khẩu
 */
export async function confirmForgotPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  try {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: awsConfig.userPoolWebClientId,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    });

    await cognitoClient.send(command);
  } catch (error: any) {
    console.error('Confirm forgot password error:', error);
    throw new Error(error.message || 'Reset mật khẩu thất bại');
  }
}

/**
 * Refresh token để lấy access token mới
 */
export async function refreshTokens(): Promise<boolean> {
  try {
    const refreshToken = sessionStorage.getItem('refreshToken');
    if (!refreshToken) {
      return false;
    }

    const command = new InitiateAuthCommand({
      AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
      ClientId: awsConfig.userPoolWebClientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    const response = await cognitoClient.send(command);
    
    if (response.AuthenticationResult) {
      sessionStorage.setItem('idToken', response.AuthenticationResult.IdToken || '');
      sessionStorage.setItem('accessToken', response.AuthenticationResult.AccessToken || '');
      return true;
    }
    
    return false;
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return false;
  }
}

/**
 * Kiểm tra token còn hạn không
 */
export function isTokenValid(): boolean {
  const idToken = sessionStorage.getItem('idToken');
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
 * Lấy token từ session storage
 */
export function getStoredTokens() {
  return {
    idToken: sessionStorage.getItem('idToken'),
    accessToken: sessionStorage.getItem('accessToken'),
    refreshToken: sessionStorage.getItem('refreshToken'),
  };
}
