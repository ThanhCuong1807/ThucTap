const RESULT = {
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
};

const { RESULTS_TABLE, FILE_BUCKET, USER_POOL_ID } = process.env;

exports.handler = async (event) => {
  try {
    const input = event.Input || event.input || {};
    const { fileId, fileName, fileSize, bucket, key, userId } = input;

    if (!fileId || !fileName || !bucket || !key) {
      return {
        ...RESULT,
        status: 'invalid',
        message: 'Missing required fields: fileId, fileName, bucket, key',
        fileId,
      };
    }

    const blockedExtensions = ['.exe', '.bat', '.cmd', '.ps1', '.vbs', '.scr', '.msi', '.jar'];
    const lowerName = (fileName || '').toLowerCase();
    const hasBlockedExt = blockedExtensions.some((ext) => lowerName.endsWith(ext));

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (typeof fileSize === 'number' && fileSize > maxSize) {
      return {
        ...RESULT,
        status: 'invalid',
        message: `File too large (max ${maxSize} bytes)`,
        fileId,
      };
    }

    return {
      ...RESULT,
      fileId,
      fileName,
      bucket,
      key,
      userId: userId || 'local-user',
      blockedExt: hasBlockedExt,
      validated: true,
      validatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('ValidateUpload error:', error);
    return { ...RESULT, status: 'invalid', message: error.message };
  }
};
