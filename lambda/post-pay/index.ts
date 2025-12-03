import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient, PutCommand, QueryCommand} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Post-pay Lambda triggered');
  console.log('Event:', JSON.stringify(event, null, 2));
  const tableName = process.env.PAYMENT_PROJECTIONS_TABLE;
  const paymentId = event.queryStringParameters?.id;
  const status = event.queryStringParameters?.status;
  const body = event.body ? JSON.parse(event.body) : null;

  try {
    const seedData = [
      { id: '1', amount: 100, status: 'pending' },
      { id: '2', amount: 200, status: 'completed' },
    ];

    for (const item of seedData) {
      await docClient.send(new PutCommand({
        TableName: tableName,
        Item: item
      }));
    }
    if (event.body !== null) {
      await docClient.send(new PutCommand({
        TableName: tableName,
        Item: { id: String(Math.floor(Math.random() * 100)) , amount: body.amount, status: body.status },
      }));
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: `Post-pay Lambda executed successfully with event: ${event.body}`,
        })
      };
    }

    const result = await docClient.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "id = :id",
      FilterExpression: status ? "#status = :status" : undefined,
      ExpressionAttributeNames: status ? { "#status": "status" } : undefined,
      ExpressionAttributeValues: {
        ":id": paymentId,
        ...(status && { ":status": status })
      },
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Post-pay Lambda executed successfully with event: ${event.body}`,
        tableName: tableName,
        itemCount: result.Count || 0
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
