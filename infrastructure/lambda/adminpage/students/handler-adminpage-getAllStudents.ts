import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { responseWithCors } from "../../utils/cors-response";
import { verifyAdminAuth } from "../auth/handler-adminpage-auth-verify";

const db = new DynamoDBClient({});
const STUDENT_TABLE = process.env.STUDENT_TABLE!;

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const user = verifyAdminAuth(event.headers);
        if (!user) {
            return responseWithCors(403, JSON.stringify({ error: "Not authorized" }));
        }

        const res = await db.send(new ScanCommand({
            TableName: STUDENT_TABLE
        }));

        const students = res.Items?.map(s => ({
            id: s.id.S!,
            name: s.name.S!,
            studentNumber: s.studentNumber.S!,
            pictureUrl: s.pictureUrl?.S || "",
            departmentCode: s.department?.S || "",
            yearCode: s.yearLevel?.S || ""
        })) || [];

        return responseWithCors(200, JSON.stringify(students));
    } catch (err) {
        console.error(err);
        return responseWithCors(500, JSON.stringify({ error: "Internal Server Error" }));
    }
};
