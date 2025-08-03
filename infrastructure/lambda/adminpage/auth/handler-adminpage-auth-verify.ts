import jwt from "jsonwebtoken";

export function verifyAdminAuth(headers: Record<string, string | undefined>) {
    const authHeader = headers?.Authorization || headers?.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

    const token = authHeader.substring(7);
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET!);
        console.log("JWT payload:", payload);
        return payload;
    } catch (err) {
        console.error("JWT verification failed:", err);
        return null;
    }
}
