import { APIGatewayProxyHandler } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid'
import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import bcrypt from 'bcryptjs';
import { responseWithCors } from './utils/cors-response';
import { error } from 'console';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { mainBucketName } from '../../shared/links';

const s3 = new S3Client({});
const db = new DynamoDBClient({});
const STUDENT_TABLE = process.env.STUDENT_TABLE;

export const handler: APIGatewayProxyHandler = async (event) => {
    const { name, studentNumber, password, pictureB64 } = JSON.parse(event.body || '{}');    

    if (!name || !studentNumber || !password) {
        return responseWithCors(400, JSON.stringify({ error: 'Missing required fields!' }));
    }

    const b64Matches = pictureB64.match(/^data:(.+);base64,(.+)$/);
    if(!b64Matches) {
        return responseWithCors(400, JSON.stringify({ error: 'base 64 profile picture is invalid format!' }));
    }

    const checkStudentNumber = await db.send(
        new QueryCommand({
            TableName: STUDENT_TABLE,
            IndexName: 'studentNumber-index',
            KeyConditionExpression: 'studentNumber = :sn',
            ExpressionAttributeValues: {
                ':sn': { S: studentNumber }
            },
        })
    );

    if (checkStudentNumber.Count && checkStudentNumber.Count > 0) {
        return responseWithCors(409, JSON.stringify({ error: 'Student number already registered.' }));
    }

    const mimeType = b64Matches[1];
    const fileExt = mimeType.split('/')[1];
    const base64Data = b64Matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const pfpFileName = `pics/${studentNumber}.${fileExt}`;

    // await s3.send(new PutObjectCommand({
    //     Bucket: mainBucketName,
    //     Key: pfpFileName,
    //     Body: buffer,
    //     ContentType: mimeType,        
    // }));
    const pfpS3Url = `https://${mainBucketName}.s3.amazonaws.com/${pfpFileName}`;

    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.send(new PutItemCommand({
        TableName: STUDENT_TABLE,
        Item: {
            id: { S: id },
            name: { S: name },
            studentNumber: { S: studentNumber },
            passwordHash: { S: hashedPassword },
            // pictureUrl: { S: pfpS3Url }
        }
    }));

    return responseWithCors(200, JSON.stringify({ message: 'Successfully added a new student!' }));
};