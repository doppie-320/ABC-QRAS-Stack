import { APIGatewayProxyHandler } from "aws-lambda";
import { responseWithCors } from "../../utils/cors-response";
import { error } from "console";
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const db = new DynamoDBClient({});
const ADMIN_TABLE = process.env.ADMIN_TABLE!;
const JWT_SECRET = process.env.JWT_SECRET!;

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const { username, password } = JSON.parse(event.body || "{}");
        if(!username || !password) {
            return responseWithCors(400, JSON.stringify({ error: "Missing credentials" }));
        }

        const res = await db.send(
            new GetItemCommand({
                TableName: ADMIN_TABLE,
                Key: { username: { S: username } },
            })
        );

        if(!res.Item) {
            return responseWithCors(401, JSON.stringify({ error: "Invalid username or password!" }));
        }

        const valid = await bcrypt.compare(password, res.Item.passwordHash.S!);
        if(!valid) {
            return responseWithCors(401, JSON.stringify({ error: "Invalid username or password!" }));
        }

        const token = jwt.sign(
            { username },
            JWT_SECRET,
            { expiresIn: "1h" },
        );

        return responseWithCors(200, JSON.stringify({ token }));
    } catch (err: any) {
        return responseWithCors(500,
            JSON.stringify({ error: `Unhandled exception! ${err}` })
        );
    }
};