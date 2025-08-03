import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { responseWithCors } from "../../utils/cors-response";
import { verifyAdminAuth } from "../auth/handler-adminpage-auth-verify";

const db = new DynamoDBClient({});
const STUDENT_TABLE = process.env.STUDENT_TABLE!;

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const user = verifyAdminAuth(event.headers);
        if(!user) {
            return responseWithCors(403, JSON.stringify({ error: "Not authorized" }));
        }

        const body = JSON.parse(event.body || "{}");
        if (!body.id) {
            return responseWithCors(400, JSON.stringify({ error: "Missing student id" }));
        }

        await db.send(new DeleteItemCommand({
            TableName: STUDENT_TABLE,
            Key: { id: { S: body.id } }
        }));

        return responseWithCors(200, JSON.stringify({ message: "Student deleted successfully" }));
    } catch (err) {
        console.error(err);
        return responseWithCors(500, JSON.stringify({ error: "Internal Server Error" }));
    }
};
