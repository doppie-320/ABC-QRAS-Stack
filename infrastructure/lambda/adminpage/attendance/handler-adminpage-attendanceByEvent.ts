import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient, QueryCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { responseWithCors } from "../../utils/cors-response";
import { verifyAdminAuth } from "../auth/handler-adminpage-auth-verify";

const db = new DynamoDBClient({});
const ATTENDANCE_TABLE = process.env.ATTENDANCE_TABLE!;
const STUDENT_TABLE = process.env.STUDENT_TABLE!;

export const handler: APIGatewayProxyHandler = async (event) => {
    const user = verifyAdminAuth(event.headers);
    if (!user) {
        return responseWithCors(403, JSON.stringify({ error: "Not authorized" }));
    }

    const eventId = event.queryStringParameters?.eventId;
    if (!eventId) {
        return responseWithCors(400, JSON.stringify({ error: "Missing eventId" }));
    }

    try {
        // 1️⃣ Get attendance logs for event
        const attendanceRes = await db.send(new QueryCommand({
            TableName: ATTENDANCE_TABLE,
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
            ExpressionAttributeValues: {
                ":pk": { S: `EVENT#${eventId}` },
                ":skPrefix": { S: "STUDENT#" }
            }
        }));

        // Map latest scan per student
        const latestScanMap: Record<string, { decision: string; timestamp: string, scannerId: string | null }> = {};

        for (const item of attendanceRes.Items || []) {
            const studentId = item.SK.S!.split("#")[1];
            const decision = item.decision.S!;
            const ts = item.timestamp.S!;

            if (
                !latestScanMap[studentId] ||
                new Date(ts).getTime() > new Date(latestScanMap[studentId].timestamp).getTime()
            ) {
                latestScanMap[studentId] = { decision, timestamp: ts, scannerId: item.scannerId?.S || null };
            }
        }

        // 2️⃣ Get all students
        const allStudentsRes = await db.send(new ScanCommand({
            TableName: STUDENT_TABLE
        }));

        const allStudents = allStudentsRes.Items?.map(s => ({
            studentId: s.id.S!,
            name: s.name.S!,
            studentNumber: s.studentNumber.S!
        })) || [];

        // 3️⃣ Categorize based on latest decision
        const present = [];
        const rejected = [];
        const absent = [];

        for (const student of allStudents) {
            const latest = latestScanMap[student.studentId];
            if (latest) {
                if (latest.decision === "accept") {
                    present.push({ ...student, timestamp: latest.timestamp, scannerId: latest.scannerId });
                } else if (latest.decision === "reject") {
                    rejected.push({ ...student, timestamp: latest.timestamp, scannerId: latest.scannerId });
                }
            } else {
                absent.push({ ...student, timestamp: null, scannerId: null });
            }
        }

        return responseWithCors(200, JSON.stringify({ present, rejected, absent }));
    } catch (err) {
        console.error(err);
        return responseWithCors(500, JSON.stringify({ error: "Internal Server Error" }));
    }
};
