import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { responseWithCors } from "../../utils/cors-response";

const db = new DynamoDBClient({});
const AUTHORIZED_TABLE = process.env.AUTHORIZED_TABLE!;

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const { scannerId, password } = JSON.parse(event.body || "{}");
        if (!scannerId || !password) {
            return responseWithCors(400, JSON.stringify({ error: "Missing required fields" }));
        }
        await db.send(new PutItemCommand({
            TableName: AUTHORIZED_TABLE,
            Item: {
                scannerId: { S: scannerId },
                password: { S: password }
            }
        }));
        return responseWithCors(200, JSON.stringify({ message: "Scanner added" }));
    } catch (err) {
        console.error(err);
        return responseWithCors(500, JSON.stringify({ error: "Internal Server Error" }));
    }
};
