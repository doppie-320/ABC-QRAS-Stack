import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { addCorsOptions, defaultCorsMethodResponses, withCorsIntegration } from './apigw-util';

import * as path from 'path';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //DYNAMO DB    
    const studentTable = new dynamodb.Table(this, `Students`, {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }
    });
    const attendanceTable = new dynamodb.Table(this, `Attendances`, {
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
    });
    const authorizedTable = new dynamodb.Table(this, `AuthorizedScanners`, {      
      partitionKey: { name: 'scannerId', type: dynamodb.AttributeType.STRING },
    });
    const eventsTable = new dynamodb.Table(this, `EventData`, {
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },      
    });
    //GSIs
    studentTable.addGlobalSecondaryIndex({
      indexName: 'studentNumber-index',
      partitionKey: { name: 'studentNumber', type: dynamodb.AttributeType.STRING }
    });

    //S3 BUCKET
    const mainBucket = new s3.Bucket(this, 'MainBucket', {      
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: true,         // still block ACLs (recommended)
        ignorePublicAcls: true,        // still ignore ACLs (recommended)
        blockPublicPolicy: false,      // 👈 this must be false
        restrictPublicBuckets: false   // 👈 this must also be false
      }),
    });    
    mainBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowPublicReadForPicsFolder',
        actions: ['s3:GetObject'],
        resources: [`${mainBucket.bucketArn}/pics/*`],
        principals: [new iam.AnyPrincipal()],
        effect: iam.Effect.ALLOW,
      })
    )

    //FUNCTIONS
    const fnRegister = new NodejsFunction(this, 'RegisterFn', {
      entry: path.join(__dirname, '../lambda/handler-register.ts'),
      runtime: Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(60),
      environment: {
        STUDENT_TABLE: studentTable.tableName,
        MAINBUCKET_NAME: mainBucket.bucketName
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

    const fnLogAttendance = new NodejsFunction(this, 'LogAttendanceFunction', {
      entry: path.join(__dirname, '../lambda/handler-logAttendance.ts'),
      runtime: Runtime.NODEJS_20_X,
      environment: {
        ATTENDANCE_TABLE: attendanceTable.tableName,
        AUTHORIZED_TABLE: authorizedTable.tableName,        
      },
    });

    const fnGetEventsInfo = new NodejsFunction(this, 'GetEventsInfoFunction', {
      entry: path.join(__dirname, '../lambda/handler-getEvents.ts'),
      runtime: Runtime.NODEJS_20_X,
      environment: {
        EVENTS_TABLE: eventsTable.tableName
      }
    });

    //ACCESS GRANTS
    studentTable.grantReadWriteData(fnRegister);
    studentTable.grantReadWriteData(fnGetQr);
    studentTable.grantReadData(fnGetStudentInfo);    
    attendanceTable.grantReadWriteData(fnLogAttendance);
    authorizedTable.grantReadData(fnLogAttendance);    
    eventsTable.grantReadData(fnGetEventsInfo);

    mainBucket.grantReadWrite(fnRegister);

    //APIGW
    const api = new apigateway.RestApi(this, 'QrApi');

    const regResource = api.root.addResource('register');
    regResource.addMethod('POST', withCorsIntegration(fnRegister), { methodResponses: defaultCorsMethodResponses });
    addCorsOptions(regResource);

    const qrResource = api.root.addResource('get-qr');
    qrResource.addMethod('POST', withCorsIntegration(fnGetQr), { methodResponses: defaultCorsMethodResponses });
    addCorsOptions(qrResource);

    const logResource = api.root.addResource('log-attendance');
    logResource.addMethod('POST', withCorsIntegration(fnLogAttendance), { methodResponses: defaultCorsMethodResponses});
    addCorsOptions(logResource);

    api.root.addResource('get-event-data')
      .addMethod('GET', withCorsIntegration(fnGetEventsInfo), { methodResponses: defaultCorsMethodResponses });

    api.root.addResource('student')
      .addResource('{id}')
      .addMethod('GET', withCorsIntegration(fnGetStudentInfo), { methodResponses: defaultCorsMethodResponses });
  }
}
