# LocalStack Spike Project

A CDK TypeScript project for testing AWS services locally using LocalStack. 
This spike is to help us understand if Localstack would be a good addition to our workflow, enabling us to add supported AWS services to \
our stack or project without having to deploy to AWS and testing there. 
I've elected to start with a simple boilerplate stack, which enables you get started as quickly as possible. 

## Prerequisites
- LocalStack installed and running. You can follow the instructions [here](https://github.com/localstack/localstack).
  - TLDR: You can install via homebrew: `brew install localstack/tap/localstack-cli`
- Cdklocal installed. You can follow the instructions [here](https://github.com/localstack/aws-cdk-local?tab=readme-ov-file).
  - TLDR: `npm install -g aws-cdk-local aws-cdk`

Once you have LocalStack and Cdklocal installed, you can proceed with the following steps.

## Getting Started
1. Clone this repository to your local machine.
2. Navigate to the project directory.
3. Install the project dependencies:
4. ```bash
   npm install
   ```
5. Ensure you start up the Docker Daemon or open docker desktop 
6. Start LocalStack:
   ```bash
   npm run localstack:start
   ```
7. Bootstrap the CDK stack in LocalStack using Cdklocal:
   ```bash
   npm run local:bootstrap
   ```
8. In a new terminal window, deploy the CDK stack to LocalStack using Cdklocal:
   ```bash
   npm run local:deploy
   ```
9. After deployment, you should see the API Gateway endpoint URL in the output.

***NOTE***: ***(Optional)*** Query deployed table to verify DynamoDB table exists. This is a temporary command just to verify the table was created successfully.:
```bash
    npm run query:table
```

### Testing the API Gateway Endpoint
I've placed an *.http file in the root of the project, 
which you can use with the REST Client extension for VS Code/Jetbrains to test the API Gateway endpoint created by the stack.
If your editor does not support *.http files, you can use curl or Postman to test the endpoint.

```bash
curl -X GET --location "<YOUR_EXECUTE_API_URL_HERE>.localhost.localstack.cloud:4566/prod/payment?id=2&status=completed" \
-H "Content-Type: application/json"
```
