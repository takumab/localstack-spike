import { Match, Template } from "aws-cdk-lib/assertions";
import * as cdk from "aws-cdk-lib/core";
import { describe, test } from "vitest";
import * as LocalstackSpike from "../lib/localstack-spike-stack";

describe("LocalstackSpikeStack", () => {
	const app = new cdk.App();
	const stack = new LocalstackSpike.LocalstackSpikeStack(app, "MyTestStack");
	const template = Template.fromStack(stack);

	test("DynamoDB table created", () => {
		template.hasResourceProperties("AWS::DynamoDB::GlobalTable", {
			TableName: "events-table",
			KeySchema: [
				{
					AttributeName: "id",
					KeyType: "HASH",
				},
			],
		});
	});

	test("Lambda function created", () => {
		template.hasResourceProperties("AWS::Lambda::Function", {
			FunctionName: "take-money",
			Runtime: "nodejs18.x",
		});
	});

	test("Lambda has DynamoDB read/write permissions", () => {
		template.hasResourceProperties("AWS::IAM::Policy", {
			PolicyDocument: {
				Statement: Match.arrayWith([
					Match.objectLike({
						Action: [
							"dynamodb:BatchGetItem",
							"dynamodb:GetRecords",
							"dynamodb:GetShardIterator",
							"dynamodb:Query",
							"dynamodb:GetItem",
							"dynamodb:Scan",
							"dynamodb:ConditionCheckItem",
							"dynamodb:BatchWriteItem",
							"dynamodb:PutItem",
							"dynamodb:UpdateItem",
							"dynamodb:DeleteItem",
							"dynamodb:DescribeTable",
						],
						Effect: "Allow",
						Resource: {
							"Fn::GetAtt": Match.arrayWith([
								Match.stringLikeRegexp("PaymentProjections"),
							]),
						},
					}),
				]),
			},
		});
	});

	test("API Gateway created", () => {
		template.hasResourceProperties("AWS::ApiGateway::RestApi", {
			Name: "take-money-api",
		});
	});
});
