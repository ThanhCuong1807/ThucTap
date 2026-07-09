# Malware Detection - Frontend

Frontend cho hệ thống phân tích và phát hiện mã độc sử dụng AWS.

## Yêu cầu

- Node.js 18+
- npm hoặc yarn

## Cài đặt

```bash
npm install
```

## Cấu hình

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Các biến môi trường cần thiết:

| Biến | Mô tả |
|-------|--------|
| `VITE_AWS_REGION` | Region AWS (VD: ap-southeast-1) |
| `VITE_COGNITO_USER_POOL_ID` | User Pool ID từ AWS Cognito |
| `VITE_COGNITO_CLIENT_ID` | App Client ID từ Cognito |
| `VITE_S3_BUCKET_NAME` | Tên bucket S3 |
| `VITE_IDENTITY_POOL_ID` | Identity Pool ID |

## Chạy development

```bash
npm run dev
```

Mở http://localhost:3000

## Build production

```bash
npm run build
```

## Tài khoản AWS cần tạo

### 1. AWS Cognito
- Tạo User Pool
- Tạo App Client (enable USER_PASSWORD_AUTH)
- Enable S3 permissions cho user (IAM Role)

### 2. AWS S3
- Tạo bucket để lưu trữ file malware
- CORS configuration cần thiết

## Cấu trúc project

```
src/
├── pages/          # Trang web
│   ├── auth/       # Login, Register
│   └── dashboard/  # Dashboard chính
├── components/     # Components tái sử dụng
├── services/      # AWS services (Cognito, S3)
├── contexts/       # React contexts (Auth)
└── utils/         # Hàm tiện ích
```

## API tích hợp

Frontend giao tiếp với backend qua:

### AWS Cognito
- Đăng ký / Đăng nhập
- Xác nhận email
- Quản lý session

### AWS S3
- Upload file malware để phân tích
- Download kết quả

## Backend cần cung cấp

Frontend mong đợi backend cung cấp:

1. **AWS Credentials Configuration**
   - User Pool ID
   - Client ID
   - Identity Pool ID

2. **S3 Bucket**
   - Bucket name
   - CORS settings

3. **Lambda Functions** (tùy chọn)
   - API Gateway endpoint cho scan malware
