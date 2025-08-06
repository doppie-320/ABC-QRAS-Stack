import { APIGatewayProxyHandler } from "aws-lambda";
import {
    DynamoDBClient,
    ScanCommand,
    QueryCommand,
    GetItemCommand
} from "@aws-sdk/client-dynamodb";
import { responseWithCors } from "../../utils/cors-response";
import { verifyAdminAuth } from "../auth/handler-adminpage-auth-verify";

const db = new DynamoDBClient({});
const ATTENDANCE_TABLE = process.env.ATTENDANCE_TABLE!;
const STUDENT_TABLE = process.env.STUDENT_TABLE!;
const METADATA_TABLE = process.env.METADATA_TABLE!;

async function getMetadata(type: string) {
    const res = await db.send(
        new GetItemCommand({
            TableName: METADATA_TABLE,
            Key: { PK: { S: type }, SK: { S: "all" } }
        })
    );
    return res.Item?.data?.S ? JSON.parse(res.Item.data.S) : {};
}

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        // 🔹 Auth check
        const user = verifyAdminAuth(event.headers);
        if (!user) {
            return responseWithCors(
                403,
                JSON.stringify({ error: "Not authorized" })
            );
        }

        const params = event.queryStringParameters || {};
        const limit = params.limit ? parseInt(params.limit, 10) : 50;
        const page = params.page ? parseInt(params.page, 10) : 0;

        const nameSearch = params.name?.trim().toLowerCase() || "";
        const studentNumberSearch = params.studentNumber?.trim().toLowerCase() || "";
        const yearsFilter = params.years ? params.years.split(",") : [];
        const deptFilter = params.departments ? params.departments.split(",") : [];
        const eventIdFilter = params.eventId || "";
        const statusFilter = params.status || "";
        const scannerIdFilter = params.scannerId || "";
        const timeFrom = params.timeFrom ? new Date(params.timeFrom).getTime() : null;
        const timeTo = params.timeTo ? new Date(params.timeTo).getTime() : null;

        // 🔹 Load metadata (dept + year)
        const [departments, years] = await Promise.all([
            getMetadata("DEPTDATA"),
            getMetadata("YEARDATA")
        ]);

        // 🔹 Step 1: Get attendance logs (filtered by eventId if provided)
        let attendanceItems: any[] = [];

        if (eventIdFilter) {
            const res = await db.send(
                new QueryCommand({
                    TableName: ATTENDANCE_TABLE,
                    KeyConditionExpression:
                        "PK = :pk AND begins_with(SK, :skPrefix)",
                    ExpressionAttributeValues: {
                        ":pk": { S: `EVENT#${eventIdFilter}` },
                        ":skPrefix": { S: "STUDENT#" }
                    }
                })
            );
            attendanceItems = res.Items || [];
        } else {
            const res = await db.send(new ScanCommand({
                TableName: ATTENDANCE_TABLE
            }));
            attendanceItems = res.Items || [];
        }

        // 🔹 Step 2: Build latest-scan map
        const latestScanMap: Record<
            string,
            { decision: string; timestamp: string; scannerId: string | null; eventId: string }
        > = {};

        for (const item of attendanceItems) {
            const eventId = item.PK.S!.replace("EVENT#", "");
            const parts = item.SK.S!.split("#");
            const studentId = parts[1];
            const skTs = parts[2];
            const decision = item.decision.S!;
            const scannerId = item.scannerId?.S || null;

            if (
                !latestScanMap[studentId] ||
                new Date(skTs).getTime() >
                    new Date(latestScanMap[studentId].timestamp).getTime()
            ) {
                latestScanMap[studentId] = {
                    decision,
                    timestamp: skTs,
                    scannerId,
                    eventId
                };
            }
        }

        // 🔹 Step 3: Get all students
        const allStudentsRes = await db.send(
            new ScanCommand({ TableName: STUDENT_TABLE })
        );
        let allStudents =
            allStudentsRes.Items?.map((s) => ({
                id: s.id.S!,
                name: s.name.S!,
                studentNumber: s.studentNumber.S!,
                departmentCode: s.department?.S || "",
                departmentName: departments[s.department?.S || ""] || "",
                yearCode: s.yearLevel?.S || "",
                yearName: years[s.yearLevel?.S || ""] || ""
            })) || [];

        // 🔹 Step 4: Merge attendance into student list
        let merged = allStudents.map((student) => {
            const latest = latestScanMap[student.id];
            let status: string;

            if (!latest) {
                status = "no-scan";
            } else if (latest.decision === "accept") {
                status = "accepted";
            } else if (latest.decision === "reject") {
                status = "rejected";
            } else {
                status = latest.decision;
            }

            return {
                ...student,
                status,
                timestamp: latest?.timestamp || null,
                scannerId: latest?.scannerId || null,
                eventId: latest?.eventId || null
            };
        });

        // 🔹 Step 5: Apply filters
        if (nameSearch) {
            merged = merged.filter((s) =>
                s.name.toLowerCase().includes(nameSearch)
            );
        }
        if (studentNumberSearch) {
            merged = merged.filter((s) =>
                s.studentNumber.toLowerCase().includes(studentNumberSearch)
            );
        }
        if (yearsFilter.length) {
            merged = merged.filter((s) => yearsFilter.includes(s.yearCode));
        }
        if (deptFilter.length) {
            merged = merged.filter((s) => deptFilter.includes(s.departmentCode));
        }
        if (statusFilter) {
            if (statusFilter === "absent") {
                merged = merged.filter((s) => s.status === "no-scan" || s.status === "rejected");
            } else {
                merged = merged.filter((s) => s.status === statusFilter);
            }
        }
        if (scannerIdFilter) {
            merged = merged.filter((s) => s.scannerId === scannerIdFilter);
        }
        if (timeFrom || timeTo) {
            merged = merged.filter((s) => {
                if (!s.timestamp) return false;
                const tsNum = new Date(s.timestamp).getTime();
                if (timeFrom && tsNum < timeFrom) return false;
                if (timeTo && tsNum > timeTo) return false;
                return true;
            });
        }

        // 🔹 Step 6: Pagination
        const totalPages = Math.ceil(merged.length / limit);
        const start = page * limit;
        const paginated = merged.slice(start, start + limit);

        return responseWithCors(
            200,
            JSON.stringify({
                items: paginated,
                totalPages
            })
        );
    } catch (err) {
        console.error("Error in attendance search:", err);
        return responseWithCors(
            500,
            JSON.stringify({ error: "Internal Server Error" })
        );
    }
};
