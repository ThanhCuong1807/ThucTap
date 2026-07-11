const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SFNClient, StartExecutionCommand } = require('@aws-sdk/client-sfn');
const { randomUUID } = require('crypto');

const s3Client = new S3Client({});
const sqsClient = new SQSClient({});
const dynamoDBClient = new DynamoDBClient({});
const sfnClient = new SFNClient({});

const ANALYSIS_QUEUE_URL = process.env.ANALYSIS_QUEUE_URL;
const RESULTS_TABLE = process.env.RESULTS_TABLE;
const S3_BUCKET = process.env.S3_BUCKET_NAME;
const STATE_MACHINE_ARN = process.env.STATE_MACHINE_ARN;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

const toISODate = () => new Date().toISOString();

const createAnalysisRecord = async (fileId, userId, fileName, fileKey, fileSize) => {
  const now = toISODate();
  const params = {
    TableName: RESULTS_TABLE,
    Item: {
      fileId: { S: fileId },
      userId: { S: userId },
      fileName: { S: fileName },
      fileKey: { S: fileKey },
      fileSize: { N: String(fileSize || 0) },
      status: { S: 'pending' },
      threatLevel: { S: 'safe' },
      threatType: { S: '' },
      createdAt: { S: now },
      updatedAt: { S: now },
    },
  };
  await dynamoDBClient.send(new PutItemCommand(params));
  return now;
};

const generatePresignedUrl = async (key, expiresIn = 3600) => {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: 'application/octet-stream',
  });

  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  return await getSignedUrl(s3Client, command, { expiresIn });
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
    const { fileName, fileSize } = body;

    if (!fileName) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Missing required field: fileName' }),
      };
    }

    const fileId = randomUUID();
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `samples/${timestamp}_${sanitizedFileName}`;

    const createdAt = await createAnalysisRecord(fileId, 'local-user', fileName, fileKey, fileSize || 0);

    const uploadUrl = await generatePresignedUrl(fileKey, 3600);

    if (ANALYSIS_QUEUE_URL) {
      await sqsClient.send(new SendMessageCommand({
        QueueUrl: ANALYSIS_QUEUE_URL,
        MessageBody: JSON.stringify({
          fileId,
          fileName,
          fileKey,
          fileSize: fileSize || 0,
          uploadedAt: createdAt,
        }),
        MessageAttributes: {
          fileId: { StringValue: fileId, DataType: 'String' },
        },
      }));
    }

    if (STATE_MACHINE_ARN) {
      await sfnClient.send(new StartExecutionCommand({
        stateMachineArn: STATE_MACHINE_ARN,
        name: `analysis-${fileId}`,
        input: JSON.stringify({
          fileId,
          fileName,
          fileKey,
          bucket: S3_BUCKET,
        }),
      }));
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Upload initiated successfully',
        fileId,
        uploadUrl,
        expiresIn: 3600,
      }),
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
};
