import { Buffer } from 'node:buffer';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

// Match production env-file precedence; deployment variables always win.
const values = { ...process.env };
for (const file of ['.env.production.local', '.env.local', '.env.production', '.env']) {
  if (!existsSync(file)) continue;
  for (const [name, value] of Object.entries(parseEnv(readFileSync(file, 'utf8')))) {
    if (values[name] === undefined) values[name] = value;
  }
}

const errors = [];
for (const name of ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_API_URL']) {
  try {
    const url = new URL(values[name] ?? '');
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
  } catch { errors.push(`${name}: informe uma URL HTTP(S) válida no ambiente do frontend.`); }
}
const key = values.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
let valid = /^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
if (!valid && key.split('.').length === 3) {
  try { valid = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'anon'; }
  catch { valid = false; }
}
if (!valid) errors.push('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: use a chave pública publishable (ou anon legada), nunca uma chave secret/service_role.');
if (errors.length) {
  console.error('Build interrompido: configuração pública inválida.');
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else console.log('Configuração pública validada (valores omitidos).');
