import { APIGatewayProxyHandler } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid'
import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import bcrypt from 'bcryptjs';
import { responseWithCors } from './utils/cors-response';
import { error } from 'console';

const db = new DynamoDBClient({});
const STUDENT_TABLE = process.env.STUDENT_TABLE;

export const handler: APIGatewayProxyHandler = async (event) => {
    const { name, studentNumber, password } = JSON.parse(event.body || '{}');

    if (!name || !studentNumber || !password) {
        return responseWithCors(400, JSON.stringify({ error: 'Missing required fields!' }));
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

    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);


    await db.send(new PutItemCommand({
        TableName: STUDENT_TABLE,
        Item: {
            id: { S: id },
            name: { S: name },
            studentNumber: { S: studentNumber },
            passwordHash: { S: hashedPassword },
        }
    }));

    return responseWithCors(200, JSON.stringify({ message: 'Successfully added a new student!' }));
};