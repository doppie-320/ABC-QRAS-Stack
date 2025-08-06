import { APIGatewayProxyHandler } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient, PutItemCommand, QueryCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import bcrypt from 'bcryptjs';
import { responseWithCors } from '../utils/cors-response';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});
const db = new DynamoDBClient({});
const STUDENT_TABLE = process.env.STUDENT_TABLE!;
const MAINBUCKET_NAME = process.env.MAINBUCKET_NAME!;
const METADATA_TABLE = process.env.METADATA_TABLE!;

async function getMetadata(type: string) {
    const res = await db.send(new GetItemCommand({
        TableName: METADATA_TABLE,
        Key: { PK: { S: type }, SK: { S: "all" } }
    }));
    return res.Item?.data?.S ? JSON.parse(res.Item.data.S) : {};
}

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const { name, studentNumber, password, pictureB64, department, yearLevel } = JSON.parse(event.body || '{}');

        if (!name || !studentNumber || !password || !department || !yearLevel) {
            return responseWithCors(400, JSON.stringify({ error: 'Missing required fields!' }));
        }

        const normalizedStudentNumber = studentNumber.trim().toLowerCase();
        const shortName = studentNumber.replace(/\s/g, '').toLowerCase();

        const b64Matches = pictureB64?.match(/^data:(.+);base64,(.+)$/);
        if (!b64Matches) {
            return responseWithCors(400, JSON.stringify({ error: 'base64 profile picture is invalid format!' }));
        }

        // Check if student number already exists
        const checkStudentNumber = await db.send(
            new QueryCommand({
                TableName: STUDENT_TABLE,
                IndexName: 'studentNumber-index',
                KeyConditionExpression: 'studentNumber = :sn',
                ExpressionAttributeValues: {
                    ':sn': { S: normalizedStudentNumber }
                },
            })
        );

        if (checkStudentNumber.Count && checkStudentNumber.Count > 0) {
            return responseWithCors(409, JSON.stringify({ error: 'Student number already registered.' }));
        }

        // Upload profile picture to S3
        const mimeType = b64Matches[1];
        const fileExt = mimeType.split('/')[1];
        const base64Data = b64Matches[2];
        const buffer = Buffer.from(base64Data, 'base64');        
        const pfpFileName = `pics/${shortName}.${fileExt}`;

        await s3.send(new PutObjectCommand({
            Bucket: MAINBUCKET_NAME,
            Key: pfpFileName,
            Body: buffer,
            ContentType: mimeType,
        }));
        const pfpS3Url = `https://${MAINBUCKET_NAME}.s3.amazonaws.com/${pfpFileName}`;

        // Fetch metadata names
        const [departments, years] = await Promise.all([
            getMetadata("DEPTDATA"),
            getMetadata("YEARDATA")
        ]);

        // Build search index
        const searchIndex = [
            name,
            studentNumber,
            departments[department] || "",
            years[yearLevel] || ""
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        // Store student record in DynamoDB
        const id = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.send(new PutItemCommand({
            TableName: STUDENT_TABLE,
            Item: {
                id: { S: id },
                name: { S: name },
                studentNumber: { S: normalizedStudentNumber },
                passwordHash: { S: hashedPassword },
                pictureUrl: { S: pfpS3Url },
                department: { S: department },
                yearLevel: { S: yearLevel },
                searchIndex: { S: searchIndex } // ✅ added
            }
        }));

        return responseWithCors(200, JSON.stringify({ message: 'Successfully added a new student!' }));
    } catch (err: any) {
        console.error('Unhandled error:', err);
        return responseWithCors(500, JSON.stringify({ error: `Unhandled error: ${err.message}` }));
    }
};
