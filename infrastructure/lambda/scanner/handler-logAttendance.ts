import { APIGatewayProxyHandler } from 'aws-lambda';
import { responseWithCors } from '../utils/cors-response';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

const db = new DynamoDBClient({});
const ATTENDANCE_TABLE = process.env.ATTENDANCE_TABLE;
const AUTHORIZED_TABLE = process.env.AUTHORIZED_TABLE;

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const { studentId, eventId, decision, scannerId, scannerPassword } = JSON.parse(event.body || '{}');

        if(!studentId || !eventId || !decision || !scannerId || !scannerPassword) {
            return responseWithCors(400, JSON.stringify({ error: 'Missing required fields!' }));
        }

        const auth = await db.send(new GetItemCommand({
            TableName: AUTHORIZED_TABLE,
            Key: { scannerId: { S: scannerId.trim() } }
        }));
        

        if(!auth.Item || auth.Item.password.S !== scannerPassword) {
            return responseWithCors(403, JSON.stringify({ error: 'Unauthorized scanner!' }));
        }

        const timestamp = new Date().toISOString();
        await db.send(
            new PutItemCommand({
                TableName: ATTENDANCE_TABLE,
                Item: {
                    PK: { S: `EVENT#${eventId}` },
                    SK: { S: `STUDENT#${studentId}#${timestamp}` },
                    decision: { S: decision },
                    timestamp: { S: timestamp },
                    scannerId: { S: scannerId }
                }
            }),
        );

        return responseWithCors(200, JSON.stringify({ message: `Successfully logged attendance of ${studentId} with decision ${decision}!` }));
    } catch(err) {
        return responseWithCors(500, JSON.stringify({ error: `Unhandled error! ${err}` }));
    }
}