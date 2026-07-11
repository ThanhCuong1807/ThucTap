const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { randomUUID } = require('crypto');

const s3Client = new S3Client({});
const sqsClient = new SQSClient({});
const dynamoDBClient = new DynamoDBClient({});

const ANALYSIS_QUEUE_URL = process.env.ANALYSIS_QUEUE_URL;
const RESULTS_TABLE = process.env.RESULTS_TABLE;
const S3_BUCKET = process.env.S3_BUCKET_NAME;

const extractMetadata = async (key) => {
  try {
    const result = await s3Client.send(new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }));
    return {
      size: result.ContentLength || 0,
      contentType: result.ContentType || 'application/octet-stream',
      lastModified: result.LastModified || new Date().toISOString(),
    };
  } catch (error) {
    return {
      size: 0,
      contentType: 'application/octet-stream',
      lastModified: new Date().toISOString(),
    };
  }
};

exports.handler = async (event) => {
  for (const record of event.Records || []) {
    try {
      const s3 = record.s3;
      const key = decodeURIComponent(s3.object.key.replace(/\+/g, ' '));
      const bucket = s3.bucket.name;
      const metadata = await extractMetadata(key);

      const fileId = key.split('/').pop()?.split('_').shift() || randomUUID();
      const now = new Date().toISOString();

      await dynamoDBClient.send(new UpdateItemCommand({
        TableName: RESULTS_TABLE,
        Key: { fileId: { S: fileId } },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt, fileSize = :size, contentType = :type',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': { S: 'received' },
          ':updatedAt': { S: now },
          ':size': { N: String(metadata.size) },
          ':type': { S: metadata.contentType },
        },
      }));

      const message = {
        fileId,
        bucket,
        key,
        metadata,
        receivedAt: now,
      };

      await sqsClient.send(new SendMessageCommand({
        QueueUrl: ANALYSIS_QUEUE_URL,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          fileId: { StringValue: fileId, DataType: 'String' },
        },
      }));
    } catch (error) {
      console.error('S3 handler error:', error);
    }
  }

  return { statusCode: 200 };
};
