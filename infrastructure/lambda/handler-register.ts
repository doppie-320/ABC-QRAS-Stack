import { APIGatewayProxyHandler } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid'
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import bcrypt from 'bcryptjs';
import { responseWithCors } from './utils/cors-response';

const db = new DynamoDBClient({});
const STUDENT_TABLE = process.env.STUDENT_TABLE;

export const handler: APIGatewayProxyHandler = async (event) => {
    const { name, studentNumber, password } = JSON.parse(event.body || '{}');
    console.log('Incoming body:', event.body);
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

    return responseWithCors(200, JSON.stringify({id}));
};