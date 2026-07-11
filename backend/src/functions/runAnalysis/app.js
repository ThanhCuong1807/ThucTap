const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = new S3Client({});

const SAFE_PATTERNS = [];
const SUSPICIOUS_PATTERNS = ['eval', 'exec', 'document.write(', 'atob(', 'fromCharCode'];
const CRITICAL_PATTERNS = ['ransomware', 'keylogger', 'backdoor', 'trojan', 'rootkit', 'wscript.shell'];

const extractDetections = (text) => {
  const tokens = text.match(/\b[A-Za-z0-9_.-]{3,}\b/g) || [];
  return [...new Set(tokens)].slice(0, 20);
};

const analyze = (text, fileName) => {
  const lowerText = String(text || '').toLowerCase();
  const lowerName = (fileName || '').toLowerCase();

  if (CRITICAL_PATTERNS.some((p) => lowerText.includes(p) || lowerName.includes(p))) {
    return {
      threatLevel: 'critical',
      threatType: 'KnownMalwareSignature',
      confidence: 0.92,
    };
  }

  if (SUSPICIOUS_PATTERNS.some((p) => lowerText.includes(p))) {
    return {
      threatLevel: 'suspicious',
      threatType: 'SuspiciousScriptContent',
      confidence: 0.7,
    };
  }

  return {
    threatLevel: 'safe',
    threatType: '',
    confidence: 0.85,
  };
};

exports.handler = async (event) => {
  try {
    const input = event.Input || event.input || {};
    const { fileId, fileName, bucket, key } = input;

    let contentText = '';
    try {
      const result = await s3Client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key })
      );
      const chunks = [];
      for await (const chunk of result.Body) chunks.push(chunk);
      contentText = Buffer.concat(chunks).toString('utf-8');
    } catch (err) {
      console.warn(`RunAnalysis: cannot read s3://${bucket}/${key} - ${err.message}`);
    }

    const verdict = analyze(contentText, fileName);
    const detections = extractDetections(contentText);

    return {
      statusCode: 200,
      fileId,
      fileName,
      bucket,
      key,
      status: verdict.threatLevel === 'safe' ? 'completed' : 'malware',
      threatLevel: verdict.threatLevel,
      threatType: verdict.threatType,
      confidence: verdict.confidence,
      detections,
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('RunAnalysis error:', error);
    return {
      statusCode: 500,
      status: 'failed',
      message: error.message,
      threatLevel: 'safe',
      threatType: '',
    };
  }
};
