import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { addCorsOptions, defaultCorsMethodResponses, withCorsIntegration } from './apigw-util';
import * as path from 'path';

const JWT_SECRET = "abc-qras-jwt-supersecret";

export interface InfrastructureStackProps extends cdk.StackProps {
  envName: string;
}

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    const envName = props.envName;
    const account = cdk.Stack.of(this).account;
    const region = cdk.Stack.of(this).region;
    const uniqueSuffix = `${account}-${region}`;

    // DynamoDB tables
    const studentTable = new dynamodb.Table(this, `StudentsTable${envName}`, {
      tableName: `students-${envName}-${uniqueSuffix}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }
    });

    const attendanceTable = new dynamodb.Table(this, `AttendancesTable${envName}`, {
      tableName: `attendances-${envName}-${uniqueSuffix}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
    });

    const authorizedTable = new dynamodb.Table(this, `AuthorizedScannersTable${envName}`, {
      tableName: `authorized-scanners-${envName}-${uniqueSuffix}`,
      partitionKey: { name: 'scannerId', type: dynamodb.AttributeType.STRING },
    });

    const eventsTable = new dynamodb.Table(this, `EventsTable${envName}`, {
      tableName: `events-${envName}-${uniqueSuffix}`,
      partitionKey: { name: 'eventId', type: dynamodb.AttributeType.STRING },
    });

    const adminsTable = new dynamodb.Table(this, `AdminsTable${envName}`, {
      tableName: `admins-${envName}-${uniqueSuffix}`,
      partitionKey: { name: 'username', type: dynamodb.AttributeType.STRING },
    });

    const studentMetadataTable = new dynamodb.Table(this, `StudentMetadataTable${envName}`, {
      tableName: `student-metadata-${envName}-${uniqueSuffix}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
    });

    // Seed metadata Lambda
    const seedMetadataLambda = new NodejsFunction(this, `SeedMetadataLambda${envName}`, {
      entry: path.join(__dirname, '../lambda/utils/prefill-metadata-db.ts'),
      runtime: Runtime.NODEJS_20_X,
      environment: {
        METADATA_TABLE: studentMetadataTable.tableName,
      }
    });
    studentMetadataTable.grantWriteData(seedMetadataLambda);
    new cr.AwsCustomResource(this, `SeedMetadataResource${envName}`, {
      policy: cr.AwsCustomResourcePolicy.fromStatements([
        new iam.PolicyStatement({
          actions: ['lambda:InvokeFunction'],
          resources: [seedMetadataLambda.functionArn],
        }),
      ]),
      onCreate: {
        service: "Lambda",
        action: "invoke",
        parameters: {
          FunctionName: seedMetadataLambda.functionName,
        },
        physicalResourceId: cr.PhysicalResourceId.of(`SeedMetadataDBOnce-${envName}`),
      }
    });

    studentTable.addGlobalSecondaryIndex({
      indexName: `studentNumber-index`,
      partitionKey: { name: 'studentNumber', type: dynamodb.AttributeType.STRING }
    });

    // S3 bucket
    const mainBucket = new s3.Bucket(this, `MainBucket${envName}`, {
      bucketName: `qras-main-bucket-${envName.toLowerCase()}-${uniqueSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: true,
        ignorePublicAcls: true,
        blockPublicPolicy: false,
        restrictPublicBuckets: false
      }),
    });
    mainBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'AllowPublicReadForPicsFolder',
      actions: ['s3:GetObject'],
      resources: [`${mainBucket.bucketArn}/pics/*`],
      principals: [new iam.AnyPrincipal()],
      effect: iam.Effect.ALLOW,
    }));

    // Helper to create Lambda with env name suffix
    const makeFn = (id: string, file: string, env: Record<string, string> = {}, timeoutSec = 10) =>
      new NodejsFunction(this, `${id}${envName}`, {
        entry: path.join(__dirname, file),
        runtime: Runtime.NODEJS_20_X,
        timeout: cdk.Duration.seconds(timeoutSec),
        environment: env,
      });

    // Lambdas
    const fnRegister = makeFn('RegisterFn', '../lambda/student-app/handler-register.ts', {
      STUDENT_TABLE: studentTable.tableName,
      MAINBUCKET_NAME: mainBucket.bucketName,
	  METADATA_TABLE: studentMetadataTable.tableName,
    }, 60);

    const fnGetQr = makeFn('GetQrFn', '../lambda/student-app/handler-getqr.ts', {
      STUDENT_TABLE: studentTable.tableName
    });

    const fnGetStudentInfo = makeFn('GetStudentInfoFn', '../lambda/scanner/handler-getStudentInfo.ts', {
      STUDENT_TABLE: studentTable.tableName,
      METADATA_TABLE: studentMetadataTable.tableName
    });

    const fnLogAttendance = makeFn('LogAttendanceFn', '../lambda/scanner/handler-logAttendance.ts', {
      ATTENDANCE_TABLE: attendanceTable.tableName,
      AUTHORIZED_TABLE: authorizedTable.tableName
    });

    const fnGetEventsInfo = makeFn('GetEventsInfoFn', '../lambda/student-app/handler-getEvents.ts', {
      EVENTS_TABLE: eventsTable.tableName
    });

    const fnAdminAddEvent = makeFn('AdminAddEventFn', '../lambda/adminpage/events/handler-adminpage-addevent.ts', {
      EVENTS_TABLE: eventsTable.tableName,
      JWT_SECRET
    });

    const fnAdminDeleteEvent = makeFn('AdminDeleteEventFn', '../lambda/adminpage/events/handler-adminpage-deleteevent.ts', {
      EVENTS_TABLE: eventsTable.tableName,
      JWT_SECRET
    });

    const fnAdminViewAttendanceByEvent = makeFn('AdminViewAttendanceByEventFn', '../lambda/adminpage/attendance/handler-adminpage-attendanceByEvent.ts', {
      ATTENDANCE_TABLE: attendanceTable.tableName,
      STUDENT_TABLE: studentTable.tableName,
      JWT_SECRET
    });

    const fnAdminViewAttendanceByStudent = makeFn('AdminViewAttendanceByStudentFn', '../lambda/adminpage/attendance/handler-adminpage-attendanceByStudent.ts', {
      ATTENDANCE_TABLE: attendanceTable.tableName,
      EVENTS_TABLE: eventsTable.tableName,
      STUDENT_TABLE: studentTable.tableName,
      JWT_SECRET
    });

    const fnAdminSearchStudents = makeFn('AdminSearchStudentsFn', '../lambda/adminpage/students/handler-adminpage-searchStudents.ts', {
      STUDENT_TABLE: studentTable.tableName,
	    METADATA_TABLE: studentMetadataTable.tableName,
      JWT_SECRET
    });

    const fnAdminDeleteStudent = makeFn('AdminDeleteStudentFn', '../lambda/adminpage/students/handler-adminpage-deleteStudent.ts', {
      STUDENT_TABLE: studentTable.tableName,
      JWT_SECRET
    });

    const fnAdminScannersList = makeFn('AdminScannersListFn', '../lambda/adminpage/scanners/handler-adminpage-getScanners.ts', {
      AUTHORIZED_TABLE: authorizedTable.tableName,
      JWT_SECRET
    });

    const fnAdminScannersAdd = makeFn('AdminScannersAddFn', '../lambda/adminpage/scanners/handler-adminpage-addScanner.ts', {
      AUTHORIZED_TABLE: authorizedTable.tableName,
      JWT_SECRET
    });

    const fnAdminScannersDelete = makeFn('AdminScannersDeleteFn', '../lambda/adminpage/scanners/handler-adminpage-deleteScanner.ts', {
      AUTHORIZED_TABLE: authorizedTable.tableName,
      JWT_SECRET
    });

    const fnAdminAuthLogin = makeFn('AdminAuthLoginFn', '../lambda/adminpage/auth/handler-adminpage-auth-login.ts', {
      ADMIN_TABLE: adminsTable.tableName,
      JWT_SECRET
    });

    const fnGetMetadata = makeFn('GetMetadataFn', '../lambda/utils/handler-getStudentMetadata.ts', {
      METADATA_TABLE: studentMetadataTable.tableName
    });

    // Grants
    studentTable.grantReadWriteData(fnRegister);
    studentTable.grantReadWriteData(fnGetQr);
    studentTable.grantReadData(fnGetStudentInfo);
    studentTable.grantReadData(fnAdminViewAttendanceByEvent);
    studentTable.grantReadData(fnAdminViewAttendanceByStudent);
    studentTable.grantReadData(fnAdminSearchStudents);
    studentTable.grantReadWriteData(fnAdminDeleteStudent);

    attendanceTable.grantReadData(fnAdminViewAttendanceByEvent);
    attendanceTable.grantReadData(fnAdminViewAttendanceByStudent);
    attendanceTable.grantReadWriteData(fnLogAttendance);

    authorizedTable.grantReadData(fnLogAttendance);
    authorizedTable.grantReadData(fnAdminScannersList);
    authorizedTable.grantReadWriteData(fnAdminScannersAdd);
    authorizedTable.grantReadWriteData(fnAdminScannersDelete);

    eventsTable.grantReadData(fnAdminViewAttendanceByStudent);
    eventsTable.grantReadData(fnGetEventsInfo);
    eventsTable.grantReadWriteData(fnAdminAddEvent);
    eventsTable.grantReadWriteData(fnAdminDeleteEvent);
    eventsTable.grantReadData(fnAdminViewAttendanceByEvent);

    adminsTable.grantReadData(fnAdminAuthLogin);

    studentMetadataTable.grantReadData(fnGetMetadata);
    studentMetadataTable.grantReadData(fnGetStudentInfo);
	studentMetadataTable.grantReadData(fnAdminSearchStudents);
	studentMetadataTable.grantReadData(fnRegister);

    mainBucket.grantReadWrite(fnRegister);

    // API Gateway
    const api = new apigateway.RestApi(this, `QrApi${envName}`, {
      restApiName: `QrApi-${envName}-${uniqueSuffix}`,
    });

    const regResource = api.root.addResource('register');
    regResource.addMethod('POST', withCorsIntegration(fnRegister), { methodResponses: defaultCorsMethodResponses });
    addCorsOptions(regResource);

    const qrResource = api.root.addResource('get-qr');
    qrResource.addMethod('POST', withCorsIntegration(fnGetQr), { methodResponses: defaultCorsMethodResponses });
    addCorsOptions(qrResource);

    const logResource = api.root.addResource('log-attendance');
    logResource.addMethod('POST', withCorsIntegration(fnLogAttendance), { methodResponses: defaultCorsMethodResponses });
    addCorsOptions(logResource);

    api.root.addResource('get-event-data')
      .addMethod('GET', withCorsIntegration(fnGetEventsInfo), { methodResponses: defaultCorsMethodResponses });

    api.root.addResource('student')
      .addResource('{id}')
      .addMethod('GET', withCorsIntegration(fnGetStudentInfo), { methodResponses: defaultCorsMethodResponses });

    const adminMainResource = api.root.addResource('admin');

    const adminAddEventResource = adminMainResource.addResource('add-event');
    adminAddEventResource.addMethod('POST', withCorsIntegration(fnAdminAddEvent), { methodResponses: defaultCorsMethodResponses });
    addCorsOptions(adminAddEventResource);

    const adminDeleteEventResource = adminMainResource.addResource('del-event');
    adminDeleteEventResource.addMethod('POST', withCorsIntegration(fnAdminDeleteEvent), { methodResponses: defaultCorsMethodResponses });
    addCorsOptions(adminDeleteEventResource);

    const adminViewAttendanceByEventResource = adminMainResource.addResource('attendance-by-event');
    adminViewAttendanceByEventResource.addMethod('GET', withCorsIntegration(fnAdminViewAttendanceByEvent), { methodResponses: defaultCorsMethodResponses });
    addCorsOptions(adminViewAttendanceByEventResource);

    const adminViewAttendanceByStudentResource = adminMainResource.addResource('attendance-by-student');
    adminViewAttendanceByStudentResource.addMethod('GET', withCorsIntegration(fnAdminViewAttendanceByStudent), { methodResponses: defaultCorsMethodResponses });
    addCorsOptions(adminViewAttendanceByStudentResource);

    const adminSearchStudentsResource = adminMainResource.addResource('search-students');
    adminSearchStudentsResource.addMethod('GET', withCorsIntegration(fnAdminSearchStudents), { methodResponses: defaultCorsMethodResponses });
    addCorsOptions(adminSearchStudentsResource);

    const adminDeleteStudentResource = adminMainResource.addResource('del-student');
    adminDeleteStudentResource.addMethod('POST', withCorsIntegration(fnAdminDeleteStudent), { methodResponses: defaultCorsMethodResponses });
    addCorsOptions(adminDeleteStudentResource);

    const adminScannersListResource = adminMainResource.addResource('get-scanners');
    adminScannersListResource.addMethod('POST', withCorsIntegration(fnAdminScannersList), { methodResponses: defaultCorsMethodResponses });
    addCorsOptions(adminScannersListResource);

    const adminScannersAddResource = adminMainResource.addResource('add-scanner');
    adminScannersAddResource.addMethod('POST', withCorsIntegration(fnAdminScannersAdd), { methodResponses: defaultCorsMethodResponses });
    addCorsOptions(adminScannersAddResource);

    const adminScannersDeleteResource = adminMainResource.addResource('del-scanner');
    adminScannersDeleteResource.addMethod('POST', withCorsIntegration(fnAdminScannersDelete), { methodResponses: defaultCorsMethodResponses });
    addCorsOptions(adminScannersDeleteResource);

    const adminAuthLoginResource = adminMainResource.addResource('login');
    adminAuthLoginResource.addMethod('POST', withCorsIntegration(fnAdminAuthLogin), { methodResponses: defaultCorsMethodResponses });
    addCorsOptions(adminAuthLoginResource);

    api.root.addResource('get-student-metadata')
      .addResource('{type}')
      .addMethod('GET', withCorsIntegration(fnGetMetadata), { methodResponses: defaultCorsMethodResponses });
  }
}
