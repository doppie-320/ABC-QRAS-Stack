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
			entry: path.join(__dirname, '../lambda/scanner/handler-getStudentInfo.ts'),
			runtime: Runtime.NODEJS_20_X,
			environment: {
				STUDENT_TABLE: studentTable.tableName,
			},
		});

		const fnLogAttendance = new NodejsFunction(this, 'LogAttendanceFunction', {
			entry: path.join(__dirname, '../lambda/scanner/handler-logAttendance.ts'),
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

		const fnAdminAddEvent = new NodejsFunction(this, 'AdminAddEventFunction', {
			entry: path.join(__dirname, '../lambda/adminpage/events/handler-adminpage-addevent.ts'),
			runtime: Runtime.NODEJS_20_X,
			environment: {
				EVENTS_TABLE: eventsTable.tableName
			}
		});

		const fnAdminDeleteEvent = new NodejsFunction(this, 'AdminDeleteEventFunction', {
			entry: path.join(__dirname, '../lambda/adminpage/events/handler-adminpage-deleteevent.ts'),
			runtime: Runtime.NODEJS_20_X,
			environment: {
				EVENTS_TABLE: eventsTable.tableName
			}
		});

		const fnAdminViewAttendanceByEvent = new NodejsFunction(this, 'AdminViewAttendanceByEventFunction', {
			entry: path.join(__dirname, '../lambda/adminpage/attendance/handler-adminpage-attendanceByEvent.ts'),
			runtime: Runtime.NODEJS_20_X,
			environment: {
				ATTENDANCE_TABLE: attendanceTable.tableName,
				STUDENT_TABLE: studentTable.tableName,
			}
		});

		const fnAdminViewAttendanceByStudent = new NodejsFunction(this, 'AdminViewAttendanceByStudentFunction', {
			entry: path.join(__dirname, '../lambda/adminpage/attendance/handler-adminpage-attendanceByStudent.ts'),
			runtime: Runtime.NODEJS_20_X,
			environment: {
				ATTENDANCE_TABLE: attendanceTable.tableName,
				EVENTS_TABLE: eventsTable.tableName,
				STUDENT_TABLE: studentTable.tableName,
			}
		});

		const fnAdminGetAllStudents = new NodejsFunction(this, 'AdminViewAllStudentsFunction', {
			entry: path.join(__dirname, '../lambda/adminpage/students/handler-adminpage-getAllStudents.ts'),
			runtime: Runtime.NODEJS_20_X,
			environment: {				
				STUDENT_TABLE: studentTable.tableName,
			}
		});

		const fnAdminDeleteStudent = new NodejsFunction(this, 'AdminDeleteStudentFunction', {
			entry: path.join(__dirname, '../lambda/adminpage/students/handler-adminpage-deleteStudent.ts'),
			runtime: Runtime.NODEJS_20_X,
			environment: {				
				STUDENT_TABLE: studentTable.tableName,
			}
		});

		//ACCESS GRANTS
		studentTable.grantReadWriteData(fnRegister);
		studentTable.grantReadWriteData(fnGetQr);
		studentTable.grantReadData(fnGetStudentInfo);
		studentTable.grantReadData(fnAdminViewAttendanceByEvent);		
		studentTable.grantReadData(fnAdminViewAttendanceByStudent);	
		studentTable.grantReadData(fnAdminGetAllStudents);
		studentTable.grantReadWriteData(fnAdminDeleteStudent);
		attendanceTable.grantReadData(fnAdminViewAttendanceByEvent);
		attendanceTable.grantReadData(fnAdminViewAttendanceByStudent);
		attendanceTable.grantReadWriteData(fnLogAttendance);
		authorizedTable.grantReadData(fnLogAttendance);
		eventsTable.grantReadData(fnAdminViewAttendanceByStudent);
		eventsTable.grantReadData(fnGetEventsInfo);
		eventsTable.grantReadWriteData(fnAdminAddEvent);
		eventsTable.grantReadWriteData(fnAdminDeleteEvent);
		eventsTable.grantReadData(fnAdminViewAttendanceByEvent);

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
		logResource.addMethod('POST', withCorsIntegration(fnLogAttendance), { methodResponses: defaultCorsMethodResponses });
		addCorsOptions(logResource);

		api.root.addResource('get-event-data')
			.addMethod('GET', withCorsIntegration(fnGetEventsInfo), { methodResponses: defaultCorsMethodResponses });

		api.root.addResource('student')
			.addResource('{id}')
			.addMethod('GET', withCorsIntegration(fnGetStudentInfo), { methodResponses: defaultCorsMethodResponses });

		
		const adminMainResource = api.root.addResource('admin');

		//admin/add-event
		const adminAddEventResource = adminMainResource.addResource('add-event');
		adminAddEventResource.addMethod('POST', withCorsIntegration(fnAdminAddEvent), { methodResponses: defaultCorsMethodResponses });
		addCorsOptions(adminAddEventResource);

		//admin/del-event
		const adminDeleteEventResource = adminMainResource.addResource('del-event');
		adminDeleteEventResource.addMethod('POST', withCorsIntegration(fnAdminDeleteEvent), { methodResponses: defaultCorsMethodResponses });
		addCorsOptions(adminDeleteEventResource);

		//admin/attendance-by-event
		const adminViewAttendanceByEventResource = adminMainResource.addResource('attendance-by-event');
		adminViewAttendanceByEventResource.addMethod('GET', withCorsIntegration(fnAdminViewAttendanceByEvent), { methodResponses: defaultCorsMethodResponses });
		addCorsOptions(adminViewAttendanceByEventResource);

		//admin/attendance-by-student
		const adminViewAttendanceByStudentResource = adminMainResource.addResource('attendance-by-student');
		adminViewAttendanceByStudentResource.addMethod('GET', withCorsIntegration(fnAdminViewAttendanceByStudent), { methodResponses: defaultCorsMethodResponses });
		addCorsOptions(adminViewAttendanceByStudentResource);

		//admin/get-all-students
		const adminGetAllStudentsResource = adminMainResource.addResource('get-all-students');
		adminGetAllStudentsResource.addMethod('GET', withCorsIntegration(fnAdminGetAllStudents), { methodResponses: defaultCorsMethodResponses });
		addCorsOptions(adminGetAllStudentsResource);

		//admin/del-student
		const adminDeleteStudentResource = adminMainResource.addResource('del-student');
		adminDeleteStudentResource.addMethod('POST', withCorsIntegration(fnAdminDeleteStudent), { methodResponses: defaultCorsMethodResponses });
		addCorsOptions(adminDeleteStudentResource);
	}
}
