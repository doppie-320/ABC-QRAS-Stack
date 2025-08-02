import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { responseWithCors } from "../../utils/cors-response";

const db = new DynamoDBClient({});
const AUTHORIZED_TABLE = process.env.AUTHORIZED_TABLE!;

export const handler: APIGatewayProxyHandler = async () => {
    try {
        const res = await db.send(new ScanCommand({ TableName: AUTHORIZED_TABLE }));
        const scanners = res.Items?.map(i => ({
            scannerId: i.scannerId.S!,
            password: i.password.S! // You might not want to return password in plaintext
        })) || [];
        return responseWithCors(200, JSON.stringify(scanners));
    } catch (err) {
        console.error(err);
        return responseWithCors(500, JSON.stringify({ error: "Internal Server Error" }));
    }
};