# Hướng Dẫn Cài Đặt AWS

## 1. Amazon Cognito - Thiết lập User Pool

### Bước 1: Tạo User Pool
1. Đăng nhập AWS Console → Services → Cognito
2. Click "Create user pool"
3. Điền thông tin:
   - **Pool name**: `MalwareDetectionUsers`
   - **Provider type**: AWS Cognito default
4. Configure sign-in experience:
   - Allow email: ✅
   - Required attributes: `email`, `name`
5. Configure password policy:
   - Minimum length: 8
   - Require uppercase: ✅
   - Require lowercase: ✅
   - Require numbers: ✅
   - Require special characters: ✅
6. Configure sign-up experience:
   - ✅ Allow email aliases
   - Require email verification: ✅
7. Configure message delivery:
   - Send email with Cognito: (chọn Send email with Cognito for dev)
8. App integration:
   - Domain name: tạo domain riêng
   - User pool client: tạo app client
   - ⚠️ ** IMPORTANT**: Bỏ tick "Generate client secret" (client secret không cần cho frontend)
9. Review và Create

### Bước 2: Lấy thông tin cấu hình
Sau khi tạo xong, lấy các giá trị:
- **User Pool ID**: `ap-southeast-1_XXXXXXXXX`
- **App Client ID**: từ app client đã tạo

## 2. Amazon S3 - Tạo Bucket

### Bước 1: Tạo S3 Bucket
1. AWS Console → Services → S3
2. Click "Create bucket"
3. Điền thông tin:
   - **Bucket name**: `malware-analysis-uploads-<your-name>`
   - **Region**: Asia Pacific (Singapore) - ap-southeast-1
4. Configure options:
   - ✅ Enable versioning (để theo dõi file)
   - ✅ Enable server-side encryption (AWS SSE-S3)
5. Set permissions:
   - Block all public access: ✅ (bảo mật)
6. Create bucket

### Bước 2: Cấu hình CORS
Để frontend có thể upload trực tiếp lên S3, cần cấu hình CORS:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE"
        ],
        "AllowedOrigins": [
            "http://localhost:3000"
        ],
        "ExposeHeaders": [
            "ETag"
        ]
    }
]
```

### Bước 3: Tạo IAM Policy cho S3
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowS3Upload",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::your-bucket-name",
                "arn:aws:s3:::your-bucket-name/*"
            ]
        }
    ]
}
```

## 3. Cấu hình Cognito Identity Pool (Optional)

Nếu cần access AWS resources từ client:
1. Services → Cognito → Create identity pool
2. Attach IAM role với quyền S3
3. Lấy **Identity Pool ID**

## 4. Cập nhật file .env

Copy `.env.example` thành `.env` và điền các giá trị đã lấy được:

```bash
cp .env.example .env
```

Điền các giá trị:
```env
VITE_AWS_REGION=ap-southeast-1
VITE_COGNITO_USER_POOL_ID=ap-southeast-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_S3_BUCKET_NAME=your-malware-analysis-bucket
VITE_IDENTITY_POOL_ID=ap-southeast-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## 5. Kiểm tra hoạt động

1. Chạy ứng dụng:
```bash
npm install
npm run dev
```

2. Test đăng ký:
   - Truy cập http://localhost:3000/register
   - Điền thông tin và đăng ký
   - Check email để lấy mã xác nhận
   - Xác nhận tài khoản

3. Test đăng nhập và upload file

## Lưu ý bảo mật

⚠️ **Important**:
- Không bao giờ commit file `.env` lên git
- Thêm `.env` vào `.gitignore`
- Sử dụng HTTPS trong production
- CORS chỉ cho phép domain của bạn
- S3 bucket nên private, chỉ access qua presigned URL
