# LocalStack Spike Project

A CDK TypeScript project for testing AWS services locally using LocalStack. This spike demonstrates a payment processing system with event-driven architecture using DynamoDB, Lambda, API Gateway, SQS, and S3.

## Architecture Overview

This project includes:
- **DynamoDB Tables**: `payment-projections` and `payment-event-store`
- **Lambda Functions**: `post-pay` and `notifications`
- **API Gateway**: REST API with `/payment` endpoints
- **SQS Queue**: `notifications-queue` for asynchronous processing
- **S3 Bucket**: `notifications-bucket` with event notifications

## Prerequisites

- Node.js (v18 or later)
- npm
- Docker and Docker Compose (for LocalStack)
- Python 3 and pip (for LocalStack CLI)

## Installation

1. Install project dependencies:
```bash
npm install
```

2. Install LocalStack and the AWS CLI wrapper:
```bash
pip install localstack
pip install awscli-local[ver1]  # for awslocal command
```

3. Install CDK Local (wrapper for AWS CDK):
```bash
npm install -g aws-cdk-local aws-cdk
```

## Getting Started with LocalStack

### 1. Ensure Docker Desktop is Running

Before starting LocalStack, make sure Docker Desktop is open and running:
```bash
docker ps  # This should work without errors if Docker is running
```

### 2. Start LocalStack

Run LocalStack with all required services:
```bash
npm run localstack:start
```

This will start LocalStack in detached mode with the following services enabled:
- dynamodb
- lambda
- apigateway
- sqs
- s3
- iam
- cloudformation
- logs

You can verify LocalStack is running:
```bash
curl http://localhost:4566/_localstack/health
```

### 3. Bootstrap CDK for LocalStack (first time only)

Bootstrap CDK for LocalStack:
```bash
cdklocal bootstrap
```

### 4. Deploy to LocalStack

Deploy the stack to LocalStack using `cdklocal`:
```bash
cdklocal deploy
```

The `cdklocal` command automatically configures CDK to use LocalStack endpoints. CDK will execute TypeScript files directly using ts-node, so no compilation step is needed.

## Available Scripts

- `npm run build` - Compile TypeScript to JavaScript (optional)
- `npm run watch` - Watch for changes and compile
- `npm run test` - Run Jest unit tests
- `npm run cdk` - Run CDK commands
- `npm run localstack:start` - Start LocalStack with required services

## CDK Commands for LocalStack

Use `cdklocal` instead of `cdk` for all CDK operations with LocalStack:

```bash
cdklocal synth       # Synthesize CloudFormation template
cdklocal diff        # Compare deployed stack with current state
cdklocal deploy      # Deploy the stack to LocalStack
cdklocal destroy     # Remove the stack from LocalStack
cdklocal list        # List all stacks
```

## Testing the Deployment

After deployment, you can test the API using `awslocal`:

```bash
# Get the API URL from CDK outputs
API_URL=$(awslocal cloudformation describe-stacks \
  --stack-name LocalstackSpikeStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)

# Test POST endpoint
curl -X POST $API_URL/payment \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'

# Test GET endpoint
curl $API_URL/payment
```

## Verify Resources

Check that resources were created in LocalStack using `awslocal`:

```bash
# List DynamoDB tables
awslocal dynamodb list-tables

# Describe a specific table
awslocal dynamodb describe-table --table-name payment-projections

# List Lambda functions
awslocal lambda list-functions

# List API Gateways
awslocal apigateway get-rest-apis

# List SQS queues
awslocal sqs list-queues

# List S3 buckets
awslocal s3 ls

# Check CloudFormation stacks
awslocal cloudformation list-stacks
```

## Project Structure

```
.
├── bin/
│   └── localstack-spike.ts    # CDK app entry point
├── lib/
│   └── localstack-spike-stack.ts  # Stack definition
├── lambda/
│   ├── post-pay/              # Post-pay Lambda function
│   └── notifications/         # Notifications Lambda function
├── test/
│   └── localstack-spike.test.ts  # Unit tests
├── cdk.json                   # CDK configuration
├── package.json               # Project dependencies
└── tsconfig.json             # TypeScript configuration
```

## LocalStack Configuration

LocalStack runs on `http://localhost:4566` by default. All AWS services are accessible through this endpoint.

The `cdklocal` and `awslocal` commands automatically point to LocalStack, so you don't need to:
- Set fake AWS credentials
- Configure endpoint URLs
- Create AWS profiles

## Useful Commands

### LocalStack Management
```bash
localstack start           # Start LocalStack (foreground)
localstack start -d        # Start LocalStack (detached/background)
localstack stop            # Stop LocalStack
localstack status          # Check LocalStack service status
localstack logs            # View LocalStack logs
```

### Development Workflow
```bash
# 1. Ensure Docker Desktop is running
docker ps

# 2. Start LocalStack
npm run localstack:start

# 3. Deploy to LocalStack (no build step needed!)
cdklocal deploy

# 4. Test your changes
awslocal lambda invoke --function-name post-pay output.json

# 5. Make changes and redeploy
cdklocal deploy

# 6. Clean up when done
cdklocal destroy
localstack stop
```

## Troubleshooting

### LocalStack not starting
- Ensure Docker is running: `docker ps`
- Check port 4566 is not already in use: `lsof -i :4566`
- Check LocalStack logs: `localstack logs`
- Try stopping and restarting: `localstack stop && npm run localstack:start`

### `cdklocal` command not found
- Install CDK Local: `npm install -g aws-cdk-local`
- Verify installation: `which cdklocal`

### CDK deployment fails
- Verify LocalStack is running: `curl http://localhost:4566/_localstack/health`
- Ensure you've bootstrapped: `cdklocal bootstrap`
- Check the CDK version matches: `cdklocal --version`
- Try destroying and redeploying: `cdklocal destroy && cdklocal deploy`

### Lambda function errors
- Verify Lambda code exists in `lambda/` directories with `index.js` or `index.ts` files
- Check Lambda was deployed: `awslocal lambda list-functions`
- View Lambda logs: `awslocal logs tail /aws/lambda/post-pay --follow`

### Resources not appearing
- Check CloudFormation stack status: `awslocal cloudformation describe-stacks --stack-name LocalstackSpikeStack`
- Review LocalStack logs: `localstack logs`
- Some services may take a few seconds to initialize

## Additional Resources

- [LocalStack Documentation](https://docs.localstack.cloud)
- [LocalStack AWS CDK Guide](https://docs.localstack.cloud/user-guide/integrations/aws-cdk/)
- [CDK Local GitHub](https://github.com/localstack/aws-cdk-local)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk)
- [CDK TypeScript Reference](https://docs.aws.amazon.com/cdk/api/latest/typescript/api/index.html)
