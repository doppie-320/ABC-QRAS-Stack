import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { responseWithCors } from './utils/cors-response';

const db = new DynamoDBClient({});
const STUDENT_TABLE = process.env.STUDENT_TABLE;

export const handler: APIGatewayProxyHandler = async (event) => {
    const { studentNumber, password } = JSON.parse(event.body || '{}');

    if (!studentNumber || !password) {        
        return responseWithCors(400, JSON.stringify({ error: "Missing number or password." }));
    }

    const result = await db.send(new QueryCommand({
        TableName: STUDENT_TABLE,
        IndexName: 'studentNumber-index',
        KeyConditionExpression: 'studentNumber = :s',
        ExpressionAttributeValues: {
            ':s': { S: studentNumber }
        }
    }));

    const student: any = result.Items?.[0];
    if (!student) {
        return responseWithCors(404, JSON.stringify({ error: "Student not found." }));        
    }

    const match = await bcrypt.compare(password, student.passwordHash.S);
    if (!match) {
        return responseWithCors(401, JSON.stringify({ error: "Invalid password." }));        
    }

    const qrPayload = JSON.stringify({ studentId: student.id.S });
    const qrCode = await QRCode.toDataURL(qrPayload);

    return responseWithCors(
        200,
        JSON.stringify({
            id: student.id.s,
            qrCode
        })
    );
};