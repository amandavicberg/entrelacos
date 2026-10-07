import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';

const { isBirthdayInBrazil } = createRequire(import.meta.url)('../dist/birthday.js');

test('aniversário acompanha o calendário de São Paulo perto da meia-noite UTC', () => {
  const now = new Date('2026-10-08T01:00:00.000Z');
  assert.equal(isBirthdayInBrazil('2000-10-07', now), true);
  assert.equal(isBirthdayInBrazil('2000-10-08', now), false);
  assert.equal(isBirthdayInBrazil('2000-10-08', new Date('2026-10-08T03:01:00.000Z')), true);
});
