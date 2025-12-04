import * as path from "node:path";
import { CfnOutput, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import { LambdaIntegration, LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, TableV2 } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";

export class LocalstackSpikeStack extends Stack {
	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		// DynamoDB Tables
		const eventsTable = new TableV2(this, "PaymentProjections", {
			tableName: "events-table",
			partitionKey: { name: "id", type: AttributeType.STRING },
			removalPolicy: RemovalPolicy.DESTROY,
		});

		// Lambda Functions
		const takeMoneyLambda = new NodejsFunction(this, "TakeMoneyLambda", {
			functionName: "take-money",
			runtime: Runtime.NODEJS_18_X,
			entry: path.join(__dirname, "../lambda/post-pay/index.ts"),
			handler: "handler",
			environment: {
				PAYMENT_PROJECTIONS_TABLE: eventsTable.tableName,
			},
		});

		// Grant post-pay Lambda read access to payment-projections table
		eventsTable.grantReadData(takeMoneyLambda);

		// API Gateway
		const api = new LambdaRestApi(this, "TakeMoneyApi", {
			integrationOptions: {},
			proxy: false,
			handler: takeMoneyLambda,
			restApiName: "take-money-api",
			description: "API Gateway for taking money",
		});

		// Connect API Gateway to post-pay Lambda
		const takeMoneyIntegration = new LambdaIntegration(takeMoneyLambda);

		// Add a /payment resource
		const paymentResource = api.root.addResource("payment");
		paymentResource.addMethod("GET", takeMoneyIntegration);
		paymentResource.addMethod("POST", takeMoneyIntegration);

		// Outputs
		new CfnOutput(this, "ApiUrl", {
			value: api.url,
			description: "API Gateway URL",
		});

		new CfnOutput(this, "EventsTableName", {
			value: eventsTable.tableName,
		});
	}
}
