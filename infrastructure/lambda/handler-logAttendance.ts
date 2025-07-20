import { APIGatewayProxyHandler } from 'aws-lambda';
import { responseWithCors } from './utils/cors-response';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const db = new DynamoDBClient({});

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const { studentId, eventId, decision, timestamp } = JSON.parse(event.body || '{}');

        if(!studentId || !eventId || !decision || !timestamp) {
            return responseWithCors(400, JSON.stringify({ error: 'Missing required fields!' }));
        }

        // await db.send(
        //     new PutItemCommand({
        //         TableName: 'attendances',
        //         Item: {
        //             PK: { S: `EVENT#${eventId}` },
        //             SK: { S: `STUDENT#${eventId}` },
        //             decision: { S: decision },
        //             timestamp: { S: timestamp },
        //         }
        //     }),
        // );

        return responseWithCors(200, JSON.stringify({ message: `Successfully logged attendance of ${studentId}!` }));
    } catch(err) {
        return responseWithCors(500, JSON.stringify({ message: `Unhandled error! ${err}` }));
    }
}