import { DynamoDBClient, ScanCommand, ScanCommandInput, ScanCommandOutput, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "ap-southeast-1" });
const TableName = process.env.STUDENT_TABLE || "students-prod-286466331800-ap-southeast-1"; // change if needed

async function sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
}

async function updateWithRetry(id: string, lower: string) {
    let attempt = 0;
    while (true) {
        try {
            await client.send(
                new UpdateItemCommand({
                    TableName,
                    Key: { id: { S: id } },
                    UpdateExpression: "SET studentNumber = :sn",
                    ExpressionAttributeValues: { ":sn": { S: lower } },
                })
            );
            break; // success → exit loop
        } catch (err: any) {
            if (err.name === "ProvisionedThroughputExceededException") {
                attempt++;
                const delay = Math.min(5000, Math.pow(2, attempt) * 100 + Math.random() * 100);
                console.warn(`⚠️ Throttled updating ${id}, retrying in ${delay}ms`);
                await sleep(delay);
            } else {
                throw err; // not a throttle error → rethrow
            }
        }
    }
}

async function run() {
    let ExclusiveStartKey;
    let totalUpdates = 0;

    do {
        const scanRes: ScanCommandOutput = await client.send(
            new ScanCommand({
                TableName,
                ExclusiveStartKey,
                Limit: 25, // small chunk to reduce GSI pressure
            })
        );

        for (const item of scanRes.Items || []) {
            const id = item.id.S!;
            const studentNumber = item.studentNumber.S!;
            const lower = studentNumber.toLowerCase();

            if (studentNumber !== lower) {
                console.log(`Updating ${id}: ${studentNumber} -> ${lower}`);
                await updateWithRetry(id, lower);
                totalUpdates++;
            }
        }

        ExclusiveStartKey = scanRes.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    console.log(`✅ Migration complete. Updated ${totalUpdates} records.`);
}

run().catch(console.error);
