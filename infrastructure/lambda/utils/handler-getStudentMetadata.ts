import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { responseWithCors } from '../utils/cors-response';

const db = new DynamoDBClient({});

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const { type } = event.pathParameters || {};
        if (!type) {
            return responseWithCors(400, JSON.stringify({ error: 'Missing type parameter' }));
        }

        const res = await db.send(new GetItemCommand({
            TableName: process.env.METADATA_TABLE!,
            Key: {
                PK: { S: type },
                SK: { S: 'all' },
            },
        }));

        if (!res.Item) {
            return responseWithCors(404, JSON.stringify({ error: 'Metadata not found' }));
        }

        return responseWithCors(
            200,
            res.Item.data.S || '{}'
        );
    } catch (err: any) {
        console.error('Unhandled error:', err);
        return responseWithCors(500, JSON.stringify({ error: `Unhandled error: ${err.message}` }));
    }
};
