export function responseWithCors(statusCode: number, body: any) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        },
        body: typeof body === 'string' ? body : JSON.stringify(body),
    };
}