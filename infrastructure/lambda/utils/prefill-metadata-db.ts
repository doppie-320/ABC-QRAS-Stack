const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const client = new DynamoDBClient({});

exports.handler = async () => {
    const items = [
        {
            PK: { S: "DEPTDATA" },
            SK: { S: "all" },
            data: {
                S: JSON.stringify({
                    soe: "School of Engineering",
                    son: "School of Nursing",
                    socje: "School of Criminal Justice Education",
                    cas: "College of Arts and Sciences",
                    sbme: "School of Business management education",
                    soedu: "School of Education",
                    soa: "School of Agriculture",
                    shs: "Senior Highschool",
                    jhs: "Junior Highschool",
                }),
            }
        },
        {
            PK: { S: "YEARDATA" },
            SK: { S: "all" },
            data: {
                S: JSON.stringify({
                    "g7": "Grade 7",
                    "g8": "Grade 8",
                    "g9": "Grade 9",
                    "10": "Grade 10",
                    "g11": "Grade 11",
                    "g12": "Grade 12",
                    "1y": "1st year",
                    "2y": "2nd year",
                    "3y": "3rd year",
                    "4y": "4th year",
                    "5y": "5th year",
                    "6y": "6th year",
                })
            }
        }
    ];

    for (const item of items) {
        await client.send(new PutItemCommand({
            TableName: process.env.METADATA_TABLE!,
            Item: item
        }));
    }

    return { status: "Seeded" };
}