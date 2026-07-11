// AWS Configuration - Thay thế các giá trị này bằng thông tin từ AWS Console của bạn
export const awsConfig = {
  region: import.meta.env.VITE_AWS_REGION || 'ap-southeast-1',
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'ap-southeast-1_xxxxxxxxx',
  userPoolWebClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
  s3BucketName: import.meta.env.VITE_S3_BUCKET_NAME || 'malware-analysis-bucket',
  identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID || 'ap-southeast-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  backendApiUrl: import.meta.env.VITE_BACKEND_API_URL || 'https://<api-id>.execute-api.<region>.amazonaws.com/dev',
};

// OAuth endpoints (nếu sử dụng)
export const oauthConfig = {
  domain: import.meta.env.VITE_COGNITO_DOMAIN || 'your-domain.auth.ap-southeast-1.amazoncognito.com',
  scope: ['email', 'openid', 'profile'],
  redirectSignIn: import.meta.env.VITE_REDIRECT_SIGN_IN || 'http://localhost:3000/',
  redirectSignOut: import.meta.env.VITE_REDIRECT_SIGN_OUT || 'http://localhost:3000/login',
};

export const backendBaseUrl = awsConfig.backendApiUrl.replace(/\/$/, '');
