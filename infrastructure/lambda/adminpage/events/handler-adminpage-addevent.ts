import { DynamoDBClient, PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";
import { responseWithCors } from "../../utils/cors-response";

const db = new DynamoDBClient({});
const EVENTS_TABLE = process.env.EVENTS_TABLE;

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const { eventId, eventName } = JSON.parse(event.body || '{}');
        if(!eventName || !eventId) {
            return responseWithCors(400,
                JSON.stringify({ error: 'eventName or eventId is not provided' })
            );
        }

        await db.send(new PutItemCommand({
            TableName: EVENTS_TABLE,
            Item: {
                eventId: { S: eventId },
                eventName: { S: eventName },
            }
        }));

        return responseWithCors(200,
            JSON.stringify({ message: `Event eventid:${eventId} added!` })
        );
    } catch (err: any) {
        return responseWithCors(500,
            JSON.stringify({ error: err.message })
        );
    }
}