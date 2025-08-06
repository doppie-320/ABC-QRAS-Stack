import { DynamoDBClient, ScanCommand, ScanCommandInput, ScanCommandOutput, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient({});
const tableName = "students-dev-286466331800-ap-southeast-1";

async function run() {
    let exclusiveStartKey;
    do {
        const scanRes: ScanCommandOutput = await db.send(new ScanCommand({
            TableName: tableName,
            ExclusiveStartKey: exclusiveStartKey,
        }));

        for(const item of scanRes.Items!) {
            const id = item.id.S;
            const studentNumber = item.studentNumber.S;
            const lower = studentNumber?.toLowerCase();

            if(studentNumber !== lower) {
                console.log(`Updating ${id}:${studentNumber} -> ${lower}`);
                await db.send(new UpdateItemCommand({
                    TableName: tableName,
                    Key: { id: { S: id! } },
                    UpdateExpression: "SET studentNumber = :sn",
                    ExpressionAttributeValues: { ":sn": { S: lower! } },
                }))
            }
        }

        exclusiveStartKey = scanRes.LastEvaluatedKey;
    } while (exclusiveStartKey);

    console.log("✅ MIGRATION COMPLETE");
}

run().catch(console.error);