import { DynamoDBClient, ScanCommand, PutItemCommand, ScanCommandOutput } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});
const PROD_TABLE = "students-prod-286466331800-ap-southeast-1";
const DEV_TABLE = "students-dev-286466331800-ap-southeast-1";

async function migrate() {
    let lastKey;
    let count = 0;

    do {
        const scanRes: ScanCommandOutput = await client.send(new ScanCommand({
            TableName: PROD_TABLE,
            ExclusiveStartKey: lastKey
        }));

        for (const item of scanRes.Items || []) {
            await client.send(new PutItemCommand({
                TableName: DEV_TABLE,
                Item: item
            }));
            count++;
            console.log(`Copied ${count}: ${item.id?.S}`);
        }

        lastKey = scanRes.LastEvaluatedKey;
    } while (lastKey);

    console.log(`✅ Migration complete. Total ${count} items copied.`);
}

migrate().catch(err => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
});
