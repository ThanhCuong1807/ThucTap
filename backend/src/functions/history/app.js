const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');

const dynamoDBClient = new DynamoDBClient({});
const RESULTS_TABLE = process.env.RESULTS_TABLE;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

const unmarshalValue = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if ('S' in value) return value.S;
  if ('N' in value) return Number(value.N);
  if ('BOOL' in value) return value.BOOL;
  if ('NULL' in value) return null;
  if (Array.isArray(value.L)) return value.L.map(unmarshalValue);
  if (value.M) {
    const obj = {};
    for (const [k, v] of Object.entries(value.M)) obj[k] = unmarshalValue(v);
    return obj;
  }
  return value;
};

const unmarshalItem = (item) => {
  const result = {};
  for (const [k, v] of Object.entries(item)) {
    result[k] = unmarshalValue(v);
  }
  return result;
};

const unmarshal = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (value.S !== undefined) return value.S;
  if (value.N !== undefined) return Number(value.N);
  if (value.BOOL !== undefined) return value.BOOL;
  if (value.NULL !== undefined) return null;
  if (Array.isArray(value.L)) return value.L.map(unmarshal);
  if (value.M) {
    const obj = {};
    for (const [k, v] of Object.entries(value.M)) obj[k] = unmarshal(v);
    return obj;
  }
  return value;
};

const parseItem = (item) => {
  if (!item) return item;
  // Check if item has any DynamoDB type marker
  const hasDynamoFormat = Object.values(item).some(
    v => v !== null && typeof v === 'object' && ('S' in v || 'N' in v || 'BOOL' in v || 'M' in v || 'L' in v)
  );
  if (hasDynamoFormat) {
    return unmarshal(item);
  }
  return item;
};

// Map DynamoDB fields to frontend model
const mapToFrontend = (item) => {
  // Map backend status to frontend status
  let status = item.status;
  if (status === 'queued' || status === 'received') status = 'pending';
  if (status === 'malware' || status === 'completed' || status === 'scanning') {
    // keep as is
  }

  return {
    id: item.fileId || item.id,
    fileName: item.fileName || item.file_name || '',
    status: status,
    uploadTime: item.createdAt || item.uploadTime || item.created_at || new Date().toISOString(),
    threatLevel: item.threatLevel || item.threat_level || 'safe',
    threatType: item.threatType || item.threat_type || '',
    fileSize: item.fileSize || item.file_size || 0,
    fileId: item.fileId,
  };
};

const extractUserIdFromEvent = (event) => {
  const token = event.headers?.Authorization || event.headers?.authorization || '';
  if (!token.startsWith('Bearer ')) return null;
  const idToken = token.slice('Bearer '.length);
  const payload = idToken.split('.')[1];
  if (!payload) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload + '==', 'base64').toString('utf8'));
    return decoded.sub || decoded.username || decoded.email || null;
  } catch (error) {
    console.error('Token parse error:', error);
    return null;
  }
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const userId = extractUserIdFromEvent(event) || 'local-user';

    const result = await dynamoDBClient.send(new QueryCommand({
      TableName: RESULTS_TABLE,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': { S: userId },
      },
      ScanIndexForward: false,
    }));

    const items = (result.Items || []).map((item) => {
      const raw = unmarshalItem(item);
      return mapToFrontend(raw);
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ items, count: items.length }),
    };
  } catch (error) {
    console.error('History error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
};
