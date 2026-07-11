const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const snsClient = new SNSClient({});

const { SNS_TOPIC_ARN, USER_EMAIL } = process.env;

const formatSeverity = (threatLevel) => {
  switch ((threatLevel || '').toLowerCase()) {
    case 'critical':
      return '[CRITICAL]';
    case 'suspicious':
      return '[WARNING]';
    case 'safe':
      return '[INFO]';
    default:
      return '[NOTICE]';
  }
};

exports.handler = async (event) => {
  try {
    const input = event.Input || event.input || {};
    const { fileId, fileName, threatLevel, threatType, status, userId } = input;

    const subject = `${formatSeverity(threatLevel)} Malware scan complete: ${fileName || fileId}`;
    const message = [
      `File: ${fileName}`,
      `FileId: ${fileId}`,
      `Status: ${status}`,
      `Threat level: ${threatLevel}`,
      `Threat type: ${threatType || 'n/a'}`,
      `User: ${userId || 'unknown'}`,
      `Scanned at: ${new Date().toISOString()}`,
    ].join('\n');

    if (SNS_TOPIC_ARN) {
      try {
        await snsClient.send(new PublishCommand({
          TopicArn: SNS_TOPIC_ARN,
          Subject: subject.slice(0, 99),
          Message: message,
        }));
      } catch (err) {
        console.warn('SNS publish failed:', err.message);
      }
    }

    console.log('Notify:', subject);
    console.log(message);

    return {
      statusCode: 200,
      delivered: Boolean(SNS_TOPIC_ARN),
      channel: SNS_TOPIC_ARN ? 'sns' : 'log',
      subject,
    };
  } catch (error) {
    console.error('NotifyUser error:', error);
    return { statusCode: 500, delivered: false, message: error.message };
  }
};
