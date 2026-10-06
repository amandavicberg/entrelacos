import { Buffer } from 'node:buffer';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const script = fileURLToPath(new URL('./check-public-env.mjs', import.meta.url));
const valid = { EXPO_PUBLIC_SUPABASE_URL: 'https://test.supabase.co', EXPO_PUBLIC_API_URL: 'https://api.example.com', EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture_only' };
function check(env, file = '') {
  const cwd = mkdtempSync(join(tmpdir(), 'entrelacos-env-'));
  try {
    if (file) writeFileSync(join(cwd, '.env'), file);
    return spawnSync(process.execPath, [script], { cwd, env, encoding: 'utf8' });
  } finally { rmSync(cwd, { recursive: true, force: true }); }
}
test('build aceita configuração pública válida e anon legada', () => {
  assert.equal(check(valid).status, 0);
  const anon = ['eyJ0eXAiOiJKV1QifQ', Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url'), 'signature'].join('.');
  assert.equal(check({ ...valid, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: anon }).status, 0);
});
test('build bloqueia chave inválida, secret e service_role sem imprimir valores', () => {
  const service = ['eyJ0eXAiOiJKV1QifQ', Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url'), 'signature'].join('.');
  for (const key of ['chave-invalida', 'sb_secret_fixture_only', service, '']) {
    const result = check({ ...valid, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Build interrompido/);
    if (key) assert.ok(!result.stderr.includes(key));
  }
});
test('variável inválida da hospedagem não é mascarada pelo arquivo local', () => {
  const result = check({ ...valid, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '' }, 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_local_fixture');
  assert.equal(result.status, 1);
  assert.equal(check({ ...valid, EXPO_PUBLIC_SUPABASE_URL: 'https://' }).status, 1);
});
