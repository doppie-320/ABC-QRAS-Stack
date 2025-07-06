export function responseWithCors(statusCode: number, body: any) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: typeof body === 'string' ? body : JSON.stringify(body),
    };
}