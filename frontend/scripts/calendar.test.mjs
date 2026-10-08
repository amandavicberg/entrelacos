import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clockTime, dateKey, minutesFromTime, monthDays, moveMonth } from '../lib/calendar.ts';

test('agenda segue o dia de Brasília perto da meia-noite UTC', () => {
  assert.equal(dateKey('2026-10-08T01:00:00.000Z'), '2026-10-07');
  assert.equal(dateKey('2026-10-08T03:01:00.000Z'), '2026-10-08');
});

test('calendário atravessa ano e mantém a grade do mês', () => {
  assert.equal(moveMonth('2026-12', 1), '2027-01');
  assert.equal(monthDays('2026-11').filter(Boolean).length, 30);
  assert.equal(monthDays('2026-11')[0], '2026-11-01');
});

test('horários de atendimento validam HH:mm e convertem minutos', () => {
  assert.equal(minutesFromTime('08:30'), 510);
  assert.equal(clockTime(510), '08:30');
  assert.equal(minutesFromTime('24:00'), null);
  assert.equal(minutesFromTime('8:30'), null);
});
