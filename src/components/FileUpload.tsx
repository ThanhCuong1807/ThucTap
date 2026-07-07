import React, { useState, useCallback } from 'react';
import { Upload, File, X, Loader2, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { uploadFileToS3 } from '../../services/s3Service';

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  key?: string;
  error?: string;
}

export default function FileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      // Kiểm tra kích thước (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        alert(`File ${file.name} quá lớn. Kích thước tối đa là 100MB.`);
        return false;
      }
      return true;
    });

    const uploadedFiles: UploadedFile[] = validFiles.map(file => ({
      id: `${Date.now()}-${file.name}`,
      file,
      progress: 0,
      status: 'uploading',
    }));

    setFiles(prev => [...prev, ...uploadedFiles]);

    // Upload từng file
    uploadedFiles.forEach(uploadedFile => {
      uploadFile(uploadedFile);
    });
  };

  const uploadFile = async (uploadedFile: UploadedFile) => {
    try {
      const result = await uploadFileToS3(uploadedFile.file, (progress) => {
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id ? { ...f, progress } : f
        ));
      });

      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'success', key: result.key, progress: 100 } 
          : f
      ));
    } catch (error: any) {
      setFiles(prev => prev.map(f => 
        f.id === uploadedFile.id 
          ? { ...f, status: 'error', error: error.message } 
          : f
      ));
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary-100 rounded-lg">
          <Upload className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Upload Files</h3>
          <p className="text-sm text-gray-500">Kéo thả hoặc chọn file để phân tích</p>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${isDragging 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".exe,.dll,.bat,.cmd,.ps1,.vbs,.js,.jar,.scr,.pif,.msi,.zip,.rar,.7z"
        />
        
        <div className="pointer-events-none">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
            <Upload className="w-6 h-6 text-gray-500" />
          </div>
          <p className="text-gray-700 font-medium mb-1">
            Kéo thả file vào đây hoặc click để chọn
          </p>
          <p className="text-sm text-gray-500">
            Hỗ trợ: .exe, .dll, .bat, .ps1, .vbs, .jar, .zip, .rar (tối đa 100MB)
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          {files.map(uploadedFile => (
            <div
              key={uploadedFile.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
            >
              {/* File Icon */}
              <div className={`
                p-2 rounded-lg
                ${uploadedFile.status === 'success' ? 'bg-green-100' : 
                  uploadedFile.status === 'error' ? 'bg-red-100' : 'bg-blue-100'}
              `}>
                {uploadedFile.status === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : uploadedFile.status === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <File className="w-5 h-5 text-blue-600" />
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadedFile.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(uploadedFile.file.size)}
                </p>
                
                {/* Progress Bar */}
                {uploadedFile.status === 'uploading' && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 transition-all duration-300"
                        style={{ width: `${uploadedFile.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {uploadedFile.progress}%
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {uploadedFile.status === 'error' && (
                  <p className="text-xs text-red-500 mt-1">
                    {uploadedFile.error}
                  </p>
                )}
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeFile(uploadedFile.id)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">Bảo mật</p>
            <p className="text-blue-700 mt-1">
              File của bạn được mã hóa khi truyền tải và lưu trữ. 
              Chỉ bạn và người dùng được ủy quyền mới có thể truy cập.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
