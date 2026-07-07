import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { awsConfig } from '../config/aws';
import { getAccessToken } from './tokenService';

// Khởi tạo S3 Client
const s3Client = new S3Client({
  region: awsConfig.region,
});

export interface PresignedUrlResponse {
  uploadUrl: string;
  downloadUrl: string;
  key: string;
  expiresIn: number;
}

export interface FileInfo {
  key: string;
  lastModified: Date;
  size: number;
  eTag: string;
}

/**
 * Tạo Presigned URL để upload file lên S3
 */
export async function getPresignedUploadUrl(
  fileName: string,
  contentType: string,
  folder: string = 'uploads'
): Promise<PresignedUrlResponse> {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${folder}/${timestamp}_${sanitizedFileName}`;

  try {
    const command = new PutObjectCommand({
      Bucket: awsConfig.s3BucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 giờ
    });

    return {
      uploadUrl,
      downloadUrl: '', // Sẽ được tạo khi cần
      key,
      expiresIn: 3600,
    };
  } catch (error: any) {
    console.error('Error generating presigned upload URL:', error);
    throw new Error('Không thể tạo link upload: ' + error.message);
  }
}

/**
 * Tạo Presigned URL để download file từ S3
 */
export async function getPresignedDownloadUrl(key: string): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: awsConfig.s3BucketName,
      Key: key,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 giờ
    });

    return downloadUrl;
  } catch (error: any) {
    console.error('Error generating presigned download URL:', error);
    throw new Error('Không thể tạo link download: ' + error.message);
  }
}

/**
 * Upload file trực tiếp lên S3 bằng Presigned URL
 */
export async function uploadFileToS3(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ key: string; etag: string }> {
  try {
    // Lấy presigned URL
    const { uploadUrl, key } = await getPresignedUploadUrl(
      file.name,
      file.type,
      'samples'
    );

    // Upload sử dụng fetch với progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const etag = xhr.getResponseHeader('ETag') || '';
          resolve({ key, etag });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    throw new Error('Upload thất bại: ' + error.message);
  }
}

/**
 * Upload file sử dụng AWS SDK (thay thế nếu cần)
 */
export async function uploadFileWithSDK(
  file: File,
  folder: string = 'samples',
  onProgress?: (progress: number) => void
): Promise<{ key: string; etag: string }> {
  const timestamp = Date.now();
  const key = `${folder}/${timestamp}_${file.name}`;

  try {
    const command = new PutObjectCommand({
      Bucket: awsConfig.s3BucketName,
      Key: key,
      Body: file,
      ContentType: file.type,
    });

    await s3Client.send(command);
    
    return { key, etag: '' };
  } catch (error: any) {
    console.error('Error uploading with SDK:', error);
    throw new Error('Upload thất bại: ' + error.message);
  }
}

/**
 * Xóa file từ S3
 */
export async function deleteFileFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: awsConfig.s3BucketName,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error: any) {
    console.error('Error deleting file:', error);
    throw new Error('Xóa file thất bại: ' + error.message);
  }
}

/**
 * Liệt kê files trong bucket
 */
export async function listFiles(prefix: string = 'samples/'): Promise<FileInfo[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: awsConfig.s3BucketName,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    
    return (response.Contents || []).map((obj) => ({
      key: obj.Key || '',
      lastModified: obj.LastModified || new Date(),
      size: obj.Size || 0,
      eTag: obj.ETag || '',
    }));
  } catch (error: any) {
    console.error('Error listing files:', error);
    throw new Error('Không thể lấy danh sách file: ' + error.message);
  }
}

/**
 * Kiểm tra file có tồn tại không
 */
export async function checkFileExists(key: string): Promise<boolean> {
  try {
    const command = new GetObjectCommand({
      Bucket: awsConfig.s3BucketName,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      return false;
    }
    throw error;
  }
}

/**
 * Format bytes sang human readable
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
