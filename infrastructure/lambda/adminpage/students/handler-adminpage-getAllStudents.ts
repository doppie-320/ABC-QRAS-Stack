import { APIGatewayProxyHandler } from "aws-lambda";
import { DynamoDBClient, ScanCommand, GetItemCommand, ScanCommandOutput } from "@aws-sdk/client-dynamodb";
import { responseWithCors } from "../../utils/cors-response";
import { verifyAdminAuth } from "../auth/handler-adminpage-auth-verify";

const db = new DynamoDBClient({});
const STUDENT_TABLE = process.env.STUDENT_TABLE!;
const METADATA_TABLE = process.env.METADATA_TABLE!;

async function getMetadata(type: string) {
    const res = await db.send(new GetItemCommand({
        TableName: METADATA_TABLE,
        Key: { PK: { S: type }, SK: { S: "all" } }
    }));
    return res.Item?.data?.S ? JSON.parse(res.Item.data.S) : {};
}

async function scanAllWithFilter(search: string, maxResults: number) {
    let results: any[] = [];
    let lastKey;

    do {
        const res: ScanCommandOutput = await db.send(new ScanCommand({
            TableName: STUDENT_TABLE,
            ExclusiveStartKey: lastKey,
            FilterExpression: "contains(searchIndex, :search)",
            ExpressionAttributeValues: { ":search": { S: search } },
            Limit: 1000 // fetch big chunks
        }));

        if (res.Items) {
            results.push(...res.Items);
        }

        lastKey = res.LastEvaluatedKey;

    } while (lastKey && results.length < maxResults);

    return results.slice(0, maxResults);
}

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const user = verifyAdminAuth(event.headers);
        if (!user) {
            return responseWithCors(403, JSON.stringify({ error: "Not authorized" }));
        }

        const params = event.queryStringParameters || {};
        const limit = params.limit ? parseInt(params.limit, 10) : 50;
        const lastKey = params.lastKey ? JSON.parse(decodeURIComponent(params.lastKey)) : undefined;
        const search = (params.search || "").trim().toLowerCase();

        // Load metadata once
        const [departments, years] = await Promise.all([
            getMetadata("DEPTDATA"),
            getMetadata("YEARDATA")
        ]);

        let resItems;
        let newLastKey = null;

        if (search) {
            // Full scan only when searching
            resItems = await scanAllWithFilter(search, limit);
        } else {
            // Paginated scan for normal browsing
            const res = await db.send(new ScanCommand({
                TableName: STUDENT_TABLE,
                Limit: limit,
                ExclusiveStartKey: lastKey
            }));
            resItems = res.Items || [];
            newLastKey = res.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(res.LastEvaluatedKey)) : null;
        }

        const items = resItems.map((s) => ({
            id: s.id.S!,
            name: s.name.S!,
            studentNumber: s.studentNumber.S!,
            departmentCode: s.department?.S || "",
            departmentName: departments[s.department?.S || ""] || "",
            yearCode: s.yearLevel?.S || "",
            yearName: years[s.yearLevel?.S || ""] || "",
            pictureUrl: s.pictureUrl?.S || ""
        }));

        return responseWithCors(200, JSON.stringify({
            items,
            lastKey: newLastKey
        }));
    } catch (err) {
        console.error("Error fetching students:", err);
        return responseWithCors(500, JSON.stringify({ error: "Internal Server Error" }));
    }
};
