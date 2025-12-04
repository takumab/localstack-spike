import {CfnOutput, RemovalPolicy, Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Runtime} from "aws-cdk-lib/aws-lambda";
import * as path from "node:path";
import {LambdaIntegration, LambdaRestApi} from "aws-cdk-lib/aws-apigateway";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {AttributeType, TableV2} from "aws-cdk-lib/aws-dynamodb";


export class LocalstackSpikeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const paymentProjectionsTable = new TableV2(this, 'PaymentProjections', {
      tableName: 'payment-projections',
      partitionKey: { name: 'id', type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY
    });


    // Lambda Functions
    const postPayLambda = new NodejsFunction(this, 'PostPayLambda', {
      functionName: 'post-pay',
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, '../lambda/post-pay/index.ts'),
      handler: 'handler',
      environment: {
        PAYMENT_PROJECTIONS_TABLE: paymentProjectionsTable.tableName
      }
    });

    // Grant post-pay Lambda read access to payment-projections table
    paymentProjectionsTable.grantReadData(postPayLambda);

    // API Gateway
    const api = new LambdaRestApi(this, 'PostPayApi', { integrationOptions: {},
      proxy: false,
      handler: postPayLambda,
      restApiName: 'post-pay-api',
      description: 'API Gateway for post-pay service'
    });

    // Connect API Gateway to post-pay Lambda
    const postPayIntegration = new LambdaIntegration(postPayLambda);

    // Add a /payment resource
    const paymentResource = api.root.addResource('payment');
    paymentResource.addMethod('GET', postPayIntegration);
    paymentResource.addMethod('POST', postPayIntegration);


    // Outputs
    new CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL'
    });

    new CfnOutput(this, 'PaymentProjectionsTableName', {
      value: paymentProjectionsTable.tableName
    });
  }
}
