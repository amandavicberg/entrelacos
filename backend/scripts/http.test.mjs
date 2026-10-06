import assert from 'node:assert/strict';
import { test } from 'node:test';
import http from '../dist/http.js';
const { sendJson } = http;

test('preflight permite PUT usado pela mensagem de aniversário e não produz corpo', () => {
  let status, headers, body;
  sendJson({ writeHead: (s, h) => { status = s; headers = h; }, end: (b) => { body = b; } }, 204, {});
  assert.equal(status, 204);
  assert.ok(headers['Access-Control-Allow-Methods'].split(', ').includes('PUT'));
  assert.equal(headers['Access-Control-Allow-Origin'], process.env.CORS_ORIGIN ?? 'http://localhost:8081');
  assert.equal(body, undefined);
});
