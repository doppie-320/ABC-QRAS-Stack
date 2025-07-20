import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { addCorsOptions, defaultCorsMethodResponses, withCorsIntegration } from './apigw-util';
import { mainBucketName } from '../../shared/links';

import * as path from 'path';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //DYNAMO DB    
    const studentTable = new dynamodb.Table(this, `Students`, {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }
    });
    //GSIs
    studentTable.addGlobalSecondaryIndex({
      indexName: 'studentNumber-index',
      partitionKey: { name: 'studentNumber', type: dynamodb.AttributeType.STRING }
    });

    //S3 BUCKET
    const mainBucket = new s3.Bucket(this, 'MainBucket', {
      bucketName: mainBucketName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false
    });    

    //FUNCTIONS
    const fnRegister = new NodejsFunction(this, 'RegisterFn', {
      entry: path.join(__dirname, '../lambda/handler-register.ts'),
      runtime: Runtime.NODEJS_20_X,
      environment: {
        STUDENT_TABLE: studentTable.tableName,
      },
    });

    const fnGetQr = new NodejsFunction(this, 'GetQrFn', {
      entry: path.join(__dirname, '../lambda/handler-getqr.ts'),
      runtime: Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(10),
      environment: {
        STUDENT_TABLE: studentTable.tableName,
      },
    });

    const fnGetStudentInfo = new NodejsFunction(this, 'GetStudentInfoFn', {
      entry: path.join(__dirname, '../lambda/handler-getStudentInfo.ts'),
      runtime: Runtime.NODEJS_20_X,
      environment: {
        STUDENT_TABLE: studentTable.tableName,
      },
    });

    //ACCESS GRANTS
    studentTable.grantReadWriteData(fnRegister);
    studentTable.grantReadWriteData(fnGetQr);
    studentTable.grantReadData(fnGetStudentInfo);
    mainBucket.grantReadWrite(fnRegister);

    //APIGW
    const api = new apigateway.RestApi(this, 'QrApi');

    const regResource = api.root.addResource('register');
    regResource.addMethod('POST', withCorsIntegration(fnRegister), { methodResponses: defaultCorsMethodResponses });
    addCorsOptions(regResource);

    const qrResource = api.root.addResource('get-qr');
    qrResource.addMethod('POST', withCorsIntegration(fnGetQr), { methodResponses: defaultCorsMethodResponses });
    addCorsOptions(qrResource);

    api.root.addResource('student')
      .addResource('{id}')
      .addMethod('GET', withCorsIntegration(fnGetStudentInfo), { methodResponses: defaultCorsMethodResponses });
  }
}
