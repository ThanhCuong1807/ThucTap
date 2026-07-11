# Malware Detection Backend

Serverless backend cho hệ thống phân tích và phát hiện mã độc sử dụng AWS services.

## Kiến trúc

```
backend/
├── src/
│   ├── functions/
│   │   ├── upload/           # API Gateway Lambda: tạo upload presigned URL và đưa vào hàng đợi
│   │   ├── results/          # API Gateway Lambda: lấy kết quả phân tích theo fileId
│   │   ├── history/          # API Gateway Lambda: lấy lịch sử phân tích của user
│   │   ├── s3Handler/        # S3 Event Lambda: tự động xử lý file mới upload
│   │   └── processor/        # SQS Processor Lambda: xử lý hàng đợi phân tích
│   └── statemachine/
│       └── analysis-workflow.asl.json # Step Functions workflow
├── template.yaml             # AWS SAM template
└── samconfig.toml            # SAM deployment config
```

## AWS Services sử dụng

- **Amazon API Gateway**: Cổng giao tiếp API cho frontend
- **AWS Lambda**: Chạy logic Node.js không cần máy chủ
- **Amazon S3**: Lưu trữ file mẫu malware
- **Amazon SQS**: Quản lý hàng đợi phân tích
- **AWS Step Functions**: Điều phối luồng phân tích có retry/fallback
- **Amazon DynamoDB**: Lưu kết quả phân tích
- **Amazon Cognito**: Xác thực người dùng

## Các endpoint chính

- `POST /upload` - Tạo phiên upload và đưa vào hàng đợi
- `GET /get-result/{fileId}` - Lấy kết quả phân tích
- `GET /history` - Lấy lịch sử phân tích của user

## Luồng hoạt động

1. Frontend gọi `/upload`, backend trả presigned URL và tạo bản ghi `queued`
2. Frontend upload file trực tiếp lên S3
3. S3 Event Lambda tự động phát hiện file mới và đưa vào SQS
4. SQS Processor Lambda lấy tin nhắn và chạy phân tích
5. Step Functions theo dõi trạng thái và cập nhật kết quả vào DynamoDB
6. Frontend gọi `/get-result/{fileId}` để theo dõi trạng thái

## Triển khai

```bash
cd backend
sam build
sam deploy --guided
```
