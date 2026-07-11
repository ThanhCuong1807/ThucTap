const { SQSClient, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { SFNClient, StartExecutionCommand } = require('@aws-sdk/client-sfn');

const sqsClient = new SQSClient({});
const dynamoDBClient = new DynamoDBClient({});
const sfnClient = new SFNClient({});

const RESULTS_TABLE = process.env.RESULTS_TABLE;
const STATE_MACHINE_ARN = process.env.STATE_MACHINE_ARN;
const PROCESSOR_QUEUE_URL = process.env.PROCESSOR_QUEUE_URL;

const startStepExecution = async (stateMachineArn, executionInput) => {
  await sfnClient.send(new StartExecutionCommand({
    stateMachineArn,
    input: JSON.stringify(executionInput),
  }));
};

const markScanning = async (fileId) => {
  await dynamoDBClient.send(new UpdateItemCommand({
    TableName: RESULTS_TABLE,
    Key: { fileId: { S: fileId } },
    UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':status': { S: 'scanning' },
      ':updatedAt': { S: new Date().toISOString() },
    },
  }));
};

exports.handler = async (event) => {
  const queueUrl = PROCESSOR_QUEUE_URL || process.env.SQS_QUEUE_URL;

  for (const record of event.Records || []) {
    const receiptHandle = record.receiptHandle;
    try {
      const payload = JSON.parse(record.body || '{}');
      const { fileId, bucket, key, userId } = payload;

      if (!fileId) {
        console.warn('Skip record without fileId');
        await sqsClient.send(new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: receiptHandle }));
        continue;
      }

      await markScanning(fileId);

      if (STATE_MACHINE_ARN) {
        await startStepExecution(STATE_MACHINE_ARN, {
          fileId,
          fileName: payload.fileName || (key ? key.split('/').pop() : 'unknown'),
          bucket,
          key,
          userId: userId || 'local-user',
        });
      }

      await sqsClient.send(new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
      }));
    } catch (error) {
      console.error('Processor error:', error);
    }
  }
};