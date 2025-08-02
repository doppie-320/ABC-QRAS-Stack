import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { responseWithCors } from './utils/cors-response';

const db = new DynamoDBClient({});

export const handler: APIGatewayProxyHandler = async (event) => {
    try {

        const data = await db.send(new ScanCommand({
            TableName: process.env.EVENTS_TABLE!,
            ProjectionExpression: 'eventId, eventName',
        }));

        return responseWithCors(200,
            JSON.stringify(
                data.Items?.map(item => ({
                    eventId: item.eventId.S,
                    eventName: item.eventName.S,
                })) || []
            )
        );
    } catch (err: any) {
        console.error('Unhanled error:', err);
        return responseWithCors(500, JSON.stringify({ error: `Unhandled error: ${err.message}` }));
    }
};