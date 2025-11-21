import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as path from 'path';

export class SecretKeeperStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. COGNITO USER POOL
    const userPool = new cognito.UserPool(this, 'SecretKeeperUsers', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: { minLength: 12, requireSymbols: true },
    });

    const userPoolClient = userPool.addClient('SecretKeeperClient', {
      oAuth: { flows: { authorizationCodeGrant: true } },
    });

    // 2. KMS KEY
    const secretKey = new kms.Key(this, 'SecretKey', {
      enableKeyRotation: true,
      alias: 'alias/secret-keeper-key',
      removalPolicy: cdk.RemovalPolicy.DESTROY, 
    });

    // 3. DYNAMODB TABLE
    const table = new dynamodb.Table(this, 'SecretTable', {
      partitionKey: { name: 'noteId', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'expiryTimestamp', 
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // 4. API GATEWAY
    const api = new apigateway.RestApi(this, 'SecretKeeperApi', {
      restApiName: 'Secret Keeper Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const auth = new apigateway.CognitoUserPoolsAuthorizer(this, 'SecretAuth', {
      cognitoUserPools: [userPool],
    });

    // 5. LAMBDA FUNCTIONS
    const lambdaEnv = {
      TABLE_NAME: table.tableName,
      KMS_KEY_ID: secretKey.keyId,
    };

    const createSecretFn = new lambda.NodejsFunction(this, 'CreateSecretFn', {
      entry: path.join(__dirname, '../backend/lambda-handlers.ts'),
      handler: 'createSecret',
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(10),
    });

    table.grantWriteData(createSecretFn);
    secretKey.grantEncrypt(createSecretFn);

    const getSecretFn = new lambda.NodejsFunction(this, 'GetSecretFn', {
      entry: path.join(__dirname, '../backend/lambda-handlers.ts'),
      handler: 'getSecret',
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      environment: lambdaEnv,
      timeout: cdk.Duration.seconds(10),
    });

    table.grantReadData(getSecretFn);
    secretKey.grantDecrypt(getSecretFn);

    // 6. API ROUTES
    const secretsResource = api.root.addResource('secrets');
    
    // POST /secrets (Protected)
    secretsResource.addMethod('POST', new apigateway.LambdaIntegration(createSecretFn), {
      authorizer: auth,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    // GET /secrets/{noteId} (Public)
    const singleSecret = secretsResource.addResource('{noteId}');
    singleSecret.addMethod('GET', new apigateway.LambdaIntegration(getSecretFn));

    // 7. OUTPUTS
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new cdk.CfnOutput(this, 'ClientId', { value: userPoolClient.userPoolClientId });
  }
}