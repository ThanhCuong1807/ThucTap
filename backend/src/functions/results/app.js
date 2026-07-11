const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamoDBClient = new DynamoDBClient({});
const RESULTS_TABLE = process.env.RESULTS_TABLE;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
};

const unmarshal = (value) => {
  if (!value || typeof value !== 'object') return value;
  if (value.S !== undefined) return value.S;
  if (value.N !== undefined) return Number(value.N);
  if (value.BOOL !== undefined) return value.BOOL;
  if (Array.isArray(value.L)) return value.L.map(unmarshal);
  if (value.M) {
    const obj = {};
    for (const [k, v] of Object.entries(value.M)) obj[k] = unmarshal(v);
    return obj;
  }
  return value;
};

const mapToFrontend = (item) => {
  const raw = unmarshal(item);
  return {
    id: raw.fileId || raw.id,
    fileId: raw.fileId,
    fileName: raw.fileName || '',
    status: raw.status,
    uploadTime: raw.createdAt || raw.uploadTime || new Date().toISOString(),
    threatLevel: raw.threatLevel || 'safe',
    threatType: raw.threatType || '',
    fileSize: raw.fileSize || 0,
  };
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const fileId = event.pathParameters?.fileId;
    if (!fileId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Missing fileId' }),
      };
    }

    const result = await dynamoDBClient.send(new GetItemCommand({
      TableName: RESULTS_TABLE,
      Key: { fileId: { S: fileId } },
    }));

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Analysis not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(mapToFrontend(result.Item)),
    };
  } catch (error) {
    console.error('Get result error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Internal server error', error: error.message }),
    };
  }
};
