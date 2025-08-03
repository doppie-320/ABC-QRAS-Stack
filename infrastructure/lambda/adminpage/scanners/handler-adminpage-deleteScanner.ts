import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { responseWithCors } from "../../utils/cors-response";
import { verifyAdminAuth } from "../auth/handler-adminpage-auth-verify";

const db = new DynamoDBClient({});
const AUTHORIZED_TABLE = process.env.AUTHORIZED_TABLE!;

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const user = verifyAdminAuth(event.headers);
        if (!user) {
            return responseWithCors(403, JSON.stringify({ error: "Not authorized" }));
        }

        const { scannerId } = JSON.parse(event.body || "{}");
        if (!scannerId) {
            return responseWithCors(400, JSON.stringify({ error: "Missing scannerId" }));
        }
        await db.send(new DeleteItemCommand({
            TableName: AUTHORIZED_TABLE,
            Key: { scannerId: { S: scannerId } }
        }));
        return responseWithCors(200, JSON.stringify({ message: "Scanner deleted" }));
    } catch (err) {
        console.error(err);
        return responseWithCors(500, JSON.stringify({ error: "Internal Server Error" }));
    }
};
