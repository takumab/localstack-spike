import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as path from 'path';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';

export class LocalstackSpikeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const paymentProjectionsTable = new dynamodb.Table(this, 'PaymentProjections', {
      tableName: 'payment-projections',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const paymentEventStoreTable = new dynamodb.Table(this, 'PaymentEventStore', {
      tableName: 'payment-event-store',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // Lambda Functions
    const postPayLambda = new lambda.Function(this, 'PostPayLambda', {
      functionName: 'post-pay',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/post-pay')),
      environment: {
        PAYMENT_PROJECTIONS_TABLE: paymentProjectionsTable.tableName
      }
    });

    const notificationsLambda = new lambda.Function(this, 'NotificationsLambda', {
      functionName: 'notifications',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/notifications'))
    });

    // Grant post-pay Lambda read access to payment-projections table
    paymentProjectionsTable.grantReadData(postPayLambda);

    // API Gateway
    const api = new LambdaRestApi(this, 'PostPayApi', {
      integrationOptions: {},
      proxy: true,
      handler: notificationsLambda,
      restApiName: 'post-pay-api',
      description: 'API Gateway for post-pay service'
    });

    // Connect API Gateway to post-pay Lambda
    const postPayIntegration = new apigateway.LambdaIntegration(postPayLambda);
    api.root.addMethod('ANY', postPayIntegration);

    // Add a /payment resource
    const paymentResource = api.root.addResource('payment');
    paymentResource.addMethod('GET', postPayIntegration);
    paymentResource.addMethod('POST', postPayIntegration);

    // SQS Queue
    const notificationsQueue = new sqs.Queue(this, 'NotificationsQueue', {
      queueName: 'notifications-queue',
      visibilityTimeout: cdk.Duration.seconds(300)
    });

    // S3 Bucket
    const notificationsBucket = new s3.Bucket(this, 'NotificationsBucket', {
      bucketName: 'notifications-bucket',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // Configure S3 bucket to send notifications to SQS queue
    notificationsBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.SqsDestination(notificationsQueue)
    );

    // Configure SQS queue as event source for notifications Lambda
    notificationsLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(notificationsQueue)
    );

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL'
    });

    new cdk.CfnOutput(this, 'PaymentProjectionsTableName', {
      value: paymentProjectionsTable.tableName
    });

    new cdk.CfnOutput(this, 'PaymentEventStoreTableName', {
      value: paymentEventStoreTable.tableName
    });

    new cdk.CfnOutput(this, 'NotificationsBucketName', {
      value: notificationsBucket.bucketName
    });

    new cdk.CfnOutput(this, 'NotificationsQueueUrl', {
      value: notificationsQueue.queueUrl
    });
  }
}
