import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Post-pay Lambda triggered');
  console.log('Event:', JSON.stringify(event, null, 2));

  const tableName = process.env.PAYMENT_PROJECTIONS_TABLE;

  try {
    // Example: Scan the payment-projections table
    const result = await docClient.send(new ScanCommand({
      TableName: tableName,
      Limit: 10
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Post-pay Lambda executed successfully',
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
