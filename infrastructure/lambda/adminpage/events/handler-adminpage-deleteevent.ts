import { DeleteItemCommand, DynamoDBClient, PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";
import { responseWithCors } from "../../utils/cors-response";

const db = new DynamoDBClient({});
const EVENTS_TABLE = process.env.EVENTS_TABLE;

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const { eventId } = JSON.parse(event.body || '{}');
        if(!eventId) {
            return responseWithCors(400, JSON.stringify({ error: 'eventId is not provided!' }));
        }

        await db.send(new DeleteItemCommand({
            TableName: EVENTS_TABLE,
            Key: { eventId: { S: eventId } }
        }));

        return responseWithCors(200, JSON.stringify({ message: `Event eventId:${eventId} deleted!` }));
    } catch (err: any) {
        return responseWithCors(500,
            JSON.stringify({ error: err.message })
        );
    }
}