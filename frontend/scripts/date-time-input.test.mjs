import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatLocalDateTime, maskLocalDateTime, parseLocalDateTime } from '../lib/date-time-input.ts';

test('agenda usa data legível e conserva o horário local', () => {
  assert.equal(maskLocalDateTime('251220261430'), '25/12/2026 14:30');
  const date = parseLocalDateTime('25/12/2026 14:30');
  assert.equal(formatLocalDateTime(date), '25/12/2026 14:30');
});

test('agenda rejeita formato incompleto e datas impossíveis antes da API', () => {
  for (const value of ['2026-12-25T14:30', '31/02/2026 14:30', '25/12/2026 24:00', '25/12/2026 14:60']) {
    assert.throws(() => parseLocalDateTime(value), Error, value);
  }
});
