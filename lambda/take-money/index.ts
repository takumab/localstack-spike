import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
	DynamoDBDocumentClient,
	PutCommand,
	QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (
	event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
	console.log("Take-money Lambda triggered");
	console.log("Event:", JSON.stringify(event, null, 2));
	const tableName = process.env.PAYMENT_PROJECTIONS_TABLE;
	const paymentId = event.queryStringParameters?.id;
	const status = event.queryStringParameters?.status;
	const body = event.body ? JSON.parse(event.body) : null;

	try {
		if (event.body !== null) {
			const id = String(Math.floor(Math.random() * 100));
			await docClient.send(
				new PutCommand({
					TableName: tableName,
					Item: {
						id: id,
						amount: body.amount,
						status: body.status,
					},
				}),
			);
			return {
				statusCode: 200,
				body: JSON.stringify({
					message: `Take-money Lambda executed successfully with event: ${event.body}, paymentId: ${id}`,
				}),
			};
		}

		const result = await docClient.send(
			new QueryCommand({
				TableName: tableName,
				KeyConditionExpression: "id = :id",
				FilterExpression: status ? "#status = :status" : undefined,
				ExpressionAttributeNames: status ? { "#status": "status" } : undefined,
				ExpressionAttributeValues: {
					":id": paymentId,
					...(status && { ":status": status }),
				},
			}),
		);

		return {
			statusCode: 200,
			body: JSON.stringify({
				message: `Take-money Lambda executed successfully with event: ${event.body}`,
				tableName: tableName,
				itemCount: result.Count || 0,
				items: result.Items || [],
			}),
		};
	} catch (error) {
		console.error("Error:", error);
		return {
			statusCode: 500,
			body: JSON.stringify({
				error: error instanceof Error ? error.message : "Unknown error",
			}),
		};
	}
};
