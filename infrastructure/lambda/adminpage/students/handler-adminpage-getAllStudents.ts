import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { responseWithCors } from "../../utils/cors-response";

const db = new DynamoDBClient({});
const STUDENT_TABLE = process.env.STUDENT_TABLE!;

export const handler: APIGatewayProxyHandler = async () => {
    try {
        const res = await db.send(new ScanCommand({
            TableName: STUDENT_TABLE
        }));

        const students = res.Items?.map(s => ({
            id: s.id.S!,
            name: s.name.S!,
            studentNumber: s.studentNumber.S!,
            pictureUrl: s.pictureUrl?.S || ""
        })) || [];

        return responseWithCors(200, JSON.stringify(students));
    } catch (err) {
        console.error(err);
        return responseWithCors(500, JSON.stringify({ error: "Internal Server Error" }));
    }
};
