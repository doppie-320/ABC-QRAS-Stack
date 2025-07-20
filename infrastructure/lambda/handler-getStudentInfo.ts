import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient, GetItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { responseWithCors } from "./utils/cors-response";

const db = new DynamoDBClient({});
const tableName = process.env.STUDENT_TABLE;

export const handler: APIGatewayProxyHandler = async(event) => {
    const id = event.pathParameters?.id;

    if(!id) return responseWithCors(400, '[Restful API] GET Request is missing QrStudentID');

    const result = await db.send(new GetItemCommand({
        TableName: tableName,
        Key: { id: { S: id } }
    }));

    if(!result.Item) { return responseWithCors(404, 'Student not found!'); }

    const student = unmarshall(result.Item);
    delete student.passwordHash;   
    
    return responseWithCors(200, JSON.stringify(student));
};