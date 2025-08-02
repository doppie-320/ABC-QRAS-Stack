import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { responseWithCors } from "../../utils/cors-response";

const db = new DynamoDBClient({});
const ATTENDANCE_TABLE = process.env.ATTENDANCE_TABLE!;
const STUDENT_TABLE = process.env.STUDENT_TABLE!;
const EVENTS_TABLE = process.env.EVENTS_TABLE!;

export const handler: APIGatewayProxyHandler = async (event) => {
    const friendlyId = event.queryStringParameters?.studentId;
    if (!friendlyId) {
        return responseWithCors(400, JSON.stringify({ error: "Missing studentId" }));
    }

    try {
        // 1️⃣ Look up student UUID by studentNumber
        const studentRes = await db.send(new ScanCommand({
            TableName: STUDENT_TABLE,
            FilterExpression: "studentNumber = :sid",
            ExpressionAttributeValues: {
                ":sid": { S: friendlyId }
            }
        }));

        if (!studentRes.Items?.length) {
            return responseWithCors(404, JSON.stringify({ error: "Student not found" }));
        }

        const studentUUID = studentRes.Items[0].id.S!;

        // 2️⃣ Get all attendance logs for this student
        const attendanceRes = await db.send(new ScanCommand({
            TableName: ATTENDANCE_TABLE,
            FilterExpression: "begins_with(SK, :skPrefix)",
            ExpressionAttributeValues: {
                ":skPrefix": { S: `STUDENT#${studentUUID}` }
            }
        }));

        // 3️⃣ Keep only the latest record per event
        const eventMap: Record<string, { status: string; timestamp?: string }> = {};
        for (const item of attendanceRes.Items || []) {
            const eventId = item.PK.S!.replace("EVENT#", "");
            const decision = item.decision.S!;
            const ts = item.timestamp?.S || undefined;

            if (
                !eventMap[eventId] ||
                (ts && new Date(ts).getTime() > new Date(eventMap[eventId].timestamp || 0).getTime())
            ) {
                eventMap[eventId] = {
                    status: decision === "accept" ? "Present" : "Rejected",
                    timestamp: ts
                };
            }
        }

        // 4️⃣ Fetch event names
        const eventsRes = await db.send(new ScanCommand({
            TableName: EVENTS_TABLE
        }));

        const eventsMap: Record<string, string> = {};
        for (const e of eventsRes.Items || []) {
            eventsMap[e.eventId.S!] = e.eventName.S!;
        }

        // 5️⃣ Prepare result
        const result = Object.entries(eventMap).map(([eventId, data]) => ({
            eventId,
            eventName: eventsMap[eventId] || eventId,
            status: data.status,
            timestamp: data.timestamp || null
        }));

        return responseWithCors(200, JSON.stringify(result));
    } catch (err) {
        console.error(err);
        return responseWithCors(500, JSON.stringify({ error: "Internal Server Error" }));
    }
};
