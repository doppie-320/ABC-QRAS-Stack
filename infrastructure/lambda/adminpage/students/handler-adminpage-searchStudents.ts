import { APIGatewayProxyHandler } from "aws-lambda";
import {
	DynamoDBClient,
	ScanCommand,
	GetItemCommand,
	ScanCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { responseWithCors } from "../../utils/cors-response";
import { verifyAdminAuth } from "../auth/handler-adminpage-auth-verify";

const db = new DynamoDBClient({});
const STUDENT_TABLE = process.env.STUDENT_TABLE!;
const METADATA_TABLE = process.env.METADATA_TABLE!;

async function getMetadata(type: string) {
	const res = await db.send(
		new GetItemCommand({
			TableName: METADATA_TABLE,
			Key: { PK: { S: type }, SK: { S: "all" } },
		})
	);
	return res.Item?.data?.S ? JSON.parse(res.Item.data.S) : {};
}

export const handler: APIGatewayProxyHandler = async (event) => {
	try {
		const user = verifyAdminAuth(event.headers);
		if (!user) {
			return responseWithCors(
				403,
				JSON.stringify({ error: "Not authorized" })
			);
		}

		const params = event.queryStringParameters || {};
		const page = params.page ? parseInt(params.page, 10) : 0;
		const limit = params.limit ? parseInt(params.limit, 10) : 50;

		const nameSearch = (params.search || "").trim().toLowerCase();
		const studentNumberSearch = (params.studentNumber || "").trim().toLowerCase();
		const selectedYears = params.years ? params.years.split(",") : [];
		const selectedDepts = params.depts ? params.depts.split(",") : [];

		// Load metadata
		const [departments, years] = await Promise.all([
			getMetadata("DEPTDATA"),
			getMetadata("YEARDATA"),
		]);

		// Build filter expression dynamically
		let filterExprParts: string[] = [];
		let exprAttrValues: Record<string, any> = {};

		if (nameSearch) {
			filterExprParts.push("contains(searchIndex, :nameSearch)");
			exprAttrValues[":nameSearch"] = { S: nameSearch };
		}

		if (studentNumberSearch) {
			filterExprParts.push("contains(studentNumber, :studNum)");
			exprAttrValues[":studNum"] = { S: studentNumberSearch };
		}

		if (selectedYears.length) {
			const yearPlaceholders = selectedYears.map((_, i) => `:year${i}`);
			filterExprParts.push(`(${yearPlaceholders.map(ph => `yearLevel = ${ph}`).join(" OR ")})`);
			selectedYears.forEach((y, i) => {
				exprAttrValues[`:year${i}`] = { S: y };
			});
		}

		if (selectedDepts.length) {
			const deptPlaceholders = selectedDepts.map((_, i) => `:dept${i}`);
			filterExprParts.push(`(${deptPlaceholders.map(ph => `department = ${ph}`).join(" OR ")})`);
			selectedDepts.forEach((d, i) => {
				exprAttrValues[`:dept${i}`] = { S: d };
			});
		}

		const filterExpr = filterExprParts.length
			? filterExprParts.join(" AND ")
			: undefined;

		// Fetch results
		let results: any[] = [];
		let lastKey;
		do {
			const res: ScanCommandOutput = await db.send(
				new ScanCommand({
					TableName: STUDENT_TABLE,
					ExclusiveStartKey: lastKey,
					FilterExpression: filterExpr,
					ExpressionAttributeValues: Object.keys(exprAttrValues).length
						? exprAttrValues
						: undefined,
					Limit: 1000, // get large chunks
				})
			);

			if (res.Items) results.push(...res.Items);
			lastKey = res.LastEvaluatedKey;
		} while (lastKey); // Scan whole table when filtering

		// Total pages
		const totalPages = Math.ceil(results.length / limit);

		// Slice for current page
		const paginated = results.slice(page * limit, (page + 1) * limit);

		const items = paginated.map((s) => ({
			id: s.id.S!,
			name: s.name.S!,
			studentNumber: s.studentNumber.S!,
			departmentCode: s.department?.S || "",
			departmentName: departments[s.department?.S || ""] || "",
			yearCode: s.yearLevel?.S || "",
			yearName: years[s.yearLevel?.S || ""] || "",
			pictureUrl: s.pictureUrl?.S || "",
		}));

		return responseWithCors(
			200,
			JSON.stringify({
				items,
				totalPages,
			})
		);
	} catch (err) {
		console.error("Error fetching students:", err);
		return responseWithCors(
			500,
			JSON.stringify({ error: "Internal Server Error" })
		);
	}
};
