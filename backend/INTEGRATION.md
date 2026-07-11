# Backend Integration Guide

Hướng dẫn tích hợp frontend với backend serverless đã được đồng bộ.

## Cấu trúc API

### Base URL
```
https://<api-id>.execute-api.<region>.amazonaws.com/dev
```

Lưu giá trị này vào frontend environment variable:
```bash
VITE_BACKEND_API_URL=https://<api-id>.execute-api.<region>.amazonaws.com/dev
```

### Authentication
Tất cả API requests đều dùng header Authorization từ Cognito tokens của frontend:
```javascript
headers: {
  'Authorization': `Bearer ${getAccessToken()}`,
  'Content-Type': 'application/json'
}
```

Backend hiện không tự quản lý Cognito; nó lấy userId từ token Cognito mà frontend đã có.

## 1. Upload File Endpoint

### Request
```http
POST /upload
Headers:
  Authorization: Bearer <id_token>
  Content-Type: application/json

Body:
{
  "fileName": "sample.exe",
  "fileSize": 1024000
}
```

### Response
```json
{
  "message": "Upload initiated successfully",
  "fileId": "uuid-here",
  "uploadUrl": "https://bucket.s3.amazonaws.com/samples/...",
  "expiresIn": 3600
}
```

### Usage
1. Gọi `/upload` để lấy `uploadUrl` và `fileId`
2. Upload file trực tiếp lên `uploadUrl` bằng PUT request
3. Frontend sẽ nhận được `fileId` để theo dõi trạng thái

## 2. Get Result Endpoint

### Request
```http
GET /get-result/{fileId}
Headers:
  Authorization: Bearer <id_token>
```

### Response
```json
{
  "fileId": "uuid-here",
  "fileName": "sample.exe",
  "status": "pending",
  "uploadTime": "2024-01-01T00:00:00.000Z",
  "threatLevel": "safe",
  "threatType": "",
  "fileSize": 1024000
}
```

### Status Values
- `pending`: File đã được đưa vào hàng đợi / đang chờ xử lý
- `scanning`: Đang phân tích
- `completed`: Phân tích hoàn tất, không phát hiện mối đe dọa
- `malware`: Phát hiện mã độc

### Threat Levels
- `safe`: File an toàn
- `low`: Mối đe dọa thấp (adware, PUP)
- `medium`: Mối đe dọa trung bình (trojan, spyware)
- `high`: Mối đe dọa cao (ransomware, rootkit)
- `critical`: Mối đe dọa nghiêm trọng (APT, zero-day)

## 3. Get History Endpoint

### Request
```http
GET /history
Headers:
  Authorization: Bearer <id_token>
```

### Response
```json
{
  "items": [
    {
      "id": "uuid-here",
      "fileId": "uuid-here",
      "fileName": "sample.exe",
      "status": "completed",
      "uploadTime": "2024-01-01T00:00:00.000Z",
      "threatLevel": "safe",
      "threatType": "",
      "fileSize": 1024000
    }
  ],
  "count": 10
}
```

## Frontend Integration

Mã frontend hiện tại đã được cập nhật để gọi 3 endpoint này:
- `src/services/backendApi.ts` - API client
- `src/components/FileUpload.tsx` - Upload qua `/upload` rồi PUT lên S3
- `src/pages/DashboardPage.tsx` - Tải `/history` và polling để cập nhật trạng thái

## Triển khai Backend

```bash
# Build
cd backend
sam build

# Deploy
sam deploy --guided
```

Sau khi deploy, SAM sẽ cung cấp:
- API Gateway URL
- S3 Bucket name

Cập nhật `VITE_BACKEND_API_URL` và `VITE_S3_BUCKET_NAME` vào frontend `.env`.
