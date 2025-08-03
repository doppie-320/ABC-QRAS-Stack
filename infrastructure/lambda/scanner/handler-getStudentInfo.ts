import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { responseWithCors } from "../utils/cors-response";

const db = new DynamoDBClient({});
const STUDENT_TABLE = process.env.STUDENT_TABLE!;
const METADATA_TABLE = process.env.METADATA_TABLE!;

export const handler: APIGatewayProxyHandler = async (event) => {
    const id = event.pathParameters?.id;

    if (!id) {
        return responseWithCors(400, '[Restful API] GET Request is missing QrStudentID');
    }

    // Get student data
    const result = await db.send(new GetItemCommand({
        TableName: STUDENT_TABLE,
        Key: { id: { S: id } }
    }));

    if (!result.Item) {
        return responseWithCors(404, 'Student not found!');
    }

    const student = unmarshall(result.Item);
    delete student.passwordHash;

    // Fetch Department name
    let departmentName = null;
    if (student.department) {
        const deptRes = await db.send(new GetItemCommand({
            TableName: METADATA_TABLE,
            Key: {
                PK: { S: `DEPTDATA#${student.department}` },
                SK: { S: "all" }
            }
        }));
        if (deptRes.Item) {
            departmentName = deptRes.Item.data?.S;
        }
    }

    // Fetch Year Level name
    let yearLevelName = null;
    if (student.yearLevel) {
        const yearRes = await db.send(new GetItemCommand({
            TableName: METADATA_TABLE,
            Key: {
                PK: { S: `YEARDATA#${student.yearLevel}` },
                SK: { S: "all" }
            }
        }));
        if (yearRes.Item) {
            yearLevelName = yearRes.Item.data?.S;
        }
    }

    return responseWithCors(200, JSON.stringify({
        ...student,
        departmentName,
        yearLevelName
    }));
};
