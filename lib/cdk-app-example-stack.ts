import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as lambda from '@aws-cdk/aws-lambda'
import * as apigw from '@aws-cdk/aws-apigateway'
import * as dynamodb from '@aws-cdk/aws-dynamodb';

//CDK is just a wrapper around CloudFormation
export class CdkAppExampleStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    //context passed to stack
    console.log(this.node.tryGetContext('fromApp'))
    //By default the removalPolicy prop of stateful resources (S3 buckets, databases) is set to RETAIN, 
    //which means that when we delete our stack the resources will remain in our account.
    // s3 bucket construct
    const bucket = new s3.Bucket(this, 'example bucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

    //database parameter
    //npx cdk deploy my-cdk-stack \ --parameters databasePort=1000 \ --parameters tableName=cool-table \
    const databasePort = new cdk.CfnParameter(this, 'databasePort', {
      type: 'Number',
      description: "port",
      minValue: 1,
      maxValue: 10000,
      default: 5432,
      allowedValues: ['1000', '3000', '5000', '5432']
    })

    const tableName = new cdk.CfnParameter(this, 'tableName', {
      type: 'String',
      description: "name of table"
    })

    //dynamo table
    const table = new dynamodb.Table(this, 'example table', {
      tableName: tableName.valueAsString,
      partitionKey: {
        name: 'to-do',
        type: dynamodb.AttributeType.NUMBER
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

    //lambda construct
    const lambdaFunction = new lambda.Function(this, "test function", {
      environment: {
        databasePort: databasePort.valueAsString,
        tableName: tableName.valueAsString
      },
      runtime: lambda.Runtime.NODEJS_14_X,
      code: new lambda.AssetCode("test"),
      handler: "index.test",
      //may include vpc and vpc subnets
    })

    const lambdaRestApi = new apigw.LambdaRestApi(this, 'lambda-rest-api', {
      handler: lambdaFunction
    })

    //grants lambda permissions for s3 put and putobjectacl
    bucket.grantPut(lambdaFunction)
    bucket.grantPutAcl(lambdaFunction)

    //hese are values that we can import into other stacks, or in our case redirect to a file on the local file system.
    //By redirecting the outputs to a json file on the file system, we enable our frontend code to import the properties and use them.
    new cdk.CfnOutput(this, 'bucketName', {
      value: bucket.bucketName
    })

    new cdk.CfnOutput(this, 'tableName', {
      value: table.tableName
    })
    //custom s3 construct
    const { s3Bucket } = new TestBucketConstruct(this, 'custom-s3-construct')
  }
}

//Custom construct
export class TestBucketConstruct extends cdk.Construct {
  public readonly s3Bucket: s3.Bucket;
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);
    this.s3Bucket = new s3.Bucket(this, id)
  }
}