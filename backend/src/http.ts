import type { ServerResponse } from 'node:http';

const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:8081';

export function sendJson(response: ServerResponse, status: number, body: object): void {
  response.writeHead(status, {
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Origin': corsOrigin,
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(status === 204 ? undefined : JSON.stringify(body));
}

export function logDatabaseError(context: string, error: unknown): void {
  const errorCode = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : 'unknown';
  console.error(context, { errorCode });
}
