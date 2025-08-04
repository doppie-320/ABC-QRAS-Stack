import { DynamoDBClient, GetItemCommand, ScanCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient({});
const STUDENT_TABLE = process.env.STUDENT_TABLE!;
const METADATA_TABLE = process.env.METADATA_TABLE!;

async function getMetadata(type: string) {
    const res = await db.send(new GetItemCommand({
        TableName: METADATA_TABLE,
        Key: { PK: { S: type }, SK: { S: "all" } }
    }));

    if (!res.Item || !res.Item.data?.S) {
        throw new Error(`No metadata found for ${type}`);
    }
    return JSON.parse(res.Item.data.S) as Record<string, string>;
}

async function migrate() {
    const departments = await getMetadata("DEPTDATA");
    const years = await getMetadata("YEARDATA");

    console.log("Loaded metadata:", { departments, years });

    let lastKey: any = undefined;
    do {
        const res = await db.send(new ScanCommand({
            TableName: STUDENT_TABLE,
            ExclusiveStartKey: lastKey
        }));

        for (const student of res.Items || []) {
            const deptCode = student.department?.S || "";
            const yearCode = student.yearLevel?.S || "";

            const searchIndex = [
                student.name?.S || "",
                student.studentNumber?.S || "",
                departments[deptCode] || "",
                years[yearCode] || ""
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            await db.send(new UpdateItemCommand({
                TableName: STUDENT_TABLE,
                Key: { id: { S: student.id.S! } },
                UpdateExpression: "SET searchIndex = :si",
                ExpressionAttributeValues: { ":si": { S: searchIndex } }
            }));

            console.log(`Updated student ${student.id.S} with searchIndex`);
        }

        lastKey = res.LastEvaluatedKey;
    } while (lastKey);

    console.log("✅ Migration complete!");
}

migrate().catch(err => {
    console.error("❌ Migration failed", err);
    process.exit(1);
});
